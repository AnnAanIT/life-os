-- =============================================
-- Personal Life OS — Database Schema (MVP 1)
-- =============================================

-- Enable RLS on all tables
-- All tables scoped to authenticated user

-- =====================
-- HAPPINESS SCORES
-- =====================
create table if not exists happiness_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 10),
  note text,
  date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table happiness_scores enable row level security;

create policy "Users manage own happiness scores"
  on happiness_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- QUICK CAPTURE / INBOX
-- =====================
create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  classified_as text, -- 'task' | 'transaction' | 'note' | 'habit' | null
  is_processed boolean default false,
  created_at timestamptz default now()
);

alter table inbox_items enable row level security;

create policy "Users manage own inbox"
  on inbox_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- USER PROFILES
-- =====================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  annual_theme text,
  active_modules text[] default array['finance', 'tasks', 'habits', 'spirit'],
  energy_peak_start time default '08:00',
  energy_peak_end time default '11:00',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================
-- INDEXES
-- =====================
create index if not exists idx_happiness_user_date on happiness_scores(user_id, date desc);
create index if not exists idx_inbox_user_processed on inbox_items(user_id, is_processed, created_at desc);
