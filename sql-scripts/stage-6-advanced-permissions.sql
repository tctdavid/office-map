-- ========================================
-- 第六段：完整權限管理與進階 RLS 政策
-- ========================================
-- 執行前確認：第五段已成功完成
-- 建立：is_admin() 函數及完善的 RLS 政策

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE EXCEPTION '錯誤：employees 表格不存在';
    END IF;
    RAISE NOTICE '前置條件檢查通過，開始建立進階權限管理';
END $$;

-- 建立管理員檢查函數（依賴 employees 資料表）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees
        WHERE email = (auth.jwt() ->> 'email')
          AND role = 'admin'
    );
$$;

-- 為 employees 表格建立更詳細的 RLS 政策
-- 刪除可能重複的政策並重新建立

-- 1. 用戶可以新增自己的資料或管理員可以新增
DO $$
BEGIN
    -- 檢查政策是否存在，如果存在就跳過
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Users can insert their own profile or admins'
    ) THEN
        CREATE POLICY "Users can insert their own profile or admins"
        ON employees FOR INSERT
        WITH CHECK ((email = (auth.jwt() ->> 'email')) OR is_admin());
        RAISE NOTICE '✓ employees 插入政策建立成功';
    ELSE
        RAISE NOTICE 'employees 插入政策已存在';
    END IF;
END $$;

-- 2. 用戶可以更新自己的資料或管理員可以更新
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Users can update their own profile or admins'
    ) THEN
        CREATE POLICY "Users can update their own profile or admins"
        ON employees FOR UPDATE
        USING ((email = (auth.jwt() ->> 'email')) OR is_admin())
        WITH CHECK ((email = (auth.jwt() ->> 'email')) OR is_admin());
        RAISE NOTICE '✓ employees 更新政策建立成功';
    ELSE
        RAISE NOTICE 'employees 更新政策已存在';
    END IF;
END $$;

-- 3. 只有管理員可以刪除員工
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Only admins can delete employees'
    ) THEN
        CREATE POLICY "Only admins can delete employees"
        ON employees FOR DELETE
        USING (is_admin());
        RAISE NOTICE '✓ employees 刪除政策建立成功';
    ELSE
        RAISE NOTICE 'employees 刪除政策已存在';
    END IF;
END $$;

-- 驗證 is_admin 函數
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE NOTICE '✓ is_admin 函數建立成功';
    ELSE
        RAISE EXCEPTION '✗ is_admin 函數建立失敗';
    END IF;
END $$;

-- ========================================
-- 第六段執行完成檢查
-- ========================================

-- 檢查 is_admin 函數
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'is_admin';

-- 檢查 employees 表格的所有政策
SELECT 
    policyname,
    cmd as command,
    permissive,
    CASE WHEN qual IS NOT NULL THEN 'USING clause exists' ELSE 'No USING clause' END as using_clause,
    CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK exists' ELSE 'No WITH CHECK' END as with_check_clause
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY policyname;

-- 檢查所有表格的 RLS 狀態總覽
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN (
    'employees', 'containers', 'equipment', 'pcs', 
    'floor_containers', 'attendance_records', 'pc_details',
    'seat_coordinates', 'seats'
)
ORDER BY tablename;

-- 統計所有政策
SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE tablename IN (
    'employees', 'containers', 'equipment', 'pcs', 
    'floor_containers', 'attendance_records', 'pc_details',
    'seat_coordinates', 'seats'
);

-- ========================================
-- 如果上述檢查都正常，請繼續執行第七段
-- ========================================