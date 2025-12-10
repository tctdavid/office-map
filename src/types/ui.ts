// ==================== UI 狀態類型定義 ====================

import { Employee, Container, Seat, SeatWithRelations, PC, Equipment } from './database';

// ==================== 異步狀態類型 ====================

export interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export interface FetchState {
  isLoading: boolean;
  error: string | null;
}

// ==================== 畫布相關類型 ====================

export interface CanvasSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
}

// ==================== 座位模板類型 ====================

export type SeatTemplateSize = '120x70' | '80x60' | '100x65';

export interface SeatSize {
  width: number;
  height: number;
}

export const SEAT_TEMPLATE_SIZES: Record<SeatTemplateSize, SeatSize> = {
  '120x70': { width: 120, height: 70 },
  '80x60': { width: 80, height: 60 },
  '100x65': { width: 100, height: 65 },
};

// ==================== Modal 狀態類型 ====================

export interface ModalState {
  isLoginModalOpen: boolean;
  isTimeClockModalOpen: boolean;
  isAdminMigrationPanelOpen: boolean;
  isPasswordResetModalOpen: boolean;
  isRegistrationModalOpen: boolean;
  isAddPcModalOpen: boolean;
  isEquipmentModalOpen: boolean;
}

// ==================== 編輯模式狀態 ====================

export interface EditModeState {
  isEditMode: boolean;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  isAddingContainer: boolean;
}

// ==================== 員工交換狀態 ====================

export interface SwapState {
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: SeatWithRelations[];
  showSwapConfirmModal: boolean;
}

// ==================== 員工管理狀態 ====================

export interface EmployeeManagementState {
  isManagingEmployees: boolean;
  selectedSeatEmployee: Employee | null;
  disabledEmployees: Employee[];
  showDisabledEmployeesModal: boolean;
  selectedEmptySeat: SeatWithRelations | null;
}

// ==================== 註冊狀態 ====================

export interface RegistrationState {
  isRegistrationModalOpen: boolean;
  registrationModalKey: number;
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: SeatWithRelations | null;
}

// ==================== PC 管理狀態 ====================

export interface PCManagementState {
  isAddPcModalOpen: boolean;
  isSelectingSeatForPc: boolean;
  selectedSeatForPc: SeatWithRelations | null;
  pcs: PC[];
}

// ==================== 設備管理狀態 ====================

export interface EquipmentManagementState {
  isEquipmentModalOpen: boolean;
  isSelectingSeatForEquipment: boolean;
  selectedSeatForEquipment: SeatWithRelations | null;
  selectedEquipment: Equipment | null;
  isViewingEquipment: boolean;
  equipments: Equipment[];
}

// ==================== UI Reducer 類型 ====================

export interface UIState {
  // Modal 狀態
  isLoginModalOpen: boolean;
  isTimeClockModalOpen: boolean;
  isAdminMigrationPanelOpen: boolean;
  isPasswordResetModalOpen: boolean;
  
  // 編輯模式
  isEditMode: boolean;
  backupSeatCoordinates: SeatWithRelations[];
  
  // 員工交換
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: SeatWithRelations[];
  showSwapConfirmModal: boolean;
  
  // 畫布
  canvasSize: CanvasSize;
  
  // 時間
  currentTime: Date;
}

export type UIAction =
  | { type: 'SET_LOGIN_MODAL'; payload: boolean }
  | { type: 'SET_TIME_CLOCK_MODAL'; payload: boolean }
  | { type: 'SET_ADMIN_MIGRATION_PANEL'; payload: boolean }
  | { type: 'SET_PASSWORD_RESET_MODAL'; payload: boolean }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_BACKUP_SEATS'; payload: SeatWithRelations[] }
  | { type: 'SET_SWAPPING_EMPLOYEES'; payload: boolean }
  | { type: 'SET_SELECTED_SEATS_FOR_SWAP'; payload: SeatWithRelations[] }
  | { type: 'SET_SWAP_CONFIRM_MODAL'; payload: boolean }
  | { type: 'SET_CANVAS_SIZE'; payload: CanvasSize }
  | { type: 'UPDATE_TIME'; payload: Date }
  | { type: 'RESET_ALL_MODALS' }
  | { type: 'RESET_SWAP_STATE' }
  | { type: 'RESET_EDIT_STATE' };

// ==================== 認證狀態類型 ====================

export interface AuthState {
  user: any | null;
  currentEmployee: Employee | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== 數據獲取狀態類型 ====================

export interface SeatsState extends FetchState {
  seatCoordinates: SeatWithRelations[];
}

export interface ContainersState extends FetchState {
  containers: Container[];
}

export interface EmployeesState extends FetchState {
  employees: Employee[];
  disabledEmployees: Employee[];
}

// ==================== Toast 類型 ====================

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}
