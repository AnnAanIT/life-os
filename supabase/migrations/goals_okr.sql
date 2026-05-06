-- Goals OKR expansion: key_results, goal_id on tasks & habits
-- Run in Supabase Dashboard → SQL Editor

-- Key Results table (sub-goals under each Objective)
create table if not exists key_results (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references goals(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  is_done    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table key_results enable row level security;

create policy "users manage own key_results"
  on key_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_key_results_goal on key_results(goal_id);

-- Link tasks to a goal (optional)
alter table tasks
  add column if not exists goal_id uuid references goals(id) on delete set null;

-- Link habits to a goal (optional)
alter table habits
  add column if not exists goal_id uuid references goals(id) on delete set null;
