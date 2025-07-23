-- Update existing floor_containers record to canvas size 1060 × 850
UPDATE floor_containers 
SET width = 1060, 
    height = 850,
    max_width = 1060,
    max_height = 850,
    min_width = 1060,
    min_height = 850,
    x = 0,
    y = 0
WHERE name = '預設部門-連動測試';