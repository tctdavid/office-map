import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment, SeatWithRelations } from '@/types';

/**
 * 設備管理 Hook
 */
export const useEquipment = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isSelectingSeatForEquipment, setIsSelectingSeatForEquipment] = useState(false);
  const [selectedSeatForEquipment, setSelectedSeatForEquipment] = useState<SeatWithRelations | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isViewingEquipment, setIsViewingEquipment] = useState(false);

  /**
   * 獲取所有設備資料
   */
  const fetchEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('獲取設備資料失敗:', error);
    }
  };

  /**
   * 開始選擇座位以新增設備
   */
  const startAddEquipment = () => {
    setIsSelectingSeatForEquipment(true);
  };

  /**
   * 選擇座位以新增設備
   */
  const selectSeatForEquipment = (seat: SeatWithRelations) => {
    setSelectedSeatForEquipment(seat);
    setIsSelectingSeatForEquipment(false);
    setIsEquipmentModalOpen(true);
  };

  /**
   * 點擊設備查看詳情
   */
  const viewEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsViewingEquipment(true);
  };

  /**
   * 編輯設備
   */
  const startEditEquipment = (seatCoordinates: SeatWithRelations[]) => {
    if (selectedEquipment) {
      // 找到包含此設備的座位
      const seatWithEquipment = seatCoordinates.find(
        seat => seat.equipment_id === selectedEquipment.id
      );
      if (seatWithEquipment) {
        setSelectedSeatForEquipment({ 
          ...seatWithEquipment, 
          equipment: selectedEquipment 
        });
        setIsViewingEquipment(false);
        setSelectedEquipment(null);
        setIsEquipmentModalOpen(true);
      }
    }
  };

  /**
   * 保存設備到座位
   */
  const saveEquipmentToSeat = async (equipmentId: string): Promise<{ success: boolean; error?: unknown }> => {
    if (!selectedSeatForEquipment || !equipmentId) {
      return { success: false, error: 'Missing seat or equipment' };
    }

    try {
      const { error } = await supabase
        .from('seat_coordinates')
        .update({ equipment_id: equipmentId })
        .eq('id', selectedSeatForEquipment.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('更新座位設備失敗:', error);
      return { success: false, error };
    }
  };

  /**
   * 取消設備操作
   */
  const cancelEquipmentOperation = () => {
    setIsEquipmentModalOpen(false);
    setSelectedSeatForEquipment(null);
    setIsSelectingSeatForEquipment(false);
  };

  /**
   * 關閉設備查看
   */
  const closeEquipmentView = () => {
    setIsViewingEquipment(false);
    setSelectedEquipment(null);
  };

  /**
   * 完成新增設備
   */
  const completeAddEquipment = () => {
    setSelectedSeatForEquipment(null);
  };

  /**
   * 重置所有設備管理狀態
   */
  const resetEquipmentManagement = () => {
    setIsSelectingSeatForEquipment(false);
    setSelectedSeatForEquipment(null);
    setIsEquipmentModalOpen(false);
    setIsViewingEquipment(false);
    setSelectedEquipment(null);
  };

  return {
    // States
    equipments,
    isEquipmentModalOpen,
    isSelectingSeatForEquipment,
    selectedSeatForEquipment,
    selectedEquipment,
    isViewingEquipment,

    // Setters
    setEquipments,
    setIsEquipmentModalOpen,
    setIsSelectingSeatForEquipment,
    setSelectedSeatForEquipment,
    setSelectedEquipment,
    setIsViewingEquipment,

    // Actions
    fetchEquipments,
    startAddEquipment,
    selectSeatForEquipment,
    viewEquipment,
    startEditEquipment,
    saveEquipmentToSeat,
    cancelEquipmentOperation,
    closeEquipmentView,
    completeAddEquipment,
    resetEquipmentManagement,
  };
};
