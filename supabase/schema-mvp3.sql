-- =============================================
-- Personal Life OS — Database Schema (MVP 3)
-- Run AFTER schema.sql and schema-mvp2.sql
-- =============================================

-- =====================
-- GOALS
-- =====================
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  timeframe text not null default 'year' check (timeframe in ('year', 'quarter', 'month')),
  value_tag text not null default 'other',
  progress integer default 0 check (progress >= 0 and progress <= 100),
  is_done boolean default false,
  target_date date,
  created_at timestamptz default now()
);

alter table goals enable row level security;

create policy "Users manage own goals"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_goals_user_timeframe on goals(user_id, timeframe, is_done);

-- =====================
-- BUDGETS
-- =====================
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(15,0) not null check (monthly_limit > 0),
  created_at timestamptz default now(),
  unique(user_id, category)
);

alter table budgets enable row level security;

create policy "Users manage own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
