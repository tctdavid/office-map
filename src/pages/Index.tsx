import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import ContainerElement from "@/components/ContainerElement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<{name: string, email: string} | null>(null);
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
    }, 3 * 60 * 1000); // 3分鐘
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
            </span>
          )}
        </div>
        
        {/* Auth Buttons - 200px width */}
        <div className="w-50 flex gap-3">
          {user ? (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              登出
            </button>
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

          {/* Seat Grid Area - 700px width, 400px height */}
          <div className="w-175 h-100 mx-auto bg-slate-800/30 rounded-lg border border-gray-700">
            {/* Seat grid will be implemented here */}
          </div>

          {/* Individual Elements Container */}
          <div className="mt-6">
            <h3 className="text-md mb-4 text-center">Individual Elements</h3>
            <div className="relative mx-auto" style={{ width: '1000px', height: '1000px' }}>
              <ContainerElement />
            </div>
          </div>
        </div>

        {/* Right Panel - Seat Details - 250px width */}
        <div className="w-[250px] bg-slate-800/30 rounded-lg border border-gray-700 p-6 flex flex-col items-center justify-center">
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