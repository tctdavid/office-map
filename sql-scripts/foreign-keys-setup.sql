-- =====================================================
-- Foreign Keys Setup Script
-- =====================================================
-- This script adds foreign key constraints to existing tables
-- Can be run independently and safely multiple times
-- =====================================================

-- Check if we're running on the correct database
DO $$
BEGIN
    RAISE NOTICE '開始外鍵約束設定...';
END $$;

-- =====================================================
-- Pre-condition checks
-- =====================================================

-- Check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    required_tables TEXT[] := ARRAY['employees', 'pcs', 'equipment', 'containers', 
                                   'attendance_records', 'pc_details', 'seat_coordinates', 'seats'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                      WHERE table_schema = 'public' AND table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION '缺少必要的表格: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✓ 所有必要的表格都存在';
    END IF;
END $$;

-- Display current foreign key status
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE '目前外鍵約束數量: %', fk_count;
END $$;

-- =====================================================
-- Add Foreign Key Constraints
-- =====================================================

-- 1. attendance_records table foreign keys
DO $$
BEGIN
    -- Add foreign key for employee_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_attendance_records_employee_id' 
                   AND table_name = 'attendance_records') THEN
        ALTER TABLE public.attendance_records 
        ADD CONSTRAINT fk_attendance_records_employee_id 
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 attendance_records.employee_id 外鍵約束';
    ELSE
        RAISE NOTICE '- attendance_records.employee_id 外鍵約束已存在';
    END IF;
END $$;

-- 2. pc_details table foreign keys
DO $$
BEGIN
    -- Add foreign key for pc_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_pc_details_pc_id' 
                   AND table_name = 'pc_details') THEN
        ALTER TABLE public.pc_details 
        ADD CONSTRAINT fk_pc_details_pc_id 
        FOREIGN KEY (pc_id) REFERENCES public.pcs(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 pc_details.pc_id 外鍵約束';
    ELSE
        RAISE NOTICE '- pc_details.pc_id 外鍵約束已存在';
    END IF;
END $$;

-- 3. seat_coordinates table foreign keys
DO $$
BEGIN
    -- Add foreign key for employee_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seat_coordinates_employee_id' 
                   AND table_name = 'seat_coordinates') THEN
        ALTER TABLE public.seat_coordinates 
        ADD CONSTRAINT fk_seat_coordinates_employee_id 
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seat_coordinates.employee_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seat_coordinates.employee_id 外鍵約束已存在';
    END IF;
    
    -- Add foreign key for pc_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seat_coordinates_pc_id' 
                   AND table_name = 'seat_coordinates') THEN
        ALTER TABLE public.seat_coordinates 
        ADD CONSTRAINT fk_seat_coordinates_pc_id 
        FOREIGN KEY (pc_id) REFERENCES public.pcs(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seat_coordinates.pc_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seat_coordinates.pc_id 外鍵約束已存在';
    END IF;
    
    -- Add foreign key for equipment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seat_coordinates_equipment_id' 
                   AND table_name = 'seat_coordinates') THEN
        ALTER TABLE public.seat_coordinates 
        ADD CONSTRAINT fk_seat_coordinates_equipment_id 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seat_coordinates.equipment_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seat_coordinates.equipment_id 外鍵約束已存在';
    END IF;
    
    -- Add foreign key for container_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seat_coordinates_container_id' 
                   AND table_name = 'seat_coordinates') THEN
        ALTER TABLE public.seat_coordinates 
        ADD CONSTRAINT fk_seat_coordinates_container_id 
        FOREIGN KEY (container_id) REFERENCES public.containers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seat_coordinates.container_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seat_coordinates.container_id 外鍵約束已存在';
    END IF;
END $$;

-- 4. seats table foreign keys
DO $$
BEGIN
    -- Add foreign key for employee_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seats_employee_id' 
                   AND table_name = 'seats') THEN
        ALTER TABLE public.seats 
        ADD CONSTRAINT fk_seats_employee_id 
        FOREIGN KEY (employee_id) REFERENCES public.employees(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seats.employee_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seats.employee_id 外鍵約束已存在';
    END IF;
    
    -- Add foreign key for pc_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seats_pc_id' 
                   AND table_name = 'seats') THEN
        ALTER TABLE public.seats 
        ADD CONSTRAINT fk_seats_pc_id 
        FOREIGN KEY (pc_id) REFERENCES public.pcs(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seats.pc_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seats.pc_id 外鍵約束已存在';
    END IF;
    
    -- Add foreign key for container_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_seats_container_id' 
                   AND table_name = 'seats') THEN
        ALTER TABLE public.seats 
        ADD CONSTRAINT fk_seats_container_id 
        FOREIGN KEY (container_id) REFERENCES public.containers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✓ 已新增 seats.container_id 外鍵約束';
    ELSE
        RAISE NOTICE '- seats.container_id 外鍵約束已存在';
    END IF;
END $$;

-- =====================================================
-- Post-execution verification
-- =====================================================

-- Display final foreign key count and list
DO $$
DECLARE
    fk_count INTEGER;
    fk_record RECORD;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 外鍵約束設定完成 ===';
    RAISE NOTICE '總共建立的外鍵約束數量: %', fk_count;
    RAISE NOTICE '';
    RAISE NOTICE '已建立的外鍵約束列表:';
    
    FOR fk_record IN
        SELECT 
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema 
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name 
            AND ccu.table_schema = tc.table_schema 
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        RAISE NOTICE '  %.% → %.% (%)', 
            fk_record.table_name, 
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name,
            fk_record.constraint_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✓ 外鍵約束設定成功！';
    RAISE NOTICE '✓ Schema Visualizer 現在應該會顯示表格間的關聯';
END $$;

-- =====================================================
-- Instructions for rollback (if needed)
-- =====================================================

/*
如果需要移除外鍵約束，請執行以下 SQL:

-- Remove all foreign key constraints
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS fk_attendance_records_employee_id;
ALTER TABLE public.pc_details DROP CONSTRAINT IF EXISTS fk_pc_details_pc_id;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS fk_seat_coordinates_employee_id;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS fk_seat_coordinates_pc_id;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS fk_seat_coordinates_equipment_id;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS fk_seat_coordinates_container_id;
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS fk_seats_employee_id;
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS fk_seats_pc_id;
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS fk_seats_container_id;

*/