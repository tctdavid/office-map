-- ========================================
-- 第五段：座位相關表格
-- ========================================
-- 執行前確認：第四段已成功完成
-- 建立：seat_coordinates, seats

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE EXCEPTION '錯誤：employees 表格不存在';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pcs') THEN
        RAISE EXCEPTION '錯誤：pcs 表格不存在';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'containers') THEN
        RAISE EXCEPTION '錯誤：containers 表格不存在';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment') THEN
        RAISE EXCEPTION '錯誤：equipment 表格不存在';
    END IF;
    RAISE NOTICE '前置條件檢查通過，開始建立座位相關表格';
END $$;

-- 1. 建立 seat_coordinates 表格
CREATE TABLE IF NOT EXISTS seat_coordinates (
    id text PRIMARY KEY NOT NULL,
    container text NOT NULL,
    container_id uuid,
    x integer NOT NULL,
    y integer NOT NULL,
    pixel_x double precision DEFAULT 0,
    pixel_y double precision DEFAULT 0,
    seat_template text NOT NULL DEFAULT 'standard',
    is_empty boolean DEFAULT true,
    employee_id uuid,
    pc_id uuid,
    equipment_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- seat_coordinates 更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_seat_coordinates_updated_at') THEN
        CREATE TRIGGER update_seat_coordinates_updated_at
            BEFORE UPDATE ON seat_coordinates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ seat_coordinates 更新觸發器建立成功';
    END IF;
END $$;

-- 2. 建立 seats 表格
CREATE TABLE IF NOT EXISTS seats (
    id text PRIMARY KEY NOT NULL,
    floor text NOT NULL,
    container_id uuid,
    x integer NOT NULL,
    y integer NOT NULL,
    pixel_x double precision DEFAULT 0,
    pixel_y double precision DEFAULT 0,
    seat_template text NOT NULL DEFAULT 'standard',
    is_empty boolean DEFAULT true,
    employee_id uuid,
    pc_id uuid
);

-- 啟用 RLS
ALTER TABLE seat_coordinates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 建立 seat_coordinates RLS 政策
CREATE POLICY "Public read access to seat_coordinates" 
ON seat_coordinates FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to seat_coordinates" 
ON seat_coordinates FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to seat_coordinates" 
ON seat_coordinates FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to seat_coordinates" 
ON seat_coordinates FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to seat_coordinates" 
ON seat_coordinates FOR DELETE 
USING (true);

-- 建立 seats RLS 政策
CREATE POLICY "Allow public read access to seats" 
ON seats FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to seats" 
ON seats FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to seats" 
ON seats FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to seats" 
ON seats FOR DELETE 
USING (true);

-- ========================================
-- 第五段執行完成檢查
-- ========================================

-- 檢查表格建立
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as status
FROM (VALUES 
    ('seat_coordinates'),
    ('seats')
) AS t(table_name);

-- 檢查觸發器
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('seat_coordinates', 'seats')
ORDER BY event_object_table;

-- 檢查 RLS 狀態和政策數量
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('seat_coordinates', 'seats');

-- 檢查所有已建立的表格總覽
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

-- ========================================
-- 如果上述檢查都正常，請繼續執行第六段
-- ========================================