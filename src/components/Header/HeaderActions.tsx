interface HeaderActionsProps {
  user: any;
  isAdmin: boolean;
  isEditMode: boolean;
  isSelectingSeatForPc: boolean;
  isSelectingSeatForEquipment: boolean;
  isViewingEquipment: boolean;
  isEquipmentModalOpen: boolean;
  isManagingEmployees: boolean;
  isSwappingEmployees: boolean;
  onToggleEditMode: () => void;
  onAddPcClick: () => void;
  onStartAddEquipment: () => void;
  onToggleManagingEmployees: () => void;
  onToggleSwappingEmployees: () => void;
  onRestoreMissingEmployees: () => void;
  onOpenPasswordReset: () => void;
  onProfileEdit: () => void;
  onOpenTimeClock: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const HeaderActions = ({
  user,
  isAdmin,
  isEditMode,
  isSelectingSeatForPc,
  isSelectingSeatForEquipment,
  isViewingEquipment,
  isEquipmentModalOpen,
  isManagingEmployees,
  isSwappingEmployees,
  onToggleEditMode,
  onAddPcClick,
  onStartAddEquipment,
  onToggleManagingEmployees,
  onToggleSwappingEmployees,
  onRestoreMissingEmployees,
  onOpenPasswordReset,
  onProfileEdit,
  onOpenTimeClock,
  onLogout,
  onLogin,
  onRegister,
}: HeaderActionsProps) => {
  if (user) {
    return (
      <div className="w-50 flex gap-3">
        {isAdmin && (
          <>
            <button 
              onClick={onToggleEditMode}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isEditMode 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isEditMode ? '完成編輯' : '編輯位置'}
            </button>
            <button 
              onClick={onAddPcClick}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isSelectingSeatForPc 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border border-green-500 text-green-400 hover:bg-green-600 hover:text-white'
              }`}
            >
              {isSelectingSeatForPc ? '選擇座位中...' : '新增/移除-電腦'}
            </button>
            <button 
              onClick={onStartAddEquipment}
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
            <button 
              onClick={onToggleManagingEmployees}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                isManagingEmployees 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'border border-orange-500 text-orange-400 hover:bg-orange-600 hover:text-white'
              }`}
            >
              {isManagingEmployees ? '停止管理員工' : '管理員工狀態'}
            </button>
            <button 
              onClick={onToggleSwappingEmployees}
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
                onClick={onRestoreMissingEmployees}
                className="px-4 py-2 rounded text-sm transition-colors border border-cyan-500 text-cyan-400 hover:bg-cyan-600 hover:text-white"
              >
                修復員工位置
              </button>
            )}
            {/* 密碼重設按鈕 */}
            <button 
              onClick={onOpenPasswordReset}
              className="px-4 py-2 rounded text-sm transition-colors border border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
            >
              重設員工密碼
            </button>
          </>
        )}
        <button 
          onClick={onProfileEdit}
          className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          修改個人資料
        </button>
        <button 
          onClick={onOpenTimeClock}
          className="px-4 py-2 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          打卡
        </button>
        <button 
          onClick={onLogout}
          className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <div className="w-50 flex gap-3">
      <button 
        onClick={onLogin}
        className="px-4 py-2 border border-gray-500 rounded text-sm hover:bg-gray-700 transition-colors"
      >
        登入
      </button>
      <button 
        onClick={onRegister}
        className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
      >
        註冊
      </button>
    </div>
  );
};

export default HeaderActions;
