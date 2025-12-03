/**
 * 認證相關事件處理 Hook
 */
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseAuthHandlersProps {
  login: (employee: { id: string; name: string; email: string; role?: string }) => Promise<void>;
  logout: () => void;
  setSelectedSeatEmployee: (value: any) => void;
  setIsEditMode: (value: boolean) => void;
  setIsContainerEditMode: (value: boolean) => void;
  setSelectedContainer: (value: any) => void;
  setEditingContainer: (value: any) => void;
  setIsDragging: (value: boolean) => void;
  setIsAddingContainer: (value: boolean) => void;
  setNewContainerStart: (value: any) => void;
  setNewContainerEnd: (value: any) => void;
  setShowNameDialog: (value: boolean) => void;
  setPendingContainer: (value: any) => void;
  setIsSeatEditMode: (value: boolean) => void;
  setSelectedSeat: (value: any) => void;
  setIsDraggingSeat: (value: boolean) => void;
  setSeatDragPosition: (value: { x: number; y: number }) => void;
  setShowSeatPreview: (value: boolean) => void;
  setBackupContainers: (value: any[]) => void;
  setBackupSeatCoordinates: (value: any[]) => void;
  setIsAdminMigrationPanelOpen: (value: boolean) => void;
  setIsSwappingEmployees: (value: boolean) => void;
  setSelectedSeatsForSwap: (value: any[]) => void;
  setShowSwapConfirmModal: (value: boolean) => void;
  resetRegistration: () => void;
  resetPcManagement: () => void;
  resetEmployeeManagement: () => void;
}

export const useAuthHandlers = ({
  login,
  logout,
  setSelectedSeatEmployee,
  setIsEditMode,
  setIsContainerEditMode,
  setSelectedContainer,
  setEditingContainer,
  setIsDragging,
  setIsAddingContainer,
  setNewContainerStart,
  setNewContainerEnd,
  setShowNameDialog,
  setPendingContainer,
  setIsSeatEditMode,
  setSelectedSeat,
  setIsDraggingSeat,
  setSeatDragPosition,
  setShowSeatPreview,
  setBackupContainers,
  setBackupSeatCoordinates,
  setIsAdminMigrationPanelOpen,
  setIsSwappingEmployees,
  setSelectedSeatsForSwap,
  setShowSwapConfirmModal,
  resetRegistration,
  resetPcManagement,
  resetEmployeeManagement,
}: UseAuthHandlersProps) => {
  const { toast } = useToast();

  const handleLoginSuccess = async (employee: { id: string; name: string; email: string; role?: string }) => {
    await login(employee);
    
    try {
      const { data: fullEmployeeData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employee.id)
        .single();

      if (error) {
        console.error('Error fetching full employee data:', error);
      } else if (fullEmployeeData) {
        setSelectedSeatEmployee(fullEmployeeData);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setSelectedSeatEmployee(employee);
    }
    
    // 設定30分鐘後自動登出
    setTimeout(() => {
      handleLogout();
      toast({
        title: "自動登出",
        description: "由於安全考量，已自動登出",
      });
    }, 30 * 60 * 1000);
  };

  const handleLogout = () => {
    logout();
    setSelectedSeatEmployee(null);
    setIsEditMode(false);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsDragging(false);
    setIsAddingContainer(false);
    setNewContainerStart(null);
    setNewContainerEnd(null);
    setShowNameDialog(false);
    setPendingContainer(null);
    setIsSeatEditMode(false);
    setSelectedSeat(null);
    setIsDraggingSeat(false);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
    resetRegistration();
    resetPcManagement();
    resetEmployeeManagement();
    setIsAdminMigrationPanelOpen(false);
    setIsSwappingEmployees(false);
    setSelectedSeatsForSwap([]);
    setShowSwapConfirmModal(false);
  };

  return {
    handleLoginSuccess,
    handleLogout,
  };
};
