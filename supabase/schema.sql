-- =============================================================================
-- DataPath — Skema Database PostgreSQL & Kebijakan Row Level Security (Supabase)
-- Jalankan seluruh skrip ini satu kali di Supabase SQL Editor.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Helper Trigger untuk kolom updated_at
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Tabel: profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  full_name text not null default '',
  headline text not null default 'Pembelajar Analisis Data',
  tagline text not null default '' check (char_length(tagline) <= 150),
  bio text not null default '',
  target_role text not null default 'Junior Data Analyst',
  city text not null default '',
  github_url text not null default '',
  linkedin_url text not null default '',
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  total_lessons_completed integer not null default 0 check (total_lessons_completed >= 0),
  completed_tracks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text;
alter table public.profiles
  add column if not exists tagline text not null default '';
alter table public.profiles
  add column if not exists city text not null default '';
alter table public.profiles
  add column if not exists github_url text not null default '';
alter table public.profiles
  add column if not exists linkedin_url text not null default '';
alter table public.profiles
  add column if not exists completed_tracks text[] not null default '{}';
alter table public.profiles
  add column if not exists xp integer not null default 0;
alter table public.profiles
  add column if not exists total_lessons_completed integer not null default 0;

create unique index if not exists idx_profiles_username_unique
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Tabel: lesson_progress
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track_slug text not null default 'excel-analisis-data',
  lesson_id text not null,
  is_completed boolean not null default true,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_user_lesson_unique unique (user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user_id
  on public.lesson_progress (user_id);

-- Bersihkan data lama dengan format 1-digit agar konsisten memakai 'excel-01'..'excel-05'
delete from public.lesson_progress
where lesson_id in ('excel-1', 'excel-2', 'excel-3', 'excel-4', 'excel-5');

-- Hapus potensi baris duplikat sebelum memastikan constraint UNIQUE terpasang
delete from public.lesson_progress a
using public.lesson_progress b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and a.lesson_id = b.lesson_id;

-- Pastikan constraint UNIQUE (user_id, lesson_id) tetap terpasang meski tabel sudah ada sebelumnya
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'lesson_progress'
      and c.conname = 'lesson_progress_user_lesson_unique'
  ) then
    alter table public.lesson_progress
      add constraint lesson_progress_user_lesson_unique unique (user_id, lesson_id);
  end if;
end
$$;

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Tabel: quiz_attempts
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pastikan tidak ada constraint unik yang menghalangi pengulangan kuis per pelajaran
alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_user_lesson_unique;

create index if not exists idx_quiz_attempts_user_lesson_completed
  on public.quiz_attempts (user_id, lesson_id, completed_at desc);

drop trigger if exists set_quiz_attempts_updated_at on public.quiz_attempts;
create trigger set_quiz_attempts_updated_at
  before update on public.quiz_attempts
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Tabel: notes
-- -----------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_user_lesson_unique unique (user_id, lesson_id)
);

create index if not exists idx_notes_user_id
  on public.notes (user_id);

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Tabel: projects (Portofolio Publik & Draf Pribadi)
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  title text not null check (char_length(title) <= 100),
  description text not null default '' check (char_length(description) <= 200),
  case_study text not null default '',
  tags text[] not null default '{}',
  github_url text,
  dataset_url text,
  track_slug text not null default 'excel-analisis-data',
  thumbnail_color text not null default '#1d4ed8',
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_user_slug_unique unique (user_id, slug)
);

alter table public.projects
  add column if not exists description text not null default '';
alter table public.projects
  add column if not exists case_study text not null default '';
alter table public.projects
  add column if not exists tags text[] not null default '{}';
alter table public.projects
  add column if not exists github_url text;
alter table public.projects
  add column if not exists dataset_url text;
alter table public.projects
  add column if not exists track_slug text not null default 'excel-analisis-data';
alter table public.projects
  add column if not exists thumbnail_color text not null default '#1d4ed8';
alter table public.projects
  add column if not exists display_order integer not null default 0;

create index if not exists idx_projects_user_id
  on public.projects (user_id);

create index if not exists idx_projects_published
  on public.projects (is_published, display_order) where is_published = true;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Tabel: streaks
