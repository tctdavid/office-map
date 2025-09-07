-- =====================================================
-- 自託管資料庫完整設置腳本 (修正版)
-- =====================================================

-- 第一部分：基礎設置和安全函數
-- =====================================================

-- 1. 建立 user_role 枚舉類型 (如果不存在)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'employee');
    END IF;
END $$;

-- 2. 建立安全的更新時間戳函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 3. 建立管理員檢查函數（修正安全設置）
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

-- 4. 建立為現有員工建立認證帳號的函數（修正安全設置）
CREATE OR REPLACE FUNCTION public.create_auth_for_existing_employees()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    emp_record RECORD;
    result_count INTEGER := 0;
    error_count INTEGER := 0;
    error_details TEXT := '';
    result_text TEXT;
    new_user_id UUID;
BEGIN
    -- 檢查是否可以存取 auth schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        RETURN '錯誤：無法存取 auth schema';
    END IF;
    
    -- 處理尚未建立認證帳號的員工
    FOR emp_record IN 
        SELECT e.email, e.name 
        FROM public.employees e
        WHERE e.email NOT IN (
            SELECT au.email 
            FROM auth.users au 
            WHERE au.email IS NOT NULL
        )
        AND e.is_active = true
        LIMIT 10  -- 限制數量避免超時
    LOOP
        BEGIN
            -- 產生新的 UUID
            new_user_id := gen_random_uuid();
            
            -- 建立使用者帳號
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                emp_record.email,
                crypt('temp123456', gen_salt('bf')),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('name', emp_record.name, 'email', emp_record.email),
                now(),
                now(),
                '',
                ''
            );
            
            result_count := result_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_details := error_details || format('員工 %s: %s; ', emp_record.email, SQLERRM);
        END;
    END LOOP;
    
    IF error_count > 0 THEN
        result_text := format('成功建立 %s 個 Auth 帳號。發生 %s 個錯誤：%s', result_count, error_count, error_details);
    ELSE
        result_text := format('成功建立 %s 個 Auth 帳號。', result_count);
    END IF;
    
    RETURN result_text;
END;
$$;

-- =====================================================
-- 第二部分：資料表建立 (僅建立不存在的表格)
-- =====================================================

-- 注意：employees 表格已存在，跳過建立

