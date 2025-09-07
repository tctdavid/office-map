-- ========================================
-- 第四段：關聯表格
-- ========================================
-- 執行前確認：第三段已成功完成
-- 建立：attendance_records, pc_details

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE EXCEPTION '錯誤：employees 表格不存在';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pcs') THEN
        RAISE EXCEPTION '錯誤：pcs 表格不存在';
    END IF;
    RAISE NOTICE '前置條件檢查通過，開始建立關聯表格';
END $$;

-- 1. 建立 attendance_records 表格
CREATE TABLE IF NOT EXISTS attendance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL,
    record_date date NOT NULL DEFAULT CURRENT_DATE,
    clock_in_time timestamptz,
    clock_out_time timestamptz,
    overtime_in_time timestamptz,
    overtime_out_time timestamptz,
    work_log text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- attendance_records 更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_records_updated_at') THEN
        CREATE TRIGGER update_attendance_records_updated_at
            BEFORE UPDATE ON attendance_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ attendance_records 更新觸發器建立成功';
    END IF;
END $$;

-- 2. 建立 pc_details 表格
CREATE TABLE IF NOT EXISTS pc_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id uuid,
    brand text,
    serial_number text,
    purchase_date date,
    warranty_expiry date,
    main_board text,
    cpu_fan text,
    psu text,
    case text,
    os text,
    mac_add text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_details ENABLE ROW LEVEL SECURITY;

-- 建立 attendance_records RLS 政策
-- 公開讀取政策
CREATE POLICY "Public read access to attendance_records" 
ON attendance_records FOR SELECT 
USING (true);

-- 允許公開訪問政策（多個政策以支援不同操作）
CREATE POLICY "Allow public read access to attendance_records" 
ON attendance_records FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to attendance_records" 
ON attendance_records FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to attendance_records" 
ON attendance_records FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to attendance_records" 
ON attendance_records FOR DELETE 
USING (true);

-- 用戶特定政策（當有認證時使用）
CREATE POLICY "Users can insert their own attendance records" 
ON attendance_records FOR INSERT 
WITH CHECK (employee_id IN (
    SELECT employees.id FROM employees 
    WHERE employees.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Users can update their own attendance records" 
ON attendance_records FOR UPDATE 
USING (employee_id IN (
    SELECT employees.id FROM employees 
    WHERE employees.email = (auth.jwt() ->> 'email')
));

-- 建立 pc_details RLS 政策
CREATE POLICY "Allow public read access to pc_details" 
ON pc_details FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to pc_details" 
ON pc_details FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to pc_details" 
ON pc_details FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to pc_details" 
ON pc_details FOR DELETE 
USING (true);

-- ========================================
-- 第四段執行完成檢查
-- ========================================

-- 檢查表格建立
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as status
FROM (VALUES 
    ('attendance_records'),
    ('pc_details')
) AS t(table_name);

-- 檢查觸發器
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('attendance_records', 'pc_details')
ORDER BY event_object_table;

-- 檢查 RLS 狀態和政策數量
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('attendance_records', 'pc_details');

-- 列出所有政策
SELECT 
    tablename,
    policyname,
    cmd as command,
    permissive
FROM pg_policies 
WHERE tablename IN ('attendance_records', 'pc_details')
ORDER BY tablename, policyname;

-- ========================================
-- 如果上述檢查都正常，請繼續執行第五段
-- ========================================