-- ========================================
-- 方案一：Database Trigger 自動同步方案（改進版）
-- ========================================
-- 此腳本將先清理不匹配的資料，再修改表結構並建立觸發器

-- 步驟 1: 備份現有員工資料
CREATE TABLE IF NOT EXISTS employees_backup_before_sync AS 
SELECT * FROM employees;

-- 步驟 2: 檢查並報告不匹配的記錄
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM public.employees e
  LEFT JOIN auth.users au ON e.id = au.id
  WHERE au.id IS NULL;
  
  RAISE NOTICE '發現 % 筆不匹配的員工記錄（在 employees 中但不在 auth.users 中）', mismatch_count;
END $$;

-- 步驟 3: 刪除不匹配的記錄（在 auth.users 中不存在的 employees）
-- 這些記錄無法與 auth 系統關聯，必須刪除
DELETE FROM public.employees
WHERE id NOT IN (SELECT id FROM auth.users);

-- 步驟 4: 為 auth.users 中存在但 employees 中不存在的用戶創建記錄
-- 這確保所有 auth 用戶都有對應的 employee 記錄
INSERT INTO public.employees (
  id,
  email,
  name,
  role,
  is_active
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'employee',
  true
FROM auth.users au
LEFT JOIN public.employees e ON au.id = e.id
WHERE e.id IS NULL
ON CONFLICT (email) DO UPDATE 
SET id = EXCLUDED.id;

-- 步驟 5: 刪除現有的自動生成 ID 預設值
ALTER TABLE public.employees 
ALTER COLUMN id DROP DEFAULT;

-- 步驟 6: 添加外鍵約束
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_auth_users 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 步驟 7: 建立自動同步函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (
    id,
    email,
    name,
    department,
    position,
    extension,
    photo,
    role,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', NULL),
    COALESCE(NEW.raw_user_meta_data->>'position', NULL),
    COALESCE(NEW.raw_user_meta_data->>'extension', NULL),
    COALESCE(NEW.raw_user_meta_data->>'photo', NULL),
    'employee',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, employees.name),
    department = COALESCE(EXCLUDED.department, employees.department),
    position = COALESCE(EXCLUDED.position, employees.position),
    extension = COALESCE(EXCLUDED.extension, employees.extension),
    photo = COALESCE(EXCLUDED.photo, employees.photo);
  
  RETURN NEW;
END;
$$;

-- 步驟 8: 建立觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 步驟 9: 驗證結果
DO $$
DECLARE
  employees_count INTEGER;
  auth_users_count INTEGER;
  matched_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO employees_count FROM public.employees;
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  SELECT COUNT(*) INTO matched_count 
  FROM public.employees e
  INNER JOIN auth.users au ON e.id = au.id;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== 同步結果 ===';
  RAISE NOTICE 'employees 記錄數: %', employees_count;
  RAISE NOTICE 'auth.users 記錄數: %', auth_users_count;
  RAISE NOTICE '匹配的記錄數: %', matched_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ employees 表結構修改完成';
  RAISE NOTICE '✅ 外鍵約束已建立: employees.id -> auth.users.id';
  RAISE NOTICE '✅ 自動同步觸發器已建立';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：修改前端代碼，移除手動插入 employees 的邏輯';
END $$;