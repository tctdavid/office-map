-- 為座位管理系統添加公開讀取員工資料的政策
CREATE POLICY "Public read access for seat management" 
ON public.employees 
FOR SELECT 
USING (true);

-- 為座位顯示添加公開讀取座位資料的政策（如果不存在）
DROP POLICY IF EXISTS "Public read access to seat_coordinates" ON public.seat_coordinates;
CREATE POLICY "Public read access to seat_coordinates" 
ON public.seat_coordinates 
FOR SELECT 
USING (true);