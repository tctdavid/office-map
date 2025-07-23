-- 先刪除現有的視圖
DROP VIEW IF EXISTS public.floor_containers;

-- 創建真正的 floor_containers 表來存儲畫布配置
CREATE TABLE public.floor_containers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    floor text NOT NULL DEFAULT 'Ground Floor',
    x integer NOT NULL DEFAULT 0,
    y integer NOT NULL DEFAULT 0,
    width integer NOT NULL DEFAULT 1060,
    height integer NOT NULL DEFAULT 850,
    max_width integer DEFAULT 1060,
    max_height integer DEFAULT 850,
    min_width integer DEFAULT 1060,
    min_height integer DEFAULT 850,
    color text DEFAULT '#f8fafc',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(name, floor)
);

-- 插入預設的畫布配置
INSERT INTO public.floor_containers (name, floor, x, y, width, height, max_width, max_height, min_width, min_height, color)
VALUES ('Main Canvas', 'Ground Floor', 0, 0, 1060, 850, 1060, 850, 1060, 850, '#f8fafc');

-- 啟用 RLS
ALTER TABLE public.floor_containers ENABLE ROW LEVEL SECURITY;

-- 創建公開讀取政策
CREATE POLICY "Allow public read access to floor_containers" 
ON public.floor_containers 
FOR SELECT 
USING (true);

-- 創建公開寫入政策（如果需要的話）
CREATE POLICY "Allow public write access to floor_containers" 
ON public.floor_containers 
FOR ALL
USING (true);

-- 創建更新時間戳的觸發器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_floor_containers_updated_at
    BEFORE UPDATE ON public.floor_containers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();