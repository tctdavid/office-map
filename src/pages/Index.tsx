import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import RegistrationModal from "@/components/RegistrationModal";
import AddPcModal from "@/components/AddPcModal";
import TimeClockModal from "@/components/TimeClockModal";
import WorkLogPanel from "@/components/WorkLogPanel";
import WorkLogViewer from "@/components/WorkLogViewer";
import PcDataDisplay from "@/components/PcDataDisplay";
import EquipmentDataDisplay from "@/components/EquipmentDataDisplay";
import EquipmentModal from "@/components/EquipmentModal";
import AdminMigrationPanel from "@/components/AdminMigrationPanel";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationModalKey, setRegistrationModalKey] = useState(0);
  const [isSelectingSeatForRegistration, setIsSelectingSeatForRegistration] = useState(false);
  const [selectedSeatForRegistration, setSelectedSeatForRegistration] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<{id: string, name: string, email: string, role?: string} | null>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [seatCoordinates, setSeatCoordinates] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number}>({width: 1060, height: 850});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isContainerEditMode, setIsContainerEditMode] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string>('');
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainerStart, setNewContainerStart] = useState<{x: number, y: number} | null>(null);
  const [newContainerEnd, setNewContainerEnd] = useState<{x: number, y: number} | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [pendingContainer, setPendingContainer] = useState<any>(null);
  const [isSeatEditMode, setIsSeatEditMode] = useState(false);
  const [selectedSeatTemplate, setSelectedSeatTemplate] = useState<string>('120x70');
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [containerMousePosition, setContainerMousePosition] = useState({ x: 0, y: 0 });
  const [showSeatPreview, setShowSeatPreview] = useState(false);
  const [isDraggingSeat, setIsDraggingSeat] = useState(false);
  const [seatDragPosition, setSeatDragPosition] = useState({ x: 0, y: 0 });
  // 備份數據用於取消變更
  const [backupContainers, setBackupContainers] = useState<any[]>([]);
  const [backupSeatCoordinates, setBackupSeatCoordinates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedSeatEmployee, setSelectedSeatEmployee] = useState<any>(null);
  const [isAddPcModalOpen, setIsAddPcModalOpen] = useState(false);
  const [isSelectingSeatForPc, setIsSelectingSeatForPc] = useState(false);
  const [selectedSeatForPc, setSelectedSeatForPc] = useState<any>(null);
  const [pcs, setPcs] = useState<any[]>([]);
  const [isTimeClockModalOpen, setIsTimeClockModalOpen] = useState(false);
  const [isAdminMigrationPanelOpen, setIsAdminMigrationPanelOpen] = useState(false);
  const [isManagingEmployees, setIsManagingEmployees] = useState(false);
  const [disabledEmployees, setDisabledEmployees] = useState<any[]>([]);
  const [showDisabledEmployeesModal, setShowDisabledEmployeesModal] = useState(false);
  const [selectedEmptySeat, setSelectedEmptySeat] = useState<any>(null);
  
  // Equipment management states
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isSelectingSeatForEquipment, setIsSelectingSeatForEquipment] = useState(false);
  const [selectedSeatForEquipment, setSelectedSeatForEquipment] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isViewingEquipment, setIsViewingEquipment] = useState(false);
  
  // Admin password confirmation states
  const [isSwappingEmployees, setIsSwappingEmployees] = useState(false);
  const [selectedSeatsForSwap, setSelectedSeatsForSwap] = useState<any[]>([]);
  const [showSwapConfirmModal, setShowSwapConfirmModal] = useState(false);
  
  const { toast } = useToast();
  
  // Header clock (GMT+8)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatHeaderTime = (d: Date) => d.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });
  const formatHeaderDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });

  const fetchSeatCoordinates = async () => {
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
        employees!fk_seat_coordinates_employee_id (
          id,
          name,
          photo,
          department,
          position,
          extension,
          email,
          is_active
        ),
        pcs!fk_seat_coordinates_pc_id (
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
        equipment!fk_seat_coordinates_equipment_id (
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
    console.log('座位詳細資料樣本:', data?.slice(0, 2));
    
    if (error) {
      console.error('Error fetching seat coordinates:', error);
    } else {
      // 更新座位資料並同步 is_empty 狀態
      const updatedData = data?.map(seat => ({
        ...seat,
        is_empty: !seat.employee_id && !seat.pc_id && !seat.equipment_id
      })) || [];
      
      console.log('設置座位資料到狀態:', updatedData.map(seat => ({
        id: seat.id,
        container: seat.container,
        employee: seat.employees?.name || '空座位',
        is_empty: seat.is_empty,
        employee_id: seat.employee_id,
        has_employee_data: !!seat.employees
      })));
      
      setSeatCoordinates(updatedData);
    }
  };

  // 載入電腦資料
  const fetchPcs = async () => {
    const { data, error } = await supabase
      .from('pcs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching PCs:', error);
    } else {
      setPcs(data || []);
    }
  };

  // 載入設備資料
  const fetchEquipments = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching equipment:', error);
    } else {
      setEquipments(data || []);
    }
  };

  useEffect(() => {
    // 處理鍵盤事件 - ESC 取消座位拖拽
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDraggingSeat) {
        setIsDraggingSeat(false);
        setSeatDragPosition({ x: 0, y: 0 });
        toast({
          title: "拖拽已取消",
          description: "座位拖拽已取消",
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDraggingSeat, toast]);

  // 檢查是否為管理員
  const isAdmin = currentEmployee?.role === 'admin';

  // 監控管理員狀態變化，非管理員時重置員工管理功能
  useEffect(() => {
    if (!isAdmin) {
      if (isManagingEmployees) {
        setIsManagingEmployees(false);
        setShowDisabledEmployeesModal(false);
        setSelectedEmptySeat(null);
        setIsAdminMigrationPanelOpen(false);
      }
      if (isSwappingEmployees) {
        setIsSwappingEmployees(false);
        setSelectedSeatsForSwap([]);
        setShowSwapConfirmModal(false);
      }
    }
  }, [isAdmin, isManagingEmployees, isSwappingEmployees]);

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

    // 載入容器資料 - 只在非編輯狀態時載入
    const fetchContainers = async () => {
      // 如果正在編輯容器或拖拽中，不重新載入資料
      if (isContainerEditMode && editingContainer) return;
      if (isDragging) return;
      
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching containers:', error);
      } else {
        setContainers(data || []);
      }
    };


    fetchCanvasSize();
    fetchContainers();
    fetchSeatCoordinates();
    fetchPcs();
    fetchEquipments();

    return () => {
      clearTimer();
    };
  }, [isContainerEditMode, editingContainer, isDragging]);

  const handleLoginSuccess = async (employee: {id: string, name: string, email: string}) => {
    // 需要獲取完整的員工資訊包含role
    try {
      const { data: fullEmployee, error } = await supabase
        .from('employees')
        .select('id, name, email, department, position, extension, photo, role, is_active, created_at, updated_at')
        .eq('id', employee.id)
        .single();
      
      if (error) throw error;
      
      setCurrentEmployee({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: fullEmployee.role
      });
    } catch (error) {
      console.error('Error fetching employee role:', error);
      setCurrentEmployee(employee);
    }
    
    setUser({ email: employee.email } as User);
    
    // 需要獲取完整的員工資訊來顯示在右側面板
    try {
      const { data: fullEmployeeData, error } = await supabase
        .from('employees')
        .select('id, name, email, department, position, extension, photo, role, is_active, created_at, updated_at')
        .eq('id', employee.id)
        .single();
      
      if (error) {
        console.error('Error fetching full employee data:', error);
        setSelectedSeatEmployee(employee); // 使用基本資料作為後備
      } else {
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
    setUser(null);
    setCurrentEmployee(null);
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
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
    setIsSelectingSeatForPc(false);
    setSelectedSeatForPc(null);
    setIsAddPcModalOpen(false);
    // 重置員工管理狀態
    setIsManagingEmployees(false);
    setShowDisabledEmployeesModal(false);
    setSelectedEmptySeat(null);
    setIsAdminMigrationPanelOpen(false);
    // 重置員工位置交換狀態
    setIsSwappingEmployees(false);
    setSelectedSeatsForSwap([]);
    setShowSwapConfirmModal(false);
    toast({
      title: "登出成功",
      description: "已成功登出系統",
    });
  };

  // 處理註冊按鈕點擊
  const handleRegistrationClick = () => {
    // 每次打開註冊表單時，重置表單內容（通過改變 key 強制重新渲染）
    setRegistrationModalKey(prev => prev + 1);
    setIsSelectingSeatForRegistration(true);
    toast({
      title: "請選擇座位",
      description: "請在平面圖中點選一個空的座位進行註冊",
    });
  };

  // 處理修改個人資料按鈕點擊
  const handleProfileEditClick = () => {
    setRegistrationModalKey(prev => prev + 1);
    setIsRegistrationModalOpen(true);
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
    setSelectedSeatForRegistration(seat);
    setIsRegistrationModalOpen(true);
  };

  // 處理註冊成功
  const handleRegistrationSuccess = async () => {
    console.log('handleRegistrationSuccess 被調用了！');
    // 重新載入座位資料和員工資訊以顯示更新
    const { data, error } = await supabase
      .from('seat_coordinates')
      .select(`
        *,
        employees:employee_id (
          id,
          name,
          photo,
          department,
          position,
          extension,
          email
        ),
        pcs:pc_id (
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
      if (registeredSeat && registeredSeat.employees) {
        setSelectedSeat(registeredSeat);
        setSelectedSeatEmployee(registeredSeat.employees);
      }
    }

    // 重新載入員工資料 - 只有管理員才能看全部員工
    if (isAdmin) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, email, department, position, extension, photo, role, is_active');
      
      if (!employeeError && employeeData) {
        setEmployees(employeeData);
        setDisabledEmployees(employeeData.filter(emp => !emp.is_active));
      }
    }
    
    // 重置註冊狀態
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
  };


  // 處理新增電腦按鈕點擊
  const handleAddPcClick = () => {
    setIsSelectingSeatForPc(true);
    toast({
      title: "請選擇座位",
      description: "請點擊要新增電腦的座位，或點擊已有電腦的座位進行修改",
    });
  };

  // 處理座位點擊（新增電腦模式）
  const handleSeatClickForPc = (seat: any) => {
    if (!isSelectingSeatForPc) return;
    
    setSelectedSeatForPc(seat);
    setIsSelectingSeatForPc(false);
    setIsAddPcModalOpen(true);
  };

  // 新增電腦成功後的處理
  const handleAddPcSuccess = async () => {
    await fetchSeatCoordinates();
    await fetchPcs();
    setSelectedSeatForPc(null);
    toast({
      title: "電腦新增成功",
      description: "電腦設備已成功新增到座位",
    });
  };

  // 設備相關處理函數
  const handleSeatClickForEquipment = (seat: any) => {
    if (!isSelectingSeatForEquipment) return;
    
    setSelectedSeatForEquipment(seat);
    setIsSelectingSeatForEquipment(false);
    setIsEquipmentModalOpen(true);
  };

  const handleAddEquipmentSuccess = async () => {
    await fetchSeatCoordinates();
    await fetchEquipments();
    setSelectedSeatForEquipment(null);
    toast({
      title: "設備新增成功",
      description: "設備已成功新增到座位",
    });
  };

  const handleEquipmentSave = async (equipment: any) => {
    if (selectedSeatForEquipment && equipment.id) {
      try {
        const { error } = await supabase
          .from('seat_coordinates')
          .update({ equipment_id: equipment.id })
          .eq('id', selectedSeatForEquipment.id);

        if (error) {
          console.error('Error updating seat with equipment:', error);
          toast({
            title: "錯誤",
            description: "無法將設備分配到座位",
            variant: "destructive",
          });
          return;
        }

        await handleAddEquipmentSuccess();
      } catch (error) {
        console.error('Error in handleEquipmentSave:', error);
      }
    }
  };

  const handleEquipmentClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsViewingEquipment(true);
  };

  const handleEquipmentEdit = () => {
    if (selectedEquipment) {
      // 找到包含此設備的座位
      const seatWithEquipment = seatCoordinates.find(seat => seat.equipment_id === selectedEquipment.id);
      if (seatWithEquipment) {
        setSelectedSeatForEquipment({ ...seatWithEquipment, equipment: selectedEquipment });
        setIsViewingEquipment(false);
        setSelectedEquipment(null);
        setIsEquipmentModalOpen(true);
      }
    }
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // 進入編輯模式 - 備份當前數據
      setBackupContainers([...containers]);
      setBackupSeatCoordinates([...seatCoordinates]);
      setIsEditMode(true);
      toast({
        title: "進入編輯模式",
        description: "已進入編輯模式",
      });
    } else {
      // 退出編輯模式 - 提供保存或取消選項
      const hasContainerChanges = JSON.stringify(containers) !== JSON.stringify(backupContainers);
      const hasSeatChanges = JSON.stringify(seatCoordinates) !== JSON.stringify(backupSeatCoordinates);
      
      if (hasContainerChanges || hasSeatChanges) {
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
    setIsEditMode(false);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsAddingContainer(false);
    setIsSeatEditMode(false);
    setSelectedSeat(null);
    setIsDraggingSeat(false);
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
    setIsEditMode(false);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsAddingContainer(false);
    setIsSeatEditMode(false);
    setSelectedSeat(null);
    setIsDraggingSeat(false);
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
    setIsEditMode(false);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsAddingContainer(false);
    setIsSeatEditMode(false);
    setSelectedSeat(null);
    setIsDraggingSeat(false);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
    
    toast({
      title: "退出編輯模式",
      description: "已退出編輯模式",
    });
  };

  const toggleContainerEditMode = () => {
    setIsContainerEditMode(!isContainerEditMode);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsAddingContainer(false);
    toast({
      title: isContainerEditMode ? "退出容器編輯" : "進入容器編輯",
      description: isContainerEditMode ? "已退出容器編輯模式" : "點擊容器進行編輯",
    });
  };

  const handleContainerClick = (container: any) => {
    if (isContainerEditMode && !isDragging && !isAddingContainer) {
      setSelectedContainer(container);
      setEditingContainer({...container});
      toast({
        title: "容器已選中",
        description: `正在編輯: ${container.name}`,
      });
    }
  };

  const startAddingContainer = () => {
    setIsAddingContainer(true);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    toast({
      title: "新增容器模式",
      description: "在畫布上拖拽創建新容器",
    });
  };

  const handleContainerNameChange = (name: string) => {
    if (editingContainer) {
      setEditingContainer({...editingContainer, name});
    }
  };

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
  };

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
        // 更新座位位置到資料庫
        const { error } = await supabase
          .from('seat_coordinates')
          .update({
            x: seatDragPosition.x,
            y: seatDragPosition.y
          })
          .eq('id', selectedSeat.id);

        if (error) {
          console.error('Error updating seat position:', error);
          toast({
            title: "更新失敗",
            description: "無法更新座位位置",
            variant: "destructive"
          });
        } else {
          // 更新本地狀態
          setSeatCoordinates(seats => 
            seats.map(seat => 
              seat.id === selectedSeat.id 
                ? { ...seat, x: seatDragPosition.x, y: seatDragPosition.y }
                : seat
            )
          );
          
          toast({
            title: "座位已移動",
            description: `座位已移動到新位置 (${seatDragPosition.x}, ${seatDragPosition.y})`,
          });
        }
      }
      
      // 退出拖拽模式
      setIsDraggingSeat(false);
      setSeatDragPosition({ x: 0, y: 0 });
      return;
    }
    
    if (!isAddingContainer) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const snapToGrid = (value: number) => Math.round(value / 20) * 20;
    const startPoint = {
      x: Math.max(0, Math.min(snapToGrid(mouseX), canvasSize.width)),
      y: Math.max(0, Math.min(snapToGrid(mouseY), canvasSize.height))
    };
    
    setNewContainerStart(startPoint);
    setNewContainerEnd(startPoint);
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isAddingContainer && isDragging && newContainerStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const snapToGrid = (value: number) => Math.round(value / 20) * 20;
      const endPoint = {
        x: Math.max(0, Math.min(snapToGrid(mouseX), canvasSize.width)),
        y: Math.max(0, Math.min(snapToGrid(mouseY), canvasSize.height))
      };
      
      setNewContainerEnd(endPoint);
    } else if (isDragging && editingContainer && dragHandle) {
      // 原有的容器編輯邏輯
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const snapToGrid = (value: number) => Math.round(value / 20) * 20;
      
      let newContainer = {...editingContainer};
      const minSize = 40;
      
      switch(dragHandle) {
        case 'top':
          const snappedTopY = Math.max(0, snapToGrid(mouseY));
          const newHeightFromTop = newContainer.y + newContainer.height - snappedTopY;
          if (newHeightFromTop >= minSize) {
            newContainer.y = snappedTopY;
            newContainer.height = newHeightFromTop;
          }
          break;
        case 'bottom':
          const snappedBottomY = snapToGrid(mouseY);
          const newHeightFromBottom = snappedBottomY - newContainer.y;
          if (newHeightFromBottom >= minSize && snappedBottomY <= canvasSize.height) {
            newContainer.height = newHeightFromBottom;
          }
          break;
        case 'left':
          const snappedLeftX = Math.max(0, snapToGrid(mouseX));
          const newWidthFromLeft = newContainer.x + newContainer.width - snappedLeftX;
          if (newWidthFromLeft >= minSize) {
            newContainer.x = snappedLeftX;
            newContainer.width = newWidthFromLeft;
          }
          break;
        case 'right':
          const snappedRightX = snapToGrid(mouseX);
          const newWidthFromRight = snappedRightX - newContainer.x;
          if (newWidthFromRight >= minSize && snappedRightX <= canvasSize.width) {
            newContainer.width = newWidthFromRight;
          }
          break;
      }
      
      setEditingContainer(newContainer);
    }
  };

  const checkContainerOverlap = (newContainer: any, excludeId?: string) => {
    return containers.some(container => {
      if (container.id === (excludeId || newContainer.id)) return false;
      
      // 檢查兩個矩形是否重疊
      const isOverlapping = !(
        newContainer.x + newContainer.width <= container.x ||
        container.x + container.width <= newContainer.x ||
        newContainer.y + newContainer.height <= container.y ||
        container.y + container.height <= newContainer.y
      );
      
      return isOverlapping;
    });
  };

  const handleCanvasMouseUp = () => {
    if (isAddingContainer && isDragging && newContainerStart && newContainerEnd) {
      const x = Math.min(newContainerStart.x, newContainerEnd.x);
      const y = Math.min(newContainerStart.y, newContainerEnd.y);
      const width = Math.abs(newContainerEnd.x - newContainerStart.x);
      const height = Math.abs(newContainerEnd.y - newContainerStart.y);
      
      if (width >= 40 && height >= 40) {
        const newContainer = { x, y, width, height };
        
        if (checkContainerOverlap(newContainer)) {
          toast({
            title: "容器重疊",
            description: "新容器不能與現有容器重疊",
            variant: "destructive"
          });
        } else {
          setPendingContainer(newContainer);
          setShowNameDialog(true);
        }
      } else {
        toast({
          title: "容器太小",
          description: "容器最小尺寸為40x40像素",
          variant: "destructive"
        });
      }
      
      setIsDragging(false);
      setNewContainerStart(null);
      setNewContainerEnd(null);
    } else if (isDragging && editingContainer) {
      // 原有的容器編輯邏輯
      const snapToGrid = (value: number) => Math.round(value / 20) * 20;
      const finalContainer = {
        ...editingContainer,
        x: snapToGrid(editingContainer.x),
        y: snapToGrid(editingContainer.y),
        width: snapToGrid(editingContainer.width),
        height: snapToGrid(editingContainer.height)
      };
      setEditingContainer(finalContainer);
      setIsDragging(false);
      setDragHandle('');
    }
  };

  const saveContainerChanges = async () => {
    if (!editingContainer) return;
    
    // 檢查重疊
    if (checkContainerOverlap(editingContainer, editingContainer.id)) {
      toast({
        title: "容器重疊",
        description: "容器不能與其他容器重疊",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('containers')
        .update({
          name: editingContainer.name,
          x: editingContainer.x,
          y: editingContainer.y,
          width: editingContainer.width,
          height: editingContainer.height,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingContainer.id);

      if (error) {
        console.error('Error updating container:', error);
        toast({
          title: "保存失敗",
          description: "無法保存容器變更",
          variant: "destructive"
        });
      } else {
        // 更新本地狀態
        const updatedContainers = containers.map(c => 
          c.id === editingContainer.id ? editingContainer : c
        );
        setContainers(updatedContainers);
        setSelectedContainer(editingContainer);
        
        toast({
          title: "保存成功",
          description: "容器變更已保存",
        });
      }
    } catch (error) {
      console.error('Error saving container:', error);
      toast({
        title: "保存失敗", 
        description: "發生錯誤",
        variant: "destructive"
      });
    }
  };

  const saveNewContainer = async () => {
    if (!pendingContainer || !newContainerName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('containers')
        .insert({
          name: newContainerName.trim(),
          x: pendingContainer.x,
          y: pendingContainer.y,
          width: pendingContainer.width,
          height: pendingContainer.height,
          department: '新部門',
          color: '#3b82f6'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating container:', error);
        toast({
          title: "創建失敗",
          description: "無法創建新容器",
          variant: "destructive"
        });
      } else {
        setContainers([data, ...containers]);
        setShowNameDialog(false);
        setNewContainerName('');
        setPendingContainer(null);
        setIsAddingContainer(false);
        
        toast({
          title: "創建成功",
          description: `容器 "${data.name}" 已創建`,
        });
      }
    } catch (error) {
      console.error('Error saving new container:', error);
      toast({
        title: "創建失敗",
        description: "發生錯誤",
        variant: "destructive"
      });
    }
  };

  const cancelNewContainer = () => {
    setShowNameDialog(false);
    setNewContainerName('');
    setPendingContainer(null);
    setIsAddingContainer(false);
    toast({
      title: "已取消",
      description: "新容器創建已取消",
    });
  };

  const cancelContainerChanges = () => {
    if (selectedContainer) {
      setEditingContainer({...selectedContainer});
      toast({
        title: "已取消變更",
        description: "容器變更已取消",
      });
    }
  };

  const getRubberBandStyle = () => {
    if (!newContainerStart || !newContainerEnd) return {};
    
    const x = Math.min(newContainerStart.x, newContainerEnd.x);
    const y = Math.min(newContainerStart.y, newContainerEnd.y);
    const width = Math.abs(newContainerEnd.x - newContainerStart.x);
    const height = Math.abs(newContainerEnd.y - newContainerStart.y);
    
    return {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      pointerEvents: 'none' as const
    };
  };

  // 刪除容器
  const deleteContainer = async () => {
    if (!selectedContainer) {
      toast({
        title: "請選擇容器",
        description: "請先選擇要刪除的容器",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('containers')
        .delete()
        .eq('id', selectedContainer.id);

      if (error) {
        console.error('Error deleting container:', error);
        toast({
          title: "刪除失敗",
          description: "無法刪除容器",
          variant: "destructive"
        });
      } else {
        setContainers(containers.filter(c => c.id !== selectedContainer.id));
        setSelectedContainer(null);
        setEditingContainer(null);
        toast({
          title: "刪除成功",
          description: "容器已刪除",
        });
      }
    } catch (error) {
      console.error('Error deleting container:', error);
      toast({
        title: "刪除失敗",
        description: "發生錯誤",
        variant: "destructive"
      });
    }
  };

  // 刪除座位
  const deleteSeat = async () => {
    if (!selectedSeat) {
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
        .eq('id', selectedSeat.id);

      if (error) {
        console.error('Error deleting seat:', error);
        toast({
          title: "刪除失敗",
          description: "無法刪除座位",
          variant: "destructive"
        });
      } else {
        setSeatCoordinates(seatCoordinates.filter(s => s.id !== selectedSeat.id));
        setSelectedSeat(null);
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

  // 切換座位編輯模式
  const toggleSeatEditMode = () => {
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

  // 獲取座位模板尺寸
  const getSeatSize = (template: string) => {
    switch (template) {
      case '120x70': return { width: 120, height: 70 };
      case '70x90': return { width: 70, height: 90 };
      case '40x40': return { width: 40, height: 40 };
      default: return { width: 40, height: 40 };
    }
  };

  // 檢查座位重疊
  const checkSeatOverlap = (newSeat: any, containerId: string) => {
    return seatCoordinates.some(seat => {
      if (seat.container_id !== containerId) return false;
      if (seat.id === newSeat.id) return false;
      
      // 檢查兩個矩形是否重疊
      const isOverlapping = !(
        newSeat.x + newSeat.pixel_x <= seat.x ||
        seat.x + seat.pixel_x <= newSeat.x ||
        newSeat.y + newSeat.pixel_y <= seat.y ||
        seat.y + seat.pixel_y <= newSeat.y
      );
      
      return isOverlapping;
    });
  };

  // 處理容器點擊事件以放置座位
  const handleContainerClickForSeat = (e: React.MouseEvent, container: any) => {
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
    
    // 鎖定到網格點 (20px 網格)
    const snapToGrid = (value: number) => Math.round(value / 20) * 20;
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
    if (checkSeatOverlap(newSeat, container.id)) {
      toast({
        title: "座位重疊",
        description: "座位不能與其他座位重疊",
        variant: "destructive"
      });
      return;
    }
    
    // 新增座位到資料庫
    addSeatToDatabase(newSeat);
  };

  // 新增座位到資料庫
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

  // 停用員工
  const handleDisableEmployee = async (employeeId: string, seatId: string) => {
    try {
      // 停用員工
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', employeeId);

      if (employeeError) throw employeeError;

      // 清空座位
      const { error: seatError } = await supabase
        .from('seat_coordinates')
        .update({ employee_id: null, is_empty: true })
        .eq('id', seatId);

      if (seatError) throw seatError;

      toast({
        title: "員工已停用",
        description: "員工已被停用並從座位移除",
      });

      // 重新載入數據
      fetchSeatCoordinates();
      if (isAdmin) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, name, email, department, position, extension, photo, role, is_active');
        if (employeeData) {
          setEmployees(employeeData);
          setDisabledEmployees(employeeData.filter(emp => !emp.is_active));
        }
      }
    } catch (error) {
      console.error('Error disabling employee:', error);
      toast({
        title: "停用失敗",
        description: "無法停用員工",
        variant: "destructive"
      });
    }
  };

  // 啟用員工並分配座位
  const handleEnableEmployee = async (employeeId: string, seatId: string) => {
    try {
      // 啟用員工
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ is_active: true })
        .eq('id', employeeId);

      if (employeeError) throw employeeError;

      // 分配座位
      const { error: seatError } = await supabase
        .from('seat_coordinates')
        .update({ employee_id: employeeId, is_empty: false })
        .eq('id', seatId);

      if (seatError) throw seatError;

      toast({
        title: "員工已啟用",
        description: "員工已被啟用並分配座位",
      });

      // 重新載入數據
      fetchSeatCoordinates();
      if (isAdmin) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, name, email, department, position, extension, photo, role, is_active');
        if (employeeData) {
          setEmployees(employeeData);
          setDisabledEmployees(employeeData.filter(emp => !emp.is_active));
        }
      }
      setShowDisabledEmployeesModal(false);
    } catch (error) {
      console.error('Error enabling employee:', error);
      toast({
        title: "啟用失敗",
        description: "無法啟用員工",
        variant: "destructive"
      });
    }
  };

  // 修復遺失的員工分配
  const restoreMissingEmployees = async () => {
    try {
      // 獲取所有活躍員工
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name')
        .eq('is_active', true)
        .neq('role', 'admin');

      if (empError) throw empError;

      // 獲取已分配座位的員工ID
      const { data: assignedSeats, error: seatError } = await supabase
        .from('seat_coordinates')
        .select('employee_id')
        .not('employee_id', 'is', null);

      if (seatError) throw seatError;

      const assignedEmployeeIds = assignedSeats.map(seat => seat.employee_id);
      const unassignedEmployees = employees.filter(emp => !assignedEmployeeIds.includes(emp.id));

      if (unassignedEmployees.length > 0) {
        // 獲取空座位
        const { data: emptySeats, error: emptySeatError } = await supabase
          .from('seat_coordinates')
          .select('id')
          .eq('is_empty', true)
          .limit(unassignedEmployees.length);

        if (emptySeatError) throw emptySeatError;

        // 分配員工到空座位
        for (let i = 0; i < Math.min(unassignedEmployees.length, emptySeats.length); i++) {
          const { error: updateError } = await supabase
            .from('seat_coordinates')
            .update({
              employee_id: unassignedEmployees[i].id,
              is_empty: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', emptySeats[i].id);

          if (updateError) throw updateError;
        }

        await fetchSeatCoordinates();
        
        toast({
          title: "員工位置已修復",
          description: `已重新分配 ${Math.min(unassignedEmployees.length, emptySeats.length)} 位員工到座位`,
        });
      }
    } catch (error) {
      console.error('修復員工位置時發生錯誤:', error);
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
    
    try {
      // 添加時間戳確保更新被識別
      const timestamp = new Date().toISOString();
      
      // 準備更新的數據 - 確保正確處理null值
      const seat1Updates: any = {
        employee_id: seat2.employee_id || null,
        is_empty: seat2.employee_id ? false : true,
        updated_at: timestamp
      };
      
      const seat2Updates: any = {
        employee_id: seat1.employee_id || null,
        is_empty: seat1.employee_id ? false : true,
        updated_at: timestamp
      };

      // 如果選擇交換電腦
      if (swapPc) {
        seat1Updates.pc_id = seat2.pc_id || null;
        seat2Updates.pc_id = seat1.pc_id || null;
      }

      console.log('Update data:', { seat1Updates, seat2Updates });

      // 同時更新兩個座位，避免數據競爭
      const [result1, result2] = await Promise.all([
        supabase
          .from('seat_coordinates')
          .update(seat1Updates)
          .eq('id', seat1.id),
        supabase
          .from('seat_coordinates')
          .update(seat2Updates)
          .eq('id', seat2.id)
      ]);

      const results = [result1, result2];
      
      // 檢查所有更新是否成功
      results.forEach((result, index) => {
        if (result.error) {
          console.error(`Update ${index + 1} failed:`, result.error);
          throw result.error;
        }
      });

      console.log('All updates successful');

      // 等待一小段時間確保數據庫更新完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
    } catch (error) {
      console.error('Error swapping employees:', error);
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
    
    try {
      // 添加時間戳確保更新被識別
      const timestamp = new Date().toISOString();
      
      // 準備更新的數據 - 只交換電腦ID，員工ID保持不變
      const seat1Updates: any = {
        pc_id: seat2.pc_id || null,
        updated_at: timestamp
      };
      
      const seat2Updates: any = {
        pc_id: seat1.pc_id || null,
        updated_at: timestamp
      };

      console.log('Update PC data:', { seat1Updates, seat2Updates });

      // 同時更新兩個座位的電腦ID
      const [result1, result2] = await Promise.all([
        supabase
          .from('seat_coordinates')
          .update(seat1Updates)
          .eq('id', seat1.id),
        supabase
          .from('seat_coordinates')
          .update(seat2Updates)
          .eq('id', seat2.id)
      ]);

      const results = [result1, result2];
      
      // 檢查所有更新是否成功
      results.forEach((result, index) => {
        if (result.error) {
          console.error(`PC swap ${index + 1} failed:`, result.error);
          throw result.error;
        }
      });

      console.log('PC swap successful');

      // 等待一小段時間確保數據庫更新完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
    } catch (error) {
      console.error('Error swapping PCs:', error);
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
      if (seat.employees && seat.employees.is_active !== false) {
        // 停用員工
        handleDisableEmployee(seat.employees.id, seat.id);
      } else if (!seat.employees || seat.is_empty) {
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
    
    // 設定選中的座位
    setSelectedSeat(seat);
    console.log('Selected seat:', seat);
    
    // 設定員工資訊 - 只有在沒有登入用戶時才更新右側面板的員工資訊
    if (!user) {
      if (seat.employees) {
        setSelectedSeatEmployee(seat.employees);
        console.log('Selected employee:', seat.employees);
      } else {
        setSelectedSeatEmployee(null);
        console.log('No employee on this seat');
      }
    }
    // 如果有登入用戶，保持顯示登入員工的資訊，不因點擊座位而改變
    
    // 如果在編輯模式且已經選中同一個座位，開始拖拽模式
    if (selectedSeat?.id === seat.id && isEditMode) {
      setIsDraggingSeat(true);
      setSeatDragPosition({ x: seat.x, y: seat.y });
      toast({
        title: "拖拽模式",
        description: "移動滑鼠至新位置後點擊釋放座位",
      });
    } else {
      const seatInfo = seat.employees ? `座位 ${seat.id} - ${seat.employees.name}` : `座位 ${seat.id}`;
      toast({
        title: "座位已選中",
        description: isEditMode ? `已選中${seatInfo}，再次點擊可進入拖拽模式` : `已選中${seatInfo}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header - 80px height */}
      <header className="h-20 w-[1400px] flex items-center justify-between px-6 bg-slate-800/50">
        {/* Time Display - 120px width */}
        <div className="w-30 bg-cyan-900/40 rounded-lg px-4 py-2 text-center">
          <div className="text-lg font-mono">{formatHeaderTime(currentTime)}</div>
          <div className="text-xs text-cyan-300">{formatHeaderDate(currentTime)}</div>
        </div>
        
        {/* Title - flexible width */}
        <div className="flex-1 flex items-center">
          <h1 className="text-2xl font-medium">
            辦公室座位與設備管理系統
          </h1>
          {currentEmployee && (
            <span className="text-lg text-cyan-300 ml-4">
              {currentEmployee.name}
            </span>
          )}
        </div>
        
        {/* Auth Buttons - 200px width */}
        <div className="w-50 flex gap-3">
          {user ? (
            <>
              {isAdmin && (
                <>
                  <button 
                    onClick={toggleEditMode}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      isEditMode 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isEditMode ? '完成編輯' : '編輯位置'}
                  </button>
                  <button 
                    onClick={handleAddPcClick}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      isSelectingSeatForPc 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'border border-green-500 text-green-400 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    {isSelectingSeatForPc ? '選擇座位中...' : '新增/移除-電腦'}
                  </button>
                  <button 
                    onClick={() => setIsSelectingSeatForEquipment(true)}
                    disabled={isViewingEquipment || isEquipmentModalOpen}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      isSelectingSeatForEquipment 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : (isViewingEquipment || isEquipmentModalOpen)
                        ? 'border border-gray-400 text-gray-400 cursor-not-allowed'
                        : 'border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {isSelectingSeatForEquipment ? '選擇座位中...' : '管理設備'}
                  </button>
                  {/* 系統整合管理按鈕 - 暫時隱藏 */}
                  {false && (
                    <button 
                      onClick={() => setIsAdminMigrationPanelOpen(!isAdminMigrationPanelOpen)}
                      className={`px-4 py-2 rounded text-sm transition-colors ${
                        isAdminMigrationPanelOpen 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                          : 'border border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white'
                      }`}
                    >
                      系統整合管理
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsManagingEmployees(!isManagingEmployees);
                      // 如果停止管理員工，重置相關狀態
                      if (isManagingEmployees) {
                        setShowDisabledEmployeesModal(false);
                        setSelectedEmptySeat(null);
                      }
                    }}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      isManagingEmployees 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'border border-orange-500 text-orange-400 hover:bg-orange-600 hover:text-white'
                    }`}
                  >
                    {isManagingEmployees ? '停止管理員工' : '管理員工狀態'}
                  </button>
                   <button 
                     onClick={() => {
                       setIsSwappingEmployees(!isSwappingEmployees);
                       // 如果停止交換，重置相關狀態
                       if (isSwappingEmployees) {
                         setSelectedSeatsForSwap([]);
                         setShowSwapConfirmModal(false);
                       }
                     }}
                     className={`px-4 py-2 rounded text-sm transition-colors ${
                       isSwappingEmployees 
                         ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                         : 'border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                     }`}
                   >
                     {isSwappingEmployees ? '停止交換' : '交換員工位置'}
                   </button>
                   {/* 修復員工位置按鈕 - 暫時隱藏 */}
                   {false && (
                     <button 
                       onClick={restoreMissingEmployees}
                       className="px-4 py-2 rounded text-sm transition-colors border border-cyan-500 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                     >
                       修復員工位置
                     </button>
                   )}
                </>
              )}
              <button 
                onClick={handleProfileEditClick}
                className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                修改個人資料
              </button>
              <button 
                onClick={() => setIsTimeClockModalOpen(true)}
                className="px-4 py-2 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                打卡
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                登入
              </button>
              <button 
                onClick={handleRegistrationClick}
                className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                註冊
              </button>
            </>
          )}
        </div>
      </header>

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
          {/* Legend - 400px width, 80px height */}
          <div className="w-100 mx-auto mb-4">
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">有員工</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">有PC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm">空位</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">已選中</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              請點選座位查看詳細信息 可按拖選進行位置調整
            </p>
          </div>

          {/* Container Display Area - Dynamic Canvas Size */}
          <div 
            className={`bg-slate-800/30 rounded-lg relative overflow-hidden ${
              isAddingContainer ? 'cursor-crosshair' : 
              isDraggingSeat ? 'cursor-move' : 
              isSeatEditMode && selectedContainer ? 'cursor-none' : ''
            }`}
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              backgroundImage: (isEditMode || isAddingContainer)
                ? `repeating-linear-gradient(to right, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px),
                   repeating-linear-gradient(to bottom, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px)`
                : 'none',
              backgroundSize: (isEditMode || isAddingContainer) ? '20px 20px' : 'auto',
              userSelect: 'none'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={(e) => {
              handleCanvasMouseMove(e);
              
              // 處理座位拖拽
              if (isDraggingSeat && selectedSeat && selectedContainer) {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const snapToGrid = (value: number) => Math.round(value / 20) * 20;
                
                // 檢查鼠標是否在選中的容器內
                const isInSelectedContainer = 
                  mouseX >= selectedContainer.x && 
                  mouseX <= selectedContainer.x + selectedContainer.width &&
                  mouseY >= selectedContainer.y && 
                  mouseY <= selectedContainer.y + selectedContainer.height;
                
                if (isInSelectedContainer) {
                  // 計算相對於容器的位置
                  const relativeX = mouseX - selectedContainer.x;
                  const relativeY = mouseY - selectedContainer.y;
                  const seatX = snapToGrid(relativeX);
                  const seatY = snapToGrid(relativeY);
                  
                  // 確保座位不會超出容器邊界
                  const maxX = selectedContainer.width - selectedSeat.pixel_x;
                  const maxY = selectedContainer.height - selectedSeat.pixel_y;
                  
                  setSeatDragPosition({
                    x: Math.max(0, Math.min(seatX, maxX)),
                    y: Math.max(0, Math.min(seatY, maxY))
                  });
                }
              }
              // 追蹤鼠標位置用於座位預覽
              else if (isSeatEditMode && selectedContainer) {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const snapToGrid = (value: number) => Math.round(value / 20) * 20;
                
                // 檢查鼠標是否在選中的容器內
                const isInSelectedContainer = 
                  mouseX >= selectedContainer.x && 
                  mouseX <= selectedContainer.x + selectedContainer.width &&
                  mouseY >= selectedContainer.y && 
                  mouseY <= selectedContainer.y + selectedContainer.height;
                
                if (isInSelectedContainer) {
                  const seatSize = getSeatSize(selectedSeatTemplate);
                  const seatX = snapToGrid(mouseX);
                  const seatY = snapToGrid(mouseY);
                  
                  // 確保座位不會超出容器邊界
                  const maxX = selectedContainer.x + selectedContainer.width - seatSize.width;
                  const maxY = selectedContainer.y + selectedContainer.height - seatSize.height;
                  
                  setContainerMousePosition({
                    x: Math.max(selectedContainer.x, Math.min(seatX, maxX)),
                    y: Math.max(selectedContainer.y, Math.min(seatY, maxY))
                  });
                  setShowSeatPreview(true);
                } else {
                  setShowSeatPreview(false);
                }
              } else {
                setShowSeatPreview(false);
              }
            }}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={(e) => {
              handleCanvasMouseUp();
              setShowSeatPreview(false);
            }}
          >
            {/* 橡皮筋矩形 */}
            {isAddingContainer && newContainerStart && newContainerEnd && (
              <div style={getRubberBandStyle()} />
            )}

            {/* Render containers with relative positioning and their seats */}
            {containers.map((container) => {
              // 調試日誌：檢查容器和座位數據
              const containerSeats = seatCoordinates.filter(seat => seat.container_id === container.id);
              console.log(`容器 "${container.name}" (${container.id}):`, {
                container_position: { x: container.x, y: container.y },
                container_size: { width: container.width, height: container.height },
                total_seats: containerSeats.length,
                seats_with_employees: containerSeats.filter(s => s.employees && !s.is_empty).length,
                seat_details: containerSeats.map(s => ({
                  id: s.id,
                  employee: s.employees?.name || '空座位',
                  position: `${s.x},${s.y}`,
                  pixel_size: `${s.pixel_x}×${s.pixel_y}`
                }))
              });
              
              // 優先使用編輯中的容器狀態，避免資料庫重載影響編輯
              const currentContainer = (editingContainer && editingContainer.id === container.id) 
                ? editingContainer 
                : container;
              const isSelected = selectedContainer?.id === container.id;
              
              return (
                <div 
                  key={container.id} 
                  className={`relative border bg-opacity-10 ${
                    isContainerEditMode ? 'cursor-pointer hover:border-yellow-400' : ''
                  } ${
                    isSelected ? 'border-yellow-400 border-2' : 'border-gray-700'
                  }`}
                   onClick={(e) => {
                     if (isSeatEditMode) {
                       handleContainerClickForSeat(e, container);
                     }
                     // 在編輯模式下，總是允許選擇容器
                     if (isEditMode) {
                       handleContainerClick(container);
                     }
                   }}
                  style={{ 
                    position: 'absolute',
                    left: `${currentContainer.x}px`,
                    top: `${currentContainer.y}px`,
                    width: `${currentContainer.width}px`,
                    height: `${currentContainer.height}px`,
                    backgroundColor: 'transparent'
                  }}
                  title={`容器: ${currentContainer.name} 位置:(${currentContainer.x}, ${currentContainer.y}) 大小:(${currentContainer.width}×${currentContainer.height})`}
                >
                  {/* 容器名稱 */}
                  <div className="absolute inset-0 flex items-start justify-center text-lg font-medium text-white pointer-events-none pt-2">
                    {currentContainer.name}
                  </div>
                  
                  {/* Resize Handles - 只在選中時顯示 */}
                  {isSelected && isContainerEditMode && (
                    <>
                      {/* Top handle */}
                      <div 
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-2 bg-yellow-400 cursor-n-resize select-none"
                        onMouseDown={(e) => handleMouseDown(e, 'top')}
                        style={{ userSelect: 'none' }}
                      />
                      {/* Bottom handle */}
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-6 h-2 bg-yellow-400 cursor-s-resize select-none"
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        style={{ userSelect: 'none' }}
                      />
                      {/* Left handle */}
                      <div 
                        className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-w-resize select-none"
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        style={{ userSelect: 'none' }}
                      />
                      {/* Right handle */}
                      <div 
                        className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-e-resize select-none"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        style={{ userSelect: 'none' }}
                      />
                    </>
                  )}

                  {/* Render seats relative to this container */}
                  {seatCoordinates
                    .filter(seat => seat.container_id === container.id)
                    .map((seat) => {
                      // 調試日誌：檢查每個座位的渲染狀態
                      console.log(`渲染座位 ${seat.id}:`, {
                        container: seat.container,
                        position: { x: seat.x, y: seat.y },
                        pixel_size: { width: seat.pixel_x, height: seat.pixel_y },
                        employee: seat.employees ? {
                          name: seat.employees.name,
                          photo: seat.employees.photo,
                          is_active: seat.employees.is_active
                        } : null,
                        is_empty: seat.is_empty,
                        container_dimensions: { width: container.width, height: container.height }
                      });
                      // 決定座位顏色 - 使用透明色
                      let seatColor = 'rgba(107, 114, 128, 0.6)'; // 透明灰色 (空位)
                      let borderColor = 'rgba(156, 163, 175, 0.4)'; // 預設邊框
                      
                      if (seat.employee_id) {
                        seatColor = 'rgba(59, 130, 246, 0.6)'; // 透明藍色 (有員工)
                        borderColor = 'rgba(59, 130, 246, 0.8)'; // 藍色邊框
                      } else if (seat.pc_id) {
                        seatColor = 'rgba(16, 185, 129, 0.6)'; // 透明綠色 (有PC)
                      } else if (seat.equipment_id) {
                        seatColor = 'rgba(147, 51, 234, 0.6)'; // 透明紫色 (有設備)
                        borderColor = 'rgba(16, 185, 129, 0.8)'; // 綠色邊框
                      }
                      
                      // 在註冊座位選擇模式時，如果是選中的座位顯示紅色
                      if (isSelectingSeatForRegistration && selectedSeatForRegistration?.id === seat.id) {
                        seatColor = 'rgba(239, 68, 68, 0.6)'; // 透明紅色表示已選中
                        borderColor = 'rgba(239, 68, 68, 0.8)'; // 紅色邊框
                      }
                      
                       // 如果是選中的座位並且在拖拽模式，使用拖拽位置
                       const isCurrentSeatDragging = isDraggingSeat && selectedSeat?.id === seat.id;
                       const displayX = isCurrentSeatDragging ? seatDragPosition.x : seat.x;
                       const displayY = isCurrentSeatDragging ? seatDragPosition.y : seat.y;
                       
                       return (
                         <div
                           key={seat.id}
                              className={`seat-container absolute rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 ${
                                selectedSeat?.id === seat.id ? 'ring-2 ring-red-400 ring-opacity-80' : ''
                              } ${
                                isSwappingEmployees && selectedSeatsForSwap.find(s => s.id === seat.id) 
                                  ? 'ring-4 ring-purple-400 ring-opacity-100' : ''
                              }`}
                           style={{
                             left: `${displayX}px`,
                             top: `${displayY}px`,
                             width: `${seat.pixel_x}px`,
                             height: `${seat.pixel_y}px`,
                               backgroundColor: selectedSeat?.id === seat.id ? 'rgba(239, 68, 68, 0.8)' : 
                                 isSwappingEmployees && selectedSeatsForSwap.find(s => s.id === seat.id) ? 'rgba(168, 85, 247, 0.8)' : seatColor,
                               border: `2px solid ${selectedSeat?.id === seat.id ? 'rgba(239, 68, 68, 1)' : 
                                 isSwappingEmployees && selectedSeatsForSwap.find(s => s.id === seat.id) ? 'rgba(168, 85, 247, 1)' : borderColor}`,
                              backdropFilter: 'blur(4px)',
                             // 拖拽中的座位加上特殊效果
                             opacity: isCurrentSeatDragging ? 0.8 : 1,
                             transform: isCurrentSeatDragging ? 'scale(1.05)' : 'scale(1)',
                             zIndex: isCurrentSeatDragging ? 1000 : 'auto'
                           }}
                             onClick={(e) => {
                                // 允許所有模式下點擊座位查看資訊
                                handleSeatClick(e, seat);
                              }}
                            title={`座位 ${seat.id} 容器內位置:(${seat.x}, ${seat.y}) 大小:(${seat.pixel_x}×${seat.pixel_y}) ${seat.employees ? `員工: ${seat.employees.name}` : '空座位'}`}
                          >
                            {/* 員工資訊顯示 */}
                            {seat.employees && (
                              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                                {seat.employees.photo ? (
                                  // 有頭像時顯示圓形頭像
                                  <div className="relative group">
                                    <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                                      <img
                                        src={seat.employees.photo.startsWith('http') 
                                          ? seat.employees.photo 
                                          : `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/staff/${seat.employees.photo}`
                                        }
                                        alt={seat.employees.name}
                                        className="employee-avatar w-full h-full object-cover transition-all duration-300"
                                      onLoad={() => {
                                        console.log('頭像載入成功:', seat.employees.name, seat.employees.photo);
                                      }}
                                      onError={(e) => {
                                        console.error('頭像載入失敗:', seat.employees.name, seat.employees.photo);
                                        console.error('嘗試載入的URL:', e.currentTarget.src);
                                        // 如果圖片載入失敗，隱藏圖片並顯示預設圓形圖示
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          const fallback = document.createElement('div');
                                          fallback.className = 'employee-avatar w-full h-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-300';
                                          fallback.innerHTML = '<div class="text-2xl">👤</div>';
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                       />
                                     </div>
                                     {/* 懸停時顯示名字 */}
                                     <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                      {seat.employees.name}
                                    </div>
                                  </div>
                                ) : (
                                  // 沒有頭像時顯示圓形預設圖示
                                  <div className="relative group">
                                    <div className="employee-avatar w-[60px] h-[60px] rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/50 shadow-lg transition-all duration-300">
                                      <div className="w-full h-full text-white flex items-center justify-center">
                                        <div className="text-2xl">👤</div>
                                      </div>
                                    </div>
                                    {/* 懸停時顯示名字 */}
                                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                      {seat.employees.name}
                                   </div>
                                 </div>
                               )}
                              </div>
                             )}
                              
                             {/* 電腦圖示顯示 */}
                              {seat.pcs && (
                                <div className="absolute bottom-1 right-1">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-xs">💻</span>
                                  </div>
                                </div>
                              )}
                             
                              {/* 設備圖示顯示 - 充滿整個座位 */}
                              {seat.equipment && (
                                <div className="absolute inset-0">
                                  {seat.equipment.photo ? (
                                    <div 
                                      className="w-full h-full rounded-lg overflow-hidden border-2 border-white/30 shadow-lg cursor-pointer hover:border-white/50 transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEquipmentClick(seat.equipment);
                                      }}
                                      title={`設備: ${seat.equipment.product}`}
                                    >
                                      <img
                                        src={seat.equipment.photo.startsWith('http') 
                                          ? seat.equipment.photo 
                                          : `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/equipment/${seat.equipment.photo}`
                                        }
                                        alt={seat.equipment.product}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.error('設備圖片載入失敗:', seat.equipment.product, seat.equipment.photo);
                                          // 如果圖片載入失敗，顯示預設圖示
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full bg-purple-500/80 rounded-lg flex items-center justify-center"><span class="text-white text-2xl">⚙️</span></div>';
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      className="w-full h-full bg-purple-500/80 rounded-lg flex items-center justify-center shadow-lg cursor-pointer hover:bg-purple-500/90 transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEquipmentClick(seat.equipment);
                                      }}
                                      title={`設備: ${seat.equipment.product}`}
                                    >
                                      <span className="text-white text-2xl">⚙️</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            
                            {/* 拖拽中的座位顯示十字線 */}
                            {isCurrentSeatDragging && (
                             <div
                               className="absolute"
                               style={{
                                 left: '-8px',
                                 top: '-8px',
                                 width: '16px',
                                 height: '16px',
                                 pointerEvents: 'none'
                               }}
                             >
                               {/* 垂直線 */}
                               <div
                                 className="absolute bg-red-500"
                                 style={{
                                   left: '7px',
                                   top: '0px',
                                   width: '2px',
                                   height: '16px'
                                 }}
                               />
                               {/* 水平線 */}
                               <div
                                 className="absolute bg-red-500"
                                 style={{
                                   left: '0px',
                                   top: '7px',
                                   width: '16px',
                                   height: '2px'
                                 }}
                               />
                             </div>
                           )}
                         </div>
                       );
                    })
                  }
                </div>
              );
            })}
            
            {/* 座位預覽 - 跟隨鼠標的座位模板 */}
            {showSeatPreview && isSeatEditMode && selectedContainer && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${containerMousePosition.x}px`,
                  top: `${containerMousePosition.y}px`,
                  width: `${getSeatSize(selectedSeatTemplate).width}px`,
                  height: `${getSeatSize(selectedSeatTemplate).height}px`,
                  backgroundColor: 'rgba(34, 197, 94, 0.5)',
                  border: '2px dashed #22c55e',
                  borderRadius: '4px',
                  zIndex: 1000
                }}
              >
                {/* 十字線在左上角 */}
                <div
                  className="absolute"
                  style={{
                    left: '-8px',
                    top: '-8px',
                    width: '16px',
                    height: '16px',
                    pointerEvents: 'none'
                  }}
                >
                  {/* 垂直線 */}
                  <div
                    className="absolute bg-red-500"
                    style={{
                      left: '7px',
                      top: '0px',
                      width: '2px',
                      height: '16px'
                    }}
                  />
                  {/* 水平線 */}
                  <div
                    className="absolute bg-red-500"
                    style={{
                      left: '0px',
                      top: '7px',
                      width: '16px',
                      height: '2px'
                    }}
                  />
                </div>
                
                {/* 座位模板標示 */}
                <div
                  className="absolute text-white text-xs font-bold flex items-center justify-center bg-black/60 rounded px-1"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '10px'
                  }}
                >
                  {selectedSeatTemplate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - 3 Containers - 250px width */}
        <div className="w-[250px] flex flex-col gap-2 h-[calc(100vh-120px)]">
          {/* Combined Staff Info + Work Log Container */}
          <div className="flex-[1.8] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4 space-y-4">
            {/* Staff Info Section */}
            {selectedSeatEmployee ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white text-lg font-medium">員工資訊</span>
                  </div>
                  <span className="text-white text-lg font-medium">{selectedSeatEmployee.name}</span>
                </div>
                
                {/* Avatar and basic info */}
                <div className="flex flex-col items-center mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-500 mb-2">
                    {selectedSeatEmployee.photo ? (
                      <img 
                        src={selectedSeatEmployee.photo.startsWith('http') 
                          ? selectedSeatEmployee.photo 
                          : `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/staff/${selectedSeatEmployee.photo}`
                        }
                        alt={selectedSeatEmployee.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gray-600 flex items-center justify-center"><span class="text-xl text-white">👤</span></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <span className="text-xl text-white">👤</span>
                      </div>
                    )}
                  </div>
                  <span className="text-blue-300 text-sm">{selectedSeatEmployee.position || '未設定職位'}</span>
                </div>
                
                {/* Contact info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-white">分機: {selectedSeatEmployee.extension || '未設定'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white">部門: {selectedSeatEmployee.department || '未設定部門'}</span>
                  </div>
                </div>
              </div>
            ) : isSelectingSeatForRegistration ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                  <span className="text-lg">🪑</span>
                </div>
                <h3 className="text-sm font-medium text-blue-300 mb-2">選擇座位</h3>
                <p className="text-xs text-gray-400 mb-2">請在平面圖中點選一個空的座位</p>
                <button 
                  onClick={() => {
                    setIsSelectingSeatForRegistration(false);
                    toast({
                      title: "已取消",
                      description: "已取消座位選擇",
                    });
                  }}
                  className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
                >
                  取消選擇
                </button>
              </div>
            ) : isEditMode ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-cyan-300 text-center">系統管理員</h3>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                    <span className="text-lg text-white">👤</span>
                  </div>
                  <span className="text-blue-300 text-sm">系統管理員</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-6 border border-gray-600 rounded"></div>
                </div>
                <p className="text-xs text-gray-400 text-center">請點選座位查看員工信息</p>
              </div>
            )}

            {/* Edit Tools (always show in edit mode) */}
            {isEditMode && (
              <div className="space-y-2 mb-3">
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯模式</h3>
                <button 
                  onClick={startAddingContainer}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                >
                  新增容器
                </button>
                <button 
                  onClick={toggleContainerEditMode}
                  className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isContainerEditMode 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isContainerEditMode ? '退出編輯容器' : '編輯容器'}
                </button>
                <button 
                  onClick={deleteContainer}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                >
                  刪除容器
                </button>
                <button 
                  onClick={toggleSeatEditMode}
                  disabled={!selectedContainer}
                  className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isSeatEditMode 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } ${!selectedContainer ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  新增座位
                </button>
                <button 
                  onClick={deleteSeat}
                  disabled={!selectedSeat || !selectedContainer || selectedSeat.container_id !== selectedContainer.id}
                  className={`w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors ${
                    (!selectedSeat || !selectedContainer || selectedSeat.container_id !== selectedContainer.id) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  刪除座位
                </button>
              </div>
            )}

            {/* Work Log Section (title removed) */}
            {selectedSeatEmployee ? (
              currentEmployee && currentEmployee.id === selectedSeatEmployee.id ? (
                <WorkLogPanel 
                  employeeId={selectedSeatEmployee.id}
                  employeeName={selectedSeatEmployee.name}
                  currentUserId={currentEmployee?.id || null}
                  pcData={null}
                />
              ) : (
                <WorkLogViewer 
                  employeeId={selectedSeatEmployee.id}
                  employeeName={selectedSeatEmployee.name}
                  currentUserId={currentEmployee?.id || null}
                  pcData={null}
                />
              )
            ) : isEditMode ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯模式</h3>
                <button 
                  onClick={startAddingContainer}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                >
                  新增容器
                </button>
                <button 
                  onClick={toggleContainerEditMode}
                  className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isContainerEditMode 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isContainerEditMode ? '退出編輯容器' : '編輯容器'}
                </button>
                <button 
                  onClick={deleteContainer}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                >
                  刪除容器
                </button>
                <button 
                  onClick={toggleSeatEditMode}
                  disabled={!selectedContainer}
                  className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isSeatEditMode 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } ${!selectedContainer ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  新增座位
                </button>
                <button 
                  onClick={deleteSeat}
                  disabled={!selectedSeat || !selectedContainer || selectedSeat.container_id !== selectedContainer.id}
                  className={`w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors ${
                    (!selectedSeat || !selectedContainer || selectedSeat.container_id !== selectedContainer.id) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  刪除座位
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-6 border border-gray-600 rounded"></div>
                </div>
                <p className="text-xs text-gray-400 text-center">工作日誌</p>
              </div>
            )}
          </div>

          {/* PC Data Container - larger height */}
          <div className="flex-[1.2] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4">
            {selectedSeat?.pcs ? (
              <>
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
                <PcDataDisplay 
                  pcData={selectedSeat.pcs} 
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Registration Modal */}
      <RegistrationModal 
        key={registrationModalKey}
        isOpen={isRegistrationModalOpen} 
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setSelectedSeatForRegistration(null);
          setIsSelectingSeatForRegistration(false);
        }}
        selectedSeat={selectedSeatForRegistration}
        containers={containers}
        onRegistrationSuccess={handleRegistrationSuccess}
        isEditMode={!!user}
        currentEmployee={currentEmployee}
      />

      {/* Add PC Modal */}
      <AddPcModal 
        isOpen={isAddPcModalOpen}
        onClose={() => {
          setIsAddPcModalOpen(false);
          setSelectedSeatForPc(null);
          setIsSelectingSeatForPc(false);
        }}
        selectedSeat={selectedSeatForPc}
        existingPc={selectedSeatForPc?.pcs}
        onSuccess={handleAddPcSuccess}
      />

      {/* Equipment Modal */}
      <EquipmentModal 
        isOpen={isEquipmentModalOpen}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setSelectedSeatForEquipment(null);
          setIsSelectingSeatForEquipment(false);
        }}
        equipment={selectedSeatForEquipment?.equipment}
        onSave={handleEquipmentSave}
        currentEmployee={currentEmployee}
      />

      {/* Equipment Data Display */}
      {isViewingEquipment && selectedEquipment && (
        <EquipmentDataDisplay 
          equipment={selectedEquipment}
          onClose={() => {
            setIsViewingEquipment(false);
            setSelectedEquipment(null);
          }}
          onEdit={isAdmin ? handleEquipmentEdit : undefined}
          isAdmin={isAdmin}
        />
      )}

      {/* Time Clock Modal */}
      {currentEmployee && (
        <TimeClockModal 
          isOpen={isTimeClockModalOpen}
          onClose={() => setIsTimeClockModalOpen(false)}
          employeeId={currentEmployee.id}
          employeeName={currentEmployee.name}
          isAdmin={currentEmployee.role === 'admin'}
        />
      )}

      {/* Name Dialog for New Container */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-white mb-4">新增容器</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">容器名稱</label>
              <input
                type="text"
                value={newContainerName}
                onChange={(e) => setNewContainerName(e.target.value)}
                placeholder="請輸入容器名稱"
                className="w-full px-3 py-2 bg-slate-600 border border-gray-500 rounded text-white"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveNewContainer}
                disabled={!newContainerName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                保存
              </button>
              <button
                onClick={cancelNewContainer}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已停用員工選擇模態框 */}
      {showDisabledEmployeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">選擇要啟用的員工</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {disabledEmployees.length === 0 ? (
                <p className="text-gray-400 text-sm">沒有已停用的員工</p>
              ) : (
                disabledEmployees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleEnableEmployee(employee.id, selectedEmptySeat?.id)}
                    className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <div className="text-white font-medium">{employee.name}</div>
                    <div className="text-gray-400 text-sm">{employee.email}</div>
                    <div className="text-gray-400 text-sm">{employee.department} - {employee.position}</div>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDisabledEmployeesModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 員工位置交換確認模態框 */}
      {showSwapConfirmModal && selectedSeatsForSwap.length === 2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">確認交換員工位置</h3>
            
            <div className="space-y-4 mb-6">
              {/* 第一個座位信息 */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">座位 1: {selectedSeatsForSwap[0].id}</h4>
                {selectedSeatsForSwap[0].employees ? (
                  <div>
                    <p className="text-gray-300">員工: {selectedSeatsForSwap[0].employees.name}</p>
                    <p className="text-gray-400 text-sm">{selectedSeatsForSwap[0].employees.department} - {selectedSeatsForSwap[0].employees.position}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">空座位</p>
                )}
                {selectedSeatsForSwap[0].pcs && (
                  <p className="text-blue-400 text-sm mt-1">電腦: {selectedSeatsForSwap[0].pcs.name}</p>
                )}
              </div>

              {/* 交換箭頭 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* 第二個座位信息 */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">座位 2: {selectedSeatsForSwap[1].id}</h4>
                {selectedSeatsForSwap[1].employees ? (
                  <div>
                    <p className="text-gray-300">員工: {selectedSeatsForSwap[1].employees.name}</p>
                    <p className="text-gray-400 text-sm">{selectedSeatsForSwap[1].employees.department} - {selectedSeatsForSwap[1].employees.position}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">空座位</p>
                )}
                {selectedSeatsForSwap[1].pcs && (
                  <p className="text-blue-400 text-sm mt-1">電腦: {selectedSeatsForSwap[1].pcs.name}</p>
                )}
              </div>
            </div>

            {/* 是否交換電腦的選項 */}
            {(selectedSeatsForSwap[0].pcs || selectedSeatsForSwap[1].pcs) && (
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-yellow-400 text-sm mb-2">⚠️ 檢測到電腦設備</p>
                <p className="text-gray-300 text-sm">是否同時交換電腦設備？</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {(selectedSeatsForSwap[0].pcs || selectedSeatsForSwap[1].pcs) ? (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSwapEmployees(false)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                    >
                      僅交換員工
                    </button>
                    <button
                      onClick={handleSwapPcsOnly}
                      className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm"
                    >
                      僅交換電腦
                    </button>
                    <button
                      onClick={() => handleSwapEmployees(true)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
                    >
                      交換員工和電腦
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleSwapEmployees(false)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  確認交換
                </button>
              )}
              <button
                onClick={() => {
                  setShowSwapConfirmModal(false);
                  setSelectedSeatsForSwap([]);
                }}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;