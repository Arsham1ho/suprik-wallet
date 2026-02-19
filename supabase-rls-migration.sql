-- Supabase Row-Level Security (RLS) Migration
-- Run this in Supabase Dashboard > SQL Editor
--
-- This blocks the public anon key from reading/writing the kv_store table directly.
-- The server Edge Functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- This is defense-in-depth: even if someone extracts the anon key from the JS bundle,
-- they cannot read wallet data, seed phrases, or any KV store entries.

-- 1. Enable RLS on the kv_store table
ALTER TABLE kv_store_e5bc10d1 ENABLE ROW LEVEL SECURITY;

-- 2. Block ALL access via anon key (only service_role can access)
-- No policies = no access for anon/authenticated roles
-- The service_role key (used by Edge Functions) bypasses RLS automatically

-- 3. Force RLS for table owner too (extra safety)
ALTER TABLE kv_store_e5bc10d1 FORCE ROW LEVEL SECURITY;

-- Verify: After running this, test that:
-- 1. Your wallet still works (Edge Functions use service_role, unaffected)
-- 2. Direct table queries with anon key return empty results
