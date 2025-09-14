-- 修正函數安全警告 - 設置正確的 search_path
-- =====================================================

-- 修正 get_current_employee_id 函數
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$;

-- 修正 get_current_user_role 函數  
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT role::text FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$;

-- 修正 is_employee_owner 函數
CREATE OR REPLACE FUNCTION public.is_employee_owner(employee_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT employee_uuid = public.get_current_employee_id();
$$;

-- 修正 check_rls_performance 函數
CREATE OR REPLACE FUNCTION public.check_rls_performance()
RETURNS TABLE (
  table_name TEXT,
  policy_count BIGINT,
  index_count BIGINT,
  estimated_rows BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COALESCE(p.policy_count, 0) as policy_count,
    COALESCE(i.index_count, 0) as index_count,
    COALESCE(s.n_tup_ins + s.n_tup_upd, 0) as estimated_rows
  FROM information_schema.tables t
  LEFT JOIN (
    SELECT schemaname||'.'||tablename as full_name, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    GROUP BY schemaname, tablename
  ) p ON p.full_name = 'public.'||t.table_name
  LEFT JOIN (
    SELECT schemaname||'.'||tablename as full_name, COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    GROUP BY schemaname, tablename
  ) i ON i.full_name = 'public.'||t.table_name
  LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_name IN ('attendance_records', 'employees', 'seats', 'pcs')
  ORDER BY t.table_name;
END;
$$;

-- 驗證函數設定
SELECT 
    routine_name as function_name,
    security_type as security_definer,
    routine_definition as definition_preview
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_current_employee_id',
    'get_current_user_role', 
    'is_employee_owner',
    'check_rls_performance'
  )
ORDER BY routine_name;