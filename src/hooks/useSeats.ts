import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkSeatOverlap, getSeatSize, snapToGrid } from "@/utils/seatCalculations";

export const useSeats = () => {
  const [seatCoordinates, setSeatCoordinates] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isDraggingSeat, setIsDraggingSeat] = useState(false);
  const [seatDragPosition, setSeatDragPosition] = useState({ x: 0, y: 0 });
  const [showSeatPreview, setShowSeatPreview] = useState(false);
  const [containerMousePosition, setContainerMousePosition] = useState({ x: 0, y: 0 });
  const [isSeatEditMode, setIsSeatEditMode] = useState(false);
  const [selectedSeatTemplate, setSelectedSeatTemplate] = useState<string>('120x70');
  
  const { toast } = useToast();

  /**
   * 獲取座位資料
   */
  const fetchSeats = async () => {
    console.log('開始載入座位資料...');
    
    // First, let's try a simple query to see if we can get basic seat data
    const { data: basicData, error: basicError } = await supabase
      .from('seat_coordinates')
      .select('*');
    
    console.log('基本座位資料:', { basicData, basicError, count: basicData?.length });
    
    if (basicError) {
      console.error('基本查詢錯誤:', basicError);
      return;
    }
    
    // Now try with associations using the existing foreign key constraint names
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
          email,
          is_active
        ),
        pc:pcs!fk_seat_coordinates_pc_id (
          id,
          name,
          cpu,
          memory,
          storage,
          graphics,
          case_photo,
          monitor_a,
          monitor_a_photo,
          monitor_b,
          monitor_b_photo
        ),
        equipment:equipment!fk_seat_coordinates_equipment_id (
          id,
          product,
          supplier,
          ip,
          sn,
          contact_person,
          mac_adds,
          purchase_date,
          photo,
          notes
        )
      `)
      .order('created_at', { ascending: false });
    
    console.log('完整座位資料載入結果:', { data, error, dataLength: data?.length });
    
    if (error) {
      console.error('Error fetching seat coordinates:', error);
    } else {
      // 更新座位資料並同步 is_empty 狀態
      const updatedData = data?.map(seat => ({
        ...seat,
        is_empty: !seat.employee_id && !seat.pc_id && !seat.equipment_id
      })) || [];
      
      setSeatCoordinates(updatedData);
    }
  };

  /**
   * 刪除座位
   */
  const deleteSeat = async (seatToDelete?: any) => {
    const targetSeat = seatToDelete || selectedSeat;
    
    if (!targetSeat) {
      toast({
        title: "請選擇座位",
        description: "請先選擇要刪除的座位",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('seat_coordinates')
        .delete()
        .eq('id', targetSeat.id);

      if (error) {
        console.error('Error deleting seat:', error);
        toast({
          title: "刪除失敗",
          description: "無法刪除座位",
          variant: "destructive"
        });
      } else {
        setSeatCoordinates(seatCoordinates.filter(s => s.id !== targetSeat.id));
        if (selectedSeat?.id === targetSeat.id) {
          setSelectedSeat(null);
        }
        toast({
          title: "刪除成功",
          description: "座位已刪除",
        });
      }
    } catch (error) {
      console.error('Error deleting seat:', error);
      toast({
        title: "刪除失敗",
        description: "發生錯誤",
        variant: "destructive"
      });
    }
  };

  /**
   * 新增座位到資料庫
   */
  const addSeat = async (seat: any) => {
    try {
      const { data, error } = await supabase
        .from('seat_coordinates')
        .insert({
          id: seat.id,
          x: seat.x,
          y: seat.y,
          pixel_x: seat.pixel_x,
          pixel_y: seat.pixel_y,
          container_id: seat.container_id,
          container: seat.container,
          seat_template: seat.seat_template,
          is_empty: seat.is_empty,
          employee_id: seat.employee_id,
          pc_id: seat.pc_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating seat:', error);
        toast({
          title: "創建失敗",
          description: "無法創建新座位",
          variant: "destructive"
        });
        return false;
      } else {
        setSeatCoordinates([data, ...seatCoordinates]);
        toast({
          title: "創建成功",
          description: "新座位已創建",
        });
        return true;
      }
    } catch (error) {
      console.error('Error saving seat:', error);
      toast({
        title: "創建失敗",
        description: "發生錯誤",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * 更新座位位置
   */
  const updateSeatPosition = async (seatId: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('seat_coordinates')
        .update({ x, y })
        .eq('id', seatId);

      if (error) {
        console.error('Error updating seat position:', error);
        toast({
          title: "更新失敗",
          description: "無法更新座位位置",
          variant: "destructive"
        });
        return false;
      } else {
        // 更新本地狀態
        setSeatCoordinates(seats => 
          seats.map(seat => 
            seat.id === seatId 
              ? { ...seat, x, y }
              : seat
          )
        );
        
        toast({
          title: "座位已移動",
          description: `座位已移動到新位置 (${x}, ${y})`,
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating seat position:', error);
      return false;
    }
  };

  /**
   * 處理座位點擊（基本邏輯）
   * 注意：這個函數應該在父組件中被擴展，以處理更多的業務邏輯
   */
  const handleBasicSeatClick = (seat: any, isEditMode: boolean = false) => {
    setSelectedSeat(seat);
    console.log('Selected seat:', seat);
    
    // 如果在編輯模式且已經選中同一個座位，開始拖拽模式
    if (selectedSeat?.id === seat.id && isEditMode) {
      setIsDraggingSeat(true);
      setSeatDragPosition({ x: seat.x, y: seat.y });
      toast({
        title: "拖拽模式",
        description: "移動滑鼠至新位置後點擊釋放座位",
      });
    } else {
      const seatInfo = seat.employee ? `座位 ${seat.id} - ${seat.employee.name}` : `座位 ${seat.id}`;
      toast({
        title: "座位已選中",
        description: isEditMode ? `已選中${seatInfo}，再次點擊可進入拖拽模式` : `已選中${seatInfo}`,
      });
    }
  };

  /**
   * 取消座位拖拽
   */
  const cancelSeatDrag = () => {
    setIsDraggingSeat(false);
    setSeatDragPosition({ x: 0, y: 0 });
    toast({
      title: "拖拽已取消",
      description: "座位拖拽已取消",
    });
  };

  /**
   * 切換座位編輯模式
   */
  const toggleSeatEditMode = (selectedContainer: any) => {
    const wasInSeatEditMode = isSeatEditMode;
    setIsSeatEditMode(!isSeatEditMode);
    
    if (wasInSeatEditMode) {
      // 退出座位編輯模式時清除座位相關狀態
      setSelectedSeat(null);
      setIsDraggingSeat(false);
      setSeatDragPosition({ x: 0, y: 0 });
      setShowSeatPreview(false);
    }
    
    if (!wasInSeatEditMode && !selectedContainer) {
      toast({
        title: "請選擇容器",
        description: "請先選擇一個容器來新增座位",
        variant: "destructive"
      });
      setIsSeatEditMode(false);
      return;
    }
    
    toast({
      title: wasInSeatEditMode ? "退出座位編輯" : "進入座位編輯",
      description: wasInSeatEditMode ? "已退出座位編輯模式" : "點擊容器內位置放置座位",
    });
  };

  /**
   * 處理容器點擊以放置座位
   */
  const handleContainerClickForSeat = async (
    e: React.MouseEvent,
    container: any,
    selectedContainer: any,
    isEditMode: boolean
  ) => {
    // 只有在編輯模式且座位編輯模式開啟時才允許新增座位
    if (!isEditMode || !isSeatEditMode) return;
    
    // 只能在選中的編輯容器中新增座位
    if (!selectedContainer || selectedContainer.id !== container.id) {
      toast({
        title: "請選擇容器",
        description: "請先選擇要編輯的容器",
        variant: "destructive"
      });
      return;
    }
    
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const seatSize = getSeatSize(selectedSeatTemplate);
    
    const newSeat = {
      id: `seat_${Date.now()}`,
      x: snapToGrid(mouseX),
      y: snapToGrid(mouseY),
      pixel_x: seatSize.width,
      pixel_y: seatSize.height,
      container_id: container.id,
      container: container.name,
      seat_template: selectedSeatTemplate,
      is_empty: true,
      employee_id: null,
      pc_id: null
    };
    
    // 檢查座位是否超出容器邊界
    if (newSeat.x + newSeat.pixel_x > container.width || 
        newSeat.y + newSeat.pixel_y > container.height ||
        newSeat.x < 0 || newSeat.y < 0) {
      toast({
        title: "座位超出邊界",
        description: "座位不能超出容器邊界",
        variant: "destructive"
      });
      return;
    }
    
    // 檢查重疊
    if (checkSeatOverlap(newSeat, seatCoordinates, container.id)) {
      toast({
        title: "座位重疊",
        description: "座位不能與其他座位重疊",
        variant: "destructive"
      });
      return;
    }
    
    // 新增座位到資料庫
    await addSeat(newSeat);
  };

  return {
    // 狀態
    seatCoordinates,
    selectedSeat,
    isDraggingSeat,
    seatDragPosition,
    showSeatPreview,
    containerMousePosition,
    isSeatEditMode,
    selectedSeatTemplate,
    
    // 設置函數
    setSeatCoordinates,
    setSelectedSeat,
    setIsDraggingSeat,
    setSeatDragPosition,
    setShowSeatPreview,
    setContainerMousePosition,
    setIsSeatEditMode,
    setSelectedSeatTemplate,
    
    // 操作函數
    fetchSeats,
    deleteSeat,
    addSeat,
    updateSeatPosition,
    handleBasicSeatClick,
    cancelSeatDrag,
    toggleSeatEditMode,
    handleContainerClickForSeat,
  };
};