-- 1. 建立出勤記錄表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in_time TIMESTAMPTZ,
    clock_out_time TIMESTAMPTZ,
    overtime_in_time TIMESTAMPTZ,
    overtime_out_time TIMESTAMPTZ,
    work_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 建立容器表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL DEFAULT 200,
    height INTEGER NOT NULL DEFAULT 150,
    department TEXT NOT NULL,
    color TEXT DEFAULT '#334155',
    min_width INTEGER DEFAULT 200,
    min_height INTEGER DEFAULT 150,
    max_width INTEGER DEFAULT 800,
    max_height INTEGER DEFAULT 600,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 建立設備表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product TEXT NOT NULL,
    sn TEXT,
    ip TEXT,
    mac_adds TEXT,
    supplier TEXT,
    purchase_date DATE,
    photo TEXT,
    notes TEXT,
    contact_person TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 建立樓層容器表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.floor_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    floor TEXT NOT NULL DEFAULT 'Ground Floor',
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 1060,
    height INTEGER NOT NULL DEFAULT 850,
    color TEXT DEFAULT '#f8fafc',
    min_width INTEGER DEFAULT 1060,
    min_height INTEGER DEFAULT 850,
    max_width INTEGER DEFAULT 1060,
    max_height INTEGER DEFAULT 850,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 建立電腦表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.pcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpu TEXT,
    memory TEXT,
    storage TEXT,
    graphics TEXT,
    monitor_a TEXT,
    monitor_a_photo TEXT,
    monitor_b TEXT,
    monitor_b_photo TEXT,
    case_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 建立電腦詳細資料表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.pc_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id UUID,
    brand TEXT,
    serial_number TEXT,
    mac_add TEXT,
    os TEXT,
    main_board TEXT,
    cpu_fan TEXT,
    psu TEXT,
    case TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 建立座位坐標表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.seat_coordinates (
    id TEXT PRIMARY KEY,
    container TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    pixel_x DOUBLE PRECISION DEFAULT 0,
    pixel_y DOUBLE PRECISION DEFAULT 0,
    is_empty BOOLEAN DEFAULT true,
    seat_template TEXT NOT NULL DEFAULT 'standard',
    employee_id UUID,
    pc_id UUID,
    equipment_id UUID,
    container_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 建立座位表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.seats (
    id TEXT PRIMARY KEY,
    floor TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    pixel_x DOUBLE PRECISION DEFAULT 0,
    pixel_y DOUBLE PRECISION DEFAULT 0,
    is_empty BOOLEAN DEFAULT true,
    seat_template TEXT NOT NULL DEFAULT 'standard',
    employee_id UUID,
    pc_id UUID,
    container_id UUID
);

-- =====================================================
-- 第三部分：觸發器設置
-- =====================================================

-- 為所有具有 updated_at 欄位的表格建立觸發器
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY['attendance_records', 'containers', 'equipment', 'floor_containers', 'seat_coordinates'];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- 檢查觸發器是否已存在
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'update_' || table_name || '_updated_at'
            AND event_object_table = table_name
        ) THEN
            EXECUTE format('
                CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column()
            ', table_name, table_name);
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 第四部分：啟用 RLS 並設置安全政策
-- =====================================================

-- 為所有表格啟用 RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_coordinates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- 員工表的 RLS 政策
DROP POLICY IF EXISTS "Public read access to employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own profile or admins" ON public.employees;
DROP POLICY IF EXISTS "Users can insert their own profile or admins" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;

CREATE POLICY "Public read access to employees" 
ON public.employees FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile or admins" 
ON public.employees FOR UPDATE 
USING ((email = (auth.jwt() ->> 'email')) OR public.is_admin())
WITH CHECK ((email = (auth.jwt() ->> 'email')) OR public.is_admin());

CREATE POLICY "Users can insert their own profile or admins" 
ON public.employees FOR INSERT 
WITH CHECK ((email = (auth.jwt() ->> 'email')) OR public.is_admin());

CREATE POLICY "Only admins can delete employees" 
ON public.employees FOR DELETE 
USING (public.is_admin());

-- 出勤記錄表的 RLS 政策
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Public read access to attendance_records" ON public.attendance_records;

CREATE POLICY "Public read access to attendance_records" 
ON public.attendance_records FOR SELECT USING (true);

CREATE POLICY "Users can insert their own attendance records" 
ON public.attendance_records FOR INSERT 
WITH CHECK (employee_id IN (
    SELECT id FROM public.employees 
    WHERE email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Users can update their own attendance records" 
ON public.attendance_records FOR UPDATE 
USING (employee_id IN (
    SELECT id FROM public.employees 
    WHERE email = (auth.jwt() ->> 'email')
));

-- 其他表格的基本 RLS 政策（可根據需求調整）
CREATE POLICY "Public access to containers" ON public.containers FOR ALL USING (true);
CREATE POLICY "Public access to equipment" ON public.equipment FOR ALL USING (true);
CREATE POLICY "Public access to floor_containers" ON public.floor_containers FOR ALL USING (true);
CREATE POLICY "Public access to pcs" ON public.pcs FOR ALL USING (true);
CREATE POLICY "Public access to pc_details" ON public.pc_details FOR ALL USING (true);
CREATE POLICY "Public access to seat_coordinates" ON public.seat_coordinates FOR ALL USING (true);
CREATE POLICY "Public access to seats" ON public.seats FOR ALL USING (true);

-- =====================================================
-- 第五部分：建立索引以提升效能
-- =====================================================

-- 員工表索引
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

-- 出勤記錄表索引
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, record_date);
CREATE INDEX IF NOT EXISTS idx_attendance_record_date ON public.attendance_records(record_date);

-- 座位相關索引
CREATE INDEX IF NOT EXISTS idx_seat_coordinates_container ON public.seat_coordinates(container_id);
CREATE INDEX IF NOT EXISTS idx_seat_coordinates_employee ON public.seat_coordinates(employee_id);
CREATE INDEX IF NOT EXISTS idx_seats_floor ON public.seats(floor);
CREATE INDEX IF NOT EXISTS idx_seats_employee ON public.seats(employee_id);

-- =====================================================
-- 完成設置
-- =====================================================

-- 執行完成提示
DO $$
BEGIN
    RAISE NOTICE '資料庫設置完成！';
    RAISE NOTICE '- 所有表格已建立或確認存在';
    RAISE NOTICE '- RLS 已啟用並設置安全政策';
    RAISE NOTICE '- 觸發器已建立用於自動更新時間戳';
    RAISE NOTICE '- 索引已建立以提升查詢效能';
    RAISE NOTICE '- 安全函數已修正 search_path 設置';
END $$;