-- ─────────────────────────────────────────────────────────────────────────────
-- Townhall · seed_bot_user.sql
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor)
--
-- Creates the Townhall civic bot user. This bypasses normal auth signup
-- because the bot never signs in — civic-sync uses the service role key
-- to insert posts directly on the bot's behalf.
--
-- The fixed UUID 00000000-0000-0000-0000-000000000001 is referenced by:
--   - TOWNHALL_BOT_USER_ID env var in Vercel
--   - civic-sync.js BOT_USER_ID constant
--   - vercel.json cron path (neighborhood_id only — bot id comes from env)
-- ─────────────────────────────────────────────────────────────────────────────
 
-- Step 1: Insert the bot into auth.users
-- (Uses the internal auth schema — only works from SQL editor with service role)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) values (
  '00000000-0000-0000-0000-000000000001',
  'bot@townhallcafe.org',
  '',   -- no password — bot never signs in
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Townhall · Jackson NJ"}',
  false,
  'authenticated'
) on conflict (id) do nothing;
 
-- Step 2: Insert the bot profile
insert into profiles (
  id,
  display_name,
  is_bot,
  trust_score,
  trust_tier,
  onboarded,
  neighborhood,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  'Townhall · Jackson NJ',
  true,
  0,
  'resident',
  true,
  'Harmony Farms',
  now(),
  now()
) on conflict (id) do update set
  is_bot       = true,
  display_name = 'Townhall · Jackson NJ',
  updated_at   = now();
 
-- Step 3: Verify
select id, display_name, is_bot, neighborhood
from profiles
where id = '00000000-0000-0000-0000-000000000001';
 
