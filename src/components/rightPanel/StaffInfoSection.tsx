import { getStaffPhotoUrl } from "@/lib/supabase-storage";
import { useToast } from "@/hooks/use-toast";

interface StaffInfoSectionProps {
  selectedSeatEmployee: any;
  isSelectingSeatForRegistration: boolean;
  isEditMode: boolean;
  setIsSelectingSeatForRegistration: (value: boolean) => void;
}

const StaffInfoSection = (props: StaffInfoSectionProps) => {
  const { toast } = useToast();

  if (props.selectedSeatEmployee) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-lg font-medium">員工資訊</span>
          </div>
          <span className="text-white text-lg font-medium">{props.selectedSeatEmployee.name}</span>
        </div>
        
        <div className="flex flex-col items-center mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-blue-500 mb-2">
            {props.selectedSeatEmployee.photo ? (
              <img 
                src={getStaffPhotoUrl(props.selectedSeatEmployee.photo) || ''}
                alt={props.selectedSeatEmployee.name}
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
          <span className="text-blue-300 text-sm">{props.selectedSeatEmployee.position || '未設定職位'}</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-white">分機: {props.selectedSeatEmployee.extension || '未設定'}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white">部門: {props.selectedSeatEmployee.department || '未設定部門'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (props.isSelectingSeatForRegistration) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">🪑</span>
        </div>
        <h3 className="text-sm font-medium text-blue-300 mb-2">選擇座位</h3>
        <p className="text-xs text-gray-400 mb-2">請在平面圖中點選一個空的座位</p>
        <button 
          onClick={() => {
            props.setIsSelectingSeatForRegistration(false);
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
    );
  }

  if (props.isEditMode) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-cyan-300 text-center">系統管理員</h3>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-lg text-white">👤</span>
          </div>
          <span className="text-blue-300 text-sm">系統管理員</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-6 border border-gray-600 rounded"></div>
      </div>
      <p className="text-xs text-gray-400 text-center">請點選座位查看員工信息</p>
    </div>
  );
};

export default StaffInfoSection;
