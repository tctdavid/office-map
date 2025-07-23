import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<{name: string, email: string, role?: string} | null>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [seatCoordinates, setSeatCoordinates] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);
  const [isEditingContainer, setIsEditingContainer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-top' | 'resize-bottom' | 'resize-left' | 'resize-right' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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

    fetchContainers();
    fetchSeatCoordinates();
  }, []);

  const handleLoginSuccess = (employee: {id: string, name: string, email: string, role?: string}) => {
    console.log('Login success, employee data:', employee); // 添加調試日誌
    setCurrentEmployee(employee);
    setUser({ email: employee.email } as User);
    
    // 暫時停用3分鐘自動登出功能
    // const logoutTimer = setTimeout(() => {
    //   handleLogout();
    //   toast({
    //     title: "自動登出",
    //     description: "由於安全考量，已自動登出",
    //   });
    // }, 3 * 60 * 1000); // 3分鐘
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentEmployee(null);
    toast({
      title: "登出成功",
      description: "已成功登出系統",
    });
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
              {currentEmployee.role && (
                <span className="text-sm text-yellow-300 ml-2">({currentEmployee.role})</span>
              )}
            </span>
          )}
        </div>
        
        {/* Auth Buttons - 200px width */}
        <div className="w-50 flex gap-3">
          {user ? (
            <>
              {/* 編輯模式按鈕 - 只有管理員才能看見 */}
              {currentEmployee?.role === 'admin' && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    isEditMode 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border border-orange-500 text-orange-500 hover:bg-orange-600 hover:text-white'
                  }`}
                >
                  {isEditMode ? '退出編輯' : '編輯模式'}
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
        {/* Left Panel - Seat Configuration - 800px width */}
        <div className="w-200 flex-1">
          <h2 className="text-lg mb-6 text-center">部門座座位配置</h2>
          
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

          {/* Containers Display Area - 1100px width, 800px height */}
          <div className="w-[1100px] h-[800px] mx-auto bg-slate-800/30 rounded-lg border border-gray-700 p-4 overflow-hidden">
            <h3 className="text-lg font-medium mb-2 text-cyan-300 text-center">{containers.length > 0 ? containers[0].name : '容器資料'}</h3>
            <hr className="border-cyan-300/50 mb-4" />
            <div className="relative">
              {/* Render seat coordinates */}
              {seatCoordinates.map((seat) => {
                // 找到座位對應的容器
                const container = containers.find(c => c.id === seat.container_id);
                const containerX = container ? container.x : 0;
                const containerY = container ? container.y : 0;
                
                return (
                  <div
                    key={seat.id}
                    className={`absolute border rounded cursor-pointer transition-colors ${
                      isEditMode 
                        ? (selectedSeat?.id === seat.id 
                            ? 'bg-red-500 border-red-400' 
                            : 'bg-gray-500 border-gray-400 hover:bg-gray-400')
                        : 'bg-gray-500 border-gray-400'
                    }`}
                    style={{
                      left: `${containerX + seat.x}px`,
                      top: `${containerY + seat.y}px`,
                      width: `${seat.pixel_x}px`,
                      height: `${seat.pixel_y}px`
                    }}
                    title={`座位 ${seat.id} 容器:(${containerX}, ${containerY}) 相對:(${seat.x}, ${seat.y}) 大小:(${seat.pixel_x}×${seat.pixel_y})`}
                    onClick={() => {
                      if (isEditMode && !isEditingContainer) {
                        setSelectedSeat(selectedSeat?.id === seat.id ? null : seat);
                        setSelectedContainer(null);
                      }
                    }}
                  />
                );
              })}
              
              {containers.map((container) => (
                <div 
                  key={container.id} 
                  className={`absolute transition-all duration-200 z-20 cursor-pointer ${
                    selectedContainer?.id === container.id && isEditMode && isEditingContainer
                      ? 'border-2 border-yellow-400 bg-yellow-400/20 shadow-lg'
                      : 'border border-transparent'
                  }`}
                  style={{ 
                    left: `${container.x}px`,
                    top: `${container.y}px`,
                    width: `${container.width}px`,
                    height: `${container.height}px`,
                    borderStyle: selectedContainer?.id === container.id && isEditMode && isEditingContainer ? 'dashed' : 'solid',
                    backgroundColor: selectedContainer?.id === container.id && isEditMode && isEditingContainer ? 'rgba(251, 191, 36, 0.2)' : 'transparent'
                  }}
                  title={`容器: ${container.name} 位置:(${container.x}, ${container.y}) 大小:(${container.width}×${container.height})`}
                  onClick={() => {
                    if (isEditMode && isEditingContainer) {
                      console.log('Container clicked:', container); // 調試用
                      console.log('Current selectedContainer:', selectedContainer);
                      console.log('isEditMode:', isEditMode, 'isEditingContainer:', isEditingContainer);
                      const newSelection = selectedContainer?.id === container.id ? null : container;
                      console.log('Setting selectedContainer to:', newSelection);
                      setSelectedContainer(newSelection);
                      setSelectedSeat(null);
                    } else {
                      console.log('Click ignored - isEditMode:', isEditMode, 'isEditingContainer:', isEditingContainer);
                    }
                  }}
                >
                  {isEditMode && isEditingContainer && selectedContainer?.id === container.id && (
                    <>
                      {/* 容器名稱 */}
                      <div className="absolute top-1 left-1 text-xs text-cyan-300 bg-slate-800/90 px-2 py-1 rounded border border-cyan-400">
                        {container.name}
                      </div>
                      
                      {/* 四邊調整控制點 */}
                      {/* 上邊 */}
                      <div 
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-yellow-400 border border-yellow-300 rounded cursor-ns-resize"
                        title="調整高度"
                      ></div>
                      
                      {/* 下邊 */}
                      <div 
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-yellow-400 border border-yellow-300 rounded cursor-ns-resize"
                        title="調整高度"
                      ></div>
                      
                      {/* 左邊 */}
                      <div 
                        className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-6 bg-yellow-400 border border-yellow-300 rounded cursor-ew-resize"
                        title="調整寬度"
                      ></div>
                      
                      {/* 右邊 */}
                      <div 
                        className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-6 bg-yellow-400 border border-yellow-300 rounded cursor-ew-resize"
                        title="調整寬度"
                      ></div>
                      
                      {/* 移動控制點（中央） */}
                      <div 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-400 border border-green-300 rounded-full cursor-move"
                        title="移動容器"
                      ></div>
                    </>
                  )}
                </div>
              ))}
              {containers.length === 0 && seatCoordinates.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  目前沒有容器資料
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Panel - Seat Details - 250px width */}
        <div className="w-[250px] bg-slate-800/30 rounded-lg border border-gray-700 p-6">
          {isEditMode ? (
            /* 編輯模式界面 */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-cyan-300 text-center">編輯模式</h3>
              
              {/* 新增容器按鈕 */}
              <button 
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                onClick={() => {
                  // TODO: 實現新增容器功能
                  toast({
                    title: "功能開發中",
                    description: "新增容器功能即將推出",
                  });
                }}
              >
                新增容器
              </button>
              
              {/* 編輯容器按鈕 */}
              <button 
                className={`w-full px-4 py-2 rounded text-sm transition-colors ${
                  isEditingContainer 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                onClick={() => {
                  setIsEditingContainer(!isEditingContainer);
                  setSelectedContainer(null);
                  setSelectedSeat(null);
                }}
              >
                {isEditingContainer ? '退出編輯容器' : '編輯容器'}
              </button>
              
              {/* 新增座位按鈕 */}
              <button 
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                onClick={() => {
                  // TODO: 實現新增座位功能
                  toast({
                    title: "功能開發中", 
                    description: "新增座位功能即將推出",
                  });
                }}
              >
                新增座位
              </button>
              
              {/* 選中項目資訊 */}
              {selectedContainer && isEditingContainer && (
                <div className="bg-slate-700/50 rounded p-3">
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">編輯容器</h4>
                  
                  {/* 容器名稱編輯 */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-400 block mb-1">名稱:</label>
                    <input 
                      type="text" 
                      value={selectedContainer.name}
                      onChange={(e) => {
                        setSelectedContainer({
                          ...selectedContainer,
                          name: e.target.value
                        });
                      }}
                      className="w-full px-2 py-1 text-xs bg-slate-600 border border-gray-500 rounded"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-300 mb-1">位置: ({selectedContainer.x}, {selectedContainer.y})</p>
                  <p className="text-xs text-gray-300 mb-3">大小: {selectedContainer.width}×{selectedContainer.height}</p>
                  
                  {/* 保存按鈕 */}
                  <button 
                    className="w-full mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('containers')
                          .update({
                            name: selectedContainer.name,
                            x: selectedContainer.x,
                            y: selectedContainer.y,
                            width: selectedContainer.width,
                            height: selectedContainer.height,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedContainer.id);
                        
                        if (error) {
                          toast({
                            title: "保存失敗",
                            description: "無法保存容器變更",
                          });
                        } else {
                          // 更新本地狀態
                          setContainers(containers.map(c => 
                            c.id === selectedContainer.id ? selectedContainer : c
                          ));
                          toast({
                            title: "保存成功",
                            description: "容器已成功更新",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "保存失敗",
                          description: "發生未知錯誤",
                        });
                      }
                    }}
                  >
                    保存變更
                  </button>
                  
                  {/* 取消選擇按鈕 */}
                  <button 
                    className="w-full mt-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
                    onClick={() => {
                      setSelectedContainer(null);
                    }}
                  >
                    取消選擇
                  </button>
                </div>
              )}
              
              {selectedSeat && (
                <div className="bg-slate-700/50 rounded p-3">
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">選中座位</h4>
                  <p className="text-xs text-gray-300">ID: {selectedSeat.id}</p>
                  <p className="text-xs text-gray-300">位置: ({selectedSeat.x}, {selectedSeat.y})</p>
                  <p className="text-xs text-gray-300">大小: {selectedSeat.pixel_x}×{selectedSeat.pixel_y}</p>
                  <button 
                    className="w-full mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-colors"
                    onClick={() => {
                      // TODO: 實現編輯座位功能
                      toast({
                        title: "功能開發中",
                        description: "編輯座位功能即將推出",
                      });
                    }}
                  >
                    編輯座位
                  </button>
                </div>
              )}
               
               <div className="text-xs text-gray-400 text-center mt-4">
                 點擊容器或座位進行選擇和編輯
               </div>
               
               {/* 調試信息 */}
               <div className="text-xs text-green-400 mt-2 p-2 bg-slate-800 rounded">
                 <div>編輯模式: {isEditMode ? 'ON' : 'OFF'}</div>
                 <div>編輯容器: {isEditingContainer ? 'ON' : 'OFF'}</div>
                 <div>選中容器: {selectedContainer ? selectedContainer.name : '無'}</div>
               </div>
            </div>
          ) : (
            /* 一般模式界面 */
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