-- Migration: asset_transactions
-- Tracks individual buy/sell history per asset for DCA (dollar-cost averaging)

CREATE TABLE IF NOT EXISTS asset_transactions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id          UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  type              TEXT        NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity          DECIMAL(20, 8) NOT NULL,
  price_per_unit    DECIMAL(20, 2) NOT NULL,
  total_value       DECIMAL(20, 2) NOT NULL,
  transaction_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own transactions"
  ON asset_transactions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_asset_tx_asset_id ON asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_tx_user_id  ON asset_transactions(user_id);
