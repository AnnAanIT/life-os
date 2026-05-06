-- =============================================
-- Personal Life OS — Database Schema (MVP 4)
-- Run AFTER schema-mvp3.sql
-- =============================================

-- =====================
-- ASSETS (Đầu tư & Tài sản)
-- =====================
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  asset_type text not null check (asset_type in ('gold', 'stock', 'savings', 'real_estate', 'cash', 'other')),
  name text not null,
  current_value numeric(15,0) not null check (current_value >= 0),
  buy_value numeric(15,0),
  quantity numeric(12,4),
  unit text,
  note text,
  created_at timestamptz default now()
);

alter table assets enable row level security;

create policy "Users manage own assets"
  on assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_assets_user_type on assets(user_id, asset_type);

-- =====================
-- SAVINGS GOALS (Hũ tiết kiệm)
-- =====================
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '🎯',
  target_amount numeric(15,0) not null check (target_amount > 0),
  current_amount numeric(15,0) default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz default now()
);

alter table savings_goals enable row level security;

create policy "Users manage own savings goals"
  on savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- BOOKS (Kệ sách)
-- =====================
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  author text,
  status text not null default 'want' check (status in ('want', 'reading', 'done')),
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  finished_at date,
  created_at timestamptz default now()
);

alter table books enable row level security;

create policy "Users manage own books"
  on books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_books_user_status on books(user_id, status, created_at desc);
