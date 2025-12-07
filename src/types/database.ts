// ==================== 資料庫實體類型定義 ====================

import { Database } from '@/integrations/supabase/types';

// 基礎資料庫類型別名
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// ==================== Employee 員工類型 ====================

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  extension: string | null;
  photo: string | null;
  role: Enums['user_role'] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export type EmployeeInsert = Tables['employees']['Insert'];
export type EmployeeUpdate = Tables['employees']['Update'];

// ==================== Container 容器類型 ====================

export interface Container {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  min_width: number | null;
  min_height: number | null;
  max_width: number | null;
  max_height: number | null;
  color: string | null;
  department: string;
  created_at: string | null;
  updated_at: string | null;
}

export type ContainerInsert = Tables['containers']['Insert'];
export type ContainerUpdate = Tables['containers']['Update'];

// ==================== Seat 座位類型 ====================

export interface Seat {
  id: string;
  x: number;
  y: number;
  pixel_x: number | null;
  pixel_y: number | null;
  container_id: string | null;
  container: string;
  seat_template: string;
  is_empty: boolean | null;
  employee_id: string | null;
  pc_id: string | null;
  equipment_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// 帶有關聯資料的座位
export interface SeatWithRelations extends Seat {
  employee: Employee | null;
  pc: PC | null;
  equipment: Equipment | null;
}

export type SeatInsert = Tables['seat_coordinates']['Insert'];
export type SeatUpdate = Tables['seat_coordinates']['Update'];

// ==================== PC 電腦類型 ====================

export interface PC {
  id: string;
  name: string;
  cpu: string | null;
  memory: string | null;
  storage: string | null;
  graphics: string | null;
  case_photo: string | null;
  monitor_a: string | null;
  monitor_a_photo: string | null;
  monitor_b: string | null;
  monitor_b_photo: string | null;
  created_at: string | null;
}

export interface PCDetails {
  id: string;
  pc_id: string | null;
  brand: string | null;
  serial_number: string | null;
  main_board: string | null;
  psu: string | null;
  pc_case: string | null;
  cpu_fan: string | null;
  os: string | null;
  mac_add: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string | null;
}

export type PCInsert = Tables['pcs']['Insert'];
export type PCUpdate = Tables['pcs']['Update'];
export type PCDetailsInsert = Tables['pc_details']['Insert'];
export type PCDetailsUpdate = Tables['pc_details']['Update'];

// ==================== Equipment 設備類型 ====================

export interface Equipment {
  id: string;
  product: string;
  supplier: string | null;
  ip: string | null;
  sn: string | null;
  contact_person: string | null;
  mac_adds: string | null;
  purchase_date: string | null;
  photo: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipmentInsert = Tables['equipment']['Insert'];
export type EquipmentUpdate = Tables['equipment']['Update'];

// ==================== Attendance 出勤類型 ====================

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  record_date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_log: string | null;
  overtime_in_time: string | null;
  overtime_out_time: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceInsert = Tables['attendance_records']['Insert'];
export type AttendanceUpdate = Tables['attendance_records']['Update'];

// ==================== Floor Container 樓層容器類型 ====================

export interface FloorContainer {
  id: string;
  name: string;
  floor: string;
  x: number;
  y: number;
  width: number;
  height: number;
  min_width: number | null;
  min_height: number | null;
  max_width: number | null;
  max_height: number | null;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type FloorContainerInsert = Tables['floor_containers']['Insert'];
export type FloorContainerUpdate = Tables['floor_containers']['Update'];
