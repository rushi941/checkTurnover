-- TurnOverCheck initial schema (raw SQL, no ORM)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'shop', 'wholesaler');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  gstin VARCHAR(15),
  state_code VARCHAR(2),
  invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  wholesaler_id UUID,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, name)
);

CREATE TABLE IF NOT EXISTS daily_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_purchases_shop_date ON daily_purchases (shop_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_purchases_shop_source ON daily_purchases (shop_id, source_name);

CREATE TABLE IF NOT EXISTS daily_galla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, date)
);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  fiscal_year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (shop_id, fiscal_year)
);

CREATE TABLE IF NOT EXISTS gst_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invoice_no VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  lines_json JSONB NOT NULL DEFAULT '[]',
  taxable_total_paise BIGINT NOT NULL DEFAULT 0,
  cgst_paise BIGINT NOT NULL DEFAULT 0,
  sgst_paise BIGINT NOT NULL DEFAULT 0,
  igst_paise BIGINT NOT NULL DEFAULT 0,
  grand_total_paise BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
