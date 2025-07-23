-- 修復函數的 search_path 安全問題
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- 重新創建函數以確保安全設定生效
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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