import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import WorkLogPanel from "@/components/WorkLogPanel";
import WorkLogViewer from "@/components/WorkLogViewer";
import PcDataDisplay from "@/components/PcDataDisplay";
import AdminMigrationPanel from "@/components/AdminMigrationPanel";
import RightPanel from "@/components/RightPanel";
import Header from "@/components/Header";
import { CanvasArea, ColorLegend } from "@/components/Canvas";
import { ModalManager } from "@/components/Modals";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/hooks/useAppState";
import { getStaffPhotoUrl, getEquipmentPhotoUrl } from "@/lib/supabase-storage";
import { getSeatSize, snapToGrid, checkSeatOverlap } from "@/utils/seatCalculations";
import { getSeatColor } from "@/utils/colorMapping";
import { enterEditMode, hasChanges, resetEditState, resetLogoutState } from "@/utils/editModeHandlers";
import { swapEmployees, swapPcsOnly, restoreMissingEmployeeAssignments } from "@/utils/seatSwapHandlers";

const Index = () => {
  // 使用統一的狀態管理層
  const appState = useAppState();
  const { toast } = useToast();
  
  // 解構常用的狀態和方法（為了方便訪問）
  const {
    // Auth
    auth: { user, currentEmployee, isAdmin, login, logout },
    
    // Seats
    seats: {
      seatCoordinates,
      selectedSeat,
      isDraggingSeat,
      seatDragPosition,
      showSeatPreview,
      containerMousePosition,
      isSeatEditMode,
      selectedSeatTemplate,
      setSeatCoordinates,
      setSelectedSeat,
      setIsDraggingSeat,
      setSeatDragPosition,
      setShowSeatPreview,
      setContainerMousePosition,
      setIsSeatEditMode,
      setSelectedSeatTemplate,
      fetchSeats,
      deleteSeat: deleteSeatFromHook,
      updateSeatPosition,
      handleBasicSeatClick,
      cancelSeatDrag,
      toggleSeatEditMode: toggleSeatEditModeFromHook,
      handleContainerClickForSeat: handleContainerClickForSeatFromHook,
    },
    
    // Containers
    containers: {
      containers,
      selectedContainer,
      editingContainer,
      isContainerEditMode,
      isAddingContainer,
      newContainerStart,
      newContainerEnd,
      showNameDialog,
      newContainerName,
      pendingContainer,
      isDragging,
      dragHandle,
      backupContainers,
      setContainers,
      setSelectedContainer,
      setEditingContainer,
      setIsContainerEditMode,
      setIsAddingContainer,
      setNewContainerStart,
      setNewContainerEnd,
      setShowNameDialog,
      setNewContainerName,
      setPendingContainer,
      setIsDragging,
      setBackupContainers,
      fetchContainers,
      checkContainerOverlap,
      handleContainerClick,
      toggleContainerEditMode,
      startAddingContainer,
      handleContainerNameChange,
      handleMouseDown,
      handleCanvasMouseDownForContainer,
      handleCanvasMouseMoveForContainer,
      handleCanvasMouseUpForContainer,
      saveContainerChanges,
      saveNewContainer,
      cancelNewContainer,
      cancelContainerChanges,
      deleteContainer,
      getRubberBandStyle,
    },
    
    // Employees
    employees: {
      employees,
      selectedSeatEmployee,
      isManagingEmployees,
      disabledEmployees,
      showDisabledEmployeesModal,
      selectedEmptySeat,
      setSelectedSeatEmployee,
      setIsManagingEmployees,
      setShowDisabledEmployeesModal,
      setSelectedEmptySeat,
      fetchEmployees,
      handleDisableEmployee: handleDisableEmployeeFromHook,
      handleEnableEmployee: handleEnableEmployeeFromHook,
      resetEmployeeManagement,
    },
    
    // Registration
    registration: {
      isRegistrationModalOpen,
      registrationModalKey,
      isSelectingSeatForRegistration,
      selectedSeatForRegistration,
      setIsRegistrationModalOpen,
      setIsSelectingSeatForRegistration,
      setSelectedSeatForRegistration,
      startRegistration,
      startProfileEdit,
      selectSeatForRegistration,
      cancelRegistration,
      completeRegistration,
      resetRegistration,
    },
    
    // PC Management
    pcManagement: {
      isAddPcModalOpen,
      isSelectingSeatForPc,
      selectedSeatForPc,
      pcs,
      setIsAddPcModalOpen,
      setIsSelectingSeatForPc,
      setSelectedSeatForPc,
      setPcs,
      fetchPcs,
      startAddPc,
      selectSeatForPc,
      cancelAddPc,
      completeAddPc,
      resetPcManagement,
    },
    
    // Equipment
    equipment: {
      equipments,
      isEquipmentModalOpen,
      isSelectingSeatForEquipment,
      selectedSeatForEquipment,
      selectedEquipment,
      isViewingEquipment,
      setIsEquipmentModalOpen,
      setIsSelectingSeatForEquipment,
      setSelectedSeatForEquipment,
      setSelectedEquipment,
      setIsViewingEquipment,
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
    },
    
    // Global UI State
    isLoginModalOpen,
    setIsLoginModalOpen,
    isTimeClockModalOpen,
    setIsTimeClockModalOpen,
    isAdminMigrationPanelOpen,
    setIsAdminMigrationPanelOpen,
    isPasswordResetModalOpen,
    setIsPasswordResetModalOpen,
    
    // Edit Mode
    isEditMode,
    setIsEditMode,
    backupSeatCoordinates,
    setBackupSeatCoordinates,
    
    // Employee Swap
    isSwappingEmployees,
    setIsSwappingEmployees,
    selectedSeatsForSwap,
    setSelectedSeatsForSwap,
    showSwapConfirmModal,
    setShowSwapConfirmModal,
    
    // Canvas
    canvasSize,
    setCanvasSize,
    
    // Time
    currentTime,
    
    // Combined Actions
    handleCompleteLogout,
    refreshAllData,
    resetAllEditStates,
  } = appState;
  
  // 時間格式化函數
  const formatHeaderTime = (d: Date) => d.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });
  const formatHeaderDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });

  const fetchSeatCoordinates = async () => {
    await fetchSeats();
  };

  useEffect(() => {
    let logoutTimer: NodeJS.Timeout | null = null;

    // 清理timer的函數
    const clearTimer = () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    };

    // 載入畫布大小資料
    const fetchCanvasSize = async () => {
      const { data, error } = await supabase
        .from('floor_containers')
        .select('width, height')
        .limit(1);
      
      if (error) {
        console.error('Error fetching canvas size:', error);
      } else if (data && data.length > 0) {
        setCanvasSize({
          width: data[0].width || 1060,
          height: data[0].height || 850
        });
      }
    };

    // 載入容器資料 - 現在由 hook 提供


    fetchCanvasSize();
    fetchContainers();
    fetchSeatCoordinates();
    fetchPcs();
    fetchEquipments();

    return () => {
      clearTimer();
    };
  }, []);

  const handleLoginSuccess = async (employee: {id: string, name: string, email: string, role?: string}) => {
    await login(employee);
    
    // 嘗試從資料庫獲取完整員工資料
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
      setSelectedSeatEmployee(employee); // 使用基本資料作為後備
    }
    
    // 設定30分鐘後自動登出
    const logoutTimer = setTimeout(() => {
      handleLogout();
      toast({
        title: "自動登出",
        description: "由於安全考量，已自動登出",
      });
    }, 30 * 60 * 1000);
  };

  const handleLogout = () => {
    logout();
    setSelectedSeatEmployee(null); // 清除右側面板的員工資訊
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
    // 重置員工管理狀態
    resetEmployeeManagement();
    setIsAdminMigrationPanelOpen(false);
    // 重置員工位置交換狀態
    setIsSwappingEmployees(false);
    setSelectedSeatsForSwap([]);
    setShowSwapConfirmModal(false);
  };

  // 處理註冊按鈕點擊
  const handleRegistrationClick = () => {
    startRegistration();
    toast({
      title: "請選擇座位",
      description: "請在平面圖中點選一個空的座位進行註冊",
    });
  };

  // 處理修改個人資料按鈕點擊
  const handleProfileEditClick = () => {
    startProfileEdit();
  };

  // 處理座位點擊（註冊模式）
  const handleSeatClickForRegistration = async (seat: any) => {
    if (!isSelectingSeatForRegistration) return;
    
    // 檢查座位是否為空
    if (!seat.is_empty) {
      toast({
        title: "座位已被佔用",
        description: "請選擇其他空座位",
        variant: "destructive"
      });
      return;
    }
    
    // 再次確認資料庫中的座位狀態
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
    
    // 座位可用，選中並開啟註冊視窗
    selectSeatForRegistration(seat);
  };

  // 處理註冊成功
  const handleRegistrationSuccess = async () => {
    console.log('handleRegistrationSuccess 被調用了！');
    // 重新載入座位資料和員工資訊以顯示更新
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
      
      // 自動選中剛註冊的座位並顯示員工資訊
      const registeredSeat = data.find(seat => seat.id === selectedSeatForRegistration?.id);
      if (registeredSeat && registeredSeat.employee) {
        setSelectedSeat(registeredSeat);
        setSelectedSeatEmployee(registeredSeat.employee);
      }
    }

    // 重新載入員工資料 - 只有管理員才能看全部員工
    await fetchEmployees(isAdmin);
    
    // 重置註冊狀態
    completeRegistration();
  };


  // 處理新增電腦按鈕點擊
  const handleAddPcClick = () => {
    startAddPc();
    toast({
      title: "請選擇座位",
      description: "請點擊要新增電腦的座位，或點擊已有電腦的座位進行修改",
    });
  };

  // 處理座位點擊（新增電腦模式）
  const handleSeatClickForPc = (seat: any) => {
    if (!isSelectingSeatForPc) return;
    selectSeatForPc(seat);
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

  // 設備相關處理函數
  const handleSeatClickForEquipment = (seat: any) => {
    if (!isSelectingSeatForEquipment) return;
    selectSeatForEquipment(seat);
  };

  const handleAddEquipmentSuccess = async () => {
    await fetchSeatCoordinates();
    await fetchEquipments();
    completeAddEquipment();
    toast({
      title: "設備新增成功",
      description: "設備已成功新增到座位",
    });
  };

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

  const handleEquipmentClick = (equipment: any) => {
    viewEquipment(equipment);
  };

  const handleEquipmentEdit = () => {
    startEditEquipment(seatCoordinates);
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // 進入編輯模式 - 備份當前數據
      const backup = enterEditMode(containers, seatCoordinates);
      setBackupContainers(backup.containers);
      setBackupSeatCoordinates(backup.seatCoordinates);
      setIsEditMode(true);
      toast({
        title: "進入編輯模式",
        description: "已進入編輯模式",
      });
    } else {
      // 退出編輯模式 - 提供保存或取消選項
      const changes = hasChanges(
        { containers, seatCoordinates },
        { containers: backupContainers, seatCoordinates: backupSeatCoordinates }
      );
      
      if (changes.hasContainerChanges || changes.hasSeatChanges) {
        if (confirm("您有未保存的變更。是否要保存變更？\n點擊「確定」保存變更，點擊「取消」放棄變更。")) {
          // 用戶選擇保存變更
          exitEditModeWithSave();
        } else {
          // 用戶選擇取消變更
          cancelAllChanges();
        }
      } else {
        // 沒有變更，直接退出
        exitEditModeWithoutChanges();
      }
    }
  };

  const exitEditModeWithSave = () => {
    // 清除編輯狀態但保留變更
    const state = resetEditState();
    setIsEditMode(state.isEditMode!);
    setIsContainerEditMode(state.isContainerEditMode!);
    setSelectedContainer(state.selectedContainer);
    setEditingContainer(state.editingContainer);
    setIsAddingContainer(state.isAddingContainer!);
    setIsSeatEditMode(state.isSeatEditMode!);
    setSelectedSeat(state.selectedSeat);
    setIsDraggingSeat(state.isDraggingSeat!);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
    
    toast({
      title: "變更已保存",
      description: "已退出編輯模式並保存變更",
    });
  };

  const cancelAllChanges = () => {
    // 恢復備份數據
    setContainers([...backupContainers]);
    setSeatCoordinates([...backupSeatCoordinates]);
    
    // 清除編輯狀態
    const state = resetEditState();
    setIsEditMode(state.isEditMode!);
    setIsContainerEditMode(state.isContainerEditMode!);
    setSelectedContainer(state.selectedContainer);
    setEditingContainer(state.editingContainer);
    setIsAddingContainer(state.isAddingContainer!);
    setIsSeatEditMode(state.isSeatEditMode!);
    setSelectedSeat(state.selectedSeat);
    setIsDraggingSeat(state.isDraggingSeat!);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
    
    toast({
      title: "變更已取消",
      description: "已退出編輯模式並取消所有變更",
    });
  };

  const exitEditModeWithoutChanges = () => {
    // 沒有變更，直接清除狀態
    const state = resetEditState();
    setIsEditMode(state.isEditMode!);
    setIsContainerEditMode(state.isContainerEditMode!);
    setSelectedContainer(state.selectedContainer);
    setEditingContainer(state.editingContainer);
    setIsAddingContainer(state.isAddingContainer!);
    setIsSeatEditMode(state.isSeatEditMode!);
    setSelectedSeat(state.selectedSeat);
    setIsDraggingSeat(state.isDraggingSeat!);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
    
    toast({
      title: "退出編輯模式",
      description: "已退出編輯模式",
    });
  };

  // toggleContainerEditMode now provided by useContainers hook

  // Container functions now provided by useContainers hook

  const handleCanvasMouseDown = async (e: React.MouseEvent) => {
    // 處理座位拖拽釋放
    if (isDraggingSeat && selectedSeat && selectedContainer) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 檢查點擊是否在選中的容器內
      const isInSelectedContainer = 
        mouseX >= selectedContainer.x && 
        mouseX <= selectedContainer.x + selectedContainer.width &&
        mouseY >= selectedContainer.y && 
        mouseY <= selectedContainer.y + selectedContainer.height;
      
      if (isInSelectedContainer) {
        await updateSeatPosition(selectedSeat.id, seatDragPosition.x, seatDragPosition.y);
      }
      
      // 退出拖拽模式
      setIsDraggingSeat(false);
      setSeatDragPosition({ x: 0, y: 0 });
      return;
    }
    
    // 處理容器相關操作
    handleCanvasMouseDownForContainer(e, canvasSize);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // 處理容器相關移動
    handleCanvasMouseMoveForContainer(e, canvasSize);
  };

  const handleCanvasMouseUp = () => {
    // 處理容器相關釋放
    handleCanvasMouseUpForContainer();
  };

  // Container management functions now provided by useContainers hook

  // 刪除座位
  const deleteSeat = async () => {
    await deleteSeatFromHook();
  };

  // 包裝座位編輯模式切換函數
  const toggleSeatEditMode = () => {
    toggleSeatEditModeFromHook(selectedContainer);
  };

  // 包裝容器點擊處理函數（用於放置座位）
  const handleContainerClickForSeat = (e: React.MouseEvent, container: any) => {
    handleContainerClickForSeatFromHook(e, container, selectedContainer, isEditMode);
  };

  // 新增座位到資料庫 - 保留這個函數因為它在其他地方被使用
  const addSeatToDatabase = async (seat: any) => {
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
      } else {
        setSeatCoordinates([data, ...seatCoordinates]);
        toast({
          title: "創建成功",
          description: "新座位已創建",
        });
      }
    } catch (error) {
      console.error('Error saving seat:', error);
      toast({
        title: "創建失敗",
        description: "發生錯誤",
        variant: "destructive"
      });
    }
  };

  // 停用員工 - 使用 hook 中的函數並傳入座位重載回調
  const handleDisableEmployee = async (employeeId: string, seatId: string) => {
    await handleDisableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeatCoordinates);
  };

  // 啟用員工並分配座位 - 使用 hook 中的函數並傳入座位重載回調
  const handleEnableEmployee = async (employeeId: string, seatId: string) => {
    await handleEnableEmployeeFromHook(employeeId, seatId, isAdmin, fetchSeatCoordinates);
  };

  // 修復遺失的員工分配
  const restoreMissingEmployees = async () => {
    const result = await restoreMissingEmployeeAssignments();
    
    if (result.success) {
      await fetchSeatCoordinates();
      
      if (result.assignedCount > 0) {
        toast({
          title: "員工位置已修復",
          description: `已重新分配 ${result.assignedCount} 位員工到座位`,
        });
      } else {
        toast({
          title: "無需修復",
          description: "所有員工都已正確分配座位",
        });
      }
    } else {
      toast({
        title: "修復失敗",
        description: "無法修復員工位置分配",
        variant: "destructive"
      });
    }
  };

  // 交換員工位置
  const handleSwapEmployees = async (swapPc: boolean = false) => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    
    console.log('Swapping seats:', { seat1, seat2 });
    
    const result = await swapEmployees(seat1, seat2, swapPc);
    
    if (result.success) {
      // 重新載入座位數據
      await fetchSeatCoordinates();
      
      // 重置狀態
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

  // 僅交換電腦
  const handleSwapPcsOnly = async () => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    
    console.log('Swapping PCs only:', { seat1, seat2 });
    
    const result = await swapPcsOnly(seat1, seat2);
    
    if (result.success) {
      // 重新載入座位數據
      await fetchSeatCoordinates();
      
      // 重置狀態
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

  // 處理座位點擊
  const handleSeatClick = (e: React.MouseEvent, seat: any) => {
    e.stopPropagation();
    
    // 如果正在交換員工位置
    if (isSwappingEmployees) {
      // 避免重複選擇同一座位
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
        // 停用員工
        handleDisableEmployee(seat.employee.id, seat.id);
      } else if (!seat.employee || seat.is_empty) {
        // 顯示已停用員工列表
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
      handleSeatClickForPc(seat);
      return;
    }

    if (isSelectingSeatForEquipment) {
      handleSeatClickForEquipment(seat);
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
    
    // 設定員工資訊 - 允許所有情況下更新右側面板的員工資訊
    if (seat.employee) {
      setSelectedSeatEmployee(seat.employee);
      console.log('Selected employee:', seat.employee);
    } else {
      setSelectedSeatEmployee(null);
      console.log('No employee on this seat');
    }
    
    // 使用 hook 的基本座位點擊處理
    handleBasicSeatClick(seat, isEditMode);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header - 80px height */}
      <Header
        currentTime={currentTime}
        formatTime={formatHeaderTime}
        formatDate={formatHeaderDate}
        currentEmployeeName={currentEmployee?.name}
        user={user}
        isAdmin={isAdmin}
        isEditMode={isEditMode}
        isSelectingSeatForPc={isSelectingSeatForPc}
        isSelectingSeatForEquipment={isSelectingSeatForEquipment}
        isViewingEquipment={isViewingEquipment}
        isEquipmentModalOpen={isEquipmentModalOpen}
        isManagingEmployees={isManagingEmployees}
        isSwappingEmployees={isSwappingEmployees}
        onToggleEditMode={toggleEditMode}
        onAddPcClick={handleAddPcClick}
        onStartAddEquipment={startAddEquipment}
        onToggleManagingEmployees={() => {
          setIsManagingEmployees(!isManagingEmployees);
          if (isManagingEmployees) {
            setShowDisabledEmployeesModal(false);
            setSelectedEmptySeat(null);
          }
        }}
        onToggleSwappingEmployees={() => {
          setIsSwappingEmployees(!isSwappingEmployees);
          if (isSwappingEmployees) {
            setSelectedSeatsForSwap([]);
            setShowSwapConfirmModal(false);
          }
        }}
        onRestoreMissingEmployees={restoreMissingEmployees}
        onOpenPasswordReset={() => setIsPasswordResetModalOpen(true)}
        onProfileEdit={handleProfileEditClick}
        onOpenTimeClock={() => setIsTimeClockModalOpen(true)}
        onLogout={handleLogout}
        onLogin={() => setIsLoginModalOpen(true)}
        onRegister={handleRegistrationClick}
      />

      {/* Admin Migration Panel */}
      {isAdminMigrationPanelOpen && (
        <div className="w-[1400px] px-6 py-2">
          <AdminMigrationPanel 
            isVisible={true} 
            currentEmployee={currentEmployee}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-[1400px] flex px-6 py-6 gap-6">
        {/* Left Panel - Seat Configuration - 1300px width */}
        <div className="w-[1300px] flex-1">
          {/* Legend */}
          <ColorLegend />

          {/* Canvas Area */}
          <CanvasArea
            canvasSize={canvasSize}
            isEditMode={isEditMode}
            isAddingContainer={isAddingContainer}
            isDraggingSeat={isDraggingSeat}
            isSeatEditMode={isSeatEditMode}
            selectedContainer={selectedContainer}
            containers={containers}
            editingContainer={editingContainer}
            isContainerEditMode={isContainerEditMode}
            seatCoordinates={seatCoordinates}
            selectedSeat={selectedSeat}
            seatDragPosition={seatDragPosition}
            isSwappingEmployees={isSwappingEmployees}
            selectedSeatsForSwap={selectedSeatsForSwap}
            isSelectingSeatForRegistration={isSelectingSeatForRegistration}
            selectedSeatForRegistration={selectedSeatForRegistration}
            selectedSeatTemplate={selectedSeatTemplate}
            showSeatPreview={showSeatPreview}
            containerMousePosition={containerMousePosition}
            newContainerStart={newContainerStart}
            newContainerEnd={newContainerEnd}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            onContainerClick={handleContainerClick}
            onContainerClickForSeat={handleContainerClickForSeat}
            onMouseDown={handleMouseDown}
            onSeatClick={handleSeatClick}
            onEquipmentClick={handleEquipmentClick}
            getRubberBandStyle={getRubberBandStyle}
            setSeatDragPosition={setSeatDragPosition}
            setContainerMousePosition={setContainerMousePosition}
            setShowSeatPreview={setShowSeatPreview}
          />
        </div>

        {/* Right Panel - 3 Containers - 250px width */}
        <div className="w-[250px] flex flex-col gap-2 h-[calc(100vh-120px)]">
          {/* Combined Staff Info + Work Log Container */}
          <div className="flex-[1.8] bg-slate-800/30 rounded-lg border border-gray-700 overflow-hidden">
            <RightPanel
              isSelectingSeatForRegistration={isSelectingSeatForRegistration}
              isEditMode={isEditMode}
              selectedSeatEmployee={selectedSeatEmployee}
              onCancelSelection={() => {
                setIsSelectingSeatForRegistration(false);
                toast({
                  title: "已取消",
                  description: "已取消座位選擇",
                });
              }}
              isContainerEditMode={isContainerEditMode}
              isSeatEditMode={isSeatEditMode}
              selectedContainer={selectedContainer}
              selectedSeat={selectedSeat}
              onStartAddingContainer={startAddingContainer}
              onToggleContainerEditMode={toggleContainerEditMode}
              onDeleteContainer={deleteContainer}
              onToggleSeatEditMode={toggleSeatEditMode}
              onDeleteSeat={deleteSeat}
              selectedSeatTemplate={selectedSeatTemplate}
              onTemplateChange={setSelectedSeatTemplate}
              currentUserId={currentEmployee?.id || null}
              pcData={undefined}
            />
          </div>

          {/* PC Data Container - larger height */}
          <div className="flex-[1.2] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4">
            {selectedSeat?.pc ? (
              <>
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
                <PcDataDisplay 
                  pcData={selectedSeat.pc} 
                />
              </>
            ) : isEditMode ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯容器</h3>
                {editingContainer && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400">名稱:</label>
                      <input 
                        type="text" 
                        value={editingContainer.name}
                        placeholder="容器名稱"
                        onChange={(e) => handleContainerNameChange(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-slate-600 border border-gray-500 rounded text-xs"
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      <div>位置: ({Math.round(editingContainer.x)}, {Math.round(editingContainer.y)})</div>
                      <div>大小: {Math.round(editingContainer.width)}×{Math.round(editingContainer.height)}</div>
                    </div>
                    <div className="space-y-1">
                      <button 
                        onClick={saveContainerChanges}
                        className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                      >
                        保存變更
                      </button>
                      <button 
                        onClick={cancelContainerChanges}
                        className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
                      >
                        取消變更
                      </button>
                    </div>
                  </div>
                )}
                {isSeatEditMode && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-xs font-medium text-cyan-300">座位模板</h4>
                    <div className="space-y-1">
                      <div>
                        <input 
                          type="radio" 
                          id="template-120x70" 
                          name="seatTemplate" 
                          value="120x70" 
                          checked={selectedSeatTemplate === '120x70'}
                          onChange={(e) => setSelectedSeatTemplate(e.target.value)}
                          className="mr-2"
                        />
                        <label htmlFor="template-120x70" className="text-xs text-gray-300">
                          120×70
                        </label>
                      </div>
                      <div>
                        <input 
                          type="radio" 
                          id="template-70x90" 
                          name="seatTemplate" 
                          value="70x90" 
                          checked={selectedSeatTemplate === '70x90'}
                          onChange={(e) => setSelectedSeatTemplate(e.target.value)}
                          className="mr-2"
                        />
                        <label htmlFor="template-70x90" className="text-xs text-gray-300">
                          70×90
                        </label>
                      </div>
                      <div>
                        <input 
                          type="radio" 
                          id="template-40x40" 
                          name="seatTemplate" 
                          value="40x40" 
                          checked={selectedSeatTemplate === '40x40'}
                          onChange={(e) => setSelectedSeatTemplate(e.target.value)}
                          className="mr-2"
                        />
                        <label htmlFor="template-40x40" className="text-xs text-gray-300">
                          40×40
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-6 border border-gray-600 rounded"></div>
                </div>
                <p className="text-xs text-gray-400 text-center">電腦設備</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Manager */}
      <ModalManager
        // Auth Modal
        isLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        
        // Registration Modal
        isRegistrationModalOpen={isRegistrationModalOpen}
        registrationModalKey={registrationModalKey}
        setIsRegistrationModalOpen={setIsRegistrationModalOpen}
        selectedSeatForRegistration={selectedSeatForRegistration}
        setSelectedSeatForRegistration={setSelectedSeatForRegistration}
        setIsSelectingSeatForRegistration={setIsSelectingSeatForRegistration}
        containers={containers}
        onRegistrationSuccess={handleRegistrationSuccess}
        user={user}
        currentEmployee={currentEmployee}
        
        // Add PC Modal
        isAddPcModalOpen={isAddPcModalOpen}
        setIsAddPcModalOpen={setIsAddPcModalOpen}
        selectedSeatForPc={selectedSeatForPc}
        setSelectedSeatForPc={setSelectedSeatForPc}
        setIsSelectingSeatForPc={setIsSelectingSeatForPc}
        onAddPcSuccess={handleAddPcSuccess}
        
        // Equipment Modal
        isEquipmentModalOpen={isEquipmentModalOpen}
        selectedSeatForEquipment={selectedSeatForEquipment}
        onEquipmentCancel={cancelEquipmentOperation}
        onEquipmentSave={handleEquipmentSave}
        
        // Equipment Data Display
        isViewingEquipment={isViewingEquipment}
        selectedEquipment={selectedEquipment}
        onCloseEquipmentView={closeEquipmentView}
        onEquipmentEdit={handleEquipmentEdit}
        isAdmin={isAdmin}
        
        // Time Clock Modal
        isTimeClockModalOpen={isTimeClockModalOpen}
        setIsTimeClockModalOpen={setIsTimeClockModalOpen}
        
        // Admin Migration Panel
        isAdminMigrationPanelOpen={isAdminMigrationPanelOpen}
        
        // Container Name Dialog
        showNameDialog={showNameDialog}
        newContainerName={newContainerName}
        setNewContainerName={setNewContainerName}
        onSaveNewContainer={saveNewContainer}
        onCancelNewContainer={cancelNewContainer}
        
        // Disabled Employees Modal
        showDisabledEmployeesModal={showDisabledEmployeesModal}
        setShowDisabledEmployeesModal={setShowDisabledEmployeesModal}
        disabledEmployees={disabledEmployees}
        selectedEmptySeat={selectedEmptySeat}
        onEnableEmployee={handleEnableEmployee}
        
        // Swap Confirm Modal
        showSwapConfirmModal={showSwapConfirmModal}
        setShowSwapConfirmModal={setShowSwapConfirmModal}
        selectedSeatsForSwap={selectedSeatsForSwap}
        setSelectedSeatsForSwap={setSelectedSeatsForSwap}
        onSwapEmployees={handleSwapEmployees}
        onSwapPcsOnly={handleSwapPcsOnly}
        
        // Admin Password Reset
        isPasswordResetModalOpen={isPasswordResetModalOpen}
        setIsPasswordResetModalOpen={setIsPasswordResetModalOpen}
      />


    </div>
  );
};

export default Index;