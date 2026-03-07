-- Function to securely update a user's role
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the executing user is a super_admin
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Not authorized. Only super_admins can change roles.';
  END IF;
END;
$$;

-- Function to securely update a user's assigned pen
CREATE OR REPLACE FUNCTION public.update_user_pen(target_user_id UUID, new_pen TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the executing user is a super_admin
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' THEN
    UPDATE public.profiles SET assigned_pen = new_pen WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Not authorized. Only super_admins can assign pens.';
  END IF;
END;
$$;
