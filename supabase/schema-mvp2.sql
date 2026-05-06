-- =============================================
-- Personal Life OS — Database Schema (MVP 2)
-- Run this in Supabase SQL Editor AFTER schema.sql
-- =============================================

-- =====================
-- TRANSACTIONS
-- =====================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(15,0) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null default 'other',
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Users manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_transactions_user_date on transactions(user_id, date desc);

-- =====================
-- TASKS
-- =====================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  is_mit boolean default false,
  is_done boolean default false,
  due_date date,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "Users manage own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_tasks_user_mit on tasks(user_id, is_done, is_mit, created_at desc);

-- =====================
-- HABITS
-- =====================
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '⚡',
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table habits enable row level security;

create policy "Users manage own habits"
  on habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_habits_user_active on habits(user_id, is_active, sort_order);

-- =====================
-- HABIT LOGS
-- =====================
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

alter table habit_logs enable row level security;

create policy "Users manage own habit logs"
  on habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_habit_logs_user_date on habit_logs(user_id, date desc);
create index if not exists idx_habit_logs_habit_date on habit_logs(habit_id, date desc);
