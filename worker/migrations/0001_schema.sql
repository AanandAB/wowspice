-- wowspice schema (D1 / SQLite)
-- Phase 1: full core schema so later phases (orders, admin, pricing) don't
-- need destructive migrations. snake_case, TEXT ids, unixepoch() timestamps.

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,       -- argon2/bcrypt output, never plaintext
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  local_name TEXT,
  description TEXT,
  spec_desc TEXT,
  flavor_notes TEXT,                 -- JSON array
  origin TEXT,                       -- JSON object
  harvest TEXT,
  heat INTEGER NOT NULL DEFAULT 0,
  uses TEXT,                         -- JSON array
  storage TEXT,
  dietary TEXT,                      -- JSON array
  cp REAL NOT NULL DEFAULT 0,        -- cost price, INR per 100 g
  sp REAL NOT NULL DEFAULT 0,        -- selling price, INR per 100 g
  sp_mode TEXT NOT NULL DEFAULT 'auto',  -- 'auto' (min-SP) | 'manual'
  stock_grams REAL NOT NULL DEFAULT 0,   -- stock on hand, grams
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_pincode TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  delivery REAL NOT NULL DEFAULT 0,
  gst REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',          -- new|confirmed|packed|dispatched|delivered|cancelled
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid|paid|cod
  delivery_slot TEXT,
  consent_version TEXT,
  consented_at INTEGER,                        -- DPDP consent record
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  pack_label TEXT,
  grams REAL NOT NULL DEFAULT 0,
  grind TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  unit_cp REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  expense_date INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
