-- ATOMIC 계정·진행도 스키마
-- Supabase 대시보드의 SQL Editor 에 그대로 붙여 넣어 한 번 실행한다.
-- 두 번 실행해도 안전하도록 전부 if not exists / or replace 로 적었다.

-- ---------------------------------------------------------------------------
-- 1. 프로필 — auth.users 와 1:1
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- 회원가입하면 프로필을 자동으로 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. 진행도 — 사용자당 한 행. 게임 상태 전체의 스냅샷.
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  xp                   integer not null default 0,
  play_count           integer not null default 0,
  best_score           integer not null default 0,
  best_combo           integer not null default 0,
  total_correct        integer not null default 0,
  total_wrong          integer not null default 0,
  total_time_ms        bigint  not null default 0,
  perfect_runs         integer not null default 0,
  best_accuracy        integer not null default 0,
  best_avg_ms          integer,
  hard_runs            integer not null default 0,
  best_endless         integer not null default 0,
  daily_completed_days integer not null default 0,
  modes_played         text[]  not null default '{}',
  viewed_elements      integer[] not null default '{}',
  -- 형태가 자주 바뀌는 것들은 jsonb 로 둔다. 클라이언트 타입이 그대로 진실이다.
  wrong_notes          jsonb   not null default '{}'::jsonb,
  achievements         jsonb   not null default '{}'::jsonb,
  daily                jsonb   not null default '{}'::jsonb,
  -- 어느 쪽이 최신인지 판단하는 기준. 클라이언트가 저장 시각을 함께 올린다.
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. 플레이 로그 — 판마다 한 행씩 쌓는다(append-only). 전체 기록을 남긴다.
-- ---------------------------------------------------------------------------
create table if not exists public.runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- 같은 판이 두 번 올라가는 것을 막는 열쇠. 클라이언트가 판마다 만들어 붙인다.
  client_id    text not null,
  played_at    timestamptz not null,
  mode         text not null,
  difficulty   text not null,
  length       text not null,
  review       boolean not null default false,
  score        integer not null,
  correct      integer not null,
  total        integer not null,
  max_combo    integer not null,
  avg_ms       integer not null,
  duration_ms  integer not null,
  created_at   timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists runs_user_played_at_idx
  on public.runs (user_id, played_at desc);

-- ---------------------------------------------------------------------------
-- 4. RLS — 남의 데이터는 읽지도 쓰지도 못한다.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.runs     enable row level security;

drop policy if exists "본인 프로필만 조회" on public.profiles;
create policy "본인 프로필만 조회" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "본인 프로필만 생성" on public.profiles;
create policy "본인 프로필만 생성" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "본인 진행도만 조회" on public.progress;
create policy "본인 진행도만 조회" on public.progress
  for select using (auth.uid() = user_id);

drop policy if exists "본인 진행도만 생성" on public.progress;
create policy "본인 진행도만 생성" on public.progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 진행도만 수정" on public.progress;
create policy "본인 진행도만 수정" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "본인 기록만 조회" on public.runs;
create policy "본인 기록만 조회" on public.runs
  for select using (auth.uid() = user_id);

drop policy if exists "본인 기록만 생성" on public.runs;
create policy "본인 기록만 생성" on public.runs
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 기록만 삭제" on public.runs;
create policy "본인 기록만 삭제" on public.runs
  for delete using (auth.uid() = user_id);
