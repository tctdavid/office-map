/**
 * 座位事件處理 Hook
 */
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseSeatEventsProps {
  isSwappingEmployees: boolean;
  isManagingEmployees: boolean;
  isSelectingSeatForRegistration: boolean;
  isSelectingSeatForPc: boolean;
  isSelectingSeatForEquipment: boolean;
  isEditMode: boolean;
  selectedContainer: any;
  selectedSeatsForSwap: any[];
  setSelectedSeatsForSwap: (value: any[]) => void;
  setShowSwapConfirmModal: (value: boolean) => void;
  setSelectedSeatEmployee: (value: any) => void;
  setSelectedEmptySeat: (value: any) => void;
  setShowDisabledEmployeesModal: (value: boolean) => void;
  handleBasicSeatClick: (seat: any, isEditMode: boolean) => void;
  handleDisableEmployee: (employeeId: string, seatId: string) => Promise<void>;
  selectSeatForRegistration: (seat: any) => void;
  selectSeatForPc: (seat: any) => void;
  selectSeatForEquipment: (seat: any) => void;
}

export const useSeatEvents = ({
  isSwappingEmployees,
  isManagingEmployees,
  isSelectingSeatForRegistration,
  isSelectingSeatForPc,
  isSelectingSeatForEquipment,
  isEditMode,
  selectedContainer,
  selectedSeatsForSwap,
  setSelectedSeatsForSwap,
  setShowSwapConfirmModal,
  setSelectedSeatEmployee,
  setSelectedEmptySeat,
  setShowDisabledEmployeesModal,
  handleBasicSeatClick,
  handleDisableEmployee,
  selectSeatForRegistration,
  selectSeatForPc,
  selectSeatForEquipment,
}: UseSeatEventsProps) => {
  const { toast } = useToast();

  // 處理座位點擊（註冊模式）
  const handleSeatClickForRegistration = async (seat: any) => {
    if (!isSelectingSeatForRegistration) return;
    
    if (!seat.is_empty) {
      toast({
        title: "座位已被佔用",
        description: "請選擇其他空座位",
        variant: "destructive"
      });
      return;
    }
    
    const { data, error } = await supabase
      .from('seat_coordinates')
      .select('is_empty, employee_id')
      .eq('id', seat.id)
      .single();
    
    if (error) {
      toast({
        title: "檢查座位失敗",
        description: "無法檢查座位狀態，請重試",
        variant: "destructive"
      });
      return;
    }
    
    if (!data.is_empty || data.employee_id) {
      toast({
        title: "座位已被佔用",
        description: "此座位已被其他人註冊，請選擇其他座位",
        variant: "destructive"
      });
      return;
    }
    
    selectSeatForRegistration(seat);
  };

  // 處理座位點擊
  const handleSeatClick = (e: React.MouseEvent, seat: any) => {
    e.stopPropagation();
    
    // 如果正在交換員工位置
    if (isSwappingEmployees) {
      if (selectedSeatsForSwap.find(s => s.id === seat.id)) {
        toast({
          title: "座位已選中",
          description: "請選擇不同的座位",
          variant: "destructive"
        });
        return;
      }
      
      const newSelection = [...selectedSeatsForSwap, seat];
      setSelectedSeatsForSwap(newSelection);
      
      if (newSelection.length === 1) {
        toast({
          title: "已選中第一個座位",
          description: "請選擇第二個座位進行交換",
        });
      } else if (newSelection.length === 2) {
        setShowSwapConfirmModal(true);
      }
      return;
    }
    
    // 如果正在管理員工
    if (isManagingEmployees) {
      if (seat.employee && seat.employee.is_active !== false) {
        handleDisableEmployee(seat.employee.id, seat.id);
      } else if (!seat.employee || seat.is_empty) {
        setSelectedEmptySeat(seat);
        setShowDisabledEmployeesModal(true);
      }
      return;
    }
    
    // 如果正在選擇註冊座位
    if (isSelectingSeatForRegistration) {
      handleSeatClickForRegistration(seat);
      return;
    }
    
    // 如果正在選擇新增電腦座位
    if (isSelectingSeatForPc) {
      selectSeatForPc(seat);
      return;
    }

    if (isSelectingSeatForEquipment) {
      selectSeatForEquipment(seat);
      return;
    }
    
    // 如果在編輯模式下，需要檢查是否在選中的容器中
    if (isEditMode && selectedContainer && seat.container_id !== selectedContainer.id) {
      toast({
        title: "座位不在選中容器中",
        description: "請在選中的容器中選擇座位",
        variant: "destructive"
      });
      return;
    }
    
    // 設定員工資訊
    if (seat.employee) {
      setSelectedSeatEmployee(seat.employee);
    } else {
      setSelectedSeatEmployee(null);
    }
    
    handleBasicSeatClick(seat, isEditMode);
  };

  return {
    handleSeatClick,
    handleSeatClickForRegistration,
  };
};
