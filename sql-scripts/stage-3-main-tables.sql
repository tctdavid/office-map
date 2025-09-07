-- ========================================
-- 第三段：主要業務表格
-- ========================================
-- 執行前確認：第二段已成功完成
-- 建立：containers, equipment, pcs, floor_containers

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE EXCEPTION '錯誤：employees 表格不存在，請先執行第二段腳本';
    END IF;
    RAISE NOTICE '前置條件檢查通過，開始建立主要業務表格';
END $$;

-- 1. 建立 containers 表格
CREATE TABLE IF NOT EXISTS containers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    department text NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    width integer NOT NULL DEFAULT 200,
    height integer NOT NULL DEFAULT 150,
    min_width integer DEFAULT 200,
    max_width integer DEFAULT 800,
    min_height integer DEFAULT 150,
    max_height integer DEFAULT 600,
    color text DEFAULT '#334155',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- containers 更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_containers_updated_at') THEN
        CREATE TRIGGER update_containers_updated_at
            BEFORE UPDATE ON containers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ containers 更新觸發器建立成功';
    END IF;
END $$;

-- 2. 建立 equipment 表格
CREATE TABLE IF NOT EXISTS equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product text NOT NULL,
    sn text,
    supplier text,
    purchase_date date,
    ip text,
    mac_adds text,
    contact_person text,
    notes text,
    photo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- equipment 更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_equipment_updated_at') THEN
        CREATE TRIGGER update_equipment_updated_at
            BEFORE UPDATE ON equipment
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ equipment 更新觸發器建立成功';
    END IF;
END $$;

-- 3. 建立 pcs 表格
CREATE TABLE IF NOT EXISTS pcs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    cpu text,
    memory text,
    storage text,
    graphics text,
    monitor_a text,
    monitor_a_photo text,
    monitor_b text,
    monitor_b_photo text,
    case_photo text,
    created_at timestamptz DEFAULT now()
);

-- 4. 建立 floor_containers 表格
CREATE TABLE IF NOT EXISTS floor_containers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    floor text NOT NULL DEFAULT 'Ground Floor',
    x integer NOT NULL DEFAULT 0,
    y integer NOT NULL DEFAULT 0,
    width integer NOT NULL DEFAULT 1060,
    height integer NOT NULL DEFAULT 850,
    min_width integer DEFAULT 1060,
    max_width integer DEFAULT 1060,
    min_height integer DEFAULT 850,
    max_height integer DEFAULT 850,
    color text DEFAULT '#f8fafc',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- floor_containers 更新觸發器
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_floor_containers_updated_at') THEN
        CREATE TRIGGER update_floor_containers_updated_at
            BEFORE UPDATE ON floor_containers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ floor_containers 更新觸發器建立成功';
    END IF;
END $$;

-- 啟用所有表格的 RLS
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_containers ENABLE ROW LEVEL SECURITY;

-- 建立基本的公開訪問政策
-- containers 政策
CREATE POLICY "Public read access to containers" ON containers FOR SELECT USING (true);
CREATE POLICY "Allow public update access to containers" ON containers FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to containers" ON containers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to containers" ON containers FOR DELETE USING (true);

-- equipment 政策
CREATE POLICY "Public read access to equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Allow public update access to equipment" ON equipment FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to equipment" ON equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to equipment" ON equipment FOR DELETE USING (true);

-- pcs 政策
CREATE POLICY "Public read access to pcs" ON pcs FOR SELECT USING (true);
CREATE POLICY "Allow public update access to pcs" ON pcs FOR UPDATE USING (true);
CREATE POLICY "Allow public insert access to pcs" ON pcs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to pcs" ON pcs FOR DELETE USING (true);

-- floor_containers 政策
CREATE POLICY "Public read access to floor_containers" ON floor_containers FOR SELECT USING (true);
CREATE POLICY "Allow public write access to floor_containers" ON floor_containers FOR ALL USING (true);

-- ========================================
-- 第三段執行完成檢查
-- ========================================

-- 檢查所有表格
SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as status
FROM (VALUES 
    ('containers'),
    ('equipment'), 
    ('pcs'),
    ('floor_containers')
) AS t(table_name);

-- 檢查觸發器
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- 檢查 RLS 狀態
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('containers', 'equipment', 'pcs', 'floor_containers');

-- ========================================
-- 如果上述檢查都正常，請繼續執行第四段
-- ========================================