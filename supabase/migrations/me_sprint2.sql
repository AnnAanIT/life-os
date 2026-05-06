-- Tầng 0 & 1 fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS purpose_statement text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS life_chapter      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS core_values       text[] NOT NULL DEFAULT '{}';

-- Life Wheel — quarterly assessments (multiple entries over time)
CREATE TABLE IF NOT EXISTS life_wheel_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessed_at   date NOT NULL DEFAULT CURRENT_DATE,
  finance       int  CHECK (finance       BETWEEN 1 AND 10),
  health        int  CHECK (health        BETWEEN 1 AND 10),
  learning      int  CHECK (learning      BETWEEN 1 AND 10),
  work          int  CHECK (work          BETWEEN 1 AND 10),
  relationships int  CHECK (relationships BETWEEN 1 AND 10),
  spirit        int  CHECK (spirit        BETWEEN 1 AND 10),
  time          int  CHECK (time          BETWEEN 1 AND 10)
);

ALTER TABLE life_wheel_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own life_wheel_entries" ON life_wheel_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_life_wheel_user ON life_wheel_entries(user_id, assessed_at DESC);
