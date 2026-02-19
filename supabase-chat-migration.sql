-- Token-Gated Chat: chat_messages + chat_reactions tables
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Chat Messages (with reply support)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_mint text NOT NULL,
  sender_address text NOT NULL,
  sender_name text,
  content text NOT NULL,
  reply_to_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_messages_room ON chat_messages (token_mint, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages"
  ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. Chat Reactions
-- ============================================
CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  sender_address text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, sender_address, emoji)
);

CREATE INDEX idx_chat_reactions_message ON chat_reactions (message_id);

ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
  ON chat_reactions FOR SELECT USING (true);

CREATE POLICY "Anyone can add reactions"
  ON chat_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove reactions"
  ON chat_reactions FOR DELETE USING (true);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;

-- ============================================
-- 3. Auto-cleanup: Delete messages older than 24h
--    Runs every hour via pg_cron (Supabase Pro)
--    Reactions cascade-delete with their parent message
-- ============================================
-- Uncomment if pg_cron is enabled (Supabase Pro plan):
-- SELECT cron.schedule(
--   'cleanup-old-chat-messages',
--   '0 * * * *',
--   $$DELETE FROM chat_messages WHERE created_at < now() - interval '24 hours'$$
-- );

-- For free tier: run this manually or via Edge Function on a schedule:
-- DELETE FROM chat_messages WHERE created_at < now() - interval '24 hours';
