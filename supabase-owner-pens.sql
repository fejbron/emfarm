-- Add assigned_pen to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_pen TEXT;

-- Profiles: Allow Super Admins to update the assigned_pen field as well (already covered by existing update policy)
-- Note: You should be able to update profiles normally from the UI using your existing update policy.

-- Update Row Level Security (RLS) policies for collections
DROP POLICY IF EXISTS "Read collections" ON collections;
CREATE POLICY "Read collections" ON collections FOR SELECT TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager') 
    OR 
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner' 
        AND 
        house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
    )
);

-- Update Row Level Security (RLS) policies for sales
DROP POLICY IF EXISTS "Read sales" ON sales;
CREATE POLICY "Read sales" ON sales FOR SELECT TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager') 
    OR 
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner' 
        AND 
        house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
    )
);

-- Update Row Level Security (RLS) policies for expenses
DROP POLICY IF EXISTS "Read expenses" ON expenses;
CREATE POLICY "Read expenses" ON expenses FOR SELECT TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager') 
    OR 
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner' 
        AND 
        house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
    )
);
