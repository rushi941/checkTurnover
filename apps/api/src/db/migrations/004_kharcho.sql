-- Shop kharcho (expenses): bhadu, salary, bills, maintenance, car, EMI, etc.

CREATE TABLE IF NOT EXISTS shop_kharcho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category VARCHAR(32) NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_kharcho_shop_date ON shop_kharcho (shop_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_kharcho_shop_category ON shop_kharcho (shop_id, category);
