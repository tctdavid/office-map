-- Re-add foreign key constraints that are needed for proper data relationships
-- These constraints ensure data integrity and enable proper joins

-- Add foreign key constraint for container_id
ALTER TABLE public.seat_coordinates 
ADD CONSTRAINT fk_seat_coordinates_container_id 
FOREIGN KEY (container_id) REFERENCES public.containers(id) ON DELETE SET NULL;

-- Add foreign key constraint for employee_id  
ALTER TABLE public.seat_coordinates 
ADD CONSTRAINT fk_seat_coordinates_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add foreign key constraint for pc_id
ALTER TABLE public.seat_coordinates 
ADD CONSTRAINT fk_seat_coordinates_pc_id 
FOREIGN KEY (pc_id) REFERENCES public.pcs(id) ON DELETE SET NULL;

-- Add foreign key constraint for equipment_id
ALTER TABLE public.seat_coordinates 
ADD CONSTRAINT fk_seat_coordinates_equipment_id 
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;