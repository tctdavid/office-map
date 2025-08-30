-- Remove old duplicate foreign key constraints to avoid conflicts
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS seat_coordinates_container_id_fkey;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS seat_coordinates_employee_id_fkey;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS seat_coordinates_pc_id_fkey;
ALTER TABLE public.seat_coordinates DROP CONSTRAINT IF EXISTS seat_coordinates_equipment_id_fkey;