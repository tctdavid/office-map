-- ========================================
-- 第二段：核心表格建立 (employees)
-- ========================================
-- 執行前確認：第一段已成功完成

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE EXCEPTION '錯誤：user_role 類型不存在，請先執行第一段腳本';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION '錯誤：update_updated_at_column 函數不存在，請先執行第一段腳本';
    END IF;
    
    RAISE NOTICE '前置條件檢查通過，開始建立 employees 表格';
END $$;

-- 建立員工資料表
CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    position text,
    department text,
    extension text,
    photo text,
    role user_role DEFAULT 'employee',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 建立更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_employees_updated_at'
    ) THEN
        CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ employees 更新觸發器建立成功';
    ELSE
        RAISE NOTICE 'employees 更新觸發器已存在，跳過建立';
    END IF;
END $$;

-- 啟用 RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 建立基本 RLS 政策
-- 1. 公開讀取政策（為了座位管理等功能）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Public read access for seat management'
    ) THEN
        CREATE POLICY "Public read access for seat management"
        ON employees FOR SELECT
        USING (true);
        RAISE NOTICE '✓ employees 公開讀取政策建立成功';
    ELSE
        RAISE NOTICE 'employees 公開讀取政策已存在';
    END IF;
END $$;

-- 2. 公開讀取政策（一般用途）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Public read access to employees'
    ) THEN
        CREATE POLICY "Public read access to employees"
        ON employees FOR SELECT
        USING (true);
        RAISE NOTICE '✓ employees 一般公開讀取政策建立成功';
    ELSE
        RAISE NOTICE 'employees 一般公開讀取政策已存在';
    END IF;
END $$;

-- ========================================
-- 第二段執行完成檢查
-- ========================================

-- 檢查表格建立
SELECT 
    'employees' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as table_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') 
         THEN '✓ 觸發器存在' 
         ELSE '✗ 觸發器不存在' 
    END as trigger_status;

-- 檢查 RLS 狀態
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'employees') as policy_count
FROM pg_tables 
WHERE tablename = 'employees';

-- 檢查政策
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'employees';

-- 測試插入一筆測試資料（可選）
-- INSERT INTO employees (email, password_hash, name, role) 
-- VALUES ('admin@test.com', 'test_hash', '測試管理員', 'admin');

-- ========================================
-- 如果上述檢查都正常，請繼續執行第三段
-- ========================================