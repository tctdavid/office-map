import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import RegistrationModal from "@/components/RegistrationModal";
import AddPcModal from "@/components/AddPcModal";
import TimeClockModal from "@/components/TimeClockModal";
import WorkLogPanel from "@/components/WorkLogPanel";
import WorkLogViewer from "@/components/WorkLogViewer";
import PcDataDisplay from "@/components/PcDataDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
  const { toast } = useToast();

  // 載入座位座標資料
  const fetchSeatCoordinates = async () => {
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
          case_photo,
          monitor_a,
          monitor_a_photo,
          monitor_b,
          monitor_b_photo
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching seat coordinates:', error);
    } else {
      setSeatCoordinates(data || []);
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

    return () => {
      clearTimer();
    };
  }, [isContainerEditMode, editingContainer, isDragging]);

  const handleLoginSuccess = async (employee: {id: string, name: string, email: string}) => {
    // 需要獲取完整的員工資訊包含role
    try {
      const { data: fullEmployee, error } = await supabase
        .from('employees')
        .select('*')
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
        .select('*')
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
    
    if (!error && data) {
      setSeatCoordinates(data);
      
      // 自動選中剛註冊的座位並顯示員工資訊
      const registeredSeat = data.find(seat => seat.id === selectedSeatForRegistration?.id);
      if (registeredSeat && registeredSeat.employees) {
        setSelectedSeat(registeredSeat);
        setSelectedSeatEmployee(registeredSeat.employees);
      }
    }

    // 重新載入員工資料
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*');
    
    if (!employeeError && employeeData) {
      setEmployees(employeeData);
    }
    
    // 重置註冊狀態
    setIsSelectingSeatForRegistration(false);
    setSelectedSeatForRegistration(null);
    setIsRegistrationModalOpen(false);
  };

  // 檢查是否為管理員
  const isAdmin = currentEmployee?.email === 'admin@company.com' || currentEmployee?.name?.includes('管理員');

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

  // 處理座位點擊
  const handleSeatClick = (e: React.MouseEvent, seat: any) => {
    e.stopPropagation();
    
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
          <div className="text-lg font-mono">15:41</div>
          <div className="text-xs text-cyan-300">07/21</div>
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
                    {isSelectingSeatForPc ? '選擇座位中...' : '新增電腦'}
                  </button>
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
                onClick={() => setIsAuthModalOpen(true)}
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
                      // 決定座位顏色 - 使用透明色
                      let seatColor = 'rgba(107, 114, 128, 0.6)'; // 透明灰色 (空位)
                      let borderColor = 'rgba(156, 163, 175, 0.4)'; // 預設邊框
                      
                      if (seat.employee_id) {
                        seatColor = 'rgba(59, 130, 246, 0.6)'; // 透明藍色 (有員工)
                        borderColor = 'rgba(59, 130, 246, 0.8)'; // 藍色邊框
                      } else if (seat.pc_id) {
                        seatColor = 'rgba(16, 185, 129, 0.6)'; // 透明綠色 (有PC)
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
                             }`}
                           style={{
                             left: `${displayX}px`,
                             top: `${displayY}px`,
                             width: `${seat.pixel_x}px`,
                             height: `${seat.pixel_y}px`,
                              backgroundColor: selectedSeat?.id === seat.id ? 'rgba(239, 68, 68, 0.8)' : seatColor,
                              border: `2px solid ${selectedSeat?.id === seat.id ? 'rgba(239, 68, 68, 1)' : borderColor}`,
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
        <div className="w-[250px] flex flex-col gap-2">
          {/* Combined Staff Info + Work Log Container */}
          <div className="flex-[1.85] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4 space-y-4">
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

            {/* Work Log Section (title removed) */}
            {selectedSeatEmployee ? (
              currentEmployee && currentEmployee.id === selectedSeatEmployee.id ? (
                <WorkLogPanel 
                  employeeId={selectedSeatEmployee.id}
                  employeeName={selectedSeatEmployee.name}
                  pcData={null}
                />
              ) : (
                <WorkLogViewer 
                  employeeId={selectedSeatEmployee.id}
                  employeeName={selectedSeatEmployee.name}
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
          <div className="flex-[1.15] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4">
            {selectedSeat?.pcs ? (
              <>
                <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
                <PcDataDisplay pcData={selectedSeat.pcs} />
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
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
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
    </div>
  );
};

export default Index;