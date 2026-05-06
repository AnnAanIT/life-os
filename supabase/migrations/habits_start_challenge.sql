alter table habits
  add column if not exists start_date    date    not null default current_date,
  add column if not exists challenge_days integer check (challenge_days > 0);
