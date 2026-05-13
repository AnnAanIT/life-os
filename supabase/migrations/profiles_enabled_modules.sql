alter table public.profiles
  add column if not exists enabled_modules text[] default array[
    'finance','investments','habits','tasks','goals',
    'health','learning','spirit','insights'
  ];
