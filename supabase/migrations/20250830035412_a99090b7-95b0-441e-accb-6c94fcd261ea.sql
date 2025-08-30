-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,
  supplier TEXT,
  ip TEXT,
  sn TEXT,
  contact_person TEXT,
  mac_adds TEXT,
  purchase_date DATE,
  photo TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add equipment_id to seat_coordinates table
ALTER TABLE public.seat_coordinates 
ADD COLUMN equipment_id UUID;

-- Enable RLS on equipment table
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for equipment table
CREATE POLICY "Allow public read access to equipment" 
ON public.equipment 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to equipment" 
ON public.equipment 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to equipment" 
ON public.equipment 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to equipment" 
ON public.equipment 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on equipment
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();