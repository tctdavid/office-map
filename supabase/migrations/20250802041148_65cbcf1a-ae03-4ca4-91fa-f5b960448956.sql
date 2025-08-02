-- Rename photo column to case_photo in pcs table
ALTER TABLE public.pcs RENAME COLUMN photo TO case_photo;

-- Add new monitor columns to pcs table
ALTER TABLE public.pcs ADD COLUMN monitor_A text;
ALTER TABLE public.pcs ADD COLUMN monitor_A_photo text;
ALTER TABLE public.pcs ADD COLUMN monitor_B text;
ALTER TABLE public.pcs ADD COLUMN monitor_B_photo text;