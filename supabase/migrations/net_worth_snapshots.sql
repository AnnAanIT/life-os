-- Net worth snapshot: 1 row per user per day, upserted automatically when user opens investments page
create table if not exists net_worth_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  snapshot_date date not null,
  total_value   bigint not null,
  by_type       jsonb not null default '{}',
  created_at    timestamptz default now(),

  constraint net_worth_snapshots_unique unique (user_id, snapshot_date)
);

alter table net_worth_snapshots enable row level security;

create policy "Users manage own snapshots"
  on net_worth_snapshots for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_nw_snapshots_user_date
  on net_worth_snapshots (user_id, snapshot_date desc);
