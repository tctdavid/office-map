-- Office Map 專案資料庫初始化腳本
-- 包含完整的資料表結構、權限設定和內建管理員帳號

-- ==============================================
-- 第一階段：基礎設定和函數
-- ==============================================

-- 建立使用者角色枚舉
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('admin', 'employee');

-- 建立更新時間戳記的觸發函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 管理員檢查函數
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE email = (auth.jwt() ->> 'email')
      AND role = 'admin'
  );
$$;

-- 取得當前使用者角色
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$;

-- 取得當前員工ID
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.employees WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
$$;

-- 檢查是否為員工擁有者
CREATE OR REPLACE FUNCTION public.is_employee_owner(employee_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT employee_uuid = public.get_current_employee_id();
$$;

-- ==============================================
-- 第二階段：建立所有資料表
-- ==============================================

-- 員工表
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    position text,
    department text,
    extension text,
    photo text,
    role user_role DEFAULT 'employee',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 考勤記錄表
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid NOT NULL,
    record_date date NOT NULL DEFAULT CURRENT_DATE,
    clock_in_time timestamp with time zone,
    clock_out_time timestamp with time zone,
    overtime_in_time timestamp with time zone,
    overtime_out_time timestamp with time zone,
    work_log text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 容器表
CREATE TABLE IF NOT EXISTS public.containers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    department text NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    width integer NOT NULL DEFAULT 200,
    height integer NOT NULL DEFAULT 150,
    min_width integer DEFAULT 200,
    min_height integer DEFAULT 150,
    max_width integer DEFAULT 800,
    max_height integer DEFAULT 600,
    color text DEFAULT '#334155',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 設備表
CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product text NOT NULL,
    sn text,
    ip text,
    mac_adds text,
    supplier text,
    contact_person text,
    purchase_date date,
    photo text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 樓層容器表
CREATE TABLE IF NOT EXISTS public.floor_containers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    floor text NOT NULL DEFAULT 'Ground Floor',
    x integer NOT NULL DEFAULT 0,
    y integer NOT NULL DEFAULT 0,
    width integer NOT NULL DEFAULT 1060,
    height integer NOT NULL DEFAULT 850,
    min_width integer DEFAULT 1060,
    min_height integer DEFAULT 850,
    max_width integer DEFAULT 1060,
    max_height integer DEFAULT 850,
    color text DEFAULT '#f8fafc',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 電腦表
CREATE TABLE IF NOT EXISTS public.pcs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    cpu text,
    memory text,
    storage text,
    graphics text,
    case_photo text,
    monitor_a text,
    monitor_a_photo text,
    monitor_b text,
    monitor_b_photo text,
    created_at timestamp with time zone DEFAULT now()
);

