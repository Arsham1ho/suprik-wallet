-- Chat Security Hardening Migration
-- Run this in Supabase SQL Editor AFTER the initial chat migration
-- Fixes: AI bot spoofing, server-side profanity, sender_name validation, rate limiting

-- ============================================
-- 1. Block ai-bot sender_address from anon key
--    Only the service_role key (used by Cloudflare Worker) can insert as 'ai-bot'
-- ============================================

-- Drop the old wide-open insert policy
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;

-- New policy: anon users can insert, but NOT as 'ai-bot' or other reserved addresses
CREATE POLICY "Users can insert chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    -- Block reserved sender addresses from anon key
    CASE
      WHEN current_setting('request.jwt.claim.role', true) = 'service_role' THEN true
      ELSE sender_address NOT IN ('ai-bot', 'system', 'admin', 'moderator')
    END
  );

-- ============================================
-- 2. Server-side profanity filter (DB trigger)
--    Rejects messages containing blocked words
-- ============================================

CREATE OR REPLACE FUNCTION check_chat_profanity()
RETURNS TRIGGER AS $$
DECLARE
  normalized text;
  blocked_pattern text := '\m(fuck|shit|ass|bitch|dick|cunt|damn|bastard|whore|slut|nigger|nigga|faggot|retard|cock|pussy|kys|kill yourself|rape|molest|motherfucker|fuk|fuq)\M';
BEGIN
  -- Skip check for service_role (AI bot messages)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Normalize: lowercase, strip zero-width chars, basic leetspeak
  normalized := lower(NEW.content);
  normalized := regexp_replace(normalized, '[\u200B\u200C\u200D\uFEFF]', '', 'g');
  normalized := replace(normalized, '@', 'a');
  normalized := replace(normalized, '1', 'i');
  normalized := replace(normalized, '3', 'e');
  normalized := replace(normalized, '0', 'o');
  normalized := replace(normalized, '$', 's');
  normalized := replace(normalized, '5', 's');
  normalized := replace(normalized, '7', 't');
  -- Strip separators between letters
  normalized := regexp_replace(normalized, '([a-z])[_\-.*]+([a-z])', '\1\2', 'g');
  -- Collapse repeated chars
  normalized := regexp_replace(normalized, '(.)\1{2,}', '\1', 'g');

  IF normalized ~* blocked_pattern THEN
    RAISE EXCEPTION 'Message contains inappropriate language'
      USING ERRCODE = '23514'; -- check_violation, same as RLS
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_profanity ON chat_messages;
CREATE TRIGGER trg_chat_profanity
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_chat_profanity();

-- ============================================
-- 3. Sanitize sender_name (DB trigger)
--    - Strip HTML tags
--    - Limit to 30 chars
--    - Block reserved names
-- ============================================

CREATE OR REPLACE FUNCTION sanitize_chat_sender()
RETURNS TRIGGER AS $$
BEGIN
  -- Strip any HTML tags from sender_name
  IF NEW.sender_name IS NOT NULL THEN
    NEW.sender_name := regexp_replace(NEW.sender_name, '<[^>]*>', '', 'g');
    NEW.sender_name := left(trim(NEW.sender_name), 30);

    -- Block reserved names (only service_role can use these)
    IF current_setting('request.jwt.claim.role', true) != 'service_role'
       AND lower(NEW.sender_name) IN ('ai', 'admin', 'moderator', 'system', 'suprik') THEN
      NEW.sender_name := 'user';
    END IF;
  END IF;

  -- Enforce content length server-side
  NEW.content := left(NEW.content, 500);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_sanitize ON chat_messages;
CREATE TRIGGER trg_chat_sanitize
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_chat_sender();

-- ============================================
-- 4. Rate limiting (1 message per 5 seconds per sender)
--    Prevents spam even from direct Supabase API calls
-- ============================================

CREATE OR REPLACE FUNCTION check_chat_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip for service_role (AI bot)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM chat_messages
    WHERE sender_address = NEW.sender_address
      AND token_mint = NEW.token_mint
      AND created_at > now() - interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'Rate limit: wait 5 seconds between messages'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_rate_limit ON chat_messages;
CREATE TRIGGER trg_chat_rate_limit
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_chat_rate_limit();

-- ============================================
-- 5. Reaction rate limiting (1 per second per sender)
-- ============================================

CREATE OR REPLACE FUNCTION check_reaction_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM chat_reactions
    WHERE sender_address = NEW.sender_address
      AND created_at > now() - interval '1 second'
  ) THEN
    RAISE EXCEPTION 'Reaction rate limit'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reaction_rate_limit ON chat_reactions;
CREATE TRIGGER trg_reaction_rate_limit
  BEFORE INSERT ON chat_reactions
  FOR EACH ROW
  EXECUTE FUNCTION check_reaction_rate_limit();
