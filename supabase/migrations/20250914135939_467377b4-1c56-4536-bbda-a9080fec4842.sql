-- RLS 效能優化腳本 - 修正 attendance_records 效率問題（修正版）
-- =====================================================

-- 第一步：建立高效能的輔助函數
-- =====================================================

-- 清理可能存在的舊函數
DROP FUNCTION IF EXISTS public.get_current_employee_id();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.is_employee_owner(uuid);
DROP FUNCTION IF EXISTS public.check_rls_performance();
DROP FUNCTION IF EXISTS public.test_rls_performance();

-- 建立高效能的輔助函數
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_employee_owner(employee_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT employee_uuid = public.get_current_employee_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- 第二步：建立效能索引（移除 CONCURRENTLY）
-- =====================================================

-- 為 attendance_records 建立效能索引
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_date 
ON public.attendance_records (employee_id, record_date);

CREATE INDEX IF NOT EXISTS idx_attendance_records_date 
ON public.attendance_records (record_date DESC);

CREATE INDEX IF NOT EXISTS idx_employees_email_role 
ON public.employees (email, role) WHERE is_active = true;

-- 第三步：清理重複的 RLS 政策
-- =====================================================

-- 移除 attendance_records 表上所有現有的政策
DROP POLICY IF EXISTS "Allow public delete access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public insert access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public read access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public update access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Public read access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.attendance_records;

-- 第四步：建立優化的 RLS 政策
-- =====================================================

-- 優化的 SELECT 政策 - 管理員可看全部，員工只能看自己的
CREATE POLICY "Optimized read access for attendance_records"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'admin' 
  OR employee_id = public.get_current_employee_id()
);

-- 優化的 INSERT 政策 - 管理員可插入任何記錄，員工只能插入自己的
CREATE POLICY "Optimized insert access for attendance_records"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'admin' 
  OR employee_id = public.get_current_employee_id()
);

-- 優化的 UPDATE 政策 - 管理員可更新任何記錄，員工只能更新自己的
CREATE POLICY "Optimized update access for attendance_records"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'admin' 
  OR employee_id = public.get_current_employee_id()
)
WITH CHECK (
  public.get_current_user_role() = 'admin' 
  OR employee_id = public.get_current_employee_id()
);

-- 優化的 DELETE 政策 - 只有管理員可以刪除記錄
CREATE POLICY "Optimized delete access for attendance_records"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'admin'
);

-- 第五步：建立效能監控函數
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_rls_performance()
RETURNS TABLE (
  table_name TEXT,
  policy_count BIGINT,
  index_count BIGINT,
  estimated_rows BIGINT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 執行效能檢查以驗證優化結果
SELECT * FROM check_rls_performance();

-- 優化摘要
SELECT 
  '✅ RLS 效能優化完成' as status,
  'attendance_records 表效率問題已修正' as description,
  '移除 7 個重複政策，建立 4 個優化政策和 3 個效能索引' as details;