import { createSupabaseClient } from './supabase/client';
import DOMPurify from 'dompurify';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────

export interface ChatMessage {
  id: string;
  token_mint: string;
  sender_address: string;
  sender_name: string | null;
  content: string;
  reply_to_id: string | null;
  created_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  sender_address: string;
  emoji: string;
  created_at: string;
}

/** Aggregated reactions per message: { "🔥": ["addr1", "addr2"], "💎": ["addr3"] } */
export type ReactionMap = Record<string, string[]>;

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👀', '💎'];

// ─── Constants ───────────────────────────────────────

const MSG_TABLE = 'chat_messages';
const REACT_TABLE = 'chat_reactions';
const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 100;
const HISTORY_HOURS = 24;

// ─── Profanity Filter ────────────────────────────────

const BLOCKED_WORDS = [
  'fuck','shit','ass','bitch','dick','cunt','damn','bastard','whore','slut',
  'nigger','nigga','faggot','retard','cock','pussy','penis','vagina',
  'stfu','gtfo','lmfao','wtf','fck','sht','btch','dck','cnt',
  'motherfucker','mf','fuk','fuq','azz','a$$','b1tch','sh1t','d1ck',
  'kys','kill yourself','rape','molest',
];

const blockedRegex = new RegExp(
  '\\b(' + BLOCKED_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
);

/** Normalize text to defeat Unicode/leetspeak bypass tricks:
 *  - Strip zero-width chars (U+200B, U+200C, U+200D, U+FEFF)
 *  - Strip combining diacritical marks (accents): fûck → fuck
 *  - Normalize leetspeak: @ → a, 1 → i, 3 → e, 0 → o, $ → s, 5 → s, 7 → t
 *  - Collapse repeated chars: fuuuck → fuck
 *  - Strip underscores/hyphens between letters: f_u_c_k → fuck */
function normalizeProfanityText(text: string): string {
  let t = text
    // Remove zero-width characters
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u061C\u180E]/g, '')
    // NFD decomposition then strip combining marks (accents)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Leetspeak substitutions
    .replace(/@/g, 'a')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/4/g, 'a')
    .replace(/8/g, 'b')
    // Strip separators between letters: f_u_c_k, f-u-c-k, f.u.c.k
    .replace(/(?<=\w)[_\-.*]+(?=\w)/g, '')
    // Collapse repeated chars (3+): fuuuck → fuck
    .replace(/(.)\1{2,}/g, '$1');
  return t;
}

/** Check if message contains blocked words (with normalization) */
export function containsProfanity(text: string): boolean {
  // Check original text
  if (blockedRegex.test(text)) return true;
  // Check normalized version (catches Unicode tricks, leetspeak, etc.)
  const normalized = normalizeProfanityText(text.toLowerCase());
  return blockedRegex.test(normalized);
}

// ─── Helpers ─────────────────────────────────────────

/** Strip HTML, filter profanity, and limit length */
export function sanitizeMessage(raw: string): string {
  const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
  return clean.trim().substring(0, MAX_MESSAGE_LENGTH);
}

/** Get display name: saturn_username or truncated wallet address */
export function getDisplayName(walletAddress: string): string {
  const username = localStorage.getItem('saturn_username');
  if (username) return username;
  return truncateAddress(walletAddress);
}

/** Truncate wallet address: A3xk...9fB2 */
export function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return address.substring(0, 4) + '...' + address.substring(address.length - 4);
}

// ─── Messages ────────────────────────────────────────

/** Fetch messages from the last 24h for a token chat room */
export async function fetchChatHistory(tokenMint: string): Promise<ChatMessage[]> {
  const supabase = createSupabaseClient();
  const cutoff = new Date(Date.now() - HISTORY_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(MSG_TABLE)
    .select('*')
    .eq('token_mint', tokenMint)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error('[chatService] Failed to fetch history:', error.message);
    return [];
  }

  return (data || []).reverse();
}

