import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PC, SeatWithRelations } from '@/types';

/**
 * PC 管理 Hook
 */
export const usePcManagement = () => {
  const [isAddPcModalOpen, setIsAddPcModalOpen] = useState(false);
  const [isSelectingSeatForPc, setIsSelectingSeatForPc] = useState(false);
  const [selectedSeatForPc, setSelectedSeatForPc] = useState<SeatWithRelations | null>(null);
  const [pcs, setPcs] = useState<PC[]>([]);

  /**
   * 獲取所有 PC 資料
   */
  const fetchPcs = async () => {
    try {
      const { data, error } = await supabase
        .from('pcs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPcs(data || []);
    } catch (error) {
      console.error('獲取 PC 資料失敗:', error);
    }
  };

  /**
   * 開始新增 PC 流程
   */
  const startAddPc = () => {
    setIsSelectingSeatForPc(true);
  };

  /**
   * 選擇要新增 PC 的座位
   */
  const selectSeatForPc = (seat: SeatWithRelations) => {
    setSelectedSeatForPc(seat);
    setIsSelectingSeatForPc(false);
    setIsAddPcModalOpen(true);
  };

  /**
   * 取消新增 PC 流程
   */
  const cancelAddPc = () => {
    setIsAddPcModalOpen(false);
    setSelectedSeatForPc(null);
    setIsSelectingSeatForPc(false);
  };

  /**
   * 完成新增 PC
   */
  const completeAddPc = () => {
    setSelectedSeatForPc(null);
  };

  /**
   * 重置所有 PC 管理狀態
   */
  const resetPcManagement = () => {
    setIsSelectingSeatForPc(false);
    setSelectedSeatForPc(null);
    setIsAddPcModalOpen(false);
  };

  return {
    // States
    isAddPcModalOpen,
    isSelectingSeatForPc,
    selectedSeatForPc,
    pcs,
    
    // Setters
    setIsAddPcModalOpen,
    setIsSelectingSeatForPc,
    setSelectedSeatForPc,
    setPcs,
    
    // Actions
    fetchPcs,
    startAddPc,
    selectSeatForPc,
    cancelAddPc,
    completeAddPc,
    resetPcManagement,
  };
};
