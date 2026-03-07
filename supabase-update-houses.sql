-- Schema updates to add house context to sales and expenses, and rename the default house for collections
ALTER TABLE sales ADD COLUMN IF NOT EXISTS house TEXT NOT NULL DEFAULT 'Emeline''s Pen';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS house TEXT NOT NULL DEFAULT 'Emeline''s Pen';
ALTER TABLE collections ALTER COLUMN house SET DEFAULT 'Emeline''s Pen';

-- Optional: Update existing records that had '1' or '2' to the new names
UPDATE collections SET house = 'Emeline''s Pen' WHERE house = '1';
UPDATE collections SET house = 'Dorcas'' Pen' WHERE house = '2';