/** Send a new chat message (with optional reply). Throws if profanity detected. */
export async function sendChatMessage(
  tokenMint: string,
  senderAddress: string,
  content: string,
  replyToId?: string | null
): Promise<ChatMessage | null> {
  const sanitized = sanitizeMessage(content);

  if (containsProfanity(sanitized)) {
    throw new Error('PROFANITY');
  }
  if (!sanitized) return null;

  const senderName = getDisplayName(senderAddress);
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(MSG_TABLE)
    .insert({
      token_mint: tokenMint,
      sender_address: senderAddress,
      sender_name: senderName,
      content: sanitized,
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error('[chatService] Failed to send message:', error.message);
    if (error.message?.includes('new row violates') || error.code === '23514' || error.message?.includes('row-level security')) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error('Failed to send message');
  }

  return data;
}

export const AI_BOT_ADDRESS = 'ai-bot';

/** Insert an AI bot reply — bypasses profanity filter & rate limit */
export async function sendAIBotMessage(
  tokenMint: string,
  content: string,
  replyToId: string,
): Promise<ChatMessage | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(MSG_TABLE)
    .insert({
      token_mint: tokenMint,
      sender_address: AI_BOT_ADDRESS,
      sender_name: 'AI',
      content: content.substring(0, 500),
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) {
    console.error('[chatService] Failed to send AI message:', error.message);
    return null;
  }

  return data;
}

// ─── Reactions ───────────────────────────────────────

// Track if reactions table exists to avoid spamming 404s
let reactionsTableAvailable = true;

/** Fetch all reactions for a set of message IDs */
export async function fetchReactions(messageIds: string[]): Promise<Record<string, ReactionMap>> {
  if (messageIds.length === 0 || !reactionsTableAvailable) return {};

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(REACT_TABLE)
    .select('*')
    .in('message_id', messageIds);

  if (error) {
    // If table doesn't exist (404/42P01), disable further attempts
    if (error.code === '42P01' || error.message?.includes('does not exist') || (error as any).status === 404) {
      console.warn('[chatService] chat_reactions table not found — disabling reactions. Run the migration SQL.');
      reactionsTableAvailable = false;
    }
    return {};
  }

  if (!data) return {};

  // Group: { messageId: { emoji: [addr1, addr2] } }
  const result: Record<string, ReactionMap> = {};
  for (const r of data as ChatReaction[]) {
    if (!result[r.message_id]) result[r.message_id] = {};
    if (!result[r.message_id][r.emoji]) result[r.message_id][r.emoji] = [];
    result[r.message_id][r.emoji].push(r.sender_address);
  }
  return result;
}

/** Toggle a reaction (one reaction per user per message).
 *  - Same emoji: remove it (toggle off)
 *  - Different emoji: replace the old one */
export async function toggleReaction(
  messageId: string,
  senderAddress: string,
  emoji: string
): Promise<'added' | 'removed'> {
  if (!reactionsTableAvailable) return 'added';
  const supabase = createSupabaseClient();

  // Find any existing reaction from this user on this message
  const { data: existing } = await supabase
    .from(REACT_TABLE)
    .select('id, emoji')
    .eq('message_id', messageId)
    .eq('sender_address', senderAddress)
    .maybeSingle();

  if (existing) {
    // Remove the old reaction
    await supabase.from(REACT_TABLE).delete().eq('id', existing.id);

    // If same emoji, just toggle off
    if (existing.emoji === emoji) return 'removed';
  }

  // Add the new reaction
  await supabase.from(REACT_TABLE).insert({
    message_id: messageId,
    sender_address: senderAddress,
    emoji,
  });
  return 'added';
}

// ─── Realtime ────────────────────────────────────────

/** Subscribe to messages + reactions in a chat room. Returns unsubscribe. */
export function subscribeToChatRoom(
  tokenMint: string,
  onNewMessage: (message: ChatMessage) => void,
  onReactionChange?: (reaction: ChatReaction, event: 'INSERT' | 'DELETE') => void
): () => void {
  const supabase = createSupabaseClient();

  const channel: RealtimeChannel = supabase
    .channel(`chat:${tokenMint}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: MSG_TABLE,
        filter: `token_mint=eq.${tokenMint}`,
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: REACT_TABLE,
      },
      (payload) => {
        onReactionChange?.(payload.new as ChatReaction, 'INSERT');
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: REACT_TABLE,
      },
      (payload) => {
        onReactionChange?.(payload.old as ChatReaction, 'DELETE');
      }
    )
    .subscribe((status) => {
      console.log(`[chatService] Realtime ${tokenMint.slice(0, 8)}:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Stats ───────────────────────────────────────────

/** Count unique senders in last 24h */
export async function getActiveParticipants(tokenMint: string): Promise<number> {
  const supabase = createSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(MSG_TABLE)
    .select('sender_address')
    .eq('token_mint', tokenMint)
    .gte('created_at', oneDayAgo);

  if (error || !data) return 0;

  const unique = new Set(data.map(d => d.sender_address));
  return unique.size;
}
