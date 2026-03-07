-- Ensure assigned_pen exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_pen TEXT;

-- Add profiles to realtime publication so role/pen updates instantly push to clients
-- (Commented out because it was already added successfully)
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Collections RLS
DROP POLICY IF EXISTS "Read collections" ON collections;
CREATE POLICY "Read collections" ON collections FOR SELECT TO authenticated
USING (
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager')
        AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NULL
    )
    OR 
    (
        (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NOT NULL
        AND 
        (
            house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
            OR (house = '1' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Emeline''s Pen')
            OR (house = '2' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Dorcas'' Pen')
        )
    )
);

-- Sales RLS 
DROP POLICY IF EXISTS "Read sales" ON sales;
CREATE POLICY "Read sales" ON sales FOR SELECT TO authenticated
USING (
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager')
        AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NULL
    )
    OR 
    (
        (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NOT NULL
        AND 
        (
            house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
            OR (house = '1' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Emeline''s Pen')
            OR (house = '2' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Dorcas'' Pen')
        )
    )
);

-- Expenses RLS
DROP POLICY IF EXISTS "Read expenses" ON expenses;
CREATE POLICY "Read expenses" ON expenses FOR SELECT TO authenticated
USING (
    (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager')
        AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NULL
    )
    OR 
    (
        (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) IS NOT NULL
        AND 
        (
            house = (SELECT assigned_pen FROM profiles WHERE id = auth.uid())
            OR (house = '1' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Emeline''s Pen')
            OR (house = '2' AND (SELECT assigned_pen FROM profiles WHERE id = auth.uid()) = 'Dorcas'' Pen')
        )
    )
);
