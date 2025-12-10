// ==================== 組件 Props 類型定義 ====================

import { 
  Employee, 
  Container, 
  SeatWithRelations, 
  PC, 
  Equipment 
} from './database';
import { 
  CanvasSize, 
  Position, 
  SeatTemplateSize 
} from './ui';

// ==================== Header 組件 Props ====================

export interface HeaderProps {
  currentTime: Date;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  currentEmployeeName?: string;
  user: any | null;
  isAdmin: boolean;
  isEditMode: boolean;
  isSelectingSeatForPc: boolean;
  isSelectingSeatForEquipment: boolean;
  isViewingEquipment: boolean;
  isEquipmentModalOpen: boolean;
  isManagingEmployees: boolean;
  isSwappingEmployees: boolean;
  onToggleEditMode: () => void;
  onAddPcClick: () => void;
  onStartAddEquipment: () => void;
  onToggleManagingEmployees: () => void;
  onToggleSwappingEmployees: () => void;
  onRestoreMissingEmployees: () => void;
  onOpenPasswordReset: () => void;
  onProfileEdit: () => void;
  onOpenTimeClock: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

// ==================== Canvas 組件 Props ====================

export interface CanvasAreaProps {
  canvasSize: CanvasSize;
  isEditMode: boolean;
  isAddingContainer: boolean;
  isDraggingSeat: boolean;
  isSeatEditMode: boolean;
  selectedContainer: Container | null;
  containers: Container[];
  editingContainer: Container | null;
  isContainerEditMode: boolean;
  seatCoordinates: SeatWithRelations[];
  selectedSeat: SeatWithRelations | null;
  seatDragPosition: Position;
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: SeatWithRelations[];
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: SeatWithRelations | null;
  selectedSeatTemplate: string;
  showSeatPreview: boolean;
  containerMousePosition: Position;
  newContainerStart: Position | null;
  newContainerEnd: Position | null;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onContainerClick: (container: Container) => void;
  onContainerClickForSeat: (e: React.MouseEvent, container: Container) => void;
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  onSeatClick: (seat: SeatWithRelations) => void;
  onEquipmentClick: (equipment: Equipment) => void;
  getRubberBandStyle: () => React.CSSProperties;
  setSeatDragPosition: (position: Position) => void;
  setContainerMousePosition: (position: Position) => void;
  setShowSeatPreview: (show: boolean) => void;
}

export interface ContainerRendererProps {
  container: Container;
  isEditMode: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editingContainer: Container | null;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  showSeatPreview: boolean;
  containerMousePosition: Position;
  seatCoordinates: SeatWithRelations[];
  selectedSeat: SeatWithRelations | null;
  seatDragPosition: Position;
  isDraggingSeat: boolean;
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: SeatWithRelations[];
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: SeatWithRelations | null;
  onContainerClick: () => void;
  onContainerClickForSeat: (e: React.MouseEvent, container: Container) => void;
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  onSeatClick: (seat: SeatWithRelations) => void;
  onEquipmentClick: (equipment: Equipment) => void;
  setSeatDragPosition: (position: Position) => void;
  setContainerMousePosition: (position: Position) => void;
  setShowSeatPreview: (show: boolean) => void;
}

export interface SeatRendererProps {
  seat: SeatWithRelations;
  isEditMode: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dragPosition: Position;
  isSwapping: boolean;
  isSelectedForSwap: boolean;
  isSelectingForRegistration: boolean;
  isSelectedForRegistration: boolean;
  onClick: () => void;
  onEquipmentClick: (equipment: Equipment) => void;
}

// ==================== Right Panel 組件 Props ====================

export interface RightPanelProps {
  isSelectingSeatForRegistration: boolean;
  isEditMode: boolean;
  selectedSeatEmployee: Employee | null;
  onCancelSelection: () => void;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedContainer: Container | null;
  selectedSeat: SeatWithRelations | null;
  onStartAddingContainer: () => void;
  onToggleContainerEditMode: () => void;
  onDeleteContainer: () => void;
  onToggleSeatEditMode: () => void;
  onDeleteSeat: () => void;
  selectedSeatTemplate: string;
  onTemplateChange: (template: string) => void;
  currentUserId: string | null;
  pcData?: PC;
}

export interface EmployeeInfoSectionProps {
  isSelectingSeatForRegistration: boolean;
  selectedSeatEmployee: Employee | null;
  onCancelSelection: () => void;
}

export interface EditToolsSectionProps {
  isEditMode: boolean;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedContainer: Container | null;
  selectedSeat: SeatWithRelations | null;
  onStartAddingContainer: () => void;
  onToggleContainerEditMode: () => void;
  onDeleteContainer: () => void;
  onToggleSeatEditMode: () => void;
  onDeleteSeat: () => void;
}

export interface SeatTemplateSelectorProps {
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  onTemplateChange: (template: string) => void;
}

export interface ContainerEditSectionProps {
  editingContainer: Container | null;
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  onContainerNameChange: (name: string) => void;
  onSaveContainerChanges: () => void;
  onCancelContainerChanges: () => void;
  onTemplateChange: (template: string) => void;
}

export interface PcEquipmentSectionProps {
  selectedSeat: SeatWithRelations | null;
}

// ==================== Modal 組件 Props ====================

export interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export interface RegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSeat: SeatWithRelations | null;
  setSelectedSeat: (seat: SeatWithRelations | null) => void;
  setIsSelectingSeat: (selecting: boolean) => void;
  containers: Container[];
  onSuccess: (employee: Employee, seatId: string) => void;
  existingUser?: any;
  existingEmployee?: Employee;
}

export interface AddPcModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSeat: SeatWithRelations | null;
  setSelectedSeat: (seat: SeatWithRelations | null) => void;
  setIsSelectingSeat: (selecting: boolean) => void;
  onSuccess: () => void;
}

