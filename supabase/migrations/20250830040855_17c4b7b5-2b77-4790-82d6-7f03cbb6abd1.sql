-- Create equipment storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment', 'equipment', true);

-- Create storage policies for equipment photos
CREATE POLICY "Equipment images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'equipment');

CREATE POLICY "Anyone can upload equipment images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'equipment');

CREATE POLICY "Anyone can update equipment images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'equipment');

CREATE POLICY "Anyone can delete equipment images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'equipment');