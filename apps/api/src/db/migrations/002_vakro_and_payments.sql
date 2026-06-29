-- Rename galla → vakro; purchase payment tracking

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'daily_galla'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'daily_vakro'
  ) THEN
    ALTER TABLE daily_galla RENAME TO daily_vakro;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS daily_vakro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, date)
);

ALTER TABLE daily_purchases
  ADD COLUMN IF NOT EXISTS paid_amount_paise BIGINT NOT NULL DEFAULT 0;

ALTER TABLE daily_purchases
  DROP CONSTRAINT IF EXISTS daily_purchases_paid_lte_amount;

ALTER TABLE daily_purchases
  ADD CONSTRAINT daily_purchases_paid_lte_amount
  CHECK (paid_amount_paise >= 0 AND paid_amount_paise <= amount_paise);

CREATE TABLE IF NOT EXISTS purchase_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES daily_purchases(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase ON purchase_payments (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_shop_date ON purchase_payments (shop_id, payment_date DESC);
