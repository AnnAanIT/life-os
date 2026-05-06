-- =============================================
-- Personal Life OS — Database Schema (MVP 5)
-- Run AFTER schema-mvp4.sql
-- =============================================

-- =====================
-- WORKOUTS
-- =====================
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'gym',
  duration_minutes integer not null check (duration_minutes > 0),
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table workouts enable row level security;
create policy "Users manage own workouts"
  on workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_workouts_user_date on workouts(user_id, date desc);

-- =====================
-- SLEEP LOGS
-- =====================
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  bed_time text,
  wake_time text,
  duration_hours numeric(4,2),
  quality integer check (quality >= 1 and quality <= 5),
  date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table sleep_logs enable row level security;
create policy "Users manage own sleep logs"
  on sleep_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================
-- WATER LOGS
-- =====================
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  glasses integer not null default 0 check (glasses >= 0),
  date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table water_logs enable row level security;
create policy "Users manage own water logs"
  on water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================
-- MEDITATION LOGS
-- =====================
create table if not exists meditation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  duration_minutes integer not null check (duration_minutes > 0),
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table meditation_logs enable row level security;
create policy "Users manage own meditation logs"
  on meditation_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_meditation_user_date on meditation_logs(user_id, date desc);

-- =====================
-- JOURNAL ENTRIES
-- =====================
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  gratitude text,
  morning_focus text,
  morning_need text,
  evening_win text,
  evening_lesson text,
  mood integer check (mood >= 1 and mood <= 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table journal_entries enable row level security;
create policy "Users manage own journal"
  on journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_journal_user_date on journal_entries(user_id, date desc);

-- =====================
-- CONTACTS (Quan hệ)
-- =====================
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  relation text default 'friend' check (relation in ('family', 'friend', 'mentor', 'network')),
  reminder_days integer default 14,
  last_contact_date date,
  birthday date,
  notes text,
  created_at timestamptz default now()
);

alter table contacts enable row level security;
create policy "Users manage own contacts"
  on contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_contacts_user on contacts(user_id, last_contact_date);
