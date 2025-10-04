-- 修复座位和员工的关联
-- 根据 email 将旧的 employee_id 映射到新的 employee_id

-- 步骤 1: 创建临时映射表
CREATE TEMP TABLE employee_id_mapping AS
SELECT 
  eb.id as old_id,
  eb.email,
  e.id as new_id,
  eb.name
FROM public.employees_backup_before_sync eb
INNER JOIN public.employees e ON eb.email = e.email;

-- 步骤 2: 查看映射结果
DO $$
DECLARE
  mapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM employee_id_mapping;
  RAISE NOTICE '找到 % 个员工映射', mapping_count;
END $$;

-- 步骤 3: 更新 seat_coordinates 表
UPDATE public.seat_coordinates sc
SET employee_id = m.new_id
FROM employee_id_mapping m
WHERE sc.employee_id = m.old_id;

-- 步骤 4: 验证更新结果
DO $$
DECLARE
  updated_seats INTEGER;
  seats_with_employees INTEGER;
BEGIN
  -- 检查有员工的座位数
  SELECT COUNT(*) INTO seats_with_employees
  FROM public.seat_coordinates
  WHERE employee_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== 座位-员工关联修复结果 ===';
  RAISE NOTICE '有员工的座位数: %', seats_with_employees;
  RAISE NOTICE '';
  
  -- 显示关联详情
  FOR updated_seats IN 1..5 LOOP
    RAISE NOTICE '座位样本:';
  END LOOP;
END $$;

-- 步骤 5: 显示修复后的座位信息
SELECT 
  sc.id,
  sc.container,
  e.name as employee_name,
  e.email as employee_email,
  sc.is_empty
FROM public.seat_coordinates sc
LEFT JOIN public.employees e ON sc.employee_id = e.id
WHERE sc.employee_id IS NOT NULL
LIMIT 10;