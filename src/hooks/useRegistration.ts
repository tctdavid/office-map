import { useState } from 'react';

/**
 * 員工註冊流程管理 Hook
 */
export const useRegistration = () => {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationModalKey, setRegistrationModalKey] = useState(0);
  const [isSelectingSeatForRegistration, setIsSelectingSeatForRegistration] = useState(false);
  const [selectedSeatForRegistration, setSelectedSeatForRegistration] = useState<any>(null);

  /**
   * 開始註冊流程 - 進入座位選擇模式
   */
  const startRegistration = () => {
    setRegistrationModalKey(prev => prev + 1);
    setIsSelectingSeatForRegistration(true);
  };

  /**
   * 開始編輯個人資料
   */
  const startProfileEdit = () => {
    setRegistrationModalKey(prev => prev + 1);
    setIsRegistrationModalOpen(true);
  };

  /**
   * 選擇註冊座位
   */
  const selectSeatForRegistration = (seat: any) => {
    setSelectedSeatForRegistration(seat);
    setIsRegistrationModalOpen(true);
  };

  /**
   * 取消註冊流程
   */
  const cancelRegistration = () => {
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
  };

  /**
   * 完成註冊
   */
  const completeRegistration = () => {
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
  };

  /**
   * 重置所有註冊狀態
   */
  const resetRegistration = () => {
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
  };

  return {
    // States
    isRegistrationModalOpen,
    registrationModalKey,
    isSelectingSeatForRegistration,
    selectedSeatForRegistration,
    
    // Setters
    setIsRegistrationModalOpen,
    setIsSelectingSeatForRegistration,
    setSelectedSeatForRegistration,
    
    // Actions
    startRegistration,
    startProfileEdit,
    selectSeatForRegistration,
    cancelRegistration,
    completeRegistration,
    resetRegistration,
  };
};
