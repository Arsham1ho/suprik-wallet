import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, VolumeX, Volume2, ExternalLink, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { VoiceOrb, type VoiceState } from './VoiceOrb';
import { speak, stopSpeaking, isTTSSupported, preloadVoices, prefetchTTS } from '../utils/speechSynthesis';
import {
  loadPuterSDK,
  callPuterAI,
  resolveAgent,
  fetchPriceContext,
  fetchNewsContext,
  AGENTS,
  DEFAULT_AGENT,
  ROUNDTABLE_ORDER,
  MODERATOR_AGENT,
  buildRoundtablePrompt,
  type Agent,
  type ChatMessage,
  getAIProvider,
  setAIProvider,
  isPuterDisabled,
  resetPuter,
  type AIProvider,
} from '../utils/puterAI';
import {
  parseTradeIntent,
  resolveTradeTokens,
  resolveDestination,
  resolveSendAmount,
  buildTradeSummary,
  userRequestedTrade,
  TRADE_SYSTEM_PROMPT,
  type TradeIntent,
} from '../utils/voiceTradeIntent';
import {
  getJupiterSwapQuote,
  executeJupiterSwap,
  type SwapQuote,
} from '../utils/jupiterSwap';
import { useWallet } from '../utils/WalletContext';
import { useNetwork } from '../utils/NetworkContext';
import { getUserSettings } from '../utils/userSettings';
import { BiometricConfirmDialog } from './BiometricConfirmDialog';
import { AccountManager } from '../utils/accountManager';
import { decryptWithPassword, decryptImportedSecret } from '../utils/wallet';
import { playSwapExchange, playSendWhoosh } from '../utils/sounds';
import {
  sendSolanaTransaction,
  sendSPLTokenTransaction,
  sendSolanaTransactionWithPrivateKey,
  sendSPLTokenTransactionWithPrivateKey,
} from '../utils/transactions';
import { saveSwapToHistory } from '../utils/transactionHistory';
import { TOKEN_REGISTRY } from '../utils/tokenRegistry';
import { TokenLogo } from './TokenLogo';
import type { BiometricSettings } from '../utils/biometric';
import { useTheme } from '../utils/ThemeContext';
import type { Token } from './pages/Home';

// --- Inline token icon injection (same pattern as StockAIChat) ---
const ICON_SKIP = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY',
  'CEO', 'IPO', 'ETF', 'GDP', 'SEC', 'FED', 'IMF',
  'ATH', 'ROI', 'APY', 'APR', 'TVL', 'YTD', 'NFT',
  'AI', 'US', 'UK', 'EU', 'UN', 'IT', 'AM', 'PM',
]);

const VOICE_SYMBOL_LOGO_MAP = new Map<string, string>();
for (const t of TOKEN_REGISTRY) {
  const sym = t.symbol.toUpperCase();
  if (sym.length >= 2 && !ICON_SKIP.has(sym)) {
    VOICE_SYMBOL_LOGO_MAP.set(sym, t.image);
  }
}

const _voiceSymbols = Array.from(VOICE_SYMBOL_LOGO_MAP.keys())
  .sort((a, b) => b.length - a.length)
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const VOICE_SYMBOL_RE = _voiceSymbols ? new RegExp(`\\b(${_voiceSymbols})\\b`, 'g') : null;

function injectVoiceTokenIcons(text: string): string {
  if (!VOICE_SYMBOL_RE) return text;
  // Clean markdown first
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  // Inject icons in text nodes only (skip tags)
  html = html
    .split(/(<[^>]+>)/)
    .map(part => {
      if (part.startsWith('<')) return part;
      return part.replace(VOICE_SYMBOL_RE!, match => {
        const logo = VOICE_SYMBOL_LOGO_MAP.get(match.toUpperCase());
        if (!logo) return match;
        return `<img src="${logo}" alt="${match}" class="token-icon-inline">${match}`;
      });
    })
    .join('');
  return html;
}

interface VoiceAssistantProps {
  open: boolean;
  onClose: () => void;
  walletId: string;
  tokensData: Token[];
}

// Portfolio context builder (same as StockAIChat)
function buildPortfolioContext(tokens?: Token[]): string {
  if (!tokens || tokens.length === 0) return '';
  const total = tokens.reduce((sum, t) => sum + (t.value || 0), 0);
  if (total === 0) return '';

  const holdings = tokens
    .filter(t => t.value > 0.01)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(t => {
      const amtStr = t.amount >= 1000000
        ? `${(t.amount / 1000000).toFixed(1)}M`
        : t.amount >= 1000
          ? `${(t.amount / 1000).toFixed(1)}K`
          : t.amount.toFixed(t.amount < 1 ? 4 : 2);
      return `${t.symbol}: ${amtStr} ($${t.value.toFixed(2)})`;
    })
    .join(', ');

  return `\n\n[User's Portfolio: ${holdings}. Total: $${total.toFixed(2)}]`;
}

const CONFIRM_WORDS = ['yes', 'confirm', 'do it', 'go ahead', 'execute', 'proceed', 'sure', 'ok', 'okay'];
const CANCEL_WORDS = ['no', 'cancel', 'stop', 'nevermind', 'never mind', 'abort', 'forget it'];

