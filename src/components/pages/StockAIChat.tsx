import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useTheme } from '../../utils/ThemeContext';
import {
  AGENTS,
  resolveAgent,
  stripMention,
  callPuterAI,
  loadPuterSDK,
  type Agent,
  type ChatMessage,
} from '../../utils/puterAI';

interface StockAIChatProps {
  walletId: string;
}

interface DisplayMessage extends ChatMessage {
  agent?: Agent;
  isStreaming?: boolean;
}

// Sanitize HTML output to prevent XSS using DOMPurify
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['pre', 'code', 'strong', 'em', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'],
  });
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

  return sanitizeHtml(html);
}

const STORAGE_KEY_PREFIX = 'suprik_stock_chat_';
const MAX_STORED_MESSAGES = 50;

export function StockAIChat({ walletId }: StockAIChatProps) {
  const { colors } = useTheme();
  const accentHex = colors.accent || colors.primary || '#7c3aed';
  const primaryHex = colors.primary || '#7c3aed';
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${walletId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as DisplayMessage[];
        // Re-attach agent references
        const restored = parsed.map(msg => ({
          ...msg,
          agent: msg.agentId ? AGENTS.find(a => a.id === msg.agentId) : undefined,
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

  // Load Puter SDK on mount
  useEffect(() => {
    loadPuterSDK()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Resolve which agent handles this
    const agent = resolveAgent(trimmed);
    const cleanContent = stripMention(trimmed);

    // Add user message
    const userMsg: DisplayMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

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

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context: user's clean message + conversation history
      const contextMessages: ChatMessage[] = [
        ...messages.filter(m => !m.isStreaming).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        { id: userMsg.id, role: 'user' as const, content: cleanContent, timestamp: userMsg.timestamp },
      ];

      const finalText = await callPuterAI(
        contextMessages,
        agent,
        (text) => {
          // Update streaming message
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: text } : m
            )
          );
        },
        abortController.signal,
      );

      // Finalize message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: finalText, isStreaming: false }
            : m
        )
      );
    } catch (error: any) {
      if (abortController.signal.aborted) return;
      // Remove failed assistant message
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      toast.error(error.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${walletId}`);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 230px)' }}>
      {/* Agent Avatars Row - Fixed */}
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
              <span className="text-[10px] font-medium text-slate-400">
                {agent.name}
              </span>
            </button>
          ))}
          {/* Clear chat button at end */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <div className="w-11 h-11 rounded-full bg-slate-900/50 border border-slate-800/30 flex items-center justify-center transition-transform group-active:scale-90">
                <Trash2 className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-[10px] font-medium text-slate-500">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 space-y-3"
      >
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentHex}1A` }}
            >
              <Bot className="w-8 h-8" style={{ color: accentHex }} />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Ask anything about stocks</p>
              <p className="text-slate-500 text-sm">
                Tap an agent above or just type your question
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['What do you think about AAPL?', '@warren Is Tesla undervalued?', 'RSI on NVDA'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-xs bg-slate-900/50 border border-slate-800/30 rounded-full px-3 py-1.5 text-slate-400 hover:text-white transition-all"
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
                      : 'rounded-2xl rounded-bl-md px-4 py-2.5 bg-slate-900/50 border border-slate-800/30'
                  }`}
                  style={msg.role === 'user' ? {
                    backgroundColor: `${primaryHex}20`,
                    borderColor: `${primaryHex}40`,
                  } : undefined}
                >
                  {/* Agent name & role */}
                  {msg.role === 'assistant' && msg.agent && (
                    <p className="text-xs font-semibold mb-1" style={{ color: msg.agent.gradientFrom }}>
                      {msg.agent.name} · {msg.agent.role}
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
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sdkReady ? 'Ask about stocks...' : 'Loading AI...'}
            disabled={!sdkReady || sdkError}
            className="flex-1 bg-slate-900/50 border border-slate-800/30 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 disabled:opacity-50"
            style={{ '--tw-ring-color': `${primaryHex}30` } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !sdkReady}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
            style={{ backgroundColor: primaryHex }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
          Powered by <span style={{ color: accentHex }}>Puter AI</span> · Not financial advice
        </p>
      </div>
    </div>
  );
}
