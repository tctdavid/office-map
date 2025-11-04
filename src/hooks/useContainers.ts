import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { snapToGrid } from '@/utils/seatCalculations';

export const useContainers = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const [isContainerEditMode, setIsContainerEditMode] = useState(false);
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainerStart, setNewContainerStart] = useState<{x: number, y: number} | null>(null);
  const [newContainerEnd, setNewContainerEnd] = useState<{x: number, y: number} | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [pendingContainer, setPendingContainer] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string>('');
  const [backupContainers, setBackupContainers] = useState<any[]>([]);
  
  const { toast } = useToast();

  // 載入容器資料
  const fetchContainers = async () => {
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

  // 檢查容器重疊
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

  // 處理容器點擊
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

  // 切換容器編輯模式
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

  // 開始新增容器
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

  // 處理容器名稱變更
  const handleContainerNameChange = (name: string) => {
    if (editingContainer) {
      setEditingContainer({...editingContainer, name});
    }
  };

  // 處理鼠標按下（拖拽手柄）
  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
  };

  // 處理畫布鼠標按下
  const handleCanvasMouseDownForContainer = (
    e: React.MouseEvent,
    canvasSize: {width: number, height: number}
  ) => {
    if (!isAddingContainer) return false;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const startPoint = {
      x: Math.max(0, Math.min(snapToGrid(mouseX), canvasSize.width)),
      y: Math.max(0, Math.min(snapToGrid(mouseY), canvasSize.height))
    };
  
    setNewContainerStart(startPoint);
    setNewContainerEnd(startPoint);
    setIsDragging(true);
    return true;
  };

  // 處理畫布鼠標移動
  const handleCanvasMouseMoveForContainer = (
    e: React.MouseEvent,
    canvasSize: {width: number, height: number}
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isAddingContainer && isDragging && newContainerStart) {
      const endPoint = {
        x: Math.max(0, Math.min(snapToGrid(mouseX), canvasSize.width)),
        y: Math.max(0, Math.min(snapToGrid(mouseY), canvasSize.height))
      };
      
      setNewContainerEnd(endPoint);
      return true;
    } else if (isDragging && editingContainer && dragHandle) {
      e.preventDefault();
      e.stopPropagation();
      
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
      return true;
    }
    return false;
  };

  // 處理畫布鼠標釋放
  const handleCanvasMouseUpForContainer = () => {
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
      return true;
    } else if (isDragging && editingContainer) {
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
      return true;
    }
    return false;
  };

  // 保存容器變更
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

  // 保存新容器
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

  // 取消新容器
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

  // 取消容器變更
  const cancelContainerChanges = () => {
    if (selectedContainer) {
      setEditingContainer({...selectedContainer});
      toast({
        title: "已取消變更",
        description: "容器變更已取消",
      });
    }
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

  // 獲取橡皮筋樣式
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

  return {
    // States
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
    
    // Setters
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
    setDragHandle,
    setBackupContainers,
    
    // Functions
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
  };
};
