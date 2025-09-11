-- Remove password_hash column from employees table to unify authentication
-- All password management will now be handled by Supabase Authentication only

ALTER TABLE public.employees DROP COLUMN IF EXISTS password_hash;

-- Update any functions that might have referenced password_hash
-- The is_admin function should remain unchanged as it doesn't use password_hash

-- Remove any triggers or functions related to password hashing if they exist
-- (None exist in current schema, but this ensures cleanup)