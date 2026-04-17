-- ─────────────────────────────────────────────────────────────────────────────
-- Townhall · Migration 001 · Initial schema
-- Run via: supabase db push
-- Requires: PostGIS extension (enabled in Supabase dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ─── Neighborhoods ───────────────────────────────────────────────────────────
create table neighborhoods (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text not null unique,
  -- PostGIS polygon — the boundary used for geo + ZK proof checks
  boundary         geography(Polygon, 4326) not null,
  -- Centroid for map display (derived, never used for proof)
  centroid         geography(Point, 4326),
  resident_count   integer not null default 0,
  issue_count      integer not null default 0,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index neighborhoods_boundary_idx on neighborhoods using gist(boundary);

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users — one row per user, created via trigger
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  avatar_initials  text,   -- e.g. "MK"
  trust_score      integer not null default 0,
  trust_tier       text not null default 'resident'
                   check (trust_tier in ('resident','contributor','voice','moderator','organizer')),
  is_expert        boolean not null default false,
  expert_domains   text[] default '{}',
  expert_org       text,
  expert_verified_at timestamptz,
  is_official      boolean not null default false,
  official_title   text,
  official_district text,
  notification_prefs jsonb not null default '{
    "expert": true,
    "official": true,
    "escalated": true,
    "trust": false,
    "rollup": false,
    "push": true,
    "digest": "realtime"
  }',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(substring(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1, 2))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Residency proofs ────────────────────────────────────────────────────────
-- PRIVACY: no coordinates ever stored here. Only cryptographic commitments.
create table residency_proofs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  neighborhood_id     uuid not null references neighborhoods(id) on delete cascade,
  -- Pedersen commitment of (lat, lng, nonce) — opaque to server
  commitment_hash     text not null,
  -- Groth16 proof that commitment encodes a point inside neighborhood boundary
  proof_hash          text not null,
  -- Proof expires and must be re-generated periodically
  expires_at          timestamptz not null default (now() + interval '90 days'),
  created_at          timestamptz not null default now(),
  unique(user_id, neighborhood_id)
);

create index residency_proofs_user_idx on residency_proofs(user_id);
create index residency_proofs_neighborhood_idx on residency_proofs(neighborhood_id);

