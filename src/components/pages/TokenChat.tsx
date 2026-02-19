import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Users, Loader2, MessageSquare, Reply, X, TrendingUp, TrendingDown, Mic, MicOff, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AccountManager } from '../../utils/accountManager';
import { useTheme } from '../../utils/ThemeContext';
import { TokenLogo } from '../TokenLogo';
import { AnimalAvatar } from '../AnimalAvatar';
import {
  fetchChatHistory,
  sendChatMessage,
  subscribeToChatRoom,
  getActiveParticipants,
  fetchReactions,
  toggleReaction,
  truncateAddress,
  REACTION_EMOJIS,
  AI_BOT_ADDRESS,
  type ChatMessage,
  type ChatReaction,
  type ReactionMap,
} from '../../utils/chatService';
import type { Token } from './Home';

interface TokenChatProps {
  token: Token;
  onBack: () => void;
  walletId: string;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TokenChat({ token, onBack }: TokenChatProps) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);

  // Reactions state: { messageId: { emoji: [addr1, addr2] } }
  const [reactions, setReactions] = useState<Record<string, ReactionMap>>({});
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // Swipe-to-reply state
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeDirection = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const swipeTriggered = useRef(false);

  // Double-tap detection
  const lastTapTime = useRef(0);
  const lastTapMsgId = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageIdsRef = useRef(new Set<string>());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true);
  const justSentRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const voiceBaseInputRef = useRef<string>('');

  const [isListening, setIsListening] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI @mention: track which messages are waiting for AI
  const [aiLoadingIds, setAiLoadingIds] = useState<Set<string>>(new Set());

  const activeAccount = AccountManager.getActiveAccount();
  const myAddress = activeAccount?.addresses?.solana || '';
  const mintAddress = token.mint || '';
  const primaryHex = colors.primary || '#8b5cf6';

  const initialScrollDone = useRef(false);

  const scrollToBottom = useCallback((instant?: boolean) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  }, []);

  // Track scroll position to decide whether to auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Voice input setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = voiceBaseInputRef.current;
      setInput(base ? base + ' ' + transcript : transcript);

      const allFinal = Array.from(event.results).every((r: any) => r.isFinal);
      if (allFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[TokenChat Voice] Error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  // Handle @ai mention — calls Cloudflare Worker which generates AI reply + inserts into Supabase server-side
  const handleAIReply = useCallback(async (msgId: string, userText: string) => {
    setAiLoadingIds(prev => new Set(prev).add(msgId));

    try {
      const res = await fetch('https://suprik-ai.arsham7hosseini10.workers.dev/chat-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMint: mintAddress,
          messageId: msgId,
          userText,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenPrice: token.price,
          tokenChange: token.change,
        }),
      });
      if (!res.ok) throw new Error(`CF ${res.status}`);
      const data = await res.json();

      // The worker inserted the message into Supabase — Realtime will deliver it.
      // But add it locally too for instant feedback (Realtime dedup will skip duplicate).
      if (data.message && !messageIdsRef.current.has(data.message.id)) {
        messageIdsRef.current.add(data.message.id);
        setMessages(prev => [...prev, data.message]);
      }
    } catch {
      // Silent fail — don't spam the chat with error messages
    } finally {
      setAiLoadingIds(prev => { const s = new Set(prev); s.delete(msgId); return s; });
    }
  }, [token, mintAddress]);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      voiceBaseInputRef.current = input;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Load history + reactions + subscribe
  useEffect(() => {
    if (!mintAddress) return;

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setLoading(true);

      const history = await fetchChatHistory(mintAddress);
      setMessages(history);
      messageIdsRef.current = new Set(history.map(m => m.id));

      // Fetch reactions for all loaded messages
      if (history.length > 0) {
        const reactionData = await fetchReactions(history.map(m => m.id));
        setReactions(reactionData);
      }

      const count = await getActiveParticipants(mintAddress);
      setParticipantCount(count);

      setLoading(false);

      // Subscribe to new messages + reaction changes
      unsubscribe = subscribeToChatRoom(
        mintAddress,
        (newMsg) => {
          if (messageIdsRef.current.has(newMsg.id)) return;
          messageIdsRef.current.add(newMsg.id);
          setMessages(prev => [...prev, newMsg]);
        },
        (reaction: ChatReaction, event: 'INSERT' | 'DELETE') => {
          setReactions(prev => {
            const updated = { ...prev };
            const msgReactions = { ...(updated[reaction.message_id] || {}) };

            if (event === 'INSERT') {
              const addrs = [...(msgReactions[reaction.emoji] || [])];
              if (!addrs.includes(reaction.sender_address)) {
                addrs.push(reaction.sender_address);
              }
              msgReactions[reaction.emoji] = addrs;
            } else {
              const addrs = (msgReactions[reaction.emoji] || []).filter(
                a => a !== reaction.sender_address
              );
              if (addrs.length === 0) {
                delete msgReactions[reaction.emoji];
              } else {
                msgReactions[reaction.emoji] = addrs;
              }
            }

            updated[reaction.message_id] = msgReactions;
            return updated;
          });
        }
      );
    };

    init();

    return () => { unsubscribe?.(); };
  }, [mintAddress]);

  // Polling fallback: fetch new messages + reactions every 5s
  useEffect(() => {
    if (!mintAddress || loading) return;

    const poll = async () => {
      try {
        const history = await fetchChatHistory(mintAddress);

        // Add any new messages
        const newMsgs = history.filter(m => !messageIdsRef.current.has(m.id));
        if (newMsgs.length > 0) {
          for (const m of newMsgs) messageIdsRef.current.add(m.id);
          setMessages(prev => {
            const existing = new Set(prev.map(m => m.id));
            const toAdd = newMsgs.filter(m => !existing.has(m.id));
            if (toAdd.length === 0) return prev;
            return [...prev, ...toAdd];
          });
        }

        // Refresh reactions only if they actually changed
        const allIds = history.map(m => m.id);
        if (allIds.length > 0) {
          const reactionData = await fetchReactions(allIds);
          setReactions(prev => {
            const prevJson = JSON.stringify(prev);
            const nextJson = JSON.stringify(reactionData);
            return prevJson === nextJson ? prev : reactionData;
          });
        }
      } catch {
        // silent — Realtime is primary, this is just backup
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [mintAddress, loading]);

  // Scroll to bottom on initial load (after loading finishes)
  useEffect(() => {
    if (loading || initialScrollDone.current) return;
    if (messages.length === 0) return;
    initialScrollDone.current = true;
    // Double rAF ensures DOM has fully painted before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom(true);
        isNearBottomRef.current = true;
      });
    });
  }, [loading, messages, scrollToBottom]);

  // Auto-scroll on new messages (only when user is near bottom or just sent)
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (messages.length <= prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      return;
    }
    prevMsgCountRef.current = messages.length;
    if (isNearBottomRef.current || justSentRef.current) {
      scrollToBottom();
      justSentRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Close reaction picker on outside tap
  useEffect(() => {
    if (!activeReactionMsgId) return;
    const close = () => setActiveReactionMsgId(null);
    const timer = setTimeout(() => document.addEventListener('click', close, { once: true }), 50);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [activeReactionMsgId]);

  // Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || cooldown > 0 || !myAddress || !mintAddress) return;

    setSending(true);
    setInput('');
    justSentRef.current = true;
    const replyId = replyTo?.id || null;
    setReplyTo(null);

    try {
      const sent = await sendChatMessage(mintAddress, myAddress, text, replyId);
      // Add to local state immediately (Realtime dedup will skip the duplicate)
      if (sent && !messageIdsRef.current.has(sent.id)) {
        messageIdsRef.current.add(sent.id);
        setMessages(prev => [...prev, sent]);
      }
      // Trigger AI reply if message contains @ai
      if (sent && /(^|\s)@ai(\s|$)/i.test(text)) {
        handleAIReply(sent.id, text);
      }
      // Start 5s cooldown to match RLS rate limit
      setCooldown(5);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err?.message === 'PROFANITY') {
        toast.error('Please keep the chat respectful. No profanity allowed.');
      } else if (err?.message === 'RATE_LIMIT') {
        toast.error('Slow down! Wait a few seconds between messages.');
      } else {
        toast.error('Failed to send message');
      }
      setInput(text);
      setReplyTo(replyId ? messages.find(m => m.id === replyId) || null : null);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Long press to show reaction picker
  const handlePointerDown = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveReactionMsgId(msgId);
    }, 400);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Double-tap to show reaction picker
  const handleDoubleTap = (msgId: string) => {
    const now = Date.now();
    if (lastTapMsgId.current === msgId && now - lastTapTime.current < 300) {
      // Double tap detected
      setActiveReactionMsgId(msgId);
      lastTapTime.current = 0;
      lastTapMsgId.current = null;
    } else {
      lastTapTime.current = now;
      lastTapMsgId.current = msgId;
    }
  };

  // Swipe-to-reply handlers
  const handleTouchStart = (msgId: string, e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    swipeDirection.current = 'none';
    swipeTriggered.current = false;
    setSwipingMsgId(msgId);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingMsgId) return;
    const dx = e.touches[0].clientX - swipeStartX.current;
    const dy = e.touches[0].clientY - swipeStartY.current;

    // Lock direction on first significant movement
    if (swipeDirection.current === 'none') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        swipeDirection.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
      return;
    }

    // Only handle horizontal swipes (right swipe = positive dx)
    if (swipeDirection.current !== 'horizontal') return;

    const offset = Math.max(0, Math.min(dx, 80));
    setSwipeOffset(offset);

    // Haptic-like threshold: trigger reply at 60px
    if (offset >= 60 && !swipeTriggered.current) {
      swipeTriggered.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (swipeTriggered.current && swipingMsgId) {
      const msg = messages.find(m => m.id === swipingMsgId);
      if (msg) {
        setReplyTo(msg);
        inputRef.current?.focus();
      }
    }
    setSwipeOffset(0);
    setSwipingMsgId(null);
    swipeDirection.current = 'none';
    swipeTriggered.current = false;
  };

  // Toggle reaction (one per user per message)
  const handleReaction = async (msgId: string, emoji: string) => {
    setActiveReactionMsgId(null);
    if (!myAddress) return;

    // Optimistic update: remove old reaction, toggle or replace
    setReactions(prev => {
      const updated = { ...prev };
      const msgReactions = { ...(updated[msgId] || {}) };

      // Remove user from any existing emoji on this message
      let wasOnSameEmoji = false;
      for (const [existingEmoji, existingAddrs] of Object.entries(msgReactions)) {
        const idx = existingAddrs.indexOf(myAddress);
        if (idx >= 0) {
          if (existingEmoji === emoji) wasOnSameEmoji = true;
          const newAddrs = existingAddrs.filter(a => a !== myAddress);
          if (newAddrs.length === 0) delete msgReactions[existingEmoji];
          else msgReactions[existingEmoji] = newAddrs;
        }
      }

      // If tapping the same emoji, just toggle off. Otherwise add new.
      if (!wasOnSameEmoji) {
        const addrs = [...(msgReactions[emoji] || [])];
        addrs.push(myAddress);
        msgReactions[emoji] = addrs;
      }

      updated[msgId] = msgReactions;
      return updated;
    });

    await toggleReaction(msgId, myAddress, emoji);
  };

  // Find replied message
  const getReplyMessage = (replyToId: string | null): ChatMessage | undefined => {
    if (!replyToId) return undefined;
    return messages.find(m => m.id === replyToId);
  };

  return (
    <div className="flex flex-col bg-black text-white" style={{ height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-20"
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="w-full md:max-w-[430px] mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="p-1.5 -ml-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-slate-300" />
            </motion.button>

            <TokenLogo
              token={token}
              logoUrl={token.logoUrl}
              name={token.name}
              symbol={token.symbol}
              mint={token.mint}
              size="sm"
            />

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-white truncate">{token.symbol} Chat</h1>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-slate-500">Token holders only</p>
                {token.price != null && token.price > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      ${token.price < 0.01 ? token.price.toFixed(6) : token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}
                    </span>
                    {token.change != null && (
                      <span className={`text-[10px] font-medium flex items-center gap-0.5 ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {token.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(token.change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: `${primaryHex}15`, borderColor: `${primaryHex}30` }}
            >
              <Users className="w-3.5 h-3.5" style={{ color: primaryHex }} />
              <span className="text-xs font-medium" style={{ color: primaryHex }}>
                {participantCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative z-10">
        <div className="w-full md:max-w-[430px] mx-auto px-3 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${primaryHex}60`, borderTopColor: 'transparent' }}
              />
              <span className="text-xs text-slate-500">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4 text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryHex}15` }}
              >
                <MessageSquare className="w-8 h-8" style={{ color: `${primaryHex}80` }} />
              </div>
              <div>
                <p className="text-base text-slate-300 font-medium">No messages yet</p>
                <p className="text-sm text-slate-600 mt-1">
                  Be the first to chat about {token.symbol}!
                </p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.filter(m => m.sender_address !== AI_BOT_ADDRESS).map((msg, i, filtered) => {
                const isOwn = msg.sender_address === myAddress;
                const isFirstInGroup = i === 0 || filtered[i - 1].sender_address !== msg.sender_address;
                const isLastInGroupForAvatar = !isOwn && (i === filtered.length - 1 || filtered[i + 1].sender_address !== msg.sender_address);
                const isLastInGroup = i === filtered.length - 1 || filtered[i + 1].sender_address !== msg.sender_address;
                // Find inline AI reply for this message
                const aiReply = messages.find(m => m.sender_address === AI_BOT_ADDRESS && m.reply_to_id === msg.id);
                const msgReactions = reactions[msg.id] || {};
                const replyMsg = getReplyMessage(msg.reply_to_id);
                const hasReactions = Object.keys(msgReactions).length > 0;
                const isSwiping = swipingMsgId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-1'} relative group overflow-x-clip`}
                    onTouchStart={(e) => handleTouchStart(msg.id, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Swipe reply indicator */}
                    {isSwiping && swipeOffset > 10 && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity"
                        style={{ opacity: Math.min(swipeOffset / 60, 1) }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: swipeOffset >= 60 ? primaryHex : 'rgba(100,116,139,0.3)',
                            transform: `scale(${Math.min(swipeOffset / 60, 1)})`,
                          }}
                        >
                          <Reply className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full`}
                      style={{
                        transform: isSwiping ? `translateX(${swipeOffset}px)` : undefined,
                        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                      }}
                    >
                    {/* Telegram-style: avatar row + bubble */}
                    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 16, maxWidth: '75%' }}>
                      {/* Avatar column — fixed width, only for others */}
                      {!isOwn && (
                        <div style={{ width: 28, minWidth: 28, height: 28, flexShrink: 0 }}>
                          {isLastInGroupForAvatar && (
                            <AnimalAvatar walletId={msg.sender_address} size="sm" className="!w-[28px] !h-[28px] !text-xs" />
                          )}
                        </div>
                      )}

                      {/* Bubble + meta column */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', minWidth: 0, maxWidth: 240 }}>
                        {/* Reply quote */}
                        {replyMsg && (
                          <div
                            className="flex items-center gap-1.5 mb-0.5 px-3 py-1 rounded-t-xl text-[11px]"
                            style={{
                              maxWidth: '100%',
                              backgroundColor: isOwn ? `${primaryHex}10` : 'rgba(30, 41, 59, 0.4)',
                              borderLeft: `2px solid ${isOwn ? primaryHex : '#475569'}`,
                            }}
                          >
                            <Reply className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-500 font-medium flex-shrink-0">
                              {replyMsg.sender_name || truncateAddress(replyMsg.sender_address)}
                            </span>
                            <span className="text-slate-600 truncate">
                              {replyMsg.content.length > 50
                                ? replyMsg.content.substring(0, 50) + '...'
                                : replyMsg.content}
                            </span>
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          style={{
                            borderRadius: 16,
                            padding: '6px 12px',
                            border: '1px solid',
                            overflow: 'hidden',
                            ...(isOwn
                              ? {
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  borderColor: 'rgba(59, 130, 246, 0.3)',
                                  borderBottomRightRadius: 4,
                                  ...(replyMsg ? { borderTopRightRadius: 4 } : {}),
                                }
                              : {
                                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                  borderColor: 'rgba(30, 41, 59, 0.3)',
                                  borderBottomLeftRadius: 4,
                                  ...(replyMsg ? { borderTopLeftRadius: 4 } : {}),
                                }),
                          }}
                          className="select-none"
                          onClick={() => handleDoubleTap(msg.id)}
                          onPointerDown={() => handlePointerDown(msg.id)}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                          onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsgId(msg.id); }}
                        >
                          {/* Sender name inside bubble (Telegram style) */}
                          {isFirstInGroup && !isOwn && (
                            <p style={{ fontSize: 11, fontWeight: 600, color: primaryHex, marginBottom: 2 }}>
                              {msg.sender_name || truncateAddress(msg.sender_address)}
                            </p>
                          )}

                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.content}
                            {/* Inline timestamp */}
                            <span style={{ fontSize: 10, color: 'rgba(100,116,139,0.7)', marginLeft: 8, whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                              {formatRelativeTime(msg.created_at)}
                            </span>
                          </p>

                          {/* Inline AI reply */}
                          {aiLoadingIds.has(msg.id) && (
                            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-purple-500/20">
                              <Bot className="w-3.5 h-3.5 text-purple-400 animate-pulse flex-shrink-0" />
                              <span className="text-[11px] text-purple-400/60 italic">thinking...</span>
                            </div>
                          )}
                          {aiReply && !aiLoadingIds.has(msg.id) && (
                            <div className="mt-1.5 pt-1.5 border-t border-purple-500/20"
                              style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', margin: '6px -12px -6px', padding: '6px 12px' }}
                            >
                              <div className="flex items-start gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <p style={{ fontSize: 12, color: 'rgba(196,181,253,0.9)', lineHeight: 1.5, wordBreak: 'break-word' }}>{aiReply.content}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reaction picker popover */}
                        <AnimatePresence>
                          {activeReactionMsgId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 5 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-1 z-30`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-0.5 bg-slate-900 border border-slate-700/50 rounded-full px-1 py-0.5 shadow-xl shadow-black/50">
                                {REACTION_EMOJIS.map((emoji) => (
                                  <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors text-sm"
                                    onClick={() => handleReaction(msg.id, emoji)}
                                  >
                                    {emoji}
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Reactions display */}
                        {hasReactions && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                            {Object.entries(msgReactions).map(([emoji, addrs]) => {
                              const iReacted = addrs.includes(myAddress);
                              return (
                                <motion.button
                                  key={emoji}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center gap-px px-1 py-px rounded-full text-[10px] border transition-colors"
                                  style={{
                                    backgroundColor: iReacted ? `${primaryHex}20` : 'rgba(15, 23, 42, 0.6)',
                                    borderColor: iReacted ? `${primaryHex}40` : 'rgba(51, 65, 85, 0.3)',
                                  }}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                >
                                  <span className="text-xs">{emoji}</span>
                                  {addrs.length > 1 && (
                                    <span className={`font-medium ${iReacted ? 'text-white' : 'text-slate-500'}`}>
                                      {addrs.length}
                                    </span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    </div>{/* end swipe wrapper */}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply preview bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 overflow-hidden relative z-20 bg-black/95 border-t border-slate-800/20"
          >
            <div className="w-full md:max-w-[430px] mx-auto px-4 pt-2 pb-1 flex items-center gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: `${primaryHex}10`, borderLeft: `2px solid ${primaryHex}` }}
              >
                <Reply className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryHex }} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium" style={{ color: primaryHex }}>
                    {replyTo.sender_name || truncateAddress(replyTo.sender_address)}
                  </span>
                  <p className="text-slate-500 truncate">
                    {replyTo.content.length > 60 ? replyTo.content.substring(0, 60) + '...' : replyTo.content}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 rounded-full hover:bg-slate-800/50 transition-colors active:scale-95"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        className="flex-shrink-0 px-4 pt-2 relative z-20 bg-black/95 backdrop-blur-xl border-t border-slate-800/30"
        style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-full md:max-w-[430px] mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!input.includes('@ai')) {
                  setInput(prev => prev ? prev.trimEnd() + ' @ai ' : '@ai ');
                }
                inputRef.current?.focus();
              }}
              disabled={sending}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-95 bg-slate-900/50 border border-slate-800/30 hover:bg-purple-500/20 hover:border-purple-500/30 disabled:opacity-30"
              title="Ask AI"
            >
              <Bot className="w-4 h-4 text-purple-400" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? 'Write a reply...' : `Message ${token.symbol} holders...`}
              maxLength={500}
              disabled={sending}
              className="flex-1 bg-slate-900/50 border border-slate-800/30 rounded-2xl px-3 py-2 text-white text-sm text-[16px] focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 disabled:opacity-50"
              style={{ '--tw-ring-color': `${primaryHex}30` } as React.CSSProperties}
            />
            <button
              onClick={handleVoiceToggle}
              disabled={sending}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 active:scale-95 ${
                isListening
                  ? 'bg-red-500/80 animate-pulse'
                  : 'bg-slate-900/50 border border-slate-800/30 hover:bg-slate-800/50'
              } disabled:opacity-30`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || cooldown > 0}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0 active:scale-95"
              style={{ backgroundColor: primaryHex }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : cooldown > 0 ? (
                <span className="text-[10px] font-bold text-white/70">{cooldown}</span>
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2 pb-1">
            End-to-end · Token holders only · Tap <Bot className="w-3 h-3 inline text-purple-400/60" /> to ask AI
          </p>
        </div>
      </div>
    </div>
  );
}
