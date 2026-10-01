-- Seed: the eleven spices (sp = current storefront price, cp = 0 until set in
-- admin) plus the pricing/settings defaults. Idempotent.

INSERT OR IGNORE INTO products (id, slug, name, sp, cp, stock_grams, sp_mode) VALUES
  ('black-pepper',     'black-pepper',     'Black Pepper',       180, 0, 0, 'auto'),
  ('cardamom',         'cardamom',         'Cardamom',           450, 0, 0, 'auto'),
  ('cinnamon',         'cinnamon',         'Cinnamon',           120, 0, 0, 'auto'),
  ('turmeric',         'turmeric',         'Turmeric',            60, 0, 0, 'auto'),
  ('nutmeg',           'nutmeg',           'Nutmeg',             300, 0, 0, 'auto'),
  ('mace',             'mace',             'Mace',               550, 0, 0, 'auto'),
  ('cashew-in-shell',  'cashew-in-shell',  'Cashew nut, in shell',150, 0, 0, 'auto'),
  ('cashew-nut',       'cashew-nut',       'Cashew nut',         220, 0, 0, 'auto'),
  ('dry-ginger',       'dry-ginger',       'Dry Ginger',         140, 0, 0, 'auto'),
  ('tamarind',         'tamarind',         'Tamarind',            70, 0, 0, 'auto'),
  ('malabar-tamarind', 'malabar-tamarind', 'Malabar Tamarind',   160, 0, 0, 'auto');

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('margin_pct', '10'),
  ('grievance_officer_name', ''),
  ('grievance_officer_email', ''),
  ('grievance_officer_phone', '');
