-- ========================================
-- RLS 效能優化回滾腳本
-- ========================================
-- 目的：回滾 RLS 效能優化的所有變更
-- 執行時機：當效能優化後出現問題時使用
-- 注意：這將還原到優化前的狀態

-- 警告訊息
DO $$
BEGIN
    RAISE NOTICE '🔄 開始回滾 RLS 效能優化';
    RAISE NOTICE '⚠️  這將還原所有優化變更';
    RAISE NOTICE '⚠️  請確認需要回滾';
END $$;

-- ========================================
-- 第一部分：移除優化的 RLS 政策
-- ========================================

-- 移除 attendance_records 的優化政策
DROP POLICY IF EXISTS "Optimized: Users can view their own attendance or admins can view all" ON public.attendance_records;
DROP POLICY IF EXISTS "Optimized: Users can insert their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Optimized: Users can update their own attendance or admins can update all" ON public.attendance_records;
DROP POLICY IF EXISTS "Optimized: Only admins can delete attendance records" ON public.attendance_records;

-- 移除 employees 的優化政策
DROP POLICY IF EXISTS "Optimized: Users can update their own profile or admins" ON public.employees;
DROP POLICY IF EXISTS "Optimized: Users can insert their own profile or admins" ON public.employees;

RAISE NOTICE '✓ 移除優化的 RLS 政策完成';

-- ========================================
-- 第二部分：還原原始 RLS 政策
-- ========================================

-- 還原 attendance_records 原始政策
CREATE POLICY "Allow public delete access to attendance_records" 
ON public.attendance_records 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public insert access to attendance_records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to attendance_records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update access to attendance_records" 
ON public.attendance_records 
FOR UPDATE 
USING (true);

CREATE POLICY "Public read access to attendance_records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (
  employee_id IN (
    SELECT employees.id
    FROM employees
    WHERE employees.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Users can update their own attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (
  employee_id IN (
    SELECT employees.id
    FROM employees
    WHERE employees.email = (auth.jwt() ->> 'email'::text)
  )
);

-- 還原 employees 原始政策
CREATE POLICY "Users can insert their own profile or admins" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  (email = (auth.jwt() ->> 'email'::text)) OR is_admin()
);

CREATE POLICY "Users can update their own profile or admins" 
ON public.employees 
FOR UPDATE 
USING (
  (email = (auth.jwt() ->> 'email'::text)) OR is_admin()
)
WITH CHECK (
  (email = (auth.jwt() ->> 'email'::text)) OR is_admin()
);

RAISE NOTICE '✓ 還原原始 RLS 政策完成';

-- ========================================
-- 第三部分：移除效能索引
-- ========================================

-- 移除建立的效能索引
DROP INDEX CONCURRENTLY IF EXISTS public.idx_employees_email_role;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_attendance_employee_date;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_attendance_record_date;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_seat_coordinates_employee;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_seats_employee;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_pc_details_pc_id;

RAISE NOTICE '✓ 移除效能索引完成';

-- ========================================
-- 第四部分：移除輔助函數（保留重要函數）
-- ========================================

-- 移除優化相關的輔助函數
DROP FUNCTION IF EXISTS public.get_current_employee_id();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.is_employee_owner(uuid);
DROP FUNCTION IF EXISTS public.check_rls_performance();
DROP FUNCTION IF EXISTS public.test_rls_performance();

-- 還原原始的 is_admin 函數
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (auth.jwt() ->> 'email')
      AND role = 'admin'
  );
$$;

RAISE NOTICE '✓ 移除輔助函數並還原原始函數完成';

-- ========================================
-- 第五部分：最終檢查
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS 效能優化回滾完成檢查 ===';
    
    -- 檢查政策數量
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attendance_records' 
        AND policyname LIKE 'Optimized:%'
    ) THEN
        RAISE NOTICE '⚠️  仍有優化政策存在';
    ELSE
        RAISE NOTICE '✓ 所有優化政策已移除';
    END IF;
    
    -- 檢查索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname LIKE 'idx_%_email_role' 
        OR indexname LIKE 'idx_%_employee_date'
    ) THEN
        RAISE NOTICE '⚠️  仍有效能索引存在';
    ELSE
        RAISE NOTICE '✓ 所有效能索引已移除';
    END IF;
    
    -- 檢查函數
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('get_current_employee_id', 'get_current_user_role', 'is_employee_owner', 'check_rls_performance', 'test_rls_performance')
    ) THEN
        RAISE NOTICE '⚠️  仍有優化函數存在';
    ELSE
        RAISE NOTICE '✓ 所有優化函數已移除';
    END IF;
    
    RAISE NOTICE '=== 回滾作業完成 ===';
    RAISE NOTICE '建議重新啟動應用程式以確保變更生效';
END $$;