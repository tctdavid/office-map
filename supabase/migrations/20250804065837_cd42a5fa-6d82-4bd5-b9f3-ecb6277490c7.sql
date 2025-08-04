-- Create storage bucket for PC images
INSERT INTO storage.buckets (id, name, public) VALUES ('pcs', 'pcs', true);

-- Create policies for PC images storage
CREATE POLICY "PC images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pcs');

CREATE POLICY "Anyone can upload PC images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pcs');

CREATE POLICY "Anyone can update PC images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pcs');

CREATE POLICY "Anyone can delete PC images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pcs');