-- ========================================
-- 第七段：進階功能與索引
-- ========================================
-- 執行前確認：第六段已成功完成
-- 建立：create_auth_for_existing_employees() 函數、效能索引、最終驗證

-- 檢查前置條件
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE EXCEPTION '錯誤：is_admin 函數不存在，請先執行第六段腳本';
    END IF;
    RAISE NOTICE '前置條件檢查通過，開始建立進階功能';
END $$;

-- 建立為現有員工建立認證帳號的函數
CREATE OR REPLACE FUNCTION create_auth_for_existing_employees()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    -- 迴圈處理尚未有認證帳號的員工
    FOR emp_record IN 
        SELECT e.email, e.name 
        FROM public.employees e
        WHERE e.email NOT IN (
            SELECT au.email 
            FROM auth.users au 
            WHERE au.email IS NOT NULL
        )
        AND e.is_active = true
        LIMIT 10  -- 限制數量以避免逾時
    LOOP
        BEGIN
            -- 產生新的 UUID
            new_user_id := gen_random_uuid();
            
            -- 使用管理員 API 建立用戶（簡化方式）
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

-- 建立效能索引
-- employees 表格索引
DO $$
BEGIN
    -- 員工 email 索引（通常已存在因為是 UNIQUE）
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_email') THEN
        CREATE INDEX idx_employees_email ON employees(email);
        RAISE NOTICE '✓ employees email 索引建立成功';
    ELSE
        RAISE NOTICE 'employees email 索引已存在';
    END IF;
    
    -- 員工角色索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_role') THEN
        CREATE INDEX idx_employees_role ON employees(role);
        RAISE NOTICE '✓ employees role 索引建立成功';
    ELSE
        RAISE NOTICE 'employees role 索引已存在';
    END IF;
    
    -- 員工是否啟用索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_is_active') THEN
        CREATE INDEX idx_employees_is_active ON employees(is_active);
        RAISE NOTICE '✓ employees is_active 索引建立成功';
    ELSE
        RAISE NOTICE 'employees is_active 索引已存在';
    END IF;
END $$;

-- attendance_records 表格索引
DO $$
BEGIN
    -- 員工 ID 索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_records_employee_id') THEN
        CREATE INDEX idx_attendance_records_employee_id ON attendance_records(employee_id);
        RAISE NOTICE '✓ attendance_records employee_id 索引建立成功';
    ELSE
        RAISE NOTICE 'attendance_records employee_id 索引已存在';
    END IF;
    
    -- 記錄日期索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_records_record_date') THEN
        CREATE INDEX idx_attendance_records_record_date ON attendance_records(record_date);
        RAISE NOTICE '✓ attendance_records record_date 索引建立成功';
    ELSE
        RAISE NOTICE 'attendance_records record_date 索引已存在';
    END IF;
    
    -- 員工和日期複合索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_records_employee_date') THEN
        CREATE INDEX idx_attendance_records_employee_date ON attendance_records(employee_id, record_date);
        RAISE NOTICE '✓ attendance_records 複合索引建立成功';
    ELSE
        RAISE NOTICE 'attendance_records 複合索引已存在';
    END IF;
END $$;

-- seat_coordinates 表格索引
DO $$
BEGIN
    -- 容器索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seat_coordinates_container') THEN
        CREATE INDEX idx_seat_coordinates_container ON seat_coordinates(container);
        RAISE NOTICE '✓ seat_coordinates container 索引建立成功';
    ELSE
        RAISE NOTICE 'seat_coordinates container 索引已存在';
    END IF;
    
    -- 員工 ID 索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seat_coordinates_employee_id') THEN
        CREATE INDEX idx_seat_coordinates_employee_id ON seat_coordinates(employee_id);
        RAISE NOTICE '✓ seat_coordinates employee_id 索引建立成功';
    ELSE
        RAISE NOTICE 'seat_coordinates employee_id 索引已存在';
    END IF;
END $$;

-- seats 表格索引
DO $$
BEGIN
    -- 樓層索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seats_floor') THEN
        CREATE INDEX idx_seats_floor ON seats(floor);
        RAISE NOTICE '✓ seats floor 索引建立成功';
    ELSE
        RAISE NOTICE 'seats floor 索引已存在';
    END IF;
    
    -- 員工 ID 索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seats_employee_id') THEN
        CREATE INDEX idx_seats_employee_id ON seats(employee_id);
        RAISE NOTICE '✓ seats employee_id 索引建立成功';
    ELSE
        RAISE NOTICE 'seats employee_id 索引已存在';
    END IF;
END $$;

-- ========================================
-- 第七段執行完成 - 最終檢查與驗證
-- ========================================

-- 檢查所有函數
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    prosecdef as security_definer,
    CASE WHEN proname = 'update_updated_at_column' THEN 'Trigger function'
         WHEN proname = 'is_admin' THEN 'Admin check function'
         WHEN proname = 'create_auth_for_existing_employees' THEN 'Auth creation function'
         ELSE 'Other function'
    END as function_type
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'is_admin', 'create_auth_for_existing_employees')
ORDER BY proname;

-- 檢查所有表格與 RLS 狀態
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count,
    (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE tablename IN (
    'employees', 'containers', 'equipment', 'pcs', 
    'floor_containers', 'attendance_records', 'pc_details',
    'seat_coordinates', 'seats'
)
ORDER BY tablename;

-- 檢查所有觸發器
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN (
    'employees', 'containers', 'equipment', 'pcs', 
    'floor_containers', 'attendance_records', 'pc_details',
    'seat_coordinates', 'seats'
)
ORDER BY event_object_table, trigger_name;

-- 檢查自定義類型
SELECT 
    typname as type_name,
    typtype as type_type,
    typcategory as type_category
FROM pg_type 
WHERE typname IN ('user_role');

-- 最終統計
SELECT 
    '資料庫設定完成' as status,
    (SELECT count(*) FROM pg_tables WHERE tablename IN (
        'employees', 'containers', 'equipment', 'pcs', 
        'floor_containers', 'attendance_records', 'pc_details',
        'seat_coordinates', 'seats'
    )) as total_tables,
    (SELECT count(*) FROM pg_policies WHERE tablename IN (
        'employees', 'containers', 'equipment', 'pcs', 
        'floor_containers', 'attendance_records', 'pc_details',
        'seat_coordinates', 'seats'
    )) as total_policies,
    (SELECT count(*) FROM pg_proc WHERE proname IN (
        'update_updated_at_column', 'is_admin', 'create_auth_for_existing_employees'
    )) as total_functions;

-- ========================================
-- 🎉 資料庫設定完成！
-- ========================================
-- 
-- 如果所有檢查都正常，您的自託管 Supabase 資料庫已經設定完成
-- 
-- 下一步建議：
-- 1. 在 employees 表格中新增管理員帳號
-- 2. 測試登入功能
-- 3. 設定前端應用程式連接到這個資料庫
-- ========================================