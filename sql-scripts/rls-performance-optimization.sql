-- ========================================
-- RLS Performance Optimization Script
-- ========================================
-- 目的：優化 RLS 政策效能，移除重複查詢，建立效能索引
-- 執行時機：在完成所有 stage 腳本後執行
-- 注意：執行前請先備份重要資料

-- 警告訊息
DO $$
BEGIN
    RAISE NOTICE '🔧 開始 RLS 效能優化';
    RAISE NOTICE '⚠️  這將修改現有的 RLS 政策和索引';
    RAISE NOTICE '⚠️  建議在非高峰時段執行';
END $$;

-- ========================================
-- 第一部分：建立高效能的輔助函數
-- ========================================

-- 建立高效能的當前員工 ID 查詢函數
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.employees
  WHERE email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$;

-- 建立高效能的當前用戶角色查詢函數
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text
  FROM public.employees
  WHERE email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$;

-- 優化現有的 is_admin 函數
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin'
     FROM public.employees
     WHERE email = (auth.jwt() ->> 'email')
     LIMIT 1),
    false
  );
$$;

-- 建立員工所有權檢查函數
CREATE OR REPLACE FUNCTION public.is_employee_owner(employee_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT employee_uuid = public.get_current_employee_id();
$$;

RAISE NOTICE '✓ 建立高效能輔助函數完成';

-- ========================================
-- 第二部分：建立效能索引
-- ========================================

-- 為 employees 表建立複合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email_role 
ON public.employees (email, role) 
WHERE is_active = true;

-- 為 attendance_records 表建立複合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_date 
ON public.attendance_records (employee_id, record_date DESC, created_at DESC);

-- 為 attendance_records 表建立日期範圍索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_record_date 
ON public.attendance_records (record_date DESC) 
WHERE record_date >= CURRENT_DATE - INTERVAL '90 days';

-- 為 seat_coordinates 表建立查詢索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seat_coordinates_employee 
ON public.seat_coordinates (employee_id) 
WHERE employee_id IS NOT NULL;

-- 為 seats 表建立查詢索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_employee 
ON public.seats (employee_id) 
WHERE employee_id IS NOT NULL;

-- 為 pc_details 表建立查詢索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pc_details_pc_id 
ON public.pc_details (pc_id) 
WHERE pc_id IS NOT NULL;

RAISE NOTICE '✓ 建立效能索引完成';

-- ========================================
-- 第三部分：清理重複的 RLS 政策
-- ========================================

-- 移除 attendance_records 表的重複 SELECT 政策
DROP POLICY IF EXISTS "Public read access to attendance_records" ON public.attendance_records;

-- 移除其他可能重複的政策
DROP POLICY IF EXISTS "Allow public read access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public insert access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public update access to attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public delete access to attendance_records" ON public.attendance_records;

RAISE NOTICE '✓ 清理重複 RLS 政策完成';

-- ========================================
-- 第四部分：建立優化的 RLS 政策
-- ========================================

-- attendance_records 優化政策
CREATE POLICY "Optimized: Users can view their own attendance or admins can view all"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  public.is_employee_owner(employee_id) OR public.is_admin()
);

CREATE POLICY "Optimized: Users can insert their own attendance"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_employee_owner(employee_id)
);

CREATE POLICY "Optimized: Users can update their own attendance or admins can update all"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  public.is_employee_owner(employee_id) OR public.is_admin()
)
WITH CHECK (
  public.is_employee_owner(employee_id) OR public.is_admin()
);

CREATE POLICY "Optimized: Only admins can delete attendance records"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

RAISE NOTICE '✓ 建立優化的 attendance_records RLS 政策完成';

-- ========================================
-- 第五部分：優化其他表格的 RLS 政策
-- ========================================

-- 為 employees 表建立更高效的政策（替換現有的）
DROP POLICY IF EXISTS "Users can update their own profile or admins" ON public.employees;

CREATE POLICY "Optimized: Users can update their own profile or admins"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  email = (auth.jwt() ->> 'email') OR public.is_admin()
)
WITH CHECK (
  email = (auth.jwt() ->> 'email') OR public.is_admin()
);

-- 為 employees 表建立更高效的插入政策
DROP POLICY IF EXISTS "Users can insert their own profile or admins" ON public.employees;

