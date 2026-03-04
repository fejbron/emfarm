-- =============================================
-- EggLedger Profiles Schema & Triggers
-- Run this in the Supabase SQL Editor AFTER the main schema
-- =============================================

-- 1. Create the custom profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'owner')) DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read all profiles (so managers can see users)
CREATE POLICY "Enable read access for authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

-- Profiles: Only super_admins can update other profiles (to change roles)
CREATE POLICY "Enable update for super_admins"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Profiles: Users can update their own name
CREATE POLICY "Enable update for self"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- 2. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
  assigned_role TEXT;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    assigned_role := 'super_admin'; -- First user gets super_admin role
  ELSE
    assigned_role := 'owner'; -- Subsequent users default to owner
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', assigned_role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Protect main tables based on role (Super Admin/Manager = All for data, Owner = Select only)
-- Drop existing public policies
DROP POLICY IF EXISTS "Allow all on collections" ON collections;
DROP POLICY IF EXISTS "Allow all on sales" ON sales;
DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all on settings" ON settings;

-- Collections
CREATE POLICY "Read collections" ON collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write collections" ON collections FOR ALL TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager'));

-- Sales
CREATE POLICY "Read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write sales" ON sales FOR ALL TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager'));

-- Expenses
CREATE POLICY "Read expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write expenses" ON expenses FOR ALL TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager'));

-- Settings
CREATE POLICY "Read settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write settings" ON settings FOR ALL TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');
