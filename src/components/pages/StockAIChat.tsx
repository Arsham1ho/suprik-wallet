import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Trash2, Bot, Users, Square, Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useTheme } from '../../utils/ThemeContext';
import {
  AGENTS,
  MODERATOR_AGENT,
  resolveAgent,
  stripMention,
  callPuterAI,
  callRoundtable,
  loadPuterSDK,
  isRoundtableRequest,
  hasExplicitMention,
  fetchPriceContext,
  fetchNewsContext,
  extractTickers,
  type Agent,
  type ChatMessage,
  getAIProvider,
  setAIProvider,
  isPuterDisabled,
  resetPuter,
  type AIProvider,
} from '../../utils/puterAI';
import { TOKEN_REGISTRY } from '../../utils/tokenRegistry';
import { STOCK_TOKENS } from '../../utils/stockTokens';
import { SYMBOL_TO_COINGECKO, fetchCoinGeckoChartCached, fetchCoinGeckoPrices } from '../../utils/coingecko';
import type { Token } from './Home';

interface StockAIChatProps {
  walletId: string;
  tokensData?: Token[];
}

interface DisplayMessage extends ChatMessage {
  agent?: Agent;
  isStreaming?: boolean;
  isModerator?: boolean;
}

// Sanitize HTML output to prevent XSS using DOMPurify
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['pre', 'code', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'img'],
    ALLOWED_ATTR: ['class', 'src', 'alt'],
  });
}

// --- Inline token/stock icon injection ---
// Skip common acronyms/abbreviations that collide with tickers
const ICON_SKIP = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY',
  'CEO', 'IPO', 'ETF', 'GDP', 'SEC', 'FED', 'IMF',
  'ATH', 'ROI', 'APY', 'APR', 'TVL', 'YTD', 'NFT',
  'AI', 'US', 'UK', 'EU', 'IT', 'AM', 'PM', 'VS',
]);

// Map 1: Symbol → logo (case-sensitive matching, e.g. "BTC", "TSLA")
const SYMBOL_LOGO_MAP = new Map<string, string>();
for (const t of TOKEN_REGISTRY) {
  const sym = t.symbol.toUpperCase();
  if (sym.length >= 2 && !ICON_SKIP.has(sym)) {
    SYMBOL_LOGO_MAP.set(sym, t.image);
  }
}
for (const t of STOCK_TOKENS) {
  const sym = t.stockSymbol.toUpperCase();
  if (sym.length >= 2 && !ICON_SKIP.has(sym) && !SYMBOL_LOGO_MAP.has(sym)) {
    SYMBOL_LOGO_MAP.set(sym, t.logo);
  }
}

// Map 2: Name → logo (case-SENSITIVE matching — "Bitcoin" matches, "bitcoin" doesn't)
// This prevents false positives where common English words match token names
// (e.g. "optimism" the word vs "Optimism" the L2 chain)
const NAME_LOGO_MAP = new Map<string, string>();
for (const t of TOKEN_REGISTRY) {
  const name = t.name;
  // Only match names >= 5 chars to avoid false positives with common words
  if (name.length >= 5 && !SYMBOL_LOGO_MAP.has(name.toUpperCase())) {
    NAME_LOGO_MAP.set(name, t.image); // Store original capitalization
  }
}
for (const t of STOCK_TOKENS) {
  const name = t.companyName;
  if (name.length >= 5 && !NAME_LOGO_MAP.has(name)) {
    // Use HTML-escaped name since & becomes &amp; in rendered HTML
    const escapedName = name.replace(/&/g, '&amp;');
    NAME_LOGO_MAP.set(escapedName, t.logo);
  }
}

// Build case-sensitive symbol regex (longest first)
const _iconSymbols = Array.from(SYMBOL_LOGO_MAP.keys())
  .sort((a, b) => b.length - a.length)
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const SYMBOL_ICON_RE = new RegExp(`\\b(${_iconSymbols})\\b`, 'g');

// Build case-sensitive name regex (longest first)
const _namePatterns = Array.from(NAME_LOGO_MAP.keys())
  .sort((a, b) => b.length - a.length)
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const NAME_ICON_RE = _namePatterns ? new RegExp(`\\b(${_namePatterns})\\b`, 'g') : null;

