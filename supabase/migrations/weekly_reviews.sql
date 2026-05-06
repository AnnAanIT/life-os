CREATE TABLE IF NOT EXISTS weekly_reviews (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start    date  NOT NULL, -- always Monday
  best_thing    text,
  carry_forward text,
  next_priority text,
  UNIQUE (user_id, week_start)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own weekly_reviews" ON weekly_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user ON weekly_reviews(user_id, week_start DESC);
