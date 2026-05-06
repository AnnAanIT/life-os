alter table tasks
  add column if not exists energy_level text
    check (energy_level in ('high', 'medium', 'low')),
  add column if not exists recurrence text
    check (recurrence in ('daily', 'weekly', 'monthly'));
