-- Secure employees table: remove public access, add admin function and proper RLS

-- 1) Drop overly permissive public policies
DROP POLICY IF EXISTS "Allow public read access to employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public insert access to employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public update access to employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public delete access to employees" ON public.employees;

-- 2) Security definer helper to check admin via JWT email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (auth.jwt() ->> 'email')
      AND role = 'admin'
  );
$$;

-- 3) RLS Policies for employees
-- View own profile or admin can view all
CREATE POLICY "Users can view their own profile or admins can view all"
ON public.employees
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  OR public.is_admin()
);

-- Update own profile or admin can update all
CREATE POLICY "Users can update their own profile or admins"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  OR public.is_admin()
)
WITH CHECK (
  email = (auth.jwt() ->> 'email')
  OR public.is_admin()
);

-- Insert own profile or admin can insert anyone
CREATE POLICY "Users can insert their own profile or admins"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  email = (auth.jwt() ->> 'email')
  OR public.is_admin()
);

-- Only admins can delete employees
CREATE POLICY "Only admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (public.is_admin());