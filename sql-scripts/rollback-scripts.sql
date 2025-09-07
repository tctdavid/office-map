-- ========================================
-- 回滾腳本 - 清除所有建立的物件
-- ========================================
-- 使用前請確認：這將刪除所有資料和結構
-- 建議先備份重要資料

-- 警告訊息
DO $$
BEGIN
    RAISE NOTICE '⚠️  即將清除所有資料庫物件';
    RAISE NOTICE '⚠️  這將刪除所有資料！';
    RAISE NOTICE '⚠️  請確認已備份重要資料';
END $$;

-- 第一步：刪除所有 RLS 政策
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'employees', 'containers', 'equipment', 'pcs', 
            'floor_containers', 'attendance_records', 'pc_details',
            'seat_coordinates', 'seats'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
        RAISE NOTICE '✓ 刪除政策: %', pol.policyname;
    END LOOP;
END $$;

-- 第二步：刪除所有觸發器
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_containers_updated_at ON containers;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
DROP TRIGGER IF EXISTS update_floor_containers_updated_at ON floor_containers;
DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
DROP TRIGGER IF EXISTS update_seat_coordinates_updated_at ON seat_coordinates;

-- 第三步：刪除函數（按依賴順序）
DROP FUNCTION IF EXISTS create_auth_for_existing_employees();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 第四步：刪除表格（按依賴順序）
-- 先刪除依賴其他表格的表格
DROP TABLE IF EXISTS seat_coordinates CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS pc_details CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;

-- 再刪除主要表格
DROP TABLE IF EXISTS floor_containers CASCADE;
DROP TABLE IF EXISTS pcs CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS containers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 第五步：刪除自定義類型
DROP TYPE IF EXISTS user_role CASCADE;

-- 最終檢查
DO $$
BEGIN
    RAISE NOTICE '=== 清除完成檢查 ===';
    
    -- 檢查表格
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename IN (
            'employees', 'containers', 'equipment', 'pcs', 
            'floor_containers', 'attendance_records', 'pc_details',
            'seat_coordinates', 'seats'
        )
    ) THEN
        RAISE NOTICE '✓ 所有表格已清除';
    ELSE
        RAISE NOTICE '⚠️  仍有表格存在';
    END IF;
    
    -- 檢查函數
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('update_updated_at_column', 'is_admin', 'create_auth_for_existing_employees')
    ) THEN
        RAISE NOTICE '✓ 所有函數已清除';
    ELSE
        RAISE NOTICE '⚠️  仍有函數存在';
    END IF;
    
    -- 檢查類型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE '✓ 自定義類型已清除';
    ELSE
        RAISE NOTICE '⚠️  仍有自定義類型存在';
    END IF;
    
    -- 檢查政策
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename IN (
            'employees', 'containers', 'equipment', 'pcs', 
            'floor_containers', 'attendance_records', 'pc_details',
            'seat_coordinates', 'seats'
        )
    ) THEN
        RAISE NOTICE '✓ 所有 RLS 政策已清除';
    ELSE
        RAISE NOTICE '⚠️  仍有 RLS 政策存在';
    END IF;
    
    RAISE NOTICE '=== 清除作業完成 ===';
END $$;