
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<{name: string, email: string} | null>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [seatCoordinates, setSeatCoordinates] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number}>({width: 1060, height: 850});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isContainerEditMode, setIsContainerEditMode] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string>('');
  const { toast } = useToast();

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

    // 載入座位座標資料
    const fetchSeatCoordinates = async () => {
      const { data, error } = await supabase
        .from('seat_coordinates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching seat coordinates:', error);
      } else {
        setSeatCoordinates(data || []);
      }
    };

    fetchCanvasSize();
    fetchContainers();
    fetchSeatCoordinates();

    return () => {
      clearTimer();
    };
  }, []);

  const handleLoginSuccess = (employee: {id: string, name: string, email: string}) => {
    setCurrentEmployee(employee);
    setUser({ email: employee.email } as User);
    
    // 設定3分鐘後自動登出
    const logoutTimer = setTimeout(() => {
      handleLogout();
      toast({
        title: "自動登出",
        description: "由於安全考量，已自動登出",
      });
    }, 30 * 60 * 1000); // 3分鐘
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentEmployee(null);
    setIsEditMode(false);
    setIsContainerEditMode(false);
    setSelectedContainer(null);
    setEditingContainer(null);
    setIsDragging(false);
    toast({
      title: "登出成功",
      description: "已成功登出系統",
    });
  };

  // 檢查是否為管理員（暫時使用email判斷）
  const isAdmin = currentEmployee?.email === 'admin@company.com' || currentEmployee?.name?.includes('管理員');

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setIsContainerEditMode(false);
      setSelectedContainer(null);
      setEditingContainer(null);
    }
    toast({
      title: isEditMode ? "退出編輯模式" : "進入編輯模式",
      description: isEditMode ? "已退出編輯模式" : "已進入編輯模式",
    });
  };

  const toggleContainerEditMode = () => {
    setIsContainerEditMode(!isContainerEditMode);
    setSelectedContainer(null);
    setEditingContainer(null);
    toast({
      title: isContainerEditMode ? "退出容器編輯" : "進入容器編輯",
      description: isContainerEditMode ? "已退出容器編輯模式" : "點擊容器進行編輯",
    });
  };

  const handleContainerClick = (container: any) => {
    if (isContainerEditMode && !isDragging) {
      setSelectedContainer(container);
      setEditingContainer({...container});
      toast({
        title: "容器已選中",
        description: `正在編輯: ${container.name}`,
      });
    }
  };

  const handleContainerNameChange = (name: string) => {
    if (editingContainer) {
      setEditingContainer({...editingContainer, name});
    }
  };

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editingContainer || !dragHandle) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let newContainer = {...editingContainer};
    
    switch(dragHandle) {
      case 'top':
        const newHeight = newContainer.height + (newContainer.y - mouseY);
        if (newHeight > 50) {
          newContainer.y = mouseY;
          newContainer.height = newHeight;
        }
        break;
      case 'bottom':
        const bottomHeight = mouseY - newContainer.y;
        if (bottomHeight > 50) {
          newContainer.height = bottomHeight;
        }
        break;
      case 'left':
        const newWidth = newContainer.width + (newContainer.x - mouseX);
        if (newWidth > 50) {
          newContainer.x = mouseX;
          newContainer.width = newWidth;
        }
        break;
      case 'right':
        const rightWidth = mouseX - newContainer.x;
        if (rightWidth > 50) {
          newContainer.width = rightWidth;
        }
        break;
    }
    
    setEditingContainer(newContainer);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle('');
  };

  const saveContainerChanges = async () => {
    if (!editingContainer) return;
    
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

  const cancelContainerChanges = () => {
    if (selectedContainer) {
      setEditingContainer({...selectedContainer});
      toast({
        title: "已取消變更",
        description: "容器變更已取消",
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
                <button 
                  onClick={toggleEditMode}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    isEditMode 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {isEditMode ? '退出編輯' : '編輯位置'}
                </button>
              )}
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
                onClick={() => setIsAuthModalOpen(true)}
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
          <h2 className="text-lg mb-6 text-center">部門座位配置</h2>
          
          {/* Legend - 400px width, 80px height */}
          <div className="w-100 mx-auto mb-6">
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
            className="bg-slate-800/30 rounded-lg relative overflow-hidden"
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              backgroundImage: isEditMode 
                ? `repeating-linear-gradient(to right, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px),
                   repeating-linear-gradient(to bottom, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px)`
                : 'none',
              backgroundSize: isEditMode ? '20px 20px' : 'auto'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Render containers with relative positioning and their seats */}
            {containers.map((container) => {
              const currentContainer = editingContainer && editingContainer.id === container.id ? editingContainer : container;
              const isSelected = selectedContainer?.id === container.id;
              
              return (
                <div 
                  key={container.id} 
                  className={`relative border bg-opacity-10 ${
                    isContainerEditMode ? 'cursor-pointer hover:border-yellow-400' : ''
                  } ${
                    isSelected ? 'border-yellow-400 border-2' : 'border-gray-700'
                  }`}
                  onClick={() => handleContainerClick(container)}
                  style={{ 
                    marginLeft: `${currentContainer.x}px`,
                    marginTop: `${currentContainer.y}px`,
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
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-2 bg-yellow-400 cursor-n-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'top')}
                    />
                    {/* Bottom handle */}
                    <div 
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-6 h-2 bg-yellow-400 cursor-s-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                    />
                    {/* Left handle */}
                    <div 
                      className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-w-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'left')}
                    />
                    {/* Right handle */}
                    <div 
                      className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-e-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'right')}
                    />
                  </>
                )}

                {/* Render seats relative to this container */}
                {seatCoordinates
                  .filter(seat => seat.container_id === container.id)
                  .map((seat) => {
                    // 決定座位顏色
                    let seatColor = '#6b7280'; // 預設灰色 (空位)
                    if (seat.employee_id && seat.pc_id) {
                      seatColor = '#3b82f6'; // 藍色 (有員工)
                    } else if (seat.pc_id) {
                      seatColor = '#10b981'; // 綠色 (有PC)
                    }
                    
                    return (
                      <div
                        key={seat.id}
                        className="absolute border border-gray-400 rounded cursor-pointer hover:border-white transition-colors"
                        style={{
                          left: `${seat.x}px`,
                          top: `${seat.y}px`,
                          width: `${seat.pixel_x}px`,
                          height: `${seat.pixel_y}px`,
                          backgroundColor: seatColor
                        }}
                        title={`座位 ${seat.id} 容器內位置:(${seat.x}, ${seat.y}) 大小:(${seat.pixel_x}×${seat.pixel_y})`}
                      />
                    );
                  })
                }
              </div>
            );
          })}
          </div>
        </div>

        {/* Right Panel - Seat Details or Edit Tools - 250px width */}
        <div className="w-[250px] bg-slate-800/30 rounded-lg border border-gray-700 p-6">
          {isEditMode ? (
            /* 編輯模式 */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-cyan-300 text-center mb-6">編輯模式</h3>
              
              {/* 新增容器 */}
              <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                新增容器
              </button>
              
              {/* 編輯容器 */}
              <button 
                onClick={toggleContainerEditMode}
                className={`w-full px-4 py-3 rounded text-sm font-medium transition-colors ${
                  isContainerEditMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isContainerEditMode ? '退出編輯容器' : '編輯容器'}
              </button>
              
              {/* 新增座位 */}
              <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
                新增座位
              </button>
              
              {/* 編輯容器表單 */}
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-cyan-300 mb-3">編輯容器</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">名稱:</label>
                    <input 
                      type="text" 
                      value={editingContainer ? editingContainer.name : ''}
                      placeholder="容器名稱"
                      onChange={(e) => handleContainerNameChange(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-600 border border-gray-500 rounded text-sm"
                      disabled={!editingContainer}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    <div>位置: ({editingContainer ? `${Math.round(editingContainer.x)}, ${Math.round(editingContainer.y)}` : '0, 0'})</div>
                    <div>大小: {editingContainer ? `${Math.round(editingContainer.width)}×${Math.round(editingContainer.height)}` : '0×0'}</div>
                  </div>
                  
                  {/* 保存/取消按鈕 */}
                  <div className="space-y-2 mt-4">
                    <button 
                      onClick={saveContainerChanges}
                      disabled={!editingContainer}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                    >
                      保存異更
                    </button>
                    <button 
                      onClick={cancelContainerChanges}
                      disabled={!editingContainer}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                    >
                      取消異更
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 編輯狀態指示 */}
              <div className="mt-4 text-xs text-green-400 space-y-1">
                <div>編輯模式: ON</div>
                <div>編輯容器: {isContainerEditMode ? 'ON' : 'OFF'}</div>
                <div>異更容器: {editingContainer ? editingContainer.name : '未選擇'}</div>
              </div>
            </div>
          ) : (
            /* 一般模式 */
            <div className="flex flex-col items-center justify-center h-full">
              {/* Monitor Icon - 80px width, 60px height */}
              <div className="w-20 h-15 mb-4 border-2 border-gray-600 rounded-lg flex items-center justify-center">
                <div className="w-12 h-8 border border-gray-600 rounded"></div>
              </div>
              
              {/* Text Content - 250px width */}
              <div className="w-62 text-center">
                <p className="text-sm text-gray-400 mb-2">請點選座位查看詳細信息</p>
                <p className="text-xs text-gray-500">可按拖選進行位置調整</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Index;
