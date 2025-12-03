/**
 * 成功回調處理 Hook
 */
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseSuccessHandlersProps {
  selectedSeatForRegistration: any;
  isAdmin: boolean;
  setSeatCoordinates: (value: any[]) => void;
  setSelectedSeat: (value: any) => void;
  setSelectedSeatEmployee: (value: any) => void;
  fetchEmployees: (isAdmin: boolean) => Promise<void>;
  fetchSeatCoordinates: () => Promise<void>;
  fetchPcs: () => Promise<void>;
  fetchEquipments: () => Promise<void>;
  completeRegistration: () => void;
  completeAddPc: () => void;
  completeAddEquipment: () => void;
  saveEquipmentToSeat: (equipmentId: string) => Promise<{ success: boolean }>;
}

export const useSuccessHandlers = ({
  selectedSeatForRegistration,
  isAdmin,
  setSeatCoordinates,
  setSelectedSeat,
  setSelectedSeatEmployee,
  fetchEmployees,
  fetchSeatCoordinates,
  fetchPcs,
  fetchEquipments,
  completeRegistration,
  completeAddPc,
  completeAddEquipment,
  saveEquipmentToSeat,
}: UseSuccessHandlersProps) => {
  const { toast } = useToast();

  // 處理註冊成功
  const handleRegistrationSuccess = async () => {
    console.log('handleRegistrationSuccess 被調用了！');
    
    const { data, error } = await supabase
      .from('seat_coordinates')
      .select(`
        *,
        employee:employees!fk_seat_coordinates_employee_id (
          id,
          name,
          photo,
          department,
          position,
          extension,
          email
        ),
        pc:pcs!fk_seat_coordinates_pc_id (
          id,
          name,
          cpu,
          memory,
          storage,
          graphics,
          case_photo
        )
      `)
      .order('created_at', { ascending: false });
    
    console.log('handleRegistrationSuccess 查詢結果:', { data, error, dataLength: data?.length });
    
    if (!error && data) {
      console.log('handleRegistrationSuccess 正在覆蓋座位資料！');
      setSeatCoordinates(data);
      
      const registeredSeat = data.find(seat => seat.id === selectedSeatForRegistration?.id);
      if (registeredSeat && registeredSeat.employee) {
        setSelectedSeat(registeredSeat);
        setSelectedSeatEmployee(registeredSeat.employee);
      }
    }

    await fetchEmployees(isAdmin);
    completeRegistration();
  };

  // 新增電腦成功後的處理
  const handleAddPcSuccess = async () => {
    await fetchSeatCoordinates();
    await fetchPcs();
    completeAddPc();
    toast({
      title: "電腦新增成功",
      description: "電腦設備已成功新增到座位",
    });
  };

  // 設備新增成功後的處理
  const handleAddEquipmentSuccess = async () => {
    await fetchSeatCoordinates();
    await fetchEquipments();
    completeAddEquipment();
    toast({
      title: "設備新增成功",
      description: "設備已成功新增到座位",
    });
  };

  // 設備保存處理
  const handleEquipmentSave = async (equipment: any) => {
    if (equipment.id) {
      const result = await saveEquipmentToSeat(equipment.id);
      
      if (!result.success) {
        toast({
          title: "錯誤",
          description: "更新座位設備時發生錯誤",
          variant: "destructive"
        });
        return;
      }

      await handleAddEquipmentSuccess();
    }
  };

  return {
    handleRegistrationSuccess,
    handleAddPcSuccess,
    handleAddEquipmentSuccess,
    handleEquipmentSave,
  };
};
