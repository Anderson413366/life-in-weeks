-- Life in Weeks baseline Supabase schema.
-- Active app tables use the liw_ prefix. RLS is required because all tables
-- hold private profile, diary, mood, feedback, or BYOK configuration data.

create extension if not exists pgcrypto;

create or replace function public.liw_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.liw_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  birthdate date,
  life_expectancy integer not null default 80 check (life_expectancy between 1 and 120),
  display_name text,
  preferred_name text,
  phone text,
  avatar_url text,
  gemini_api_key text,
  avg_heartbeats_per_min numeric not null default 72 check (avg_heartbeats_per_min between 1 and 240),
  avg_breaths_per_min numeric not null default 15 check (avg_breaths_per_min between 1 and 80),
  avg_blinks_per_min numeric not null default 17 check (avg_blinks_per_min between 0 and 80),
  meals_per_day numeric not null default 3 check (meals_per_day between 0 and 20),
  avg_steps_per_day numeric not null default 7500 check (avg_steps_per_day between 0 and 100000),
  avg_sleep_hours numeric not null default 8 check (avg_sleep_hours between 0 and 24),
  avg_screen_hours numeric not null default 7 check (avg_screen_hours between 0 and 24),
  avg_words_per_day numeric not null default 16000 check (avg_words_per_day between 0 and 100000),
  avg_laughs_per_day numeric not null default 15 check (avg_laughs_per_day between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.liw_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_index integer not null check (week_index >= 0),
  content text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_index)
);

create table if not exists public.liw_mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood text not null,
  energy integer not null check (energy between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.liw_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stars integer not null check (stars between 1 and 5),
  message text,
  created_at timestamptz not null default now()
);

drop trigger if exists liw_profiles_set_updated_at on public.liw_profiles;
create trigger liw_profiles_set_updated_at
before update on public.liw_profiles
for each row execute function public.liw_set_updated_at();

drop trigger if exists liw_diary_entries_set_updated_at on public.liw_diary_entries;
create trigger liw_diary_entries_set_updated_at
before update on public.liw_diary_entries
for each row execute function public.liw_set_updated_at();

create index if not exists liw_diary_entries_user_week_idx
  on public.liw_diary_entries (user_id, week_index desc);

create index if not exists liw_mood_entries_user_created_idx
  on public.liw_mood_entries (user_id, created_at desc);

create index if not exists liw_feedback_user_created_idx
  on public.liw_feedback (user_id, created_at desc);

alter table public.liw_profiles enable row level security;
alter table public.liw_diary_entries enable row level security;
alter table public.liw_mood_entries enable row level security;
alter table public.liw_feedback enable row level security;

drop policy if exists "liw_profiles_select_own" on public.liw_profiles;
create policy "liw_profiles_select_own"
on public.liw_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "liw_profiles_insert_own" on public.liw_profiles;
create policy "liw_profiles_insert_own"
on public.liw_profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "liw_profiles_update_own" on public.liw_profiles;
create policy "liw_profiles_update_own"
on public.liw_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "liw_diary_select_own" on public.liw_diary_entries;
create policy "liw_diary_select_own"
on public.liw_diary_entries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "liw_diary_insert_own" on public.liw_diary_entries;
create policy "liw_diary_insert_own"
on public.liw_diary_entries for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "liw_diary_update_own" on public.liw_diary_entries;
create policy "liw_diary_update_own"
on public.liw_diary_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "liw_diary_delete_own" on public.liw_diary_entries;
create policy "liw_diary_delete_own"
on public.liw_diary_entries for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "liw_mood_select_own" on public.liw_mood_entries;
create policy "liw_mood_select_own"
on public.liw_mood_entries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "liw_mood_insert_own" on public.liw_mood_entries;
create policy "liw_mood_insert_own"
on public.liw_mood_entries for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "liw_mood_update_own" on public.liw_mood_entries;
create policy "liw_mood_update_own"
on public.liw_mood_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "liw_feedback_insert_own" on public.liw_feedback;
create policy "liw_feedback_insert_own"
on public.liw_feedback for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "liw_feedback_select_own" on public.liw_feedback;
create policy "liw_feedback_select_own"
on public.liw_feedback for select
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'liw-photos',
  'liw-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "liw_photos_select_own" on storage.objects;
create policy "liw_photos_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'liw-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "liw_photos_insert_own" on storage.objects;
create policy "liw_photos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'liw-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "liw_photos_update_own" on storage.objects;
create policy "liw_photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'liw-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'liw-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "liw_photos_delete_own" on storage.objects;
create policy "liw_photos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'liw-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
