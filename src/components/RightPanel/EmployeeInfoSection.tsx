import { User, Phone, Briefcase } from "lucide-react";
import { getStaffPhotoUrl } from "@/lib/supabase-storage";

interface EmployeeInfoSectionProps {
  isSelectingSeatForRegistration: boolean;
  isEditMode: boolean;
  selectedSeatEmployee: any;
  onCancelSelection: () => void;
}

export default function EmployeeInfoSection({
  isSelectingSeatForRegistration,
  isEditMode,
  selectedSeatEmployee,
  onCancelSelection,
}: EmployeeInfoSectionProps) {
  // 座位選擇模式
  if (isSelectingSeatForRegistration) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">🪑</span>
        </div>
        <h3 className="text-sm font-medium text-blue-300 mb-2">選擇座位</h3>
        <p className="text-xs text-gray-400 mb-2">請在平面圖中點選一個空的座位</p>
        <button
          onClick={onCancelSelection}
          className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
        >
          取消選擇
        </button>
      </div>
    );
  }

  // 編輯模式 - 顯示管理員信息
  if (isEditMode) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-cyan-300 text-center">系統管理員</h3>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-white" />
          </div>
          <span className="text-blue-300 text-sm">系統管理員</span>
        </div>
      </div>
    );
  }

  // 有選中員工 - 顯示完整員工信息
  if (selectedSeatEmployee) {
    const photoUrl = selectedSeatEmployee.photo 
      ? getStaffPhotoUrl(selectedSeatEmployee.photo)
      : null;

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span className="text-white text-lg font-medium">員工資訊</span>
          </div>
          <span className="text-white text-lg font-medium">{selectedSeatEmployee.name}</span>
        </div>
        
        {/* Avatar and basic info */}
        <div className="flex flex-col items-center mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-500 mb-2">
            {photoUrl ? (
              <img 
                src={photoUrl}
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
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-white">分機: {selectedSeatEmployee.extension || '未設定'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span className="text-white">部門: {selectedSeatEmployee.department || '未設定部門'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 默認狀態 - 提示用戶選擇座位
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-6 border border-gray-600 rounded"></div>
      </div>
      <p className="text-xs text-gray-400 text-center">請點選座位查看員工信息</p>
    </div>
  );
}