export function VoiceAssistant({ open, onClose, walletId, tokensData }: VoiceAssistantProps) {
  const wallet = useWallet();
  const { isTestnet } = useNetwork();
  const { colors } = useTheme();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [displayText, setDisplayText] = useState('Tap the orb to start talking');
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent>(DEFAULT_AGENT);
  const [tradeIntent, setTradeIntent] = useState<TradeIntent | null>(null);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [resolvedTradeAmount, setResolvedTradeAmount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [sendDestination, setSendDestination] = useState<string | null>(null);
  const [sendResolvedAmount, setSendResolvedAmount] = useState<{ amount: number; mint: string; decimals: number } | null>(null);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [roundtableMode, setRoundtableMode] = useState(false);
  const [roundtableActive, setRoundtableActive] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>(getAIProvider());
  const [roundtableProgress, setRoundtableProgress] = useState<{
    current: number; total: number; agent: Agent;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isConfirmingRef = useRef(false);
  const manualAgentRef = useRef(false); // Track if user manually selected an agent
  const voiceStateRef = useRef<VoiceState>('idle'); // Live ref for closure access
  const handleConfirmRef = useRef<(text: string) => void>(() => {}); // Avoids stale closure in onresult
  const handleSubmitRef = useRef<(text: string) => void>(() => {}); // Avoids stale closure in onresult
  const executeTradeRef = useRef<() => void>(() => {}); // Avoids stale closure in handleConfirmationResponse
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep voiceStateRef in sync with voiceState for closure access
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Load SDK + preload voices on mount
  useEffect(() => {
    if (!open) return;
    loadPuterSDK()
      .then(() => setSdkReady(true))
      .catch(() => {
        // Puter SDK failed but Cloudflare AI fallback is available
        console.warn('[VoiceAssistant] Puter SDK unavailable, Cloudflare AI fallback active');
        setSdkReady(true);
      });
    preloadVoices();

    // Load biometric settings
    try {
      const settings = getUserSettings(walletId);
      if (settings.biometricEnabled) {
        setBiometricSettings({
          enabled: true,
          autoLockMinutes: settings.autoLockMinutes || 5,
          requireForTransactions: settings.requireBiometricForTransactions || false,
        });
      }
    } catch { /* ignore */ }
  }, [open, walletId]);

  // Setup SpeechRecognition
  useEffect(() => {
    if (!open) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);

      const allFinal = Array.from(event.results).every((r: any) => r.isFinal);
      if (allFinal && finalTranscript.trim()) {
        // Use refs to always call the latest handler (avoids stale closure)
        if (isConfirmingRef.current) {
          handleConfirmRef.current(finalTranscript.trim().toLowerCase());
        } else {
          handleSubmitRef.current(finalTranscript.trim());
        }
      }
    };

    recognition.onend = () => {
      // If we're in confirming state, auto-restart listening for confirm/cancel
      if (isConfirmingRef.current) {
        try {
          setTimeout(() => {
            if (isConfirmingRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 300);
        } catch { /* ignore */ }
        return;
      }
      // Otherwise, if we were listening, go back to idle
      if (voiceStateRef.current === 'listening') {
        setVoiceState('idle');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Voice] Error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow mic access.');
        setVoiceState('idle');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [open]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopSpeaking();
      recognitionRef.current?.abort();
      abortRef.current?.abort();
      setVoiceState('idle');
      setTranscript('');
      setAiResponse('');
      setTradeIntent(null);
      setSwapQuote(null);
      setLastSignature(null);
      setSendDestination(null);
      setSendResolvedAmount(null);
      setShowAddressInput(false);
      setAddressInput('');
      setDisplayText('Tap the orb to start talking');
    }
  }, [open]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    stopSpeaking();
    setTranscript('');
    // Don't change voiceState if we're in confirming mode — keep the card visible
    if (!isConfirmingRef.current) {
      setVoiceState('listening');
      setDisplayText('Listening...');
    }
    try {
      recognitionRef.current.start();
    } catch {
      // Already started
    }
  }, []);

  const handleOrbClick = useCallback(() => {
    if (voiceState === 'idle') {
      startListening();
    } else if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      setVoiceState('idle');
      setDisplayText('Tap the orb to start talking');
    } else if (voiceState === 'speaking') {
      stopSpeaking();
      // During roundtable, don't go idle — let the loop handle the next agent
      if (!roundtableActive) {
        setVoiceState('idle');
        setDisplayText('Tap the orb to continue');
      }
    }
  }, [voiceState, startListening, roundtableActive]);

  const speakAndReturn = useCallback((text: string) => {
    setDisplayText(text);
    setAiResponse(prev => prev + '\n\n' + text);
    setVoiceState('speaking');

    if (!isMuted && isTTSSupported()) {
      speak(text, () => {
        setVoiceState('idle');
        setDisplayText('Tap the orb to continue');
      }, currentAgent.id);
    } else {
      setTimeout(() => {
        setVoiceState('idle');
        setDisplayText('Tap the orb to continue');
      }, 2000);
    }
  }, [isMuted, currentAgent]);

  // Helper: speak as a Promise so we can await it in loops
  const speakAsync = useCallback((text: string, agentId: string): Promise<void> => {
    return new Promise((resolve) => {
      if (isMuted || !isTTSSupported()) {
        resolve();
        return;
      }
      speak(text, () => resolve(), agentId);
    });
  }, [isMuted]);

  // Roundtable discussion — all agents discuss sequentially with voice
  const executeVoiceRoundtable = useCallback(async (
    text: string,
    enrichedContent: string,
    abortSignal: AbortSignal,
  ) => {
    setRoundtableActive(true);
    setVoiceState('speaking');

    const agents = ROUNDTABLE_ORDER;
    const totalSteps = agents.length + 1; // 6 agents + moderator
    const rtHistory: Array<{ agentName: string; agentRole: string; content: string }> = [];

    try {
      for (let i = 0; i < agents.length; i++) {
        if (abortSignal.aborted) break;

        const agent = agents[i];
        setCurrentAgent(agent);
        setRoundtableProgress({ current: i + 1, total: totalSteps, agent });
        setDisplayText(`${agent.name} is analyzing...`);
        setAiResponse('');

        // Build context: user question + prior agent responses
        const priorContext = rtHistory
          .map(h => `${h.agentName} (${h.agentRole}): ${h.content}`)
          .join('\n\n');

        const contextMessage = priorContext
          ? `User question: ${enrichedContent}\n\nPrevious analyst opinions:\n${priorContext}`
          : enrichedContent;

        const apiMessages: ChatMessage[] = [
          { id: 'ctx', role: 'user', content: contextMessage, timestamp: Date.now() },
        ];

        const overrideAgent: Agent = { ...agent, systemPrompt: buildRoundtablePrompt(agent) };

        try {
          let rtPrefetchStarted = false;
          const finalText = await callPuterAI(
            apiMessages,
            overrideAgent,
            (streamText) => {
              setAiResponse(streamText);
              // Prefetch TTS during streaming
              if (!rtPrefetchStarted && !isMuted && isTTSSupported()) {
                const cleaned = streamText.replace(/```trade[\s\S]*?```/g, '').trim();
                if (/[.!?](\s|$)/.test(cleaned) && cleaned.length > 20) {
                  prefetchTTS(cleaned, agent.id);
                  rtPrefetchStarted = true;
                }
              }
            },
            abortSignal,
          );

          const cleanText = finalText.replace(/```trade[\s\S]*?```/g, '').trim();
          setDisplayText(`${agent.name}`);
          setAiResponse(cleanText);

          // Speak this agent's response
          setVoiceState('speaking');
          await speakAsync(cleanText, agent.id);

          rtHistory.push({ agentName: agent.name, agentRole: agent.role, content: cleanText });
        } catch (err: any) {
          if (abortSignal.aborted) break;
          rtHistory.push({ agentName: agent.name, agentRole: agent.role, content: '(no response)' });
        }

        // Brief pause between agents
        if (i < agents.length - 1 && !abortSignal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Moderator synthesis
      if (!abortSignal.aborted) {
        setCurrentAgent(MODERATOR_AGENT as Agent);
        setRoundtableProgress({ current: totalSteps, total: totalSteps, agent: MODERATOR_AGENT as Agent });
        setDisplayText('Moderator synthesizing...');
        setAiResponse('');

        const summaryContext = rtHistory
          .map(h => `${h.agentName} (${h.agentRole}): ${h.content}`)
          .join('\n\n');

        const summaryMessages: ChatMessage[] = [
          { id: 'summary', role: 'user', content: `User question: ${text}\n\nAnalyst discussion:\n${summaryContext}`, timestamp: Date.now() },
        ];

        try {
          let modPrefetchStarted = false;
          const summaryText = await callPuterAI(
            summaryMessages,
            MODERATOR_AGENT as Agent,
            (streamText) => {
              setAiResponse(streamText);
              if (!modPrefetchStarted && !isMuted && isTTSSupported()) {
                const cleaned = streamText.replace(/```trade[\s\S]*?```/g, '').trim();
                if (/[.!?](\s|$)/.test(cleaned) && cleaned.length > 20) {
                  prefetchTTS(cleaned, 'moderator');
                  modPrefetchStarted = true;
                }
              }
            },
            abortSignal,
          );

          const cleanSummary = summaryText.replace(/```trade[\s\S]*?```/g, '').trim();
          setDisplayText('Moderator');
          setAiResponse(cleanSummary);
          setVoiceState('speaking');
          await speakAsync(cleanSummary, 'moderator');
        } catch {
          // Moderator failed
        }
      }
    } finally {
      setRoundtableActive(false);
      setRoundtableProgress(null);
      setVoiceState('idle');
      setDisplayText('Tap the orb to continue');
      // Restore default agent
      if (!manualAgentRef.current) {
        setCurrentAgent(DEFAULT_AGENT);
      }
    }
  }, [isMuted, speakAsync]);

  const handleVoiceSubmit = useCallback(async (text: string) => {
    if (!sdkReady || !text.trim()) return;

    setVoiceState('thinking');
    setDisplayText('Thinking...');
    setLastSignature(null); // Clear previous Solscan link
    recognitionRef.current?.stop();

    // Use manually selected agent, or auto-resolve from speech
    let agent: Agent;
    if (manualAgentRef.current) {
      agent = currentAgent;
    } else {
      agent = resolveAgent(text);
      setCurrentAgent(agent);
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const updatedHistory = [...conversationHistory, userMessage].slice(-20);
    setConversationHistory(updatedHistory);

    // Fetch context in parallel
    const [priceCtx, newsCtx] = await Promise.all([
      fetchPriceContext(text).catch(() => ''),
      fetchNewsContext(text).catch(() => ''),
    ]);
    const portfolioCtx = buildPortfolioContext(tokensData);

    // Build enriched message
    const enrichedContent = text + priceCtx + newsCtx + portfolioCtx;

    // Check if roundtable discussion should be used
    const isDiscussRequest = /\b(discuss|roundtable|everyone|all.*(think|analyze|opinion))\b/i.test(text);
    if (roundtableMode || isDiscussRequest) {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      await executeVoiceRoundtable(text, enrichedContent, abortController.signal);
      return;
    }

    const enrichedHistory = [
      ...updatedHistory.slice(0, -1),
      { ...userMessage, content: enrichedContent },
    ];

    // Augment agent with trade system prompt
    const voiceAgent: Agent = {
      ...agent,
      systemPrompt: agent.systemPrompt + '\n\n' + TRADE_SYSTEM_PROMPT,
    };

    // Abort previous request
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      let fullResponse = '';
      let prefetchStarted = false;
      const finalText = await callPuterAI(
        enrichedHistory,
        voiceAgent,
        (text) => {
          fullResponse = text;
          setAiResponse(text);
          // Prefetch TTS for first sentence(s) during streaming to reduce voice delay
          if (!prefetchStarted && !isMuted && isTTSSupported()) {
            const cleaned = text.replace(/```trade[\s\S]*?```/g, '').trim();
            if (/[.!?](\s|$)/.test(cleaned) && cleaned.length > 20) {
              prefetchTTS(cleaned, agent.id);
              prefetchStarted = true;
            }
          }
        },
        abortController.signal,
      );

      // Add assistant response to history (clean of trade blocks)
      const cleanResponse = finalText.replace(/```trade[\s\S]*?```/g, '').trim();
      setConversationHistory(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: cleanResponse,
          agentId: agent.id,
          timestamp: Date.now(),
        },
      ].slice(-20));

      // Check for trade intent — only if user's message actually requested a trade
      const intent = userRequestedTrade(text) ? parseTradeIntent(finalText) : null;

      if (intent && intent.confidence >= 0.7) {
        setTradeIntent(intent);
        setDisplayText(`${agent.name}: Trade detected`);
        await handleTradeIntent(intent, cleanResponse);
      } else {
        // Normal response — speak it with agent's voice
        setDisplayText(`${agent.name}`);
        if (!isMuted && isTTSSupported()) {
          setVoiceState('speaking');
          speak(cleanResponse, () => {
            setVoiceState('idle');
            setDisplayText('Tap the orb to continue');
          }, agent.id);
        } else {
          setVoiceState('idle');
          setDisplayText('Tap the orb to continue');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[VoiceAssistant] AI error:', error);
      const msg = error.message || '';
      if (msg.includes('Cloudflare Worker URL not configured')) {
        toast.error('AI unavailable — set up Cloudflare Worker in Settings > API Keys');
        setDisplayText('Configure AI in Settings');
      } else if (msg.includes('credits exhausted') || msg.includes('Puter')) {
        toast.error('AI credits exhausted. Configure Cloudflare Worker in Settings.');
        setDisplayText('Configure AI in Settings');
      } else {
        toast.error('AI request failed. Please try again.');
        setDisplayText('Tap the orb to try again');
      }
      setVoiceState('idle');
    }
  }, [sdkReady, conversationHistory, tokensData, isMuted, currentAgent, roundtableMode, executeVoiceRoundtable]);

  // Keep submit ref in sync so recognition.onresult always calls the latest version
  useEffect(() => { handleSubmitRef.current = handleVoiceSubmit; }, [handleVoiceSubmit]);

  const handleTradeIntent = useCallback(async (intent: TradeIntent, aiText: string) => {
    try {
      // --- SEND flow ---
      if (intent.action === 'send') {
        // Resolve amount + token info
        const sendInfo = resolveSendAmount(intent, tokensData);
        if (!sendInfo) {
          speakAndReturn(`You don't have enough ${intent.fromToken} to send.`);
          return;
        }
        setSendResolvedAmount(sendInfo);

        // Resolve destination
        const dest = resolveDestination(intent.destination);
        if (!dest) {
          // No destination — ask user to type/paste address
          setTradeIntent(intent);
          setShowAddressInput(true);
          setVoiceState('confirming');
          isConfirmingRef.current = true;
          const msg = 'Where should I send it? Please type or paste the destination address.';
          setDisplayText(msg);
          setAiResponse(aiText + '\n\n' + msg);
          if (!isMuted && isTTSSupported()) {
            speak(msg, () => {}, currentAgent.id);
          }
          return;
        }

        // Have destination — show confirmation
        setSendDestination(dest);
        setVoiceState('confirming');
        isConfirmingRef.current = true;

        const amtStr = sendInfo.amount >= 1 ? sendInfo.amount.toFixed(4) : sendInfo.amount.toFixed(6);
        const addrShort = `${dest.slice(0, 4)}...${dest.slice(-4)}`;
        const summary = `Send ${amtStr} ${intent.fromToken} to ${addrShort}`;
        setDisplayText(summary);
        setAiResponse(aiText + '\n\n' + summary);

        if (!isMuted && isTTSSupported()) {
          speak(summary + '. Say confirm or cancel.', () => {
            startListening();
          }, currentAgent.id);
        } else {
          startListening();
        }
        return;
      }

      // --- SWAP flow ---
      // Resolve tokens
      const resolved = await resolveTradeTokens(intent, tokensData);
      if (!resolved) {
        const msg = `I couldn't find the tokens you mentioned. Please try again with valid token symbols.`;
        speakAndReturn(msg);
        return;
      }

      // Fetch swap quote
      setDisplayText('Getting quote...');
      const quote = await getJupiterSwapQuote({
        inputMint: resolved.inputMint,
        outputMint: resolved.outputMint,
        amount: resolved.amount,
        slippage: 1,
        isTestnet,
        inputDecimals: resolved.inputDecimals,
        outputDecimals: resolved.outputDecimals,
        swapMode: resolved.swapMode,
      });

      setSwapQuote(quote);
      setResolvedTradeAmount(resolved.amount);
      setVoiceState('confirming');
      isConfirmingRef.current = true;

      // Build and speak the confirmation message
      const summary = buildTradeSummary(intent, quote, resolved.amount);
      setDisplayText(summary);
      setAiResponse(aiText + '\n\n' + summary);

      if (!isMuted && isTTSSupported()) {
        speak(summary + '. Say confirm or cancel.', () => {
          startListening();
        }, currentAgent.id);
      } else {
        // If muted, start listening immediately
        startListening();
      }
    } catch (error: any) {
      console.error('[VoiceAssistant] Trade error:', error);
      speakAndReturn(`Failed to process: ${error.message || 'Unknown error'}. Please try again.`);
    }
  }, [tokensData, isTestnet, isMuted, startListening, speakAndReturn, currentAgent]);

  const handleConfirmationResponse = useCallback((text: string) => {
    isConfirmingRef.current = false;
    recognitionRef.current?.stop();

    if (CONFIRM_WORDS.some(w => text.includes(w))) {
      executeTradeRef.current(); // Use ref to avoid stale closure
    } else if (CANCEL_WORDS.some(w => text.includes(w))) {
      speakAndReturn('Trade cancelled.');
      setTradeIntent(null);
      setSwapQuote(null);
      setResolvedTradeAmount(0);
    } else {
      // Unclear response - ask again
      isConfirmingRef.current = true;
      if (!isMuted) {
        speak('Sorry, say confirm to proceed or cancel to stop.', () => {
          startListening();
        }, currentAgent.id);
      } else {
        startListening();
      }
    }
  }, [isMuted, startListening, speakAndReturn, currentAgent]);

  // Keep confirm ref in sync so recognition.onresult always calls the latest version
  useEffect(() => { handleConfirmRef.current = handleConfirmationResponse; }, [handleConfirmationResponse]);

  const performSwapExecution = useCallback(async () => {
    if (!swapQuote || !tradeIntent) return;

    setVoiceState('executing');
    setDisplayText('Executing trade...');

    try {
      const mnemonic = wallet.getMnemonic();
      if (!mnemonic) {
        speakAndReturn('Wallet is locked. Please unlock first.');
        return;
      }

      // Handle imported accounts (same pattern as Swap.tsx)
      const activeAccount = AccountManager.getActiveAccount();
      let mnemonicToUse = mnemonic;
      let privateKeyBase58: string | undefined;

      const storedPrivateKeys = JSON.parse(localStorage.getItem('saturn_imported_private_keys') || '{}');
      const accountAddress = activeAccount?.addresses?.solana;
      const hasStoredPrivateKey = accountAddress && storedPrivateKeys[accountAddress];

      if (hasStoredPrivateKey || activeAccount?.isPrivateKeyImport) {
        const storedKey = storedPrivateKeys[accountAddress!];
        if (storedKey) {
          const decrypted = await decryptImportedSecret(storedKey, wallet.getPassword());
          if (decrypted) {
            privateKeyBase58 = decrypted;
          } else {
            speakAndReturn('Failed to decrypt private key.');
            return;
          }
        }
      } else if (activeAccount?.isImportedSeedPhrase && activeAccount?.encryptedMnemonic) {
        const password = wallet.getPassword();
        if (password) {
          const decrypted = await decryptWithPassword(activeAccount.encryptedMnemonic, password);
          if (decrypted) {
            mnemonicToUse = decrypted;
          }
        }
      }

      const result = await executeJupiterSwap({
        quoteResponse: swapQuote,
        mnemonic: privateKeyBase58 ? `PRIVKEY:${privateKeyBase58}` : mnemonicToUse,
        accountIndex: wallet.currentAccount,
        isTestnet,
      });

      if (result.success) {
        playSwapExchange();
        // Dispatch balance update event
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated'));

        const sig = result.signature || `voice_swap_${Date.now()}`;
        setLastSignature(sig);

        // Save swap to local history so it shows in Activity tab
        if (!isTestnet) {
          saveSwapToHistory({
            signature: sig,
            fromToken: tradeIntent.fromToken,
            toToken: tradeIntent.toToken,
            fromAmount: resolvedTradeAmount || tradeIntent.amount,
            toAmount: result.outputAmount || swapQuote.outputAmount,
            walletAddress: wallet.addresses?.solana || '',
            fromMint: swapQuote.inputMint,
            toMint: swapQuote.outputMint,
          });
        }

        const rawAmt = resolvedTradeAmount || tradeIntent.amount;
        const inputAmt = tradeIntent.amountType === 'all'
          ? `all your ${tradeIntent.fromToken}`
          : `${rawAmt >= 1 ? rawAmt.toFixed(2) : rawAmt.toFixed(6)} ${tradeIntent.fromToken}`;
        const outAmt = result.outputAmount || swapQuote.outputAmount;
        const successMsg = `Trade complete! Swapped ${inputAmt} for approximately ${
          outAmt >= 1 ? outAmt.toFixed(2) : outAmt.toFixed(4)
        } ${tradeIntent.toToken}. You can view the transaction on Solscan.`;

        setTradeIntent(null);
        setSwapQuote(null);
        setResolvedTradeAmount(0);
        speakAndReturn(successMsg);
      } else {
        speakAndReturn(`Trade failed: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error: any) {
      console.error('[VoiceAssistant] Swap execution error:', error);
      let errorMsg = 'Trade failed. Please try again.';
      if (error.message?.includes('Insufficient balance')) {
        errorMsg = 'Insufficient balance to complete this trade.';
      } else if (error.message?.includes('confirmation timeout')) {
        errorMsg = 'Transaction was sent but confirmation is slow. Check your Activity tab.';
      }
      speakAndReturn(errorMsg);
    }
  }, [swapQuote, tradeIntent, wallet, isTestnet, speakAndReturn]);

  const performSendExecution = useCallback(async () => {
    if (!tradeIntent || !sendDestination || !sendResolvedAmount) return;

    setVoiceState('executing');
    setDisplayText('Sending...');

    try {
      const mnemonic = wallet.getMnemonic();
      if (!mnemonic) {
        speakAndReturn('Wallet is locked. Please unlock first.');
        return;
      }

      // Handle imported accounts (same pattern as performSwapExecution)
      const activeAccount = AccountManager.getActiveAccount();
      let mnemonicToUse = mnemonic;
      let privateKeyBase58: string | undefined;

      const storedPrivateKeys = JSON.parse(localStorage.getItem('saturn_imported_private_keys') || '{}');
      const accountAddress = activeAccount?.addresses?.solana;
      const hasStoredPrivateKey = accountAddress && storedPrivateKeys[accountAddress];

      if (hasStoredPrivateKey || activeAccount?.isPrivateKeyImport) {
        const storedKey = storedPrivateKeys[accountAddress!];
        if (storedKey) {
          const decrypted = await decryptImportedSecret(storedKey, wallet.getPassword());
          if (decrypted) {
            privateKeyBase58 = decrypted;
          } else {
            speakAndReturn('Failed to decrypt private key.');
            return;
          }
        }
      } else if (activeAccount?.isImportedSeedPhrase && activeAccount?.encryptedMnemonic) {
        const password = wallet.getPassword();
        if (password) {
          const decrypted = await decryptWithPassword(activeAccount.encryptedMnemonic, password);
          if (decrypted) {
            mnemonicToUse = decrypted;
          }
        }
      }

      let result: { signature: string; success: boolean; error?: string };
      const isSol = tradeIntent.fromToken.toUpperCase() === 'SOL';

      if (privateKeyBase58) {
        // Private key path
        if (isSol) {
          result = await sendSolanaTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: sendDestination,
            amount: sendResolvedAmount.amount,
            isTestnet,
          });
        } else {
          result = await sendSPLTokenTransactionWithPrivateKey({
            privateKeyBase58,
            toAddress: sendDestination,
            amount: sendResolvedAmount.amount,
            tokenMint: sendResolvedAmount.mint,
            decimals: sendResolvedAmount.decimals,
            isTestnet,
          });
        }
      } else {
        // Mnemonic path
        if (isSol) {
          result = await sendSolanaTransaction({
            mnemonic: mnemonicToUse,
            toAddress: sendDestination,
            amount: sendResolvedAmount.amount,
            accountIndex: wallet.currentAccount,
            isTestnet,
          });
        } else {
          result = await sendSPLTokenTransaction({
            mnemonic: mnemonicToUse,
            toAddress: sendDestination,
            amount: sendResolvedAmount.amount,
            tokenMint: sendResolvedAmount.mint,
            decimals: sendResolvedAmount.decimals,
            accountIndex: wallet.currentAccount,
            isTestnet,
          });
        }
      }

      if (result.success) {
        playSendWhoosh();
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated'));

        const sig = result.signature || `voice_send_${Date.now()}`;
        setLastSignature(sig);

        const amtStr = sendResolvedAmount.amount >= 1
          ? sendResolvedAmount.amount.toFixed(2)
          : sendResolvedAmount.amount.toFixed(6);
        const addrShort = `${sendDestination.slice(0, 4)}...${sendDestination.slice(-4)}`;
        const successMsg = `Sent ${amtStr} ${tradeIntent.fromToken} to ${addrShort}. You can view the transaction on Solscan.`;

        setTradeIntent(null);
        setSendDestination(null);
        setSendResolvedAmount(null);
        setShowAddressInput(false);
        speakAndReturn(successMsg);
      } else {
        speakAndReturn(`Send failed: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error: any) {
      console.error('[VoiceAssistant] Send execution error:', error);
      let errorMsg = 'Send failed. Please try again.';
      if (error.message?.includes('Insufficient balance') || error.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient balance to complete this send.';
      }
      speakAndReturn(errorMsg);
    }
  }, [tradeIntent, sendDestination, sendResolvedAmount, wallet, isTestnet, speakAndReturn]);

  const executeTrade = useCallback(async () => {
    // Check biometric settings first
    if (biometricSettings?.enabled && biometricSettings?.requireForTransactions) {
      setShowBiometricConfirm(true);
      return;
    }

    // Route to send or swap execution
    if (tradeIntent?.action === 'send' && sendDestination && sendResolvedAmount) {
      await performSendExecution();
    } else if (swapQuote && tradeIntent?.action === 'swap') {
      await performSwapExecution();
    }
  }, [swapQuote, tradeIntent, biometricSettings, performSwapExecution, performSendExecution, sendDestination, sendResolvedAmount]);

  // Keep executeTrade ref in sync for handleConfirmationResponse
  useEffect(() => { executeTradeRef.current = executeTrade; }, [executeTrade]);

  const handleClose = useCallback(() => {
    // Stop all audio, speech recognition, and pending AI requests
    stopSpeaking();
    recognitionRef.current?.abort();
    abortRef.current?.abort();
    isConfirmingRef.current = false;
    manualAgentRef.current = false;
    setVoiceState('idle');
    setTranscript('');
    setAiResponse('');
    setTradeIntent(null);
    setSwapQuote(null);
    setResolvedTradeAmount(0);
    setLastSignature(null);
    setSendDestination(null);
    setSendResolvedAmount(null);
    setShowAddressInput(false);
    setAddressInput('');
    setRoundtableActive(false);
    setRoundtableProgress(null);
    setDisplayText('Tap the orb to start talking');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* Solid background */}
      <div className="absolute inset-0 bg-black" />
      <motion.div
        className="absolute inset-0 flex flex-col bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
      {/* Header — matches wallet header style */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
        >
          <X className="w-4 h-4 text-slate-300" />
        </button>

        {/* Current agent indicator */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
          >
            <img
              src={currentAgent.avatar}
              alt={currentAgent.name}
              className="w-5 h-5 rounded-full"
              style={{ background: `linear-gradient(135deg, ${currentAgent.gradientFrom}, ${currentAgent.gradientTo})` }}
            />
            <span className="text-xs text-slate-300 font-medium">{currentAgent.name}</span>
          </div>
        </div>

        <button
          onClick={() => {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            if (newMuted) stopSpeaking(); // Immediately silence current audio
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center px-4 overflow-hidden">
        {/* Conversation area — scrollable */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0">

          {/* Orb — shows agent avatar */}
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <VoiceOrb
                state={voiceState}
                gradientFrom={roundtableMode && !roundtableActive ? '#a855f7' : currentAgent.gradientFrom}
                gradientTo={roundtableMode && !roundtableActive ? '#7c3aed' : currentAgent.gradientTo}
                avatarUrl={roundtableActive ? currentAgent.avatar : (roundtableMode ? undefined : currentAgent.avatar)}
                avatarUrls={roundtableMode && !roundtableActive ? AGENTS.map(a => a.avatar) : undefined}
                onClick={handleOrbClick}
              />
            </div>
            {/* Agent name below orb */}
            <AnimatePresence>
              {(voiceState !== 'idle' || (roundtableMode && !roundtableActive)) && (
                <motion.span
                  className="text-slate-500 text-xs font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {roundtableMode && !roundtableActive
                    ? 'Discussion Mode'
                    : `${currentAgent.name} · ${currentAgent.role}`}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Roundtable progress */}
            <AnimatePresence>
              {roundtableProgress && (
                <motion.div
                  className="text-center mt-2"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <span className="text-purple-400 text-xs font-medium">
                    {roundtableProgress.agent.name} analyzing... ({roundtableProgress.current}/{roundtableProgress.total})
                  </span>
                  <div className="w-32 h-1 bg-purple-900/30 rounded-full mx-auto mt-1.5">
                    <motion.div
                      className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(roundtableProgress.current / roundtableProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Display text */}
          <motion.div
            className="text-center w-full max-w-xs mb-3"
            key={displayText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-slate-200 text-base font-medium leading-relaxed">
              {displayText}
            </p>
          </motion.div>

          {/* Transcript (what user said) */}
          <AnimatePresence>
            {transcript && voiceState === 'listening' && (
              <motion.p
                className="text-slate-500 text-sm text-center max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                "{transcript}"
              </motion.p>
            )}
          </AnimatePresence>

          {/* AI Response text — wallet-style card */}
          <AnimatePresence>
            {aiResponse && voiceState !== 'listening' && voiceState !== 'idle' && (
              <motion.div
                ref={scrollRef}
                className="mt-3 w-full max-w-xs max-h-36 overflow-y-auto rounded-xl p-3"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                <div
                  className="text-slate-400 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: injectVoiceTokenIcons(
                      aiResponse.replace(/```trade[\s\S]*?```/g, '').trim()
                    ),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trade Confirmation Card — compact */}
        <AnimatePresence>
          {voiceState === 'confirming' && tradeIntent && swapQuote && (
            <motion.div
              className="w-full max-w-xs rounded-xl overflow-hidden mb-3"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-400 font-semibold text-sm">{tradeIntent.amountSide === 'to' ? 'Buy' : 'Swap'} Confirmation</span>
                  <span className="text-slate-600 text-xs">via Jupiter</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TokenLogo symbol={tradeIntent.fromToken} name={tradeIntent.fromToken} size="sm" />
                    <div>
                      <span className="text-slate-500 text-xs">From</span>
                      <p className="text-white font-medium text-sm">
                        {tradeIntent.amountSide === 'to'
                          ? `~${swapQuote.inputAmount >= 1 ? swapQuote.inputAmount.toFixed(4) : swapQuote.inputAmount.toFixed(6)} ${tradeIntent.fromToken}`
                          : tradeIntent.amountType === 'all'
                            ? `All ${tradeIntent.fromToken}`
                            : tradeIntent.amountType === 'usd'
                              ? `$${tradeIntent.amount} (${(resolvedTradeAmount || 0).toFixed(resolvedTradeAmount >= 1 ? 2 : 6)} ${tradeIntent.fromToken})`
                              : `${resolvedTradeAmount || tradeIntent.amount} ${tradeIntent.fromToken}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-600 text-lg mx-2">→</span>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-slate-500 text-xs">To</span>
                      <p className="text-white font-medium text-sm">
                        {tradeIntent.amountSide === 'to'
                          ? `${resolvedTradeAmount || tradeIntent.amount} ${tradeIntent.toToken}`
                          : `~${swapQuote.outputAmount >= 1
                              ? swapQuote.outputAmount.toFixed(2)
                              : swapQuote.outputAmount.toFixed(4)} ${tradeIntent.toToken}`}
                      </p>
                    </div>
                    <TokenLogo symbol={tradeIntent.toToken} name={tradeIntent.toToken} size="sm" />
                  </div>
                </div>

                {/* Rate + details */}
                <div className="border-t border-slate-800/40 pt-2 mt-2 space-y-1">
                  {swapQuote.inputAmount > 0 && swapQuote.outputAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Rate</span>
                      <span className="text-slate-400">1 {tradeIntent.fromToken} ≈ {(swapQuote.outputAmount / swapQuote.inputAmount).toFixed(4)} {tradeIntent.toToken}</span>
                    </div>
                  )}
                  {swapQuote.priceImpact > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Impact</span>
                      <span className={swapQuote.priceImpact > 3 ? 'text-red-400' : 'text-slate-400'}>{swapQuote.priceImpact.toFixed(2)}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Fee</span>
                    <span className="text-slate-400">{swapQuote.feePercent.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      isConfirmingRef.current = false;
                      speakAndReturn('Trade cancelled.');
                      setTradeIntent(null);
                      setSwapQuote(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-slate-300 font-medium text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      isConfirmingRef.current = false;
                      executeTrade();
                    }}
                    className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    Confirm Swap
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Confirmation Card — compact */}
        <AnimatePresence>
          {voiceState === 'confirming' && tradeIntent?.action === 'send' && sendDestination && sendResolvedAmount && (
            <motion.div
              className="w-full max-w-xs rounded-xl overflow-hidden mb-3"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: `1px solid ${colors.primary}4D` }}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                    <span className="font-semibold text-sm" style={{ color: colors.accent }}>Send Confirmation</span>
                  </div>
                  <span className="text-slate-600 text-xs">Solana</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <TokenLogo symbol={tradeIntent.fromToken} name={tradeIntent.fromToken} size="sm" />
                  <div>
                    <p className="text-white font-medium text-sm">
                      {sendResolvedAmount.amount >= 1
                        ? sendResolvedAmount.amount.toFixed(4)
                        : sendResolvedAmount.amount.toFixed(6)} {tradeIntent.fromToken}
                    </p>
                    <span className="text-slate-500 text-xs">
                      To: {sendDestination.slice(0, 6)}...{sendDestination.slice(-4)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      isConfirmingRef.current = false;
                      speakAndReturn('Send cancelled.');
                      setTradeIntent(null);
                      setSendDestination(null);
                      setSendResolvedAmount(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-slate-300 font-medium text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      isConfirmingRef.current = false;
                      executeTrade();
                    }}
                    className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition-colors"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                  >
                    Confirm Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address Input — when send destination is unknown */}
        <AnimatePresence>
          {showAddressInput && tradeIntent?.action === 'send' && !sendDestination && (
            <motion.div
              className="w-full max-w-xs rounded-xl overflow-hidden mb-3"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="p-4">
                <p className="text-slate-400 text-sm mb-2">Paste recipient address:</p>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Solana address..."
                  className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-slate-500 mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      isConfirmingRef.current = false;
                      setShowAddressInput(false);
                      setTradeIntent(null);
                      setSendResolvedAmount(null);
                      speakAndReturn('Send cancelled.');
                    }}
                    className="flex-1 py-2 rounded-xl text-slate-300 font-medium text-sm"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.3)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const addr = addressInput.trim();
                      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
                        setSendDestination(addr);
                        setShowAddressInput(false);
                        // Confirmation card will now show
                        const amtStr = sendResolvedAmount
                          ? (sendResolvedAmount.amount >= 1 ? sendResolvedAmount.amount.toFixed(4) : sendResolvedAmount.amount.toFixed(6))
                          : '?';
                        const summary = `Send ${amtStr} ${tradeIntent?.fromToken} to ${addr.slice(0, 4)}...${addr.slice(-4)}`;
                        setDisplayText(summary);
                        if (!isMuted && isTTSSupported()) {
                          speak(summary + '. Say confirm or cancel.', () => {
                            startListening();
                          }, currentAgent.id);
                        } else {
                          startListening();
                        }
                      } else {
                        toast.error('Invalid Solana address');
                      }
                    }}
                    className="flex-1 py-2 rounded-xl font-medium text-sm text-white"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solscan link after successful swap/send — only while response card is visible */}
        <AnimatePresence>
          {lastSignature && voiceState === 'speaking' && (
            <motion.div
              className="w-full max-w-xs mb-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <a
                href={`https://solscan.io/tx/${lastSignature}${isTestnet ? '?cluster=devnet' : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm transition-all rounded-xl py-2.5 border group"
                style={{
                  color: colors.accent,
                  background: `linear-gradient(to right, ${colors.primary}1A, ${colors.secondary}1A)`,
                  borderColor: `${colors.primary}33`,
                }}
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                View on Solscan
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom area — agent selector + hint */}
      <div
        className="px-4 pb-4 flex flex-col items-center gap-2.5"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Agent chips — wallet card style */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              disabled={roundtableActive}
              onClick={() => {
                setCurrentAgent(agent);
                manualAgentRef.current = true;
                setRoundtableMode(false); // Deactivate discuss when picking an agent
                toast.success(`Switched to ${agent.name}`);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                opacity: roundtableActive ? 0.5 : 1,
                backgroundColor: !roundtableMode && currentAgent.id === agent.id
                  ? `${agent.gradientFrom}30`
                  : 'rgba(15, 23, 42, 0.5)',
                color: !roundtableMode && currentAgent.id === agent.id ? '#fff' : 'rgba(148, 163, 184, 0.8)',
                border: `1px solid ${!roundtableMode && currentAgent.id === agent.id ? `${agent.gradientFrom}60` : 'rgba(51, 65, 85, 0.3)'}`,
              }}
            >
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-4 h-4 rounded-full"
                style={{ background: `linear-gradient(135deg, ${agent.gradientFrom}60, ${agent.gradientTo}60)` }}
              />
              {agent.name}
            </button>
          ))}

          {/* Discuss toggle */}
          <button
            onClick={() => {
              const newMode = !roundtableMode;
              setRoundtableMode(newMode);
              if (newMode) manualAgentRef.current = false; // Reset manual agent selection
              toast.success(newMode ? 'Discussion mode on' : 'Discussion mode off');
            }}
            disabled={roundtableActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              backgroundColor: roundtableMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${roundtableMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(51, 65, 85, 0.3)'}`,
              color: roundtableMode ? '#c084fc' : '#94a3b8',
              opacity: roundtableActive ? 0.5 : 1,
            }}
          >
            <Users className="w-3.5 h-3.5" />
            Discuss
          </button>

          {/* AI Provider selector */}
          <div className="flex items-center gap-1 ml-auto">
            {(['puter', 'cloudflare', 'ollama'] as AIProvider[]).map((p) => {
              const label = p === 'puter' ? 'Puter' : p === 'cloudflare' ? 'CF' : 'Ollama';
              const isActive = aiProvider === p;
              const color = p === 'puter' ? '#a855f7' : p === 'cloudflare' ? '#fb923c' : '#22c55e';
              return (
                <button
                  key={p}
                  onClick={() => {
                    if (p === 'puter' && isPuterDisabled()) {
                      resetPuter();
                      toast.success('Switched to Puter (GPT-4o) — credits reset');
                    } else {
                      const names = { puter: 'Puter (GPT-4o)', cloudflare: 'Cloudflare (Llama 3.1)', ollama: 'Ollama (Llama 3.2)' };
                      toast.success(`Switched to ${names[p]}`);
                    }
                    setAIProvider(p);
                    setAiProvider(p);
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? `${color}33` : 'transparent',
                    color: isActive ? color : '#64748b',
                    border: isActive ? `1px solid ${color}66` : '1px solid transparent',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint text */}
        <p className="text-slate-600 text-[11px] text-center">
          {voiceState === 'idle' && (roundtableMode ? 'Discussion mode — all agents will analyze your question' : 'Say "swap 1 SOL to USDC" or ask any question')}
          {voiceState === 'listening' && 'Speak now...'}
          {voiceState === 'thinking' && 'Processing your request...'}
          {voiceState === 'speaking' && (roundtableActive ? 'Tap orb to skip to next agent' : 'Tap orb to interrupt')}
          {voiceState === 'confirming' && 'Say "confirm" or "cancel"'}
          {voiceState === 'executing' && 'Executing your trade...'}
        </p>
      </div>

      {/* Biometric Confirmation Dialog */}
      <BiometricConfirmDialog
        open={showBiometricConfirm}
        onOpenChange={setShowBiometricConfirm}
        onConfirm={() => {
          setShowBiometricConfirm(false);
          if (tradeIntent?.action === 'send') {
            performSendExecution();
          } else {
            performSwapExecution();
          }
        }}
        walletId={walletId}
        title={tradeIntent?.action === 'send' ? 'Confirm Send' : 'Confirm Trade'}
        description="Authenticate to execute this swap"
        amount={tradeIntent?.amount?.toString()}
        token={tradeIntent?.fromToken}
      />
      </motion.div>
    </div>,
    document.body,
  );
}
