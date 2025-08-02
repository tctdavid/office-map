-- Rename model column to mac_add
ALTER TABLE public.pc_details RENAME COLUMN model TO mac_add;

-- Add new columns to pc_details table
ALTER TABLE public.pc_details ADD COLUMN "case" text;
ALTER TABLE public.pc_details ADD COLUMN psu text;
ALTER TABLE public.pc_details ADD COLUMN main_board text;
ALTER TABLE public.pc_details ADD COLUMN os text;
ALTER TABLE public.pc_details ADD COLUMN cpu_fan text;