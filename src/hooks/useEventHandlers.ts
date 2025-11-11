import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { enterEditMode, hasChanges, resetEditState } from '@/utils/editModeHandlers';
import { swapEmployees, swapPcsOnly } from '@/utils/seatSwapHandlers';

interface UseEventHandlersProps {
  login: (employee: any) => Promise<void>;
  logout: () => void;
  setSelectedSeatEmployee: (employee: any) => void;
  fetchEmployees: (isAdmin: boolean) => Promise<void>;
  isAdmin: boolean;
  setSeatCoordinates: (data: any[]) => void;
  completeRegistration: () => void;
  selectedSeatForRegistration: any;
  setSelectedSeat: (seat: any) => void;
  completeAddPc: () => void;
  fetchSeats: () => Promise<void>;
  fetchPcs: () => Promise<void>;
  completeAddEquipment: () => void;
  fetchEquipments: () => Promise<void>;
  saveEquipmentToSeat: (equipmentId: string) => Promise<{ success: boolean; error?: any }>;
}

/**
 * 事件處理器集中管理 Hook
 */
export const useEventHandlers = (props: UseEventHandlersProps) => {
  const { toast } = useToast();

  /**
   * 處理登入成功
   */
  const handleLoginSuccess = async (employee: { id: string; name: string; email: string; role?: string }) => {
    await props.login(employee);
    
    try {
      const { data: fullEmployeeData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employee.id)
        .single();

      if (error) {
        console.error('Error fetching full employee data:', error);
      } else if (fullEmployeeData) {
        props.setSelectedSeatEmployee(fullEmployeeData);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      props.setSelectedSeatEmployee(employee);
    }
    
    setTimeout(() => {
      handleLogout();
      toast({
        title: "自動登出",
        description: "由於安全考量，已自動登出",
      });
    }, 30 * 60 * 1000);
  };

  /**
   * 處理登出
   */
  const handleLogout = () => {
    props.logout();
    props.setSelectedSeatEmployee(null);
  };

  /**
   * 處理註冊成功
   */
  const handleRegistrationSuccess = async () => {
    const { data, error } = await supabase
      .from('seat_coordinates')
      .select(`
        *,
        employee:employees!fk_seat_coordinates_employee_id (
          id, name, photo, department, position, extension, email
        ),
        pc:pcs!fk_seat_coordinates_pc_id (
          id, name, cpu, memory, storage, graphics, case_photo
        )
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      props.setSeatCoordinates(data);
      
      const registeredSeat = data.find(seat => seat.id === props.selectedSeatForRegistration?.id);
      if (registeredSeat && registeredSeat.employee) {
        props.setSelectedSeat(registeredSeat);
        props.setSelectedSeatEmployee(registeredSeat.employee);
      }
    }

    await props.fetchEmployees(props.isAdmin);
    props.completeRegistration();
  };

  /**
   * 處理新增電腦成功
   */
  const handleAddPcSuccess = async () => {
    await props.fetchSeats();
    await props.fetchPcs();
    props.completeAddPc();
    toast({
      title: "電腦新增成功",
      description: "電腦設備已成功新增到座位",
    });
  };

  /**
   * 處理新增設備成功
   */
  const handleAddEquipmentSuccess = async () => {
    await props.fetchSeats();
    await props.fetchEquipments();
    props.completeAddEquipment();
    toast({
      title: "設備新增成功",
      description: "設備已成功新增到座位",
    });
  };

  /**
   * 處理設備保存
   */
  const handleEquipmentSave = async (equipment: any) => {
    if (equipment.id) {
      const result = await props.saveEquipmentToSeat(equipment.id);
      
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

  /**
   * 切換編輯模式
   */
  const createToggleEditMode = (
    isEditMode: boolean,
    containers: any[],
    seatCoordinates: any[],
    backupContainers: any[],
    backupSeatCoordinates: any[],
    setIsEditMode: (value: boolean) => void,
    setBackupContainers: (value: any[]) => void,
    setBackupSeatCoordinates: (value: any[]) => void,
    setContainers: (value: any[]) => void,
    setSeatCoordinates: (value: any[]) => void,
    applyEditState: (state: any) => void
  ) => {
    return () => {
      if (!isEditMode) {
        const backup = enterEditMode(containers, seatCoordinates);
        setBackupContainers(backup.containers);
        setBackupSeatCoordinates(backup.seatCoordinates);
        setIsEditMode(true);
        toast({
          title: "進入編輯模式",
          description: "已進入編輯模式",
        });
      } else {
        const changes = hasChanges(
          { containers, seatCoordinates },
          { containers: backupContainers, seatCoordinates: backupSeatCoordinates }
        );
        
        if (changes.hasContainerChanges || changes.hasSeatChanges) {
          if (confirm("您有未保存的變更。是否要保存變更？\n點擊「確定」保存變更，點擊「取消」放棄變更。")) {
            const state = resetEditState();
            applyEditState(state);
            toast({
              title: "變更已保存",
              description: "已退出編輯模式並保存變更",
            });
          } else {
            setContainers([...backupContainers]);
            setSeatCoordinates([...backupSeatCoordinates]);
            const state = resetEditState();
            applyEditState(state);
            toast({
              title: "變更已取消",
              description: "已退出編輯模式並取消所有變更",
            });
          }
        } else {
          const state = resetEditState();
          applyEditState(state);
          toast({
            title: "退出編輯模式",
            description: "已退出編輯模式",
          });
        }
      }
    };
  };

  /**
   * 交換員工位置
   */
  const handleSwapEmployees = async (
    selectedSeatsForSwap: any[],
    swapPc: boolean,
    fetchSeats: () => Promise<void>,
    setSelectedSeatsForSwap: (value: any[]) => void,
    setShowSwapConfirmModal: (value: boolean) => void,
    setIsSwappingEmployees: (value: boolean) => void
  ) => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    const result = await swapEmployees(seat1, seat2, swapPc);
    
    if (result.success) {
      await fetchSeats();
      setSelectedSeatsForSwap([]);
      setShowSwapConfirmModal(false);
      setIsSwappingEmployees(false);

      toast({
        title: "交換成功",
        description: swapPc ? "員工位置和電腦已成功交換" : "員工位置已成功交換",
      });
    } else {
      toast({
        title: "交換失敗",
        description: "無法完成位置交換",
        variant: "destructive"
      });
    }
  };

  /**
   * 僅交換電腦
   */
  const handleSwapPcsOnly = async (
    selectedSeatsForSwap: any[],
    fetchSeats: () => Promise<void>,
    setSelectedSeatsForSwap: (value: any[]) => void,
    setShowSwapConfirmModal: (value: boolean) => void,
    setIsSwappingEmployees: (value: boolean) => void
  ) => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    const result = await swapPcsOnly(seat1, seat2);
    
    if (result.success) {
      await fetchSeats();
      setSelectedSeatsForSwap([]);
      setShowSwapConfirmModal(false);
      setIsSwappingEmployees(false);

      toast({
        title: "電腦交換成功",
        description: "電腦設備已成功交換",
      });
    } else {
      toast({
        title: "電腦交換失敗",
        description: "無法完成電腦交換",
        variant: "destructive"
      });
    }
  };

  return {
    handleLoginSuccess,
    handleLogout,
    handleRegistrationSuccess,
    handleAddPcSuccess,
    handleAddEquipmentSuccess,
    handleEquipmentSave,
    createToggleEditMode,
    handleSwapEmployees,
    handleSwapPcsOnly,
  };
};
