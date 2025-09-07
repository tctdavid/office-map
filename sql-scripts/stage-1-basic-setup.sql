-- ========================================
-- 第一段：基礎設定與類型定義
-- ========================================
-- 執行前請確認：這是全新的資料庫
-- 如果已有資料，請先執行清除腳本

-- 檢查是否已存在類型定義
DO $$
BEGIN
    -- 檢查 user_role 類型是否存在
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'user_role 類型已存在，跳過建立';
    ELSE
        -- 建立用戶角色列舉類型
        CREATE TYPE user_role AS ENUM ('admin', 'employee');
        RAISE NOTICE 'user_role 類型建立成功';
    END IF;
END $$;

-- 建立更新時間戳函數（這個不依賴任何資料表）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 驗證函數建立
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE '✓ update_updated_at_column 函數建立成功';
    ELSE
        RAISE EXCEPTION '✗ update_updated_at_column 函數建立失敗';
    END IF;
END $$;

-- ========================================
-- 第一段執行完成檢查
-- ========================================

-- 檢查建立的物件
SELECT 
    'user_role' as object_name, 
    'TYPE' as object_type,
    CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as status
UNION ALL
SELECT 
    'update_updated_at_column' as object_name,
    'FUNCTION' as object_type,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') 
         THEN '✓ 存在' 
         ELSE '✗ 不存在' 
    END as status;

-- ========================================
-- 如果上述檢查都顯示 "✓ 存在"，請繼續執行第二段
-- 如有任何 "✗ 不存在"，請檢查錯誤訊息後重新執行
-- ========================================