-- -----------------------------------------------------------------------------
create table if not exists public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_streaks_updated_at on public.streaks;
create trigger set_streaks_updated_at
  before update on public.streaks
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 7b. Tabel: exercise_attempts (Status Latihan Interaktif Python / SQL / Excel)
-- -----------------------------------------------------------------------------
create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  exercise_id text not null,
  exercise_type text not null check (exercise_type in ('python', 'sql', 'excel')),
  status text not null default 'attempted' check (status in ('attempted', 'passed')),
  attempts_count integer not null default 1 check (attempts_count >= 1),
  last_submission text not null default '',
  passed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint exercise_attempts_user_lesson_exercise_unique unique (user_id, lesson_id, exercise_id)
);

create index if not exists idx_exercise_attempts_user_id
  on public.exercise_attempts (user_id);

drop trigger if exists set_exercise_attempts_updated_at on public.exercise_attempts;
create trigger set_exercise_attempts_updated_at
  before update on public.exercise_attempts
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 7c. Tabel: user_badges (Pencapaian / Lencana Pembelajar)
-- -----------------------------------------------------------------------------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  constraint user_badges_user_badge_unique unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user_id
  on public.user_badges (user_id);

-- -----------------------------------------------------------------------------
-- 8. Trigger Otomatis Pembuatan Profil & Streak Saat User Mendaftar
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_name text;
begin
  default_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'Pengguna'), '@', 1)
  );

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, default_name)
  on conflict (id) do nothing;

  insert into public.streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 9. Aktifkan Row Level Security (RLS) di SEMUA Tabel
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.notes enable row level security;
alter table public.projects enable row level security;
alter table public.streaks enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.user_badges enable row level security;

-- -----------------------------------------------------------------------------
-- 10. Kebijakan RLS Eksplisit (SELECT, INSERT, UPDATE, DELETE)
-- -----------------------------------------------------------------------------

-- profiles: pemilik dapat membaca seluruh datanya sendiri, dan publik dapat membaca profil portofolio yang memiliki username
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_select_public_portfolio" on public.profiles;
create policy "profiles_select_public_portfolio"
  on public.profiles for select
  to anon, authenticated
  using (username is not null and length(trim(username)) > 0);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- lesson_progress: hanya pemilik
drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
create policy "lesson_progress_select_own"
  on public.lesson_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "lesson_progress_insert_own" on public.lesson_progress;
create policy "lesson_progress_insert_own"
  on public.lesson_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "lesson_progress_update_own" on public.lesson_progress;
create policy "lesson_progress_update_own"
  on public.lesson_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "lesson_progress_delete_own" on public.lesson_progress;
create policy "lesson_progress_delete_own"
  on public.lesson_progress for delete
  to authenticated
  using (auth.uid() = user_id);

-- quiz_attempts: hanya pemilik
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "quiz_attempts_update_own" on public.quiz_attempts;
create policy "quiz_attempts_update_own"
  on public.quiz_attempts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quiz_attempts_delete_own" on public.quiz_attempts;
create policy "quiz_attempts_delete_own"
  on public.quiz_attempts for delete
  to authenticated
  using (auth.uid() = user_id);

-- notes: hanya pemilik
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

-- projects: proyek publik (is_published = true) dapat dibaca oleh siapa saja;
-- pemilik (authenticated) dapat membaca draf miliknya sendiri; tulis/ubah/hapus hanya pemilik.
drop policy if exists "projects_select_public_or_own" on public.projects;
drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public"
  on public.projects for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

-- streaks: hanya pemilik
drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
  on public.streaks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own"
  on public.streaks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own"
  on public.streaks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "streaks_delete_own" on public.streaks;
create policy "streaks_delete_own"
  on public.streaks for delete
  to authenticated
  using (auth.uid() = user_id);

-- exercise_attempts: hanya pemilik
drop policy if exists "exercise_attempts_select_own" on public.exercise_attempts;
create policy "exercise_attempts_select_own"
  on public.exercise_attempts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "exercise_attempts_insert_own" on public.exercise_attempts;
create policy "exercise_attempts_insert_own"
  on public.exercise_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "exercise_attempts_update_own" on public.exercise_attempts;
create policy "exercise_attempts_update_own"
  on public.exercise_attempts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "exercise_attempts_delete_own" on public.exercise_attempts;
create policy "exercise_attempts_delete_own"
  on public.exercise_attempts for delete
  to authenticated
  using (auth.uid() = user_id);

-- user_badges: hanya pemilik
drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
  on public.user_badges for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own"
  on public.user_badges for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_badges_update_own" on public.user_badges;
create policy "user_badges_update_own"
  on public.user_badges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_badges_delete_own" on public.user_badges;
create policy "user_badges_delete_own"
  on public.user_badges for delete
  to authenticated
  using (auth.uid() = user_id);
