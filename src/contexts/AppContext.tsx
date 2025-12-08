import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSeats } from '@/hooks/useSeats';
import { useContainers } from '@/hooks/useContainers';
import { useEmployees } from '@/hooks/useEmployees';
import { useRegistration } from '@/hooks/useRegistration';
import { usePcManagement } from '@/hooks/usePcManagement';
import { useEquipment } from '@/hooks/useEquipment';
import { resetLogoutState } from '@/utils/editModeHandlers';
import { 
  SeatWithRelations, 
  CanvasSize, 
  UIState, 
  UIAction 
} from '@/types';

// ==================== 初始狀態 ====================

const initialUIState: UIState = {
  isLoginModalOpen: false,
  isTimeClockModalOpen: false,
  isAdminMigrationPanelOpen: false,
  isPasswordResetModalOpen: false,
  isEditMode: false,
  backupSeatCoordinates: [],
  isSwappingEmployees: false,
  selectedSeatsForSwap: [],
  showSwapConfirmModal: false,
  canvasSize: { width: 1060, height: 850 },
  currentTime: new Date(),
};

// ==================== UI Reducer ====================

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_LOGIN_MODAL':
      return { ...state, isLoginModalOpen: action.payload };
    case 'SET_TIME_CLOCK_MODAL':
      return { ...state, isTimeClockModalOpen: action.payload };
    case 'SET_ADMIN_MIGRATION_PANEL':
      return { ...state, isAdminMigrationPanelOpen: action.payload };
    case 'SET_PASSWORD_RESET_MODAL':
      return { ...state, isPasswordResetModalOpen: action.payload };
    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload };
    case 'SET_BACKUP_SEATS':
      return { ...state, backupSeatCoordinates: action.payload };
    case 'SET_SWAPPING_EMPLOYEES':
      return { ...state, isSwappingEmployees: action.payload };
    case 'SET_SELECTED_SEATS_FOR_SWAP':
      return { ...state, selectedSeatsForSwap: action.payload };
    case 'SET_SWAP_CONFIRM_MODAL':
      return { ...state, showSwapConfirmModal: action.payload };
    case 'SET_CANVAS_SIZE':
      return { ...state, canvasSize: action.payload };
    case 'UPDATE_TIME':
      return { ...state, currentTime: action.payload };
    case 'RESET_ALL_MODALS':
      return {
        ...state,
        isLoginModalOpen: false,
        isTimeClockModalOpen: false,
        isAdminMigrationPanelOpen: false,
        isPasswordResetModalOpen: false,
      };
    case 'RESET_SWAP_STATE':
      return {
        ...state,
        isSwappingEmployees: false,
        selectedSeatsForSwap: [],
        showSwapConfirmModal: false,
      };
    case 'RESET_EDIT_STATE':
      return {
        ...state,
        isEditMode: false,
        backupSeatCoordinates: [],
      };
    default:
      return state;
  }
}

// ==================== Context 類型定義 ====================

interface AppContextType {
  // 子模組 hooks
  auth: ReturnType<typeof useAuth>;
  seats: ReturnType<typeof useSeats>;
  containers: ReturnType<typeof useContainers>;
  employees: ReturnType<typeof useEmployees>;
  registration: ReturnType<typeof useRegistration>;
  pcManagement: ReturnType<typeof usePcManagement>;
  equipment: ReturnType<typeof useEquipment>;
  
  // UI 狀態
  ui: UIState;
  dispatch: React.Dispatch<UIAction>;
  
  // 便捷 setter 函數（保持向後兼容）
  setIsLoginModalOpen: (value: boolean) => void;
  setIsTimeClockModalOpen: (value: boolean) => void;
  setIsAdminMigrationPanelOpen: (value: boolean) => void;
  setIsPasswordResetModalOpen: (value: boolean) => void;
  setIsEditMode: (value: boolean) => void;
  setBackupSeatCoordinates: (value: SeatWithRelations[]) => void;
  setIsSwappingEmployees: (value: boolean) => void;
  setSelectedSeatsForSwap: (value: SeatWithRelations[]) => void;
  setShowSwapConfirmModal: (value: boolean) => void;
  setCanvasSize: (value: CanvasSize) => void;
  
  // 組合操作
  handleCompleteLogout: () => void;
  refreshAllData: () => Promise<void>;
  resetAllEditStates: () => void;
}

// ==================== Context 創建 ====================

const AppContext = createContext<AppContextType | null>(null);

