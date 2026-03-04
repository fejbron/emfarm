-- =============================================
-- EggLedger Database Schema for Supabase
-- Run this in the Supabase SQL Editor
-- =============================================

-- Egg Collections
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  eggs INTEGER NOT NULL,
  damaged_eggs INTEGER DEFAULT 0,
  good_eggs INTEGER NOT NULL,
  house TEXT NOT NULL DEFAULT '1',
  crates NUMERIC(10,2) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  crates_sold INTEGER NOT NULL,
  price_per_crate NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings (single row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  farm_name TEXT DEFAULT 'My Poultry Farm',
  eggs_per_crate INTEGER DEFAULT 30,
  default_price_per_crate NUMERIC(10,2) DEFAULT 1500,
  currency TEXT DEFAULT 'GHS ',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (allow all for now — add auth later)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public access policies (since there's no auth yet)
CREATE POLICY "Allow all on collections" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE collections;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
