interface HeaderBarProps {
  currentTime: Date;
  currentEmployee: any;
  user: any;
  isAdmin: boolean;
  isEditMode: boolean;
  isSelectingSeatForPc: boolean;
  isSelectingSeatForEquipment: boolean;
  isViewingEquipment: boolean;
  isEquipmentModalOpen: boolean;
  isAdminMigrationPanelOpen: boolean;
  isManagingEmployees: boolean;
  isSwappingEmployees: boolean;
  toggleEditMode: () => void;
  handleAddPcClick: () => void;
  startAddEquipment: () => void;
  setIsAdminMigrationPanelOpen: (value: boolean) => void;
  setIsManagingEmployees: (value: boolean) => void;
  setShowDisabledEmployeesModal: (value: boolean) => void;
  setSelectedEmptySeat: (value: any) => void;
  setIsSwappingEmployees: (value: boolean) => void;
  setSelectedSeatsForSwap: (value: any[]) => void;
  setShowSwapConfirmModal: (value: boolean) => void;
  setIsPasswordResetModalOpen: (value: boolean) => void;
  handleRegistrationClick: () => void;
  handleProfileEditClick: () => void;
  setIsLoginModalOpen: (value: boolean) => void;
  handleLogout: () => void;
  setIsTimeClockModalOpen: (value: boolean) => void;
}

const HeaderBar = (props: HeaderBarProps) => {
  const formatHeaderTime = (d: Date) => d.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });
  const formatHeaderDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });

  return (
    <header className="h-20 w-[1400px] flex items-center justify-between px-6 bg-slate-800/50">
      {/* Time Display */}
      <div className="w-30 bg-cyan-900/40 rounded-lg px-4 py-2 text-center">
        <div className="text-lg font-mono">{formatHeaderTime(props.currentTime)}</div>
        <div className="text-xs text-cyan-300">{formatHeaderDate(props.currentTime)}</div>
      </div>
      
      {/* Title */}
      <div className="flex-1 flex items-center">
        <h1 className="text-2xl font-medium">辦公室座位與設備管理系統</h1>
        {props.currentEmployee && (
          <span className="text-lg text-cyan-300 ml-4">{props.currentEmployee.name}</span>
        )}
      </div>
      
      {/* Auth Buttons */}
      <div className="w-50 flex gap-3">
        {props.user ? (
          <>
            {props.isAdmin && (
              <>
                <button 
                  onClick={props.toggleEditMode}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    props.isEditMode 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {props.isEditMode ? '完成編輯' : '編輯位置'}
                </button>
                <button 
                  onClick={props.handleAddPcClick}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    props.isSelectingSeatForPc 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border border-green-500 text-green-400 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  {props.isSelectingSeatForPc ? '選擇座位中...' : '新增/移除-電腦'}
                </button>
                <button 
                  onClick={props.startAddEquipment}
                  disabled={props.isViewingEquipment || props.isEquipmentModalOpen}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    props.isSelectingSeatForEquipment 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : (props.isViewingEquipment || props.isEquipmentModalOpen)
                      ? 'border border-gray-400 text-gray-400 cursor-not-allowed'
                      : 'border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  {props.isSelectingSeatForEquipment ? '選擇座位中...' : '管理設備'}
                </button>
                <button 
                  onClick={() => {
                    props.setIsManagingEmployees(!props.isManagingEmployees);
                    if (props.isManagingEmployees) {
                      props.setShowDisabledEmployeesModal(false);
                      props.setSelectedEmptySeat(null);
                    }
                  }}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    props.isManagingEmployees 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border border-orange-500 text-orange-400 hover:bg-orange-600 hover:text-white'
                  }`}
                >
                  {props.isManagingEmployees ? '停止管理員工' : '管理員工狀態'}
                </button>
                <button 
                  onClick={() => {
                    props.setIsSwappingEmployees(!props.isSwappingEmployees);
                    if (props.isSwappingEmployees) {
                      props.setSelectedSeatsForSwap([]);
                      props.setShowSwapConfirmModal(false);
                    }
                  }}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    props.isSwappingEmployees 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  {props.isSwappingEmployees ? '停止交換' : '交換員工位置'}
                </button>
                <button 
                  onClick={() => props.setIsPasswordResetModalOpen(true)}
                  className="px-4 py-2 border border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded text-sm transition-colors"
                >
                  重設員工密碼
                </button>
              </>
            )}
            {!props.isAdmin && (
              <>
                <button 
                  onClick={props.handleRegistrationClick}
                  className="px-4 py-2 border border-green-500 text-green-400 hover:bg-green-600 hover:text-white rounded text-sm transition-colors"
                >
                  新人註冊
                </button>
                <button 
                  onClick={props.handleProfileEditClick}
                  className="px-4 py-2 border border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded text-sm transition-colors"
                >
                  修改個人資料
                </button>
              </>
            )}
            <button 
              onClick={() => props.setIsLoginModalOpen(true)}
              className="px-4 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded text-sm transition-colors"
            >
              切換帳號
            </button>
            <button 
              onClick={props.handleLogout}
              className="px-4 py-2 border border-red-500 text-red-400 hover:bg-red-600 hover:text-white rounded text-sm transition-colors"
            >
              登出
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => props.setIsLoginModalOpen(true)}
              className="px-4 py-2 border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-sm transition-colors"
            >
              登入
            </button>
            <button 
              onClick={props.handleRegistrationClick}
              className="px-4 py-2 border border-green-500 text-green-400 hover:bg-green-600 hover:text-white rounded text-sm transition-colors"
            >
              新人註冊
            </button>
          </>
        )}
        <button 
          onClick={() => props.setIsTimeClockModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded text-sm font-medium transition-all"
        >
          打卡
        </button>
      </div>
    </header>
  );
};

export default HeaderBar;
