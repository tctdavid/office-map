-- 修復自託管 Supabase 儲存上傳問題
-- 解決自託管環境中照片上傳失敗的常見問題

-- 1. 確保儲存 buckets 正確設定且為 public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('staff', 'staff', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('equipment', 'equipment', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('pcs', 'pcs', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. 移除可能衝突的舊政策
DROP POLICY IF EXISTS "Allow anonymous avatar uploads during registration" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to staff bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Only authenticated users can upload files" ON storage.objects;

-- 3. 建立寬鬆的上傳政策（適用於自託管環境）
-- 允許任何人上傳到指定的 buckets（因為自託管環境通常在內網）
CREATE POLICY "Allow uploads to staff bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'staff');

CREATE POLICY "Allow uploads to equipment bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'equipment');

CREATE POLICY "Allow uploads to pcs bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pcs');

-- 4. 允許公開讀取所有 buckets
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('staff', 'equipment', 'pcs'));

-- 5. 允許經過認證的用戶更新和刪除檔案
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 6. 檢查結果
SELECT 
  b.id as bucket_name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  'Bucket configured for self-hosted environment' as status
FROM storage.buckets b 
WHERE b.id IN ('staff', 'equipment', 'pcs')
ORDER BY b.id;

-- 顯示所有儲存政策
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;