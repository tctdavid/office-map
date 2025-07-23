-- Update the container width to 1000px
UPDATE containers 
SET width = 1000, updated_at = now() 
WHERE name = '預設部門-連動測試';