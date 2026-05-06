CREATE TABLE IF NOT EXISTS energy_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date        NOT NULL,
  score      int         NOT NULL CHECK (score BETWEEN 1 AND 5),
  factors    text[]      NOT NULL DEFAULT '{}',
  UNIQUE (user_id, date)
);

ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own energy_logs" ON energy_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_energy_logs_user_date ON energy_logs(user_id, date DESC);
