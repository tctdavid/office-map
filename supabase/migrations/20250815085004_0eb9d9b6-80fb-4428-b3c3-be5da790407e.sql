-- 檢查並修復 Storage RLS 政策
-- 先清理可能衝突的政策
DROP POLICY IF EXISTS "Users can upload their own staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own staff photos" ON storage.objects;

-- 允許任何人查看 staff bucket 中的照片（因為它是公開 bucket）
CREATE POLICY "Staff photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff');

-- 允許已驗證用戶上傳照片到 staff bucket
CREATE POLICY "Authenticated users can upload staff photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff' 
  AND auth.role() = 'authenticated'
);

-- 允許已驗證用戶更新自己上傳的照片
CREATE POLICY "Users can update their own staff photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff' 
  AND auth.role() = 'authenticated'
);

-- 允許已驗證用戶刪除自己上傳的照片  
CREATE POLICY "Users can delete their own staff photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff'
  AND auth.role() = 'authenticated'
);