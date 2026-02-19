-- Migration: Create wallet_backups table for cross-device wallet sync
-- The encrypted_data column stores the same {encrypted, salt, iv, version} blob
-- that lives in localStorage. The server NEVER sees plaintext mnemonics or passwords.

CREATE TABLE IF NOT EXISTS wallet_backups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id text NOT NULL,
  encrypted_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_id)
);

-- RLS: users can only access their own rows
ALTER TABLE wallet_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own backups"
  ON wallet_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON wallet_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups"
  ON wallet_backups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON wallet_backups FOR DELETE
  USING (auth.uid() = user_id);
