-- Update floor_containers to have canvas size of 1060 × 850
INSERT INTO floor_containers (id, name, x, y, width, height, max_width, max_height, min_width, min_height, color, floor) 
VALUES (gen_random_uuid(), 'Main Canvas', 0, 0, 1060, 850, 1060, 850, 1060, 850, '#f8fafc', 'Ground Floor')
ON CONFLICT (name) DO UPDATE SET 
  width = 1060, 
  height = 850,
  max_width = 1060,
  max_height = 850,
  min_width = 1060,
  min_height = 850;