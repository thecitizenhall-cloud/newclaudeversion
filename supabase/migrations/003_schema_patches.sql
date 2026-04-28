-- ─────────────────────────────────────────────────────────────────────────────
-- Townhall · Migration 003 · Schema patches
-- Adds missing columns and tables referenced in the app but absent from 001
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Cities table ─────────────────────────────────────────────────────────────
create table if not exists cities (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null,
  state text not null,
  lat   float,
  lng   float,
  unique(name, state)
);

-- ─── Neighborhoods patches ────────────────────────────────────────────────────
alter table neighborhoods add column if not exists city_id     uuid references cities(id);
alter table neighborhoods add column if not exists center_lat  float;
alter table neighborhoods add column if not exists center_lng  float;

-- Drop the NOT NULL constraint on boundary so neighborhoods can be created
-- without a PostGIS polygon (app creates them via name/city only)
alter table neighborhoods alter column boundary drop not null;

-- ─── Profiles patches ─────────────────────────────────────────────────────────
alter table profiles add column if not exists neighborhood_id uuid references neighborhoods(id);
alter table profiles add column if not exists neighborhood    text;
alter table profiles add column if not exists onboarded       boolean not null default false;

-- ─── Expert applications ──────────────────────────────────────────────────────
create table if not exists expert_applications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  full_name       text not null,
  organisation    text not null,
  license_number  text,
  domains         text[] not null default '{}',
  credential_url  text,
  credential_name text,
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  admin_note      text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

alter table expert_applications enable row level security;
create policy "expert_apps_own" on expert_applications
  for all using (auth.uid() = user_id);

-- ─── Official applications ────────────────────────────────────────────────────
create table if not exists official_applications (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  full_name           text not null,
  title               text not null,
  department          text,
  jurisdiction        text not null,
  jurisdiction_state  text not null,
  official_email      text,
  phone               text,
  civic_match         jsonb,
  civic_verified      boolean not null default false,
  status              text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  admin_note          text,
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now()
);

alter table official_applications enable row level security;
create policy "official_apps_own" on official_applications
  for all using (auth.uid() = user_id);

-- ─── Reported posts ───────────────────────────────────────────────────────────
create table if not exists reported_posts (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null,
  status      text not null default 'pending'
              check (status in ('pending','reviewed','dismissed')),
  created_at  timestamptz not null default now(),
  unique(post_id, reporter_id)
);

alter table reported_posts enable row level security;
create policy "reports_auth_insert" on reported_posts
  for insert with check (auth.uid() = reporter_id);
create policy "reports_own_select" on reported_posts
  for select using (auth.uid() = reporter_id);

-- ─── Question upvotes ─────────────────────────────────────────────────────────
create table if not exists question_upvotes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references expert_questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table question_upvotes enable row level security;
create policy "q_upvotes_own" on question_upvotes
  for all using (auth.uid() = user_id);

-- ─── Admin RPC functions ──────────────────────────────────────────────────────
create or replace function approve_expert_application(application_id uuid, note text default null)
returns void language plpgsql security definer as $$
declare
  app expert_applications;
begin
  select * into app from expert_applications where id = application_id;
  if not found then raise exception 'Application not found'; end if;

  update expert_applications
    set status = 'approved', admin_note = note, reviewed_at = now()
    where id = application_id;

  update profiles
    set is_expert = true,
        expert_domains = app.domains,
        expert_org = app.organisation,
        expert_verified_at = now(),
        trust_score = trust_score + 100,
        updated_at = now()
    where id = app.user_id;

  insert into notifications (user_id, type, payload)
    values (app.user_id, 'trust_milestone',
      jsonb_build_object('message', 'Your expert application has been approved!'));
end;
$$;

create or replace function reject_expert_application(application_id uuid, note text default null)
returns void language plpgsql security definer as $$
begin
  update expert_applications
    set status = 'rejected', admin_note = note, reviewed_at = now()
    where id = application_id;
end;
$$;

create or replace function approve_official_application(application_id uuid, note text default null)
returns void language plpgsql security definer as $$
declare
  app official_applications;
begin
  select * into app from official_applications where id = application_id;
  if not found then raise exception 'Application not found'; end if;

  update official_applications
    set status = 'approved', admin_note = note, reviewed_at = now()
    where id = application_id;

  update profiles
    set is_official = true,
        official_title = app.title,
        official_district = app.jurisdiction,
        updated_at = now()
    where id = app.user_id;

  insert into notifications (user_id, type, payload)
    values (app.user_id, 'official_response',
      jsonb_build_object('message', 'Your official application has been approved!'));
end;
$$;

create or replace function reject_official_application(application_id uuid, note text default null)
returns void language plpgsql security definer as $$
begin
  update official_applications
    set status = 'rejected', admin_note = note, reviewed_at = now()
    where id = application_id;
end;
$$;