-- ─── Posts ───────────────────────────────────────────────────────────────────
create table posts (
  id                  uuid primary key default uuid_generate_v4(),
  author_id           uuid not null references auth.users(id) on delete cascade,
  neighborhood_id     uuid not null references neighborhoods(id) on delete cascade,
  body                text not null check (char_length(body) between 1 and 2000),
  tags                text[] not null default '{}',
  upvote_count        integer not null default 0,
  reply_count         integer not null default 0,
  escalated           boolean not null default false,
  escalated_at        timestamptz,
  escalated_issue_id  uuid, -- FK added after civic_issues created
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index posts_neighborhood_idx on posts(neighborhood_id, created_at desc);
create index posts_author_idx on posts(author_id);
create index posts_tags_idx on posts using gin(tags);

-- ─── Post upvotes ─────────────────────────────────────────────────────────────
create table post_upvotes (
  user_id   uuid not null references auth.users(id) on delete cascade,
  post_id   uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Maintain upvote_count via trigger
create or replace function update_post_upvote_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update posts set upvote_count = upvote_count + 1 where id = NEW.post_id;
    -- Award trust points to post author
    update profiles
      set trust_score = trust_score + 2,
          updated_at = now()
      where id = (select author_id from posts where id = NEW.post_id);
  elsif TG_OP = 'DELETE' then
    update posts set upvote_count = upvote_count - 1 where id = OLD.post_id;
    update profiles
      set trust_score = greatest(0, trust_score - 2),
          updated_at = now()
      where id = (select author_id from posts where id = OLD.post_id);
  end if;
  return null;
end;
$$;

create trigger post_upvote_count_trigger
  after insert or delete on post_upvotes
  for each row execute procedure update_post_upvote_count();

-- ─── Civic issues ────────────────────────────────────────────────────────────
create table civic_issues (
  id                  uuid primary key default uuid_generate_v4(),
  neighborhood_id     uuid not null references neighborhoods(id) on delete cascade,
  source_post_id      uuid references posts(id) on delete set null,
  title               text not null check (char_length(title) between 1 and 300),
  description         text,
  voice_count         integer not null default 0,
  priority_pct        integer not null default 0 check (priority_pct between 0 and 100),
  status              text not null default 'open'
                      check (status in ('open','escalated','expert','city_wide','resolved')),
  -- City-wide rollup
  is_city_wide        boolean not null default false,
  city_wide_at        timestamptz,
  -- Official response
  official_response   text,
  official_id         uuid references profiles(id),
  responded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Add FK from posts back to civic_issues now that table exists
alter table posts
  add constraint posts_escalated_issue_fk
  foreign key (escalated_issue_id) references civic_issues(id) on delete set null;

create index civic_issues_neighborhood_idx on civic_issues(neighborhood_id);
create index civic_issues_status_idx on civic_issues(status);
create index civic_issues_city_wide_idx on civic_issues(is_city_wide) where is_city_wide = true;

-- ─── Votes (ZK-gated) ────────────────────────────────────────────────────────
-- proof_hash is the ZK proof used to cast — stored for uniqueness check only
-- We can verify a proof hasn't been reused without knowing who cast it
create table votes (
  id              uuid primary key default uuid_generate_v4(),
  -- user_id stored for moderation purposes but never exposed publicly
  user_id         uuid not null references auth.users(id) on delete cascade,
  issue_id        uuid not null references civic_issues(id) on delete cascade,
  -- The ZK proof hash used — prevents double-voting without revealing identity
  proof_hash      text not null unique,
  created_at      timestamptz not null default now(),
  unique(user_id, issue_id)
);

create index votes_issue_idx on votes(issue_id);

-- Maintain voice_count and priority_pct on civic_issues
create or replace function update_issue_vote_stats()
returns trigger language plpgsql as $$
declare
  total_residents integer;
  new_voice_count integer;
begin
  if TG_OP = 'INSERT' then
    -- Get neighborhood resident count for percentage calc
    select n.resident_count into total_residents
    from civic_issues ci
    join neighborhoods n on n.id = ci.neighborhood_id
    where ci.id = NEW.issue_id;

    update civic_issues
    set voice_count = voice_count + 1,
        priority_pct = least(99, round((voice_count + 1)::numeric / greatest(total_residents, 1) * 100)),
        updated_at = now()
    where id = NEW.issue_id;

  elsif TG_OP = 'DELETE' then
    select n.resident_count into total_residents
    from civic_issues ci
    join neighborhoods n on n.id = ci.neighborhood_id
    where ci.id = OLD.issue_id;

    update civic_issues
    set voice_count = greatest(0, voice_count - 1),
        priority_pct = greatest(0, round((voice_count - 1)::numeric / greatest(total_residents, 1) * 100)),
        updated_at = now()
    where id = OLD.issue_id;
  end if;
  return null;
end;
$$;

create trigger vote_stats_trigger
  after insert or delete on votes
  for each row execute procedure update_issue_vote_stats();

-- ─── Expert Q&A ───────────────────────────────────────────────────────────────
create table expert_questions (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null references auth.users(id) on delete cascade,
  neighborhood_id uuid not null references neighborhoods(id) on delete cascade,
  domain          text not null
                  check (domain in ('traffic','arch','fiscal','env','legal','housing')),
  body            text not null check (char_length(body) between 10 and 1000),
  upvote_count    integer not null default 0,
  answered        boolean not null default false,
  created_at      timestamptz not null default now()
);

create index eq_neighborhood_idx on expert_questions(neighborhood_id, created_at desc);
create index eq_domain_idx on expert_questions(domain);

create table expert_answers (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null references expert_questions(id) on delete cascade,
  expert_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 10 and 5000),
  helpful_count integer not null default 0,
  created_at  timestamptz not null default now(),
  -- One answer per expert per question
  unique(question_id, expert_id)
);

-- Mark question answered when first answer posted
create or replace function mark_question_answered()
returns trigger language plpgsql as $$
begin
  update expert_questions set answered = true where id = NEW.question_id;
  -- Award trust to question author for getting answered
  update profiles
    set trust_score = trust_score + 10, updated_at = now()
    where id = (select author_id from expert_questions where id = NEW.question_id);
  -- Award trust to answering expert
  update profiles
    set trust_score = trust_score + 40, updated_at = now()
    where id = NEW.expert_id;
  return NEW;
end;
$$;

create trigger answer_posted_trigger
  after insert on expert_answers
  for each row execute procedure mark_question_answered();

-- ─── Notifications ───────────────────────────────────────────────────────────
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null
              check (type in ('expert_answer','official_response','escalation','trust_milestone','city_wide','upvote')),
  -- Flexible payload: reference ids, text snippets, etc.
  payload     jsonb not null default '{}',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where read = false;

-- ─── Trust tier auto-update ───────────────────────────────────────────────────
create or replace function update_trust_tier()
returns trigger language plpgsql as $$
begin
  NEW.trust_tier := case
    when NEW.trust_score >= 1200 then 'moderator'
    when NEW.trust_score >= 600  then 'voice'
    when NEW.trust_score >= 200  then 'contributor'
    else 'resident'
  end;

  -- Fire milestone notification if tier changed
  if NEW.trust_tier != OLD.trust_tier then
    insert into notifications (user_id, type, payload)
    values (NEW.id, 'trust_milestone', jsonb_build_object(
      'new_tier', NEW.trust_tier,
      'score', NEW.trust_score
    ));
  end if;

  return NEW;
end;
$$;

create trigger trust_tier_trigger
  before update of trust_score on profiles
  for each row execute procedure update_trust_tier();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles          enable row level security;
alter table neighborhoods     enable row level security;
alter table residency_proofs  enable row level security;
alter table posts             enable row level security;
alter table post_upvotes      enable row level security;
alter table civic_issues      enable row level security;
alter table votes             enable row level security;
alter table expert_questions  enable row level security;
alter table expert_answers    enable row level security;
alter table notifications     enable row level security;

-- Profiles: public read, own write
create policy "profiles_public_read"   on profiles for select using (true);
create policy "profiles_own_update"    on profiles for update using (auth.uid() = id);

-- Neighborhoods: public read, authenticated create
create policy "neighborhoods_public_read"   on neighborhoods for select using (true);
create policy "neighborhoods_auth_insert"   on neighborhoods for insert with check (auth.uid() is not null);

-- Residency proofs: own only
create policy "proofs_own_select" on residency_proofs for select using (auth.uid() = user_id);
create policy "proofs_own_insert" on residency_proofs for insert with check (auth.uid() = user_id);
create policy "proofs_own_delete" on residency_proofs for delete using (auth.uid() = user_id);

-- Posts: public read, authenticated insert
create policy "posts_public_read"   on posts for select using (true);
create policy "posts_auth_insert"   on posts for insert with check (auth.uid() = author_id);
create policy "posts_own_update"    on posts for update using (auth.uid() = author_id);

-- Post upvotes: own
create policy "upvotes_own" on post_upvotes for all using (auth.uid() = user_id);

-- Civic issues: public read, escalation via function
create policy "issues_public_read"  on civic_issues for select using (true);
create policy "issues_auth_insert"  on civic_issues for insert with check (auth.uid() is not null);

-- Votes: authenticated insert, own select (moderation)
create policy "votes_auth_insert"   on votes for insert with check (auth.uid() = user_id);
create policy "votes_own_select"    on votes for select using (auth.uid() = user_id);

-- Expert Q&A: public read, authenticated insert
create policy "eq_public_read"      on expert_questions for select using (true);
create policy "eq_auth_insert"      on expert_questions for insert with check (auth.uid() = author_id);
create policy "ea_public_read"      on expert_answers for select using (true);
create policy "ea_expert_insert"    on expert_answers for insert
  with check (exists (select 1 from profiles where id = auth.uid() and is_expert = true));

-- Notifications: own only
create policy "notifs_own" on notifications for all using (auth.uid() = user_id);

-- ─── Seed: sample neighborhoods (GeoJSON polygons) ───────────────────────────
-- In production these come from real GIS boundary data.
-- These are simplified rectangles for development.
insert into neighborhoods (name, slug, boundary, centroid, resident_count) values
(
  'Riverdale', 'riverdale',
  ST_GeographyFromText('SRID=4326;POLYGON((-74.02 40.70, -73.98 40.70, -73.98 40.73, -74.02 40.73, -74.02 40.70))'),
  ST_GeographyFromText('SRID=4326;POINT(-74.00 40.715)'),
  1240
),
(
  'Midtown', 'midtown',
  ST_GeographyFromText('SRID=4326;POLYGON((-74.00 40.74, -73.96 40.74, -73.96 40.77, -74.00 40.77, -74.00 40.74))'),
  ST_GeographyFromText('SRID=4326;POINT(-73.98 40.755)'),
  3100
),
(
  'Eastside', 'eastside',
  ST_GeographyFromText('SRID=4326;POLYGON((-73.97 40.71, -73.93 40.71, -73.93 40.74, -73.97 40.74, -73.97 40.71))'),
  ST_GeographyFromText('SRID=4326;POINT(-73.95 40.725)'),
  890
);
