-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "PC images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload PC images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update PC images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete PC images" ON storage.objects;

-- Create comprehensive storage policies for pcs bucket
CREATE POLICY "Allow public read access to pcs bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pcs');

CREATE POLICY "Allow public insert access to pcs bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pcs');

CREATE POLICY "Allow public update access to pcs bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pcs')
WITH CHECK (bucket_id = 'pcs');

CREATE POLICY "Allow public delete access to pcs bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pcs');