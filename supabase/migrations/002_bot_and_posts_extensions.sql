-- ─────────────────────────────────────────────────────────────────────────────
-- Townhall · Migration 002 · Bot user + post extensions
-- Run via: Supabase SQL editor, or supabase db push
--
-- Adds:
--   - profiles.is_bot          — marks the Townhall civic bot account
--   - posts.external_id        — deduplication key for civic feed items
--   - posts.source_url         — link back to original source (SeeClickFix, NWS, etc.)
--   - posts.source_name        — human-readable source label shown in feed
--   - posts.source_label       — alias for source_name (used in some queries)
--   - Bot user profile row     — uuid 00000000-0000-0000-0000-000000000001
--
-- NOTE: The bot auth.users row cannot be inserted via migration (Supabase Auth
-- controls that table). Run supabase/seed_bot_user.sql separately in the
-- SQL editor after applying this migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── profiles patches ────────────────────────────────────────────────────────
alter table profiles add column if not exists is_bot boolean not null default false;
alter table profiles add column if not exists is_admin boolean not null default false;

-- ─── posts patches ───────────────────────────────────────────────────────────
alter table posts add column if not exists external_id  text unique;
alter table posts add column if not exists source_url   text;
alter table posts add column if not exists source_name  text;
alter table posts add column if not exists source_label text;

-- Index for fast dedup lookups in civic-sync
create index if not exists posts_external_id_idx on posts(external_id)
  where external_id is not null;

-- ─── RLS: bot posts are publicly readable, bot cannot be reported ────────────
-- The existing posts_public_read policy already covers bot posts.
-- reported_posts already has auth check on reporter_id.
-- No additional policies needed — FeedScreen hides the report button on is_bot posts.

-- ─── Civic issues: add source tracking ───────────────────────────────────────
alter table civic_issues add column if not exists source_label text;
alter table civic_issues add column if not exists created_at_display text; -- human date for UI

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- After running this migration, run seed_bot_user.sql to create the bot profile.
-- Then test: SELECT * FROM profiles WHERE is_bot = true;
