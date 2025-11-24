-- Function to grant admin role by email
-- This function can be called by admins to grant admin access to other users
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if the current user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant admin access';
  END IF;

  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'User not found with email: ' || user_email;
  END IF;

  -- Grant admin role (using ON CONFLICT to handle if already admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'Admin access granted to ' || user_email;
END;
$$;

-- Grant execute permission to authenticated users (RLS will check if they're admin)
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(TEXT) TO authenticated;