// ==================== Provider 組件 ====================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // 整合所有子 Hooks
  const auth = useAuth();
  const seats = useSeats();
  const containers = useContainers();
  const employees = useEmployees();
  const registration = useRegistration();
  const pcManagement = usePcManagement();
  const equipment = useEquipment();
  
  // UI 狀態 reducer
  const [ui, dispatch] = useReducer(uiReducer, initialUIState);
  
  // 時間更新
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'UPDATE_TIME', payload: new Date() });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 監控管理員狀態變化
  useEffect(() => {
    if (!auth.isAdmin) {
      if (employees.isManagingEmployees) {
        employees.resetEmployeeManagement();
        dispatch({ type: 'SET_ADMIN_MIGRATION_PANEL', payload: false });
      }
      if (ui.isSwappingEmployees) {
        dispatch({ type: 'RESET_SWAP_STATE' });
      }
    }
  }, [auth.isAdmin, employees.isManagingEmployees, ui.isSwappingEmployees]);
  
  // ESC 鍵取消座位拖拽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && seats.isDraggingSeat) {
        seats.cancelSeatDrag();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [seats.isDraggingSeat]);
  
  // ==================== 便捷 setter 函數 ====================
  
  const setIsLoginModalOpen = (value: boolean) => 
    dispatch({ type: 'SET_LOGIN_MODAL', payload: value });
  const setIsTimeClockModalOpen = (value: boolean) => 
    dispatch({ type: 'SET_TIME_CLOCK_MODAL', payload: value });
  const setIsAdminMigrationPanelOpen = (value: boolean) => 
    dispatch({ type: 'SET_ADMIN_MIGRATION_PANEL', payload: value });
  const setIsPasswordResetModalOpen = (value: boolean) => 
    dispatch({ type: 'SET_PASSWORD_RESET_MODAL', payload: value });
  const setIsEditMode = (value: boolean) => 
    dispatch({ type: 'SET_EDIT_MODE', payload: value });
  const setBackupSeatCoordinates = (value: SeatWithRelations[]) => 
    dispatch({ type: 'SET_BACKUP_SEATS', payload: value });
  const setIsSwappingEmployees = (value: boolean) => 
    dispatch({ type: 'SET_SWAPPING_EMPLOYEES', payload: value });
  const setSelectedSeatsForSwap = (value: SeatWithRelations[]) => 
    dispatch({ type: 'SET_SELECTED_SEATS_FOR_SWAP', payload: value });
  const setShowSwapConfirmModal = (value: boolean) => 
    dispatch({ type: 'SET_SWAP_CONFIRM_MODAL', payload: value });
  const setCanvasSize = (value: CanvasSize) => 
    dispatch({ type: 'SET_CANVAS_SIZE', payload: value });
  
  // ==================== 組合操作函數 ====================
  
  const handleCompleteLogout = () => {
    resetLogoutState();
    
    // 重置 UI 狀態
    dispatch({ type: 'RESET_ALL_MODALS' });
    dispatch({ type: 'RESET_SWAP_STATE' });
    dispatch({ type: 'RESET_EDIT_STATE' });
    
    // 重置所有子模組
    seats.setSelectedSeat(null);
    seats.setIsSeatEditMode(false);
    seats.setIsDraggingSeat(false);
    
    containers.setSelectedContainer(null);
    containers.setIsContainerEditMode(false);
    containers.setIsAddingContainer(false);
    
    employees.resetEmployeeManagement();
    registration.resetRegistration();
    pcManagement.resetPcManagement();
    equipment.resetEquipmentManagement();
    
    auth.logout();
  };
  
  const refreshAllData = async () => {
    await Promise.all([
      seats.fetchSeats(),
      containers.fetchContainers(),
      employees.fetchEmployees(auth.isAdmin),
      pcManagement.fetchPcs(),
      equipment.fetchEquipments(),
    ]);
  };
  
  const resetAllEditStates = () => {
    dispatch({ type: 'RESET_EDIT_STATE' });
    dispatch({ type: 'RESET_SWAP_STATE' });
    
    seats.setIsSeatEditMode(false);
    seats.setSelectedSeat(null);
    seats.setIsDraggingSeat(false);
    
    containers.setIsContainerEditMode(false);
    containers.setSelectedContainer(null);
    containers.setIsAddingContainer(false);
    
    employees.resetEmployeeManagement();
  };
  
  // ==================== Context Value ====================
  
  const value: AppContextType = {
    auth,
    seats,
    containers,
    employees,
    registration,
    pcManagement,
    equipment,
    ui,
    dispatch,
    setIsLoginModalOpen,
    setIsTimeClockModalOpen,
    setIsAdminMigrationPanelOpen,
    setIsPasswordResetModalOpen,
    setIsEditMode,
    setBackupSeatCoordinates,
    setIsSwappingEmployees,
    setSelectedSeatsForSwap,
    setShowSwapConfirmModal,
    setCanvasSize,
    handleCompleteLogout,
    refreshAllData,
    resetAllEditStates,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ==================== Custom Hook ====================

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// ==================== 向後兼容的 useAppState ====================

export const useAppState = () => {
  const context = useAppContext();
  
  // 返回與原有 useAppState 相同的接口結構
  return {
    auth: context.auth,
    seats: context.seats,
    containers: context.containers,
    employees: context.employees,
    registration: context.registration,
    pcManagement: context.pcManagement,
    equipment: context.equipment,
    
    // 從 ui 狀態解構
    isLoginModalOpen: context.ui.isLoginModalOpen,
    setIsLoginModalOpen: context.setIsLoginModalOpen,
    isTimeClockModalOpen: context.ui.isTimeClockModalOpen,
    setIsTimeClockModalOpen: context.setIsTimeClockModalOpen,
    isAdminMigrationPanelOpen: context.ui.isAdminMigrationPanelOpen,
    setIsAdminMigrationPanelOpen: context.setIsAdminMigrationPanelOpen,
    isPasswordResetModalOpen: context.ui.isPasswordResetModalOpen,
    setIsPasswordResetModalOpen: context.setIsPasswordResetModalOpen,
    
    isEditMode: context.ui.isEditMode,
    setIsEditMode: context.setIsEditMode,
    backupSeatCoordinates: context.ui.backupSeatCoordinates,
    setBackupSeatCoordinates: context.setBackupSeatCoordinates,
    
    isSwappingEmployees: context.ui.isSwappingEmployees,
    setIsSwappingEmployees: context.setIsSwappingEmployees,
    selectedSeatsForSwap: context.ui.selectedSeatsForSwap,
    setSelectedSeatsForSwap: context.setSelectedSeatsForSwap,
    showSwapConfirmModal: context.ui.showSwapConfirmModal,
    setShowSwapConfirmModal: context.setShowSwapConfirmModal,
    
    canvasSize: context.ui.canvasSize,
    setCanvasSize: context.setCanvasSize,
    currentTime: context.ui.currentTime,
    
    handleCompleteLogout: context.handleCompleteLogout,
    refreshAllData: context.refreshAllData,
    resetAllEditStates: context.resetAllEditStates,
  };
};
