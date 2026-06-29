-- Monthly sales targets (Vakro / kamai goal)

CREATE TABLE IF NOT EXISTS monthly_targets (
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,
  target_paise BIGINT NOT NULL CHECK (target_paise > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, month)
);
