-- 修正 is_admin 函數的 search_path 安全警告
-- =====================================================

-- 查看現有的 is_admin 函數
SELECT 
    routine_name,
    routine_definition,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- 修正 is_admin 函數設置正確的 search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (auth.jwt() ->> 'email')
      AND role = 'admin'
  );
$$;