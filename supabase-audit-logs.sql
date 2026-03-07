-- =============================================
-- EggLedger Audit Logs Update
-- Run this in the Supabase SQL Editor
-- =============================================

-- Add tracking columns to Collections
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add tracking columns to Sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add tracking columns to Expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
