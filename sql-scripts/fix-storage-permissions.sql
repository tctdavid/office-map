-- 修復 staff storage bucket 權限設定
-- 解決註冊時照片上傳失敗的問題

-- 移除現有的嚴格 INSERT 政策
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Only authenticated users can upload files" ON storage.objects;

-- 建立新的權限政策允許註冊時的匿名上傳
-- 1. 允許匿名用戶上傳到 staff bucket 的 avatars 資料夾（僅限圖片）
CREATE POLICY "Allow anonymous avatar uploads during registration"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

-- 2. 保持讀取權限為公開（staff bucket 是 public）
CREATE POLICY "Public read access to staff bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff');

-- 3. 只有經過認證的用戶可以更新自己的檔案
CREATE POLICY "Authenticated users can update their own files"  
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 只有經過認證的用戶可以刪除自己的檔案
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE  
USING (
  bucket_id = 'staff' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 確保 staff bucket 存在且為 public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff', 'staff', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- 檢查並回報結果
SELECT 
  'Storage permissions updated successfully. Anonymous users can now upload avatars during registration.' as result;