// Process text nodes in HTML, skipping tags
function _replaceInTextNodes(
  html: string,
  re: RegExp,
  getLogoFn: (match: string) => string | undefined,
): string {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(re, (match) => {
        const logo = getLogoFn(match);
        if (!logo) return match;
        return `<img src="${logo}" alt="${match}" class="token-icon-inline">${match}`;
      });
    })
    .join('');
}

function injectTokenIcons(html: string): string {
  // Pass 1: Symbol matching (case-sensitive) — BTC, ETH, SOL, TSLA...
  let result = _replaceInTextNodes(html, SYMBOL_ICON_RE, (m) =>
    SYMBOL_LOGO_MAP.get(m.toUpperCase()),
  );
  // Pass 2: Name matching (case-sensitive) — Bitcoin, Ethereum, Tesla...
  if (NAME_ICON_RE) {
    result = _replaceInTextNodes(result, NAME_ICON_RE, (m) =>
      NAME_LOGO_MAP.get(m),
    );
  }
  return result;
}

// Lightweight markdown renderer (bold, italic, code, lists)
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks (```)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-slate-800/80 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Bullet lists (- item or * item at start of line)
  html = html.replace(/((?:^|<br\/>)[\s]*[-*]\s.+(?:<br\/>[\s]*[-*]\s.+)*)/g, (match) => {
    const items = match
      .split(/<br\/>/)
      .filter(line => /^\s*[-*]\s/.test(line))
      .map(line => `<li class="ml-4">${line.replace(/^\s*[-*]\s/, '')}</li>`)
      .join('');
    return `<ul class="my-1 space-y-0.5">${items}</ul>`;
  });

  // Numbered lists
  html = html.replace(/((?:^|<br\/>)[\s]*\d+\.\s.+(?:<br\/>[\s]*\d+\.\s.+)*)/g, (match) => {
    const items = match
      .split(/<br\/>/)
      .filter(line => /^\s*\d+\.\s/.test(line))
      .map(line => `<li class="ml-4">${line.replace(/^\s*\d+\.\s/, '')}</li>`)
      .join('');
    return `<ol class="my-1 space-y-0.5 list-decimal">${items}</ol>`;
  });

  // Inject inline token/stock icons
  html = injectTokenIcons(html);

  return sanitizeHtml(html);
}

const STORAGE_KEY_PREFIX = 'suprik_stock_chat_';
const MAX_STORED_MESSAGES = 50;

// Autocomplete search index — built once at module load
interface AutocompleteItem { symbol: string; name: string; type: 'crypto' | 'stock' }
const AUTOCOMPLETE_INDEX: AutocompleteItem[] = (() => {
  const seen = new Set<string>();
  const items: AutocompleteItem[] = [];
  for (const t of TOKEN_REGISTRY) {
    const key = t.symbol.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push({ symbol: t.symbol, name: t.name, type: 'crypto' });
    }
  }
  for (const t of STOCK_TOKENS) {
    const key = t.stockSymbol.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push({ symbol: t.stockSymbol, name: t.companyName, type: 'stock' });
    }
  }
  return items;
})();

// --- Portfolio context builder ---
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

// --- Sparkline chart component ---
interface SparklineProps {
  data: Array<{ time: string; price: number }>;
  symbol: string;
  price: number;
  change24h: number;
}

function SparklineChart({ data, symbol, price, change24h }: SparklineProps) {
  if (data.length < 2) return null;

  const prices = data.map(d => d.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;
  const paddedRange = range * 1.1;
  const paddedMin = minPrice - range * 0.05;

  const path = data.map((point, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((point.price - paddedMin) / paddedRange) * 100;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const isPositive = change24h >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  const priceStr = price >= 1
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${price.toPrecision(4)}`;
  const changeStr = isPositive ? `+${change24h.toFixed(1)}%` : `${change24h.toFixed(1)}%`;
  const gradId = `spark-${symbol}-${Date.now()}`;

  return (
    <div className="mt-2 rounded-lg bg-slate-900/60 border border-slate-800/30 p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-white">{symbol} 7d</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-300">{priceStr}</span>
          <span className={`text-[10px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {changeStr}
          </span>
        </div>
      </div>
      <svg className="w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: '60px' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 100 L 0 100 Z`} fill={`url(#${gradId})`} />
        <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function StockAIChat({ walletId, tokensData }: StockAIChatProps) {
  const { colors } = useTheme();
  const accentHex = colors.accent || colors.primary || '#7c3aed';
  const primaryHex = colors.primary || '#7c3aed';
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [roundtableMode, setRoundtableMode] = useState(true);
  const [aiProvider, setAiProvider] = useState<AIProvider>(getAIProvider());
  const [roundtableProgress, setRoundtableProgress] = useState<{ current: number; total: number; agentName: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [messageCharts, setMessageCharts] = useState<
    Record<string, Array<{ symbol: string; price: number; change24h: number; data: Array<{ time: string; price: number }> }>>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceBaseInputRef = useRef<string>('');

  // All known agents (including moderator) for restoring from localStorage
  const allAgents = [...AGENTS, MODERATOR_AGENT];

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${walletId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as DisplayMessage[];
        // Re-attach agent references (including moderator)
        const restored = parsed.map(msg => ({
          ...msg,
          agent: msg.agentId ? allAgents.find(a => a.id === msg.agentId) : undefined,
          isModerator: msg.agentId === 'moderator',
          isStreaming: false,
        }));
        setMessages(restored);
      }
    } catch {
      // Ignore parse errors
    }
  }, [walletId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length === 0) return;
    const toStore = messages
      .filter(m => !m.isStreaming)
      .slice(-MAX_STORED_MESSAGES);
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${walletId}`,
        JSON.stringify(toStore)
      );
    } catch {
      // Storage full, ignore
    }
  }, [messages, walletId]);

  // Load Puter SDK on mount (Cloudflare AI fallback available if Puter fails)
  useEffect(() => {
    loadPuterSDK()
      .then(() => setSdkReady(true))
      .catch(() => {
        // Puter SDK failed but Cloudflare AI fallback is available — still allow usage
        console.warn('[StockAIChat] Puter SDK unavailable, Cloudflare AI fallback active');
        setSdkReady(true);
      });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice input setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // Collect all results into one transcript, using the latest version of each result
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Replace input with base (before listening) + live transcript
      const base = voiceBaseInputRef.current;
      setInput(base ? base + ' ' + transcript : transcript);

      // Check if all results are final
      const allFinal = Array.from(event.results).every((r: any) => r.isFinal);
      if (allFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Voice] Error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Save current input as base so we replace (not duplicate) the transcript
      voiceBaseInputRef.current = input;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Fetch sparkline charts for a completed message
  const fetchChartsForMessage = async (msgId: string, content: string) => {
    const tickers = extractTickers(content).slice(0, 2);
    if (tickers.length === 0) return;
    if (messageCharts[msgId]) return;

    const charts: Array<{ symbol: string; price: number; change24h: number; data: Array<{ time: string; price: number }> }> = [];

    for (const ticker of tickers) {
      const cgId = SYMBOL_TO_COINGECKO[ticker];
      if (!cgId) continue;

      try {
        const [chartData, priceData] = await Promise.all([
          fetchCoinGeckoChartCached(cgId, 7),
          fetchCoinGeckoPrices([cgId]).then(p => p[cgId] || null),
        ]);

        if (chartData.length > 0 && priceData) {
          charts.push({
            symbol: ticker,
            price: priceData.price,
            change24h: priceData.change24h,
            data: chartData,
          });
        }
      } catch {
        // Non-blocking
      }
    }

    if (charts.length > 0) {
      setMessageCharts(prev => ({ ...prev, [msgId]: charts }));
    }
  };

  // Autocomplete: reactively compute suggestions from current input
  const suggestions = useMemo(() => {
    const words = input.split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase();

    if (!lastWord || lastWord.length < 2 || lastWord.startsWith('@')) {
      return [];
    }

    return AUTOCOMPLETE_INDEX.filter(item =>
      item.symbol.toLowerCase().startsWith(lastWord) ||
      item.name.toLowerCase().startsWith(lastWord) ||
      (lastWord.length >= 3 && item.name.toLowerCase().includes(lastWord))
    ).slice(0, 5);
  }, [input]);

  const handleSuggestionTap = (item: AutocompleteItem) => {
    const words = input.split(/\s+/);
    words[words.length - 1] = item.symbol;
    setInput(words.join(' ') + ' ');
    inputRef.current?.focus();
  };

  const handleAgentTap = (agent: Agent) => {
    setInput(`@${agent.id} `);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Cancel any ongoing stream
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    // Determine mode: roundtable or single agent
    const useRoundtable = (roundtableMode || isRoundtableRequest(trimmed)) && !hasExplicitMention(trimmed);

    // Add user message
    const userMsg: DisplayMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (useRoundtable) {
      await executeRoundtable(trimmed, abortController);
    } else {
      await executeSingleAgent(trimmed, abortController);
    }
  };

  const executeSingleAgent = async (trimmed: string, abortController: AbortController) => {
    const agent = resolveAgent(trimmed);
    const cleanContent = stripMention(trimmed);

    // Fetch live price data + news in parallel (non-blocking)
    const [priceContext, newsContext] = await Promise.all([
      fetchPriceContext(cleanContent).catch(() => ''),
      fetchNewsContext(cleanContent).catch(() => ''),
    ]);
    const portfolioContext = buildPortfolioContext(tokensData);

    // Add placeholder for assistant
    const assistantId = `asst_${Date.now()}`;
    const assistantMsg: DisplayMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agent,
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMsg]);

    try {
      const enrichedContent = cleanContent + priceContext + portfolioContext + newsContext;
      const contextMessages: ChatMessage[] = [
        ...messages.filter(m => !m.isStreaming).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        { id: `user_${Date.now()}`, role: 'user' as const, content: enrichedContent, timestamp: Date.now() },
      ];

      const finalText = await callPuterAI(
        contextMessages,
        agent,
        (text) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: text } : m
            )
          );
        },
        abortController.signal,
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: finalText, isStreaming: false }
            : m
        )
      );

      // Fetch sparkline charts for the response
      fetchChartsForMessage(assistantId, finalText);
    } catch (error: any) {
      if (abortController.signal.aborted) return;
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      const msg = error.message || '';
      if (msg.includes('Cloudflare Worker URL not configured')) {
        toast.error('AI unavailable — set up Cloudflare Worker in Settings > API Keys');
      } else {
        toast.error(msg || 'Failed to get response');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const executeRoundtable = async (trimmed: string, abortController: AbortController) => {
    // Fetch live price data + news in parallel
    const [priceContext, newsContext] = await Promise.all([
      fetchPriceContext(trimmed).catch(() => ''),
      fetchNewsContext(trimmed).catch(() => ''),
    ]);
    const portfolioContext = buildPortfolioContext(tokensData);
    const enrichedMessage = trimmed + priceContext + portfolioContext + newsContext;

    try {
      await callRoundtable(
        enrichedMessage,
        {
          onAgentStart: (agent: Agent) => {
            const msgId = `rt_${agent.id}_${Date.now()}`;
            const newMsg: DisplayMessage = {
              id: msgId,
              role: 'assistant',
              content: '',
              agentId: agent.id,
              agent,
              timestamp: Date.now(),
              isStreaming: true,
              isModerator: agent.id === 'moderator',
            };
            setMessages(prev => [...prev, newMsg]);
            return msgId;
          },
          onChunk: (msgId: string, text: string) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === msgId ? { ...m, content: text } : m
              )
            );
          },
          onAgentDone: (msgId: string, finalText: string) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === msgId ? { ...m, content: finalText, isStreaming: false } : m
              )
            );
            // Fetch charts for moderator summary
            if (msgId.startsWith('rt_moderator_')) {
              fetchChartsForMessage(msgId, finalText);
            }
          },
          onProgress: (current: number, total: number, agent: Agent) => {
            setRoundtableProgress({ current, total, agentName: agent.name });
          },
        },
        abortController.signal,
      );
    } catch (error: any) {
      if (!abortController.signal.aborted) {
        const msg = error.message || '';
        if (msg.includes('Cloudflare Worker URL not configured')) {
          toast.error('AI unavailable — set up Cloudflare Worker in Settings > API Keys');
        } else {
          toast.error(msg || 'Roundtable discussion failed');
        }
      }
    } finally {
      setIsLoading(false);
      setRoundtableProgress(null);
    }
  };

  const handleCancelRoundtable = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setRoundtableProgress(null);
    // Keep completed messages, remove any still-streaming ones
    setMessages(prev => prev.filter(m => !m.isStreaming));
  };

  const handleClearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${walletId}`);
    setIsLoading(false);
    setRoundtableProgress(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Agent Avatars Row + Roundtable Toggle */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="flex gap-3 justify-between pb-1">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentTap(agent)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <div
                className="w-12 h-12 rounded-full p-[2px] transition-transform group-active:scale-90"
                style={{ background: `linear-gradient(135deg, ${agent.gradientFrom}, ${agent.gradientTo})` }}
              >
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  {avatarErrors.has(agent.id) ? (
                    <span className="text-sm font-bold text-white">{agent.initial}</span>
                  ) : (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full rounded-full"
                      onError={() => setAvatarErrors(prev => new Set(prev).add(agent.id))}
                    />
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400 leading-tight">
                {agent.name}
              </span>
              <span className="text-[8px] text-slate-600 leading-tight -mt-0.5">
                {agent.role.split(' ')[0]}
              </span>
            </button>
          ))}
          {/* Roundtable toggle */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setRoundtableMode(prev => !prev)}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-active:scale-90 border-2 ${
                  roundtableMode
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-800/30 bg-slate-900/50'
                }`}
              >
                <Users className={`w-5 h-5 ${roundtableMode ? 'text-purple-400' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[10px] font-medium ${roundtableMode ? 'text-purple-400' : 'text-slate-500'}`}>
                Discuss
              </span>
            </button>
          </div>
          {/* AI Provider selector */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium transition-all"
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
      </div>

      {/* Roundtable Progress Bar */}
      {roundtableProgress && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex-shrink-0 px-4 pb-2"
        >
          <div className="bg-purple-950/30 border border-purple-900/40 rounded-xl p-2.5 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-purple-300 font-medium">
                  {roundtableProgress.agentName} analyzing...
                </span>
                <span className="text-xs text-purple-400">
                  {roundtableProgress.current}/{roundtableProgress.total}
                </span>
              </div>
              <div className="w-full bg-purple-900/30 rounded-full h-1.5">
                <motion.div
                  className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(roundtableProgress.current / roundtableProgress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <button
              onClick={handleCancelRoundtable}
              className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center hover:bg-purple-900/60 transition-colors flex-shrink-0"
            >
              <Square className="w-3.5 h-3.5 text-purple-300 fill-purple-300" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Message List */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 space-y-3"
      >
        {messages.length === 0 ? (
          /* Empty State — Agent Intro */
          <div className="flex flex-col h-full pt-2 gap-3">
            <div className="text-center mb-1">
              <p className="text-white font-semibold">Your AI Analyst Team</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Tap an agent for a single take, or use <span className="text-purple-400">Discuss</span> for a roundtable
              </p>
            </div>
            {/* Agent role cards */}
            <div className="grid grid-cols-2 gap-2">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentTap(agent)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/20 text-left transition-all active:scale-[0.98]"
                >
                  <div
                    className="w-8 h-8 rounded-full p-[1.5px] flex-shrink-0 mt-0.5"
                    style={{ background: `linear-gradient(135deg, ${agent.gradientFrom}, ${agent.gradientTo})` }}
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {avatarErrors.has(agent.id) ? (
                        <span className="text-[9px] font-bold text-white">{agent.initial}</span>
                      ) : (
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-full h-full rounded-full"
                          onError={() => setAvatarErrors(prev => new Set(prev).add(agent.id))}
                        />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{agent.name}</p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: agent.gradientFrom }}>{agent.role}</p>
                  </div>
                </button>
              ))}
            </div>
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-auto pb-1">
              {['What do you think about SOL?', '@warren Is Bitcoin undervalued?', '@all Analyze ETH'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-[11px] bg-slate-900/50 border border-slate-800/30 rounded-full px-3 py-1.5 text-slate-400 hover:text-white transition-all"
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accentHex}40`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Agent avatar */}
                {msg.role === 'assistant' && msg.agent && (
                  <div
                    className="w-7 h-7 rounded-full p-[1.5px] mr-2 mt-1 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${msg.agent.gradientFrom}, ${msg.agent.gradientTo})` }}
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {avatarErrors.has(msg.agent.id) ? (
                        <span className="text-[9px] font-bold text-white">{msg.agent.initial}</span>
                      ) : (
                        <img
                          src={msg.agent.avatar}
                          alt={msg.agent.name}
                          className="w-full h-full rounded-full"
                          onError={() => setAvatarErrors(prev => new Set(prev).add(msg.agent!.id))}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md px-4 py-2.5 text-white border'
                      : msg.isModerator
                        ? 'rounded-2xl rounded-bl-md px-4 py-2.5 border'
                        : 'rounded-2xl rounded-bl-md px-4 py-2.5 bg-slate-900/50 border border-slate-800/30'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: `${primaryHex}20`, borderColor: `${primaryHex}40` }
                      : msg.isModerator
                        ? { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }
                        : undefined
                  }
                >
                  {/* Agent name & role */}
                  {msg.role === 'assistant' && msg.agent && (
                    <p className="text-xs font-semibold mb-1" style={{ color: msg.agent.gradientFrom }}>
                      {msg.isModerator ? '⚖️ ' : ''}{msg.agent.name} · {msg.agent.role}
                    </p>
                  )}

                  {/* Message content */}
                  {msg.content ? (
                    <div
                      className="text-sm text-white/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : null}

                  {/* Streaming cursor */}
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block w-1 h-4 bg-white/60 ml-0.5 animate-pulse align-middle" />
                  )}

                  {/* Inline sparkline charts */}
                  {!msg.isStreaming && msg.role === 'assistant' && messageCharts[msg.id] && (
                    <div className="mt-1 space-y-1">
                      {messageCharts[msg.id].map(chart => (
                        <SparklineChart
                          key={chart.symbol}
                          data={chart.data}
                          symbol={chart.symbol}
                          price={chart.price}
                          change24h={chart.change24h}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* SDK Error */}
      {sdkError && (
        <div className="px-4 py-2">
          <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-red-400 text-sm">Failed to load AI. Check your connection and try again.</p>
            <button
              onClick={() => {
                setSdkError(false);
                loadPuterSDK()
                  .then(() => setSdkReady(true))
                  .catch(() => setSdkError(true));
              }}
              className="text-xs mt-1 font-medium"
              style={{ color: accentHex }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((item) => (
              <button
                key={`${item.type}-${item.symbol}`}
                onClick={() => handleSuggestionTap(item)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/70 border border-slate-700/40 text-xs whitespace-nowrap shrink-0 hover:bg-slate-800/70 transition-colors"
              >
                <span className="font-semibold text-white">{item.symbol}</span>
                <span className="text-slate-500">{item.name}</span>
                <span className={`text-[9px] px-1 py-0.5 rounded ${item.type === 'crypto' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                  {item.type === 'crypto' ? 'Crypto' : 'Stock'}
                </span>
              </button>
            ))}
          </div>
        )}
        {/* Roundtable mode indicator */}
        {roundtableMode && !isLoading && suggestions.length === 0 && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Users className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] text-purple-400 font-medium">Discuss mode — all agents will weigh in</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Clear chat button */}
          {messages.length > 0 && !isLoading && (
            <button
              onClick={handleClearChat}
              className="w-11 h-11 rounded-full bg-slate-900/50 border border-slate-800/30 flex items-center justify-center transition-all hover:bg-slate-800/50 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !sdkReady ? 'Loading AI...'
                : roundtableMode ? 'Ask all agents... (or @agent for single)'
                  : 'Ask about stocks or crypto...'
            }
            disabled={!sdkReady || sdkError || isLoading}
            className="flex-1 bg-slate-900/50 border border-slate-800/30 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 disabled:opacity-50"
            style={{
              '--tw-ring-color': `${roundtableMode ? '#a855f7' : primaryHex}30`,
              borderColor: roundtableMode ? 'rgba(168, 85, 247, 0.2)' : undefined,
            } as React.CSSProperties}
          />
          {/* Voice input button */}
          <button
            onClick={handleVoiceToggle}
            disabled={!sdkReady || sdkError || isLoading}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isListening
                ? 'bg-red-500/80 animate-pulse'
                : 'bg-slate-900/50 border border-slate-800/30 hover:bg-slate-800/50'
            } disabled:opacity-30`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !sdkReady}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
            style={{ backgroundColor: roundtableMode ? '#a855f7' : primaryHex }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
