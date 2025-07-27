-- 將 staff bucket 設置為公開，以便顯示員工頭像
UPDATE storage.buckets 
SET public = true 
WHERE id = 'staff';

-- 為 staff bucket 創建公開讀取政策
CREATE POLICY "Staff photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'staff');