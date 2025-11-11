import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSeats } from './useSeats';
import { useContainers } from './useContainers';
import { useEmployees } from './useEmployees';
import { useRegistration } from './useRegistration';
import { usePcManagement } from './usePcManagement';
import { useEquipment } from './useEquipment';
import { resetLogoutState } from '@/utils/editModeHandlers';

/**
 * 中央狀態管理 Hook - 整合所有子 hooks 和全局狀態
 * 提供統一的接口來訪問和管理應用的所有狀態
 */
export const useAppState = () => {
  // ==================== 整合所有子 Hooks ====================
  
  // 認證狀態
  const auth = useAuth();
  
  // 座位管理
  const seats = useSeats();
  
  // 容器管理
  const containers = useContainers();
  
  // 員工管理
  const employees = useEmployees();
  
  // 註冊流程
  const registration = useRegistration();
  
  // PC 管理
  const pcManagement = usePcManagement();
  
  // 設備管理
  const equipment = useEquipment();
  
  // ==================== 全局 UI 狀態 ====================
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTimeClockModalOpen, setIsTimeClockModalOpen] = useState(false);
  const [isAdminMigrationPanelOpen, setIsAdminMigrationPanelOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  
  // ==================== 編輯模式狀態 ====================
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [backupSeatCoordinates, setBackupSeatCoordinates] = useState<any[]>([]);
  
  // ==================== 員工交換功能狀態 ====================
  
  const [isSwappingEmployees, setIsSwappingEmployees] = useState(false);
  const [selectedSeatsForSwap, setSelectedSeatsForSwap] = useState<any[]>([]);
  const [showSwapConfirmModal, setShowSwapConfirmModal] = useState(false);
  
  // ==================== 畫布狀態 ====================
  
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number}>({
    width: 1060, 
    height: 850
  });
  
  // ==================== 時間顯示（GMT+8） ====================
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // ==================== 副作用管理 ====================
  
  // 監控管理員狀態變化，非管理員時重置管理功能
  useEffect(() => {
    if (!auth.isAdmin) {
      if (employees.isManagingEmployees) {
        employees.resetEmployeeManagement();
        setIsAdminMigrationPanelOpen(false);
      }
      if (isSwappingEmployees) {
        setIsSwappingEmployees(false);
        setSelectedSeatsForSwap([]);
        setShowSwapConfirmModal(false);
      }
    }
  }, [auth.isAdmin, employees.isManagingEmployees, isSwappingEmployees]);
  
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
  
  // ==================== 組合操作函數 ====================
  
  /**
   * 完整的登出流程
   */
  const handleCompleteLogout = () => {
    // 重置所有狀態
    const logoutStates = resetLogoutState();
    
    // 應用重置狀態
    setIsEditMode(false);
    setIsLoginModalOpen(false);
    setIsTimeClockModalOpen(false);
    setIsAdminMigrationPanelOpen(false);
    setIsPasswordResetModalOpen(false);
    setIsSwappingEmployees(false);
    setSelectedSeatsForSwap([]);
    setShowSwapConfirmModal(false);
    setBackupSeatCoordinates([]);
    
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
    
    // 執行認證登出
    auth.logout();
  };
  
  /**
   * 重新整理所有資料
   */
  const refreshAllData = async () => {
    await Promise.all([
      seats.fetchSeats(),
      containers.fetchContainers(),
      employees.fetchEmployees(auth.isAdmin),
      pcManagement.fetchPcs(),
      equipment.fetchEquipments(),
    ]);
  };
  
  /**
   * 重置所有編輯狀態
   */
  const resetAllEditStates = () => {
    setIsEditMode(false);
    seats.setIsSeatEditMode(false);
    seats.setSelectedSeat(null);
    seats.setIsDraggingSeat(false);
    
    containers.setIsContainerEditMode(false);
    containers.setSelectedContainer(null);
    containers.setIsAddingContainer(false);
    
    employees.resetEmployeeManagement();
    
    setIsSwappingEmployees(false);
    setSelectedSeatsForSwap([]);
  };
  
  // ==================== 返回統一的狀態和方法介面 ====================
  
  return {
    // 子模組 hooks（完整的狀態和方法）
    auth,
    seats,
    containers,
    employees,
    registration,
    pcManagement,
    equipment,
    
    // 全局 UI 狀態
    isLoginModalOpen,
    setIsLoginModalOpen,
    isTimeClockModalOpen,
    setIsTimeClockModalOpen,
    isAdminMigrationPanelOpen,
    setIsAdminMigrationPanelOpen,
    isPasswordResetModalOpen,
    setIsPasswordResetModalOpen,
    
    // 編輯模式
    isEditMode,
    setIsEditMode,
    backupSeatCoordinates,
    setBackupSeatCoordinates,
    
    // 員工交換
    isSwappingEmployees,
    setIsSwappingEmployees,
    selectedSeatsForSwap,
    setSelectedSeatsForSwap,
    showSwapConfirmModal,
    setShowSwapConfirmModal,
    
    // 畫布
    canvasSize,
    setCanvasSize,
    
    // 時間
    currentTime,
    
    // 組合操作
    handleCompleteLogout,
    refreshAllData,
    resetAllEditStates,
  };
};
