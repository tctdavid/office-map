// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
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
        <h1 className="text-xl font-medium text-center flex-1">
          辦公室座位與設備管理系統
        </h1>
        
        {/* Auth Buttons - 200px width */}
        <div className="w-50 flex gap-3">
          <button className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors">
            登入
          </button>
          <button className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors">
            註冊
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 p-6 gap-6">
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
        </div>

        {/* Right Panel - Seat Details - 200px width */}
        <div className="w-50 bg-slate-800/30 rounded-lg border border-gray-700 p-6 flex flex-col items-center justify-center">
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
    </div>
  );
};

export default Index;
