-- Update RLS policies to allow public read access for seat management data

-- Drop existing restrictive policies and create public read policies
DROP POLICY IF EXISTS "Users can view their own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON employees;

-- Allow public read access to all tables needed for seat management
CREATE POLICY "Public read access to employees" 
ON employees 
FOR SELECT 
USING (true);

CREATE POLICY "Public read access to attendance_records" 
ON attendance_records 
FOR SELECT 
USING (true);

-- Equipment policies are already public, but ensure they exist
DROP POLICY IF EXISTS "Allow public read access to equipment" ON equipment;
CREATE POLICY "Public read access to equipment" 
ON equipment 
FOR SELECT 
USING (true);

-- Ensure seat_coordinates policies allow public read
DROP POLICY IF EXISTS "Public read access to seat_coordinates" ON seat_coordinates;
CREATE POLICY "Public read access to seat_coordinates" 
ON seat_coordinates 
FOR SELECT 
USING (true);

-- Ensure containers policies allow public read  
DROP POLICY IF EXISTS "Allow public read access to containers" ON containers;
CREATE POLICY "Public read access to containers" 
ON containers 
FOR SELECT 
USING (true);

-- Ensure pcs policies allow public read
DROP POLICY IF EXISTS "Allow public read access to pcs" ON pcs;
CREATE POLICY "Public read access to pcs" 
ON pcs 
FOR SELECT 
USING (true);

-- Ensure floor_containers policies allow public read
DROP POLICY IF EXISTS "Allow public read access to floor_containers" ON floor_containers;
CREATE POLICY "Public read access to floor_containers" 
ON floor_containers 
FOR SELECT 
USING (true);