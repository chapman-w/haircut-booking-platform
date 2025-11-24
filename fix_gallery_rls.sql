-- Fix RLS policies for gallery_images table
-- Make sure admins can insert, update, and delete gallery images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Only admins can manage gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Only admins can insert gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Only admins can update gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Only admins can delete gallery images" ON public.gallery_images;

-- Create new policies using direct subquery instead of function
CREATE POLICY "Everyone can view gallery images"
  ON public.gallery_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert gallery images"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update gallery images"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete gallery images"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