export interface EquipmentModalProps {
  isOpen: boolean;
  selectedSeat: SeatWithRelations | null;
  onCancel: () => void;
  onSave: (equipment: Equipment) => void;
}

export interface TimeClockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SwapConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSeats: SeatWithRelations[];
  onConfirmSwap: () => void;
  onSwapPcsOnly: () => void;
  onCancel: () => void;
}

export interface DisabledEmployeesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabledEmployees: Employee[];
  selectedEmptySeat: SeatWithRelations | null;
  onEnableEmployee: (employeeId: string, seatId: string) => void;
}

export interface ContainerNameDialogProps {
  isOpen: boolean;
  containerName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

// ==================== Hook 回傳類型 ====================

export interface UseAuthReturn {
  user: any | null;
  currentEmployee: Employee | null;
  isAdmin: boolean;
  login: (employee: Employee) => Promise<void>;
  logout: () => void;
  setUser: (user: any) => void;
  setCurrentEmployee: (employee: Employee | null) => void;
}

export interface UseSeatsReturn {
  seatCoordinates: SeatWithRelations[];
  selectedSeat: SeatWithRelations | null;
  isDraggingSeat: boolean;
  seatDragPosition: Position;
  showSeatPreview: boolean;
  containerMousePosition: Position;
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  isLoading: boolean;
  error: string | null;
  setSeatCoordinates: (seats: SeatWithRelations[]) => void;
  setSelectedSeat: (seat: SeatWithRelations | null) => void;
  setIsDraggingSeat: (dragging: boolean) => void;
  setSeatDragPosition: (position: Position) => void;
  setShowSeatPreview: (show: boolean) => void;
  setContainerMousePosition: (position: Position) => void;
  setIsSeatEditMode: (mode: boolean) => void;
  setSelectedSeatTemplate: (template: string) => void;
  fetchSeats: () => Promise<void>;
  deleteSeat: (seat?: SeatWithRelations) => Promise<void>;
  addSeat: (seat: any) => Promise<boolean>;
  updateSeatPosition: (seatId: string, x: number, y: number) => Promise<boolean>;
  handleBasicSeatClick: (seat: SeatWithRelations, isEditMode?: boolean) => void;
  cancelSeatDrag: () => void;
  toggleSeatEditMode: (selectedContainer: Container | null) => void;
  handleContainerClickForSeat: (e: React.MouseEvent, container: Container, selectedContainer: Container | null, isEditMode: boolean) => void;
}

export interface UseContainersReturn {
  containers: Container[];
  selectedContainer: Container | null;
  editingContainer: Container | null;
  isContainerEditMode: boolean;
  isAddingContainer: boolean;
  newContainerStart: Position | null;
  newContainerEnd: Position | null;
  showNameDialog: boolean;
  newContainerName: string;
  pendingContainer: Partial<Container> | null;
  isDragging: boolean;
  dragHandle: string;
  backupContainers: Container[];
  isLoading: boolean;
  error: string | null;
  setContainers: (containers: Container[]) => void;
  setSelectedContainer: (container: Container | null) => void;
  setEditingContainer: (container: Container | null) => void;
  setIsContainerEditMode: (mode: boolean) => void;
  setIsAddingContainer: (adding: boolean) => void;
  setNewContainerStart: (position: Position | null) => void;
  setNewContainerEnd: (position: Position | null) => void;
  setShowNameDialog: (show: boolean) => void;
  setNewContainerName: (name: string) => void;
  setPendingContainer: (container: Partial<Container> | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragHandle: (handle: string) => void;
  setBackupContainers: (containers: Container[]) => void;
  fetchContainers: () => Promise<void>;
  checkContainerOverlap: (container: Partial<Container>, excludeId?: string) => boolean;
  handleContainerClick: (container: Container) => void;
  toggleContainerEditMode: () => void;
  startAddingContainer: () => void;
  handleContainerNameChange: (name: string) => void;
  handleMouseDown: (e: React.MouseEvent, handle: string) => void;
  handleCanvasMouseDownForContainer: (e: React.MouseEvent, canvasSize: CanvasSize) => boolean;
  handleCanvasMouseMoveForContainer: (e: React.MouseEvent, canvasSize: CanvasSize) => boolean;
  handleCanvasMouseUpForContainer: () => boolean;
  saveContainerChanges: () => Promise<void>;
  saveNewContainer: () => Promise<void>;
  cancelNewContainer: () => void;
  cancelContainerChanges: () => void;
  deleteContainer: () => Promise<void>;
  getRubberBandStyle: () => React.CSSProperties;
}

export interface UseEmployeesReturn {
  employees: Employee[];
  selectedSeatEmployee: Employee | null;
  isManagingEmployees: boolean;
  disabledEmployees: Employee[];
  showDisabledEmployeesModal: boolean;
  selectedEmptySeat: SeatWithRelations | null;
  isLoading: boolean;
  error: string | null;
  setEmployees: (employees: Employee[]) => void;
  setSelectedSeatEmployee: (employee: Employee | null) => void;
  setIsManagingEmployees: (managing: boolean) => void;
  setDisabledEmployees: (employees: Employee[]) => void;
  setShowDisabledEmployeesModal: (show: boolean) => void;
  setSelectedEmptySeat: (seat: SeatWithRelations | null) => void;
  fetchEmployees: (isAdmin: boolean) => Promise<void>;
  handleDisableEmployee: (employeeId: string, seatId: string, isAdmin: boolean, onSuccess?: () => void) => Promise<void>;
  handleEnableEmployee: (employeeId: string, seatId: string, isAdmin: boolean, onSuccess?: () => void) => Promise<void>;
  resetEmployeeManagement: () => void;
}
