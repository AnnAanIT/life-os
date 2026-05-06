create table if not exists ai_insights_cache (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  generated_at timestamptz not null default now(),
  monthly_story text,
  insights    jsonb not null default '[]',
  unique (user_id)
);

alter table ai_insights_cache enable row level security;

create policy "Users manage own cache"
  on ai_insights_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
