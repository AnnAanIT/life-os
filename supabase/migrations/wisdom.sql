-- ─── Phase 1: Wisdom module ──────────────────────────────────────────────────

-- 1. Thêm thông tin sinh nhật vào profiles (dùng cho tính toán tử vi)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_hour smallint CHECK (birth_hour BETWEEN 0 AND 23);

-- 2. Lịch sử gieo quẻ của user
CREATE TABLE IF NOT EXISTS wisdom_readings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  hexagram_num  smallint NOT NULL CHECK (hexagram_num BETWEEN 1 AND 64),
  question      text,
  reflection    text
);

ALTER TABLE wisdom_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own wisdom_readings" ON wisdom_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_readings_user ON wisdom_readings(user_id, created_at DESC);

-- 3. Cache AI interpretation theo ngày (tránh gọi API nhiều lần)
CREATE TABLE IF NOT EXISTS wisdom_daily_cache (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE wisdom_daily_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own wisdom_daily_cache" ON wisdom_daily_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_cache_user ON wisdom_daily_cache(user_id, date DESC);
