-- supabase/migrations/005_issue_replies.sql
--
-- Adds replies to civic issues and links expert answers to issues.

-- ── Issue replies ─────────────────────────────────────────────────────────────
create table if not exists issue_replies (
  id            uuid primary key default uuid_generate_v4(),
  issue_id      uuid not null references civic_issues(id) on delete cascade,
  author_id     uuid not null references auth.users(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 1000),
  proof_hash    text,
  created_at    timestamptz not null default now()
);

create index if not exists issue_replies_issue_idx on issue_replies(issue_id, created_at asc);

-- ── reply_count on civic_issues ───────────────────────────────────────────────
alter table civic_issues add column if not exists reply_count integer not null default 0;

create or replace function update_issue_reply_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update civic_issues set reply_count = reply_count + 1, updated_at = now()
    where id = NEW.issue_id;
  elsif TG_OP = 'DELETE' then
    update civic_issues set reply_count = greatest(0, reply_count - 1), updated_at = now()
    where id = OLD.issue_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_issue_reply_count on issue_replies;
create trigger trg_issue_reply_count
  after insert or delete on issue_replies
  for each row execute function update_issue_reply_count();

-- ── Link expert questions/answers to a specific civic issue ───────────────────
alter table expert_questions add column if not exists issue_id uuid references civic_issues(id) on delete set null;
alter table expert_answers   add column if not exists issue_id uuid references civic_issues(id) on delete set null;

create index if not exists eq_issue_idx on expert_questions(issue_id) where issue_id is not null;
create index if not exists ea_issue_idx on expert_answers(issue_id)   where issue_id is not null;

-- ── Official response satisfaction ───────────────────────────────────────────
create table if not exists official_response_reactions (
  id         uuid primary key default uuid_generate_v4(),
  issue_id   uuid not null references civic_issues(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  addressed  boolean not null,
  created_at timestamptz not null default now(),
  unique(issue_id, user_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table issue_replies                enable row level security;
alter table official_response_reactions  enable row level security;

create policy "replies_public_read"   on issue_replies for select using (true);
create policy "replies_auth_insert"   on issue_replies for insert with check (auth.uid() = author_id);
create policy "replies_auth_delete"   on issue_replies for delete using (auth.uid() = author_id);

create policy "orr_public_read"       on official_response_reactions for select using (true);
create policy "orr_auth_insert"       on official_response_reactions for insert with check (auth.uid() = user_id);
create policy "orr_auth_update"       on official_response_reactions for update using (auth.uid() = user_id);
