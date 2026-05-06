-- Sleep logs (logged in the morning for previous night)
CREATE TABLE IF NOT EXISTS sleep_logs (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            date    NOT NULL, -- date you woke up
  bedtime         text,             -- "23:30"
  wake_time       text,             -- "06:30"
  duration_hours  numeric(3,1),
  quality         int     CHECK (quality BETWEEN 1 AND 5),
  UNIQUE (user_id, date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own sleep_logs" ON sleep_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);

-- Movement + Recovery logs (logged in the evening)
CREATE TABLE IF NOT EXISTS movement_logs (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                date    NOT NULL,
  did_move            boolean NOT NULL DEFAULT false,
  activity            text,             -- 'run','gym','yoga','walk','swim','other'
  duration_mins       int,
  felt_after          text,             -- 'energized','neutral','drained'
  stress_level        int     CHECK (stress_level BETWEEN 1 AND 5),
  recovery_activities text[]  NOT NULL DEFAULT '{}',
  UNIQUE (user_id, date)
);

ALTER TABLE movement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own movement_logs" ON movement_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_movement_logs_user_date ON movement_logs(user_id, date DESC);
