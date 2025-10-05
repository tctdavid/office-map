-- 階段一：建立完整的資料庫外鍵約束
-- 這將確保刪除員工時，相關資料能正確處理

-- 步驟 1: 為 seat_coordinates 添加外鍵約束
DO $$ 
BEGIN
  -- 檢查並添加 employee_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seat_coordinates_employee' 
    AND table_name = 'seat_coordinates'
  ) THEN
    ALTER TABLE public.seat_coordinates
    ADD CONSTRAINT fk_seat_coordinates_employee
    FOREIGN KEY (employee_id) 
    REFERENCES public.employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seat_coordinates.employee_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seat_coordinates.employee_id 外鍵約束已存在';
  END IF;

  -- 檢查並添加 pc_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seat_coordinates_pc' 
    AND table_name = 'seat_coordinates'
  ) THEN
    ALTER TABLE public.seat_coordinates
    ADD CONSTRAINT fk_seat_coordinates_pc
    FOREIGN KEY (pc_id) 
    REFERENCES public.pcs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seat_coordinates.pc_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seat_coordinates.pc_id 外鍵約束已存在';
  END IF;

  -- 檢查並添加 equipment_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seat_coordinates_equipment' 
    AND table_name = 'seat_coordinates'
  ) THEN
    ALTER TABLE public.seat_coordinates
    ADD CONSTRAINT fk_seat_coordinates_equipment
    FOREIGN KEY (equipment_id) 
    REFERENCES public.equipment(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seat_coordinates.equipment_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seat_coordinates.equipment_id 外鍵約束已存在';
  END IF;

  -- 檢查並添加 container_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seat_coordinates_container' 
    AND table_name = 'seat_coordinates'
  ) THEN
    ALTER TABLE public.seat_coordinates
    ADD CONSTRAINT fk_seat_coordinates_container
    FOREIGN KEY (container_id) 
    REFERENCES public.containers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seat_coordinates.container_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seat_coordinates.container_id 外鍵約束已存在';
  END IF;
END $$;

-- 步驟 2: 為 seats 表添加外鍵約束
DO $$ 
BEGIN
  -- 檢查並添加 employee_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seats_employee' 
    AND table_name = 'seats'
  ) THEN
    ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_employee
    FOREIGN KEY (employee_id) 
    REFERENCES public.employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seats.employee_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seats.employee_id 外鍵約束已存在';
  END IF;

  -- 檢查並添加 pc_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seats_pc' 
    AND table_name = 'seats'
  ) THEN
    ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_pc
    FOREIGN KEY (pc_id) 
    REFERENCES public.pcs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seats.pc_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seats.pc_id 外鍵約束已存在';
  END IF;

  -- 檢查並添加 container_id 外鍵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seats_container' 
    AND table_name = 'seats'
  ) THEN
    ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_container
    FOREIGN KEY (container_id) 
    REFERENCES public.containers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 seats.container_id 外鍵約束';
  ELSE
    RAISE NOTICE '- seats.container_id 外鍵約束已存在';
  END IF;
END $$;

-- 步驟 3: 為 attendance_records 添加外鍵約束
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_attendance_employee' 
    AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE public.attendance_records
    ADD CONSTRAINT fk_attendance_employee
    FOREIGN KEY (employee_id) 
    REFERENCES public.employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 attendance_records.employee_id 外鍵約束 (CASCADE)';
  ELSE
    RAISE NOTICE '- attendance_records.employee_id 外鍵約束已存在';
  END IF;
END $$;

-- 步驟 4: 為 pc_details 添加外鍵約束
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_pc_details_pc' 
    AND table_name = 'pc_details'
  ) THEN
    ALTER TABLE public.pc_details
    ADD CONSTRAINT fk_pc_details_pc
    FOREIGN KEY (pc_id) 
    REFERENCES public.pcs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
    
    RAISE NOTICE '✓ 已添加 pc_details.pc_id 外鍵約束';
  ELSE
    RAISE NOTICE '- pc_details.pc_id 外鍵約束已存在';
  END IF;
END $$;

-- 驗證結果
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND table_name IN ('seat_coordinates', 'seats', 'attendance_records', 'pc_details');
  
  RAISE NOTICE '';
  RAISE NOTICE '=== 外鍵約束建立完成 ===';
  RAISE NOTICE '共建立 % 個外鍵約束', fk_count;
  RAISE NOTICE '';
  RAISE NOTICE '刪除策略說明：';
  RAISE NOTICE '- seat_coordinates/seats: SET NULL（座位清空但保留）';
  RAISE NOTICE '- attendance_records: CASCADE（考勤記錄一併刪除）';
  RAISE NOTICE '- pc_details: CASCADE（電腦詳細資料一併刪除）';
  RAISE NOTICE '';
END $$;