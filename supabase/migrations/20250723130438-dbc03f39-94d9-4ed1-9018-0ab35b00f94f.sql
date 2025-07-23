-- Update the container width to 1040px
UPDATE containers 
SET width = 1040, updated_at = now() 
WHERE name = '預設部門-連動測試';