-- 電腦詳細資訊表
CREATE TABLE IF NOT EXISTS public.pc_details (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pc_id uuid,
    brand text,
    serial_number text,
    mac_add text,
    pc_case text,
    main_board text,
    cpu_fan text,
    psu text,
    os text,
    purchase_date date,
    warranty_expiry date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 座位座標表
CREATE TABLE IF NOT EXISTS public.seat_coordinates (
    id text NOT NULL PRIMARY KEY,
    container text NOT NULL,
    container_id uuid,
    x integer NOT NULL,
    y integer NOT NULL,
    pixel_x double precision DEFAULT 0,
    pixel_y double precision DEFAULT 0,
    seat_template text NOT NULL DEFAULT 'standard',
    employee_id uuid,
    pc_id uuid,
    equipment_id uuid,
    is_empty boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 座位表
CREATE TABLE IF NOT EXISTS public.seats (
    id text NOT NULL PRIMARY KEY,
    floor text NOT NULL,
    container_id uuid,
    x integer NOT NULL,
    y integer NOT NULL,
    pixel_x double precision DEFAULT 0,
    pixel_y double precision DEFAULT 0,
    seat_template text NOT NULL DEFAULT 'standard',
    employee_id uuid,
    pc_id uuid,
    is_empty boolean DEFAULT true
);

-- ==============================================
-- 第三階段：建立觸發器
-- ==============================================

-- 員工表觸發器
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 考勤記錄表觸發器
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 容器表觸發器
DROP TRIGGER IF EXISTS update_containers_updated_at ON public.containers;
CREATE TRIGGER update_containers_updated_at
    BEFORE UPDATE ON public.containers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 設備表觸發器
DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 樓層容器表觸發器
DROP TRIGGER IF EXISTS update_floor_containers_updated_at ON public.floor_containers;
CREATE TRIGGER update_floor_containers_updated_at
    BEFORE UPDATE ON public.floor_containers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 座位座標表觸發器
DROP TRIGGER IF EXISTS update_seat_coordinates_updated_at ON public.seat_coordinates;
CREATE TRIGGER update_seat_coordinates_updated_at
    BEFORE UPDATE ON public.seat_coordinates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 第四階段：啟用 RLS 和設定權限策略
-- ==============================================

-- 啟用所有表的 RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_coordinates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- 員工表權限策略
DROP POLICY IF EXISTS "Public read access to employees" ON public.employees;
CREATE POLICY "Public read access to employees" ON public.employees
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile or admins" ON public.employees;
CREATE POLICY "Users can insert their own profile or admins" ON public.employees
    FOR INSERT WITH CHECK ((email = (auth.jwt() ->> 'email')) OR is_admin());

DROP POLICY IF EXISTS "Users can update their own profile or admins" ON public.employees;
CREATE POLICY "Users can update their own profile or admins" ON public.employees
    FOR UPDATE USING ((email = (auth.jwt() ->> 'email')) OR is_admin())
    WITH CHECK ((email = (auth.jwt() ->> 'email')) OR is_admin());

DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;
CREATE POLICY "Only admins can delete employees" ON public.employees
    FOR DELETE USING (is_admin());

-- 考勤記錄表權限策略
DROP POLICY IF EXISTS "Optimized read access for attendance_records" ON public.attendance_records;
CREATE POLICY "Optimized read access for attendance_records" ON public.attendance_records
    FOR SELECT USING ((get_current_user_role() = 'admin') OR (employee_id = get_current_employee_id()));

DROP POLICY IF EXISTS "Optimized insert access for attendance_records" ON public.attendance_records;
CREATE POLICY "Optimized insert access for attendance_records" ON public.attendance_records
    FOR INSERT WITH CHECK ((get_current_user_role() = 'admin') OR (employee_id = get_current_employee_id()));

DROP POLICY IF EXISTS "Optimized update access for attendance_records" ON public.attendance_records;
CREATE POLICY "Optimized update access for attendance_records" ON public.attendance_records
    FOR UPDATE USING ((get_current_user_role() = 'admin') OR (employee_id = get_current_employee_id()))
    WITH CHECK ((get_current_user_role() = 'admin') OR (employee_id = get_current_employee_id()));

DROP POLICY IF EXISTS "Optimized delete access for attendance_records" ON public.attendance_records;
CREATE POLICY "Optimized delete access for attendance_records" ON public.attendance_records
    FOR DELETE USING (get_current_user_role() = 'admin');

-- 其他表的公開存取策略
-- 容器表
DROP POLICY IF EXISTS "Public read access to containers" ON public.containers;
CREATE POLICY "Public read access to containers" ON public.containers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to containers" ON public.containers;
CREATE POLICY "Allow public insert access to containers" ON public.containers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to containers" ON public.containers;
CREATE POLICY "Allow public update access to containers" ON public.containers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to containers" ON public.containers;
CREATE POLICY "Allow public delete access to containers" ON public.containers FOR DELETE USING (true);

-- 設備表
DROP POLICY IF EXISTS "Public read access to equipment" ON public.equipment;
CREATE POLICY "Public read access to equipment" ON public.equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to equipment" ON public.equipment;
CREATE POLICY "Allow public insert access to equipment" ON public.equipment FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to equipment" ON public.equipment;
CREATE POLICY "Allow public update access to equipment" ON public.equipment FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to equipment" ON public.equipment;
CREATE POLICY "Allow public delete access to equipment" ON public.equipment FOR DELETE USING (true);

-- 樓層容器表
DROP POLICY IF EXISTS "Public read access to floor_containers" ON public.floor_containers;
CREATE POLICY "Public read access to floor_containers" ON public.floor_containers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write access to floor_containers" ON public.floor_containers;
CREATE POLICY "Allow public write access to floor_containers" ON public.floor_containers FOR ALL USING (true);

-- 電腦表
DROP POLICY IF EXISTS "Public read access to pcs" ON public.pcs;
CREATE POLICY "Public read access to pcs" ON public.pcs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to pcs" ON public.pcs;
CREATE POLICY "Allow public insert access to pcs" ON public.pcs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to pcs" ON public.pcs;
CREATE POLICY "Allow public update access to pcs" ON public.pcs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to pcs" ON public.pcs;
CREATE POLICY "Allow public delete access to pcs" ON public.pcs FOR DELETE USING (true);

-- 電腦詳細資訊表
DROP POLICY IF EXISTS "Allow public read access to pc_details" ON public.pc_details;
CREATE POLICY "Allow public read access to pc_details" ON public.pc_details FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to pc_details" ON public.pc_details;
CREATE POLICY "Allow public insert access to pc_details" ON public.pc_details FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to pc_details" ON public.pc_details;
CREATE POLICY "Allow public update access to pc_details" ON public.pc_details FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to pc_details" ON public.pc_details;
CREATE POLICY "Allow public delete access to pc_details" ON public.pc_details FOR DELETE USING (true);

-- 座位座標表
DROP POLICY IF EXISTS "Allow public read access to seat_coordinates" ON public.seat_coordinates;
CREATE POLICY "Allow public read access to seat_coordinates" ON public.seat_coordinates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to seat_coordinates" ON public.seat_coordinates;
CREATE POLICY "Allow public insert access to seat_coordinates" ON public.seat_coordinates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to seat_coordinates" ON public.seat_coordinates;
CREATE POLICY "Allow public update access to seat_coordinates" ON public.seat_coordinates FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to seat_coordinates" ON public.seat_coordinates;
CREATE POLICY "Allow public delete access to seat_coordinates" ON public.seat_coordinates FOR DELETE USING (true);

-- 座位表
DROP POLICY IF EXISTS "Allow public read access to seats" ON public.seats;
CREATE POLICY "Allow public read access to seats" ON public.seats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to seats" ON public.seats;
CREATE POLICY "Allow public insert access to seats" ON public.seats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to seats" ON public.seats;
CREATE POLICY "Allow public update access to seats" ON public.seats FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete access to seats" ON public.seats;
CREATE POLICY "Allow public delete access to seats" ON public.seats FOR DELETE USING (true);

-- ==============================================
-- 第五階段：建立索引
-- ==============================================

-- 員工表索引
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees (department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees (role);

-- 考勤記錄表索引
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON public.attendance_records (employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records (record_date);

-- 座位相關表索引
CREATE INDEX IF NOT EXISTS idx_seat_coordinates_employee_id ON public.seat_coordinates (employee_id);
CREATE INDEX IF NOT EXISTS idx_seat_coordinates_pc_id ON public.seat_coordinates (pc_id);
CREATE INDEX IF NOT EXISTS idx_seats_employee_id ON public.seats (employee_id);
CREATE INDEX IF NOT EXISTS idx_seats_pc_id ON public.seats (pc_id);

-- ==============================================
-- 第六階段：建立內建管理員帳號
-- ==============================================

-- 插入管理員員工記錄
INSERT INTO public.employees (id, email, name, position, department, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin@gmail.com',
    '系統管理員',
    '系統管理員',
    'IT',
    'admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- ==============================================
-- 第七階段：建立儲存桶和儲存權限
-- ==============================================

-- 建立儲存桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('staff', 'staff', true, 10485760, '{"image/*"}'),
    ('equipment', 'equipment', true, 10485760, '{"image/*"}'),
    ('pcs', 'pcs', true, 10485760, '{"image/*"}')
ON CONFLICT (id) DO NOTHING;

-- 儲存權限策略
-- 員工照片儲存桶策略
DROP POLICY IF EXISTS "Public read access for staff bucket" ON storage.objects;
CREATE POLICY "Public read access for staff bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'staff');

DROP POLICY IF EXISTS "Authenticated users can upload staff photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload staff photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'staff' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update staff photos" ON storage.objects;
CREATE POLICY "Authenticated users can update staff photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'staff' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete staff photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete staff photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'staff' AND auth.role() = 'authenticated');

-- 設備照片儲存桶策略
DROP POLICY IF EXISTS "Public read access for equipment bucket" ON storage.objects;
CREATE POLICY "Public read access for equipment bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'equipment');

DROP POLICY IF EXISTS "Authenticated users can upload equipment photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload equipment photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'equipment' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update equipment photos" ON storage.objects;
CREATE POLICY "Authenticated users can update equipment photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'equipment' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete equipment photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete equipment photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'equipment' AND auth.role() = 'authenticated');

-- 電腦照片儲存桶策略
DROP POLICY IF EXISTS "Public read access for pcs bucket" ON storage.objects;
CREATE POLICY "Public read access for pcs bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'pcs');

DROP POLICY IF EXISTS "Authenticated users can upload pc photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload pc photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pcs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update pc photos" ON storage.objects;
CREATE POLICY "Authenticated users can update pc photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'pcs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete pc photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete pc photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'pcs' AND auth.role() = 'authenticated');

-- ==============================================
-- 完成訊息
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Office Map 資料庫初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 資料表結構已建立';
    RAISE NOTICE '✅ RLS 權限策略已設定';
    RAISE NOTICE '✅ 儲存桶和權限已建立';
    RAISE NOTICE '✅ 內建管理員帳號已建立';
    RAISE NOTICE '';
    RAISE NOTICE '管理員帳號資訊：';
    RAISE NOTICE '  Email: admin@gmail.com';
    RAISE NOTICE '  密碼: admin123';
    RAISE NOTICE '';
    RAISE NOTICE 'Supabase Studio: http://192.168.52.112:3000';
    RAISE NOTICE 'API Gateway: http://192.168.52.112:8000';
    RAISE NOTICE '========================================';
END $$;