-- =============================================================================
-- Migration 001: Initial Schema
-- Paper Prints Platform — PostgreSQL
-- Run once on a fresh database before any other migrations.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE,
  phone         TEXT        UNIQUE,
  password_hash TEXT,                        -- NULL for Google-only users
  firebase_uid  TEXT        UNIQUE,          -- set by migration 004
  photo_url     TEXT,
  role          TEXT        NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'vendor', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);

-- -----------------------------------------------------------------------------
-- VENDORS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        REFERENCES users (id) ON DELETE CASCADE,
  shop_name     TEXT        NOT NULL,
  owner_name    TEXT        NOT NULL,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  location_lat  DOUBLE PRECISION,
  location_lng  DOUBLE PRECISION,
  is_active     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_vendors_active   ON vendors (is_active, is_verified);

-- -----------------------------------------------------------------------------
-- VENDOR SETTINGS  (1:1 with vendors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id           UUID        NOT NULL UNIQUE REFERENCES vendors (id) ON DELETE CASCADE,
  price_bw            NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  price_color         NUMERIC(8,2) NOT NULL DEFAULT 5.00,
  price_double_sided  NUMERIC(8,2),
  opening_time        TIME,
  closing_time        TIME,
  max_file_size_mb    INT          NOT NULL DEFAULT 50,
  avg_processing_min  INT          NOT NULL DEFAULT 15,
  capabilities        TEXT[]       NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- FILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  file_url         TEXT         NOT NULL,
  s3_key           TEXT         NOT NULL,
  file_name        TEXT         NOT NULL,
  file_size_bytes  BIGINT       NOT NULL DEFAULT 0,
  total_pages      INT          NOT NULL DEFAULT 0,
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user ON files (user_id);

-- -----------------------------------------------------------------------------
-- FILE PAGES  (per-page colour detection from pdf-service)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id     UUID    NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  page_number INT     NOT NULL,
  is_color    BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (file_id, page_number)
);

-- -----------------------------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------------------------
CREATE TYPE order_status AS ENUM (
  'PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'
);

CREATE TABLE IF NOT EXISTS orders (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT         NOT NULL UNIQUE,
  user_id          UUID         NOT NULL REFERENCES users    (id),
  vendor_id        UUID         NOT NULL REFERENCES vendors  (id),
  file_id          UUID         NOT NULL REFERENCES files    (id),
  status           order_status NOT NULL DEFAULT 'PENDING',
  copies           INT          NOT NULL DEFAULT 1,
  is_double_sided  BOOLEAN      NOT NULL DEFAULT FALSE,
  total_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_time   INT,                         -- minutes, set by vendor on accept
  qr_code_url      TEXT,                        -- set when status = READY
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders (user_id,   created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- -----------------------------------------------------------------------------
-- ORDER PAGES  (user's per-page print-type choices)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  page_number INT  NOT NULL,
  print_type  TEXT NOT NULL DEFAULT 'BW' CHECK (print_type IN ('BW', 'COLOR')),
  UNIQUE (order_id, page_number)
);

-- -----------------------------------------------------------------------------
-- PAYMENTS  (future use — stub for schema completeness)
-- -----------------------------------------------------------------------------
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS payments (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID           NOT NULL UNIQUE REFERENCES orders (id),
  amount         NUMERIC(10,2)  NOT NULL,
  status         payment_status NOT NULL DEFAULT 'PENDING',
  payment_method TEXT           CHECK (payment_method IN ('UPI', 'CASH', 'CARD')),
  transaction_id TEXT,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Seed: one demo vendor (comment out in production)
-- =============================================================================
-- INSERT INTO vendors (shop_name, owner_name, address, location_lat, location_lng, is_active, is_verified)
-- VALUES ('Demo Print Shop', 'Demo Owner', '123 Main St', 28.6139, 77.2090, TRUE, TRUE)
-- ON CONFLICT DO NOTHING;
