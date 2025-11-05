/**
 * 編輯模式處理工具函數
 */

export interface EditModeState {
  isEditMode: boolean;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedContainer: any;
  selectedSeat: any;
  editingContainer: any;
  isDraggingSeat: boolean;
  isAddingContainer: boolean;
}

export interface BackupData {
  containers: any[];
  seatCoordinates: any[];
}

/**
 * 進入編輯模式
 */
export const enterEditMode = (
  containers: any[],
  seatCoordinates: any[]
): BackupData => {
  return {
    containers: [...containers],
    seatCoordinates: [...seatCoordinates]
  };
};

/**
 * 檢查是否有變更
 */
export const hasChanges = (
  current: BackupData,
  backup: BackupData
): { hasContainerChanges: boolean; hasSeatChanges: boolean } => {
  const hasContainerChanges = JSON.stringify(current.containers) !== JSON.stringify(backup.containers);
  const hasSeatChanges = JSON.stringify(current.seatCoordinates) !== JSON.stringify(backup.seatCoordinates);
  
  return { hasContainerChanges, hasSeatChanges };
};

/**
 * 重置所有編輯狀態
 */
export const resetEditState = (): Partial<EditModeState> => {
  return {
    isEditMode: false,
    isContainerEditMode: false,
    isSeatEditMode: false,
    selectedContainer: null,
    selectedSeat: null,
    editingContainer: null,
    isDraggingSeat: false,
    isAddingContainer: false,
  };
};

/**
 * 重置登出相關狀態
 */
export const resetLogoutState = () => {
  return {
    ...resetEditState(),
    selectedSeatEmployee: null,
    isSelectingSeatForRegistration: false,
    selectedSeatForRegistration: null,
    isRegistrationModalOpen: false,
    isSelectingSeatForPc: false,
    selectedSeatForPc: null,
    isAddPcModalOpen: false,
    isManagingEmployees: false,
    showDisabledEmployeesModal: false,
    selectedEmptySeat: null,
    isAdminMigrationPanelOpen: false,
    isSwappingEmployees: false,
    selectedSeatsForSwap: [],
    showSwapConfirmModal: false,
  };
};