CREATE POLICY "Optimized: Users can insert their own profile or admins"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  email = (auth.jwt() ->> 'email') OR public.is_admin()
);

RAISE NOTICE '✓ 優化其他表格 RLS 政策完成';

-- ========================================
-- 第六部分：建立效能監控查詢
-- ========================================

-- 建立效能監控函數
CREATE OR REPLACE FUNCTION public.check_rls_performance()
RETURNS TABLE (
  table_name text,
  policy_count bigint,
  index_count bigint,
  estimated_rows bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.table_name::text,
    COALESCE(p.policy_count, 0) as policy_count,
    COALESCE(i.index_count, 0) as index_count,
    COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as estimated_rows
  FROM 
    information_schema.tables t
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON t.table_name = p.tablename
  LEFT JOIN (
    SELECT tablename, COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) i ON t.table_name = i.tablename
  LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
  WHERE t.table_schema = 'public'
    AND t.table_name IN ('employees', 'attendance_records', 'seat_coordinates', 'seats', 'pcs', 'pc_details', 'equipment', 'containers', 'floor_containers')
  ORDER BY t.table_name;
$$;

RAISE NOTICE '✓ 建立效能監控函數完成';

-- ========================================
-- 第七部分：建立測試查詢
-- ========================================

-- 建立測試函數來檢查優化效果
CREATE OR REPLACE FUNCTION public.test_rls_performance()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  test_result text := '';
  duration_ms numeric;
BEGIN
  -- 測試 1: employees 查詢
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM public.employees WHERE is_active = true;
  end_time := clock_timestamp();
  duration_ms := EXTRACT(milliseconds FROM end_time - start_time);
  test_result := test_result || format('Employees query: %.2f ms' || chr(10), duration_ms);
  
  -- 測試 2: attendance_records 查詢
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM public.attendance_records WHERE record_date >= CURRENT_DATE - INTERVAL '30 days';
  end_time := clock_timestamp();
  duration_ms := EXTRACT(milliseconds FROM end_time - start_time);
  test_result := test_result || format('Attendance records query: %.2f ms' || chr(10), duration_ms);
  
  -- 測試 3: is_admin 函數
  start_time := clock_timestamp();
  PERFORM public.is_admin();
  end_time := clock_timestamp();
  duration_ms := EXTRACT(milliseconds FROM end_time - start_time);
  test_result := test_result || format('is_admin() function: %.2f ms' || chr(10), duration_ms);
  
  RETURN test_result;
END;
$$;

RAISE NOTICE '✓ 建立測試函數完成';

-- ========================================
-- 第八部分：最終檢查和統計
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS 效能優化完成檢查 ===';
    
    -- 檢查函數
    RAISE NOTICE '✓ 新建立的函數：';
    RAISE NOTICE '  - get_current_employee_id()';
    RAISE NOTICE '  - get_current_user_role()';
    RAISE NOTICE '  - is_employee_owner()';
    RAISE NOTICE '  - check_rls_performance()';
    RAISE NOTICE '  - test_rls_performance()';
    
    -- 檢查索引
    RAISE NOTICE '✓ 新建立的效能索引：';
    RAISE NOTICE '  - idx_employees_email_role';
    RAISE NOTICE '  - idx_attendance_employee_date';
    RAISE NOTICE '  - idx_attendance_record_date';
    RAISE NOTICE '  - idx_seat_coordinates_employee';
    RAISE NOTICE '  - idx_seats_employee';
    RAISE NOTICE '  - idx_pc_details_pc_id';
    
    RAISE NOTICE '✓ 優化的 RLS 政策：';
    RAISE NOTICE '  - attendance_records: 4 個優化政策';
    RAISE NOTICE '  - employees: 2 個優化政策';
    
    RAISE NOTICE '=== 效能優化建議 ===';
    RAISE NOTICE '1. 執行 SELECT public.check_rls_performance(); 來檢查表格統計';
    RAISE NOTICE '2. 執行 SELECT public.test_rls_performance(); 來測試查詢效能';
    RAISE NOTICE '3. 監控應用程式的查詢效能改善情況';
    RAISE NOTICE '4. 如有問題，可使用 rollback-rls-optimization.sql 回滾';
    
    RAISE NOTICE '=== RLS 效能優化完成 ===';
END $$;

-- 執行效能檢查
SELECT public.check_rls_performance();