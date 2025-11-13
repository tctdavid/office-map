interface EditToolsSectionProps {
  isEditMode: boolean;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedContainer: any;
  selectedSeat: any;
  onStartAddingContainer: () => void;
  onToggleContainerEditMode: () => void;
  onDeleteContainer: () => void;
  onToggleSeatEditMode: () => void;
  onDeleteSeat: () => void;
}

export default function EditToolsSection({
  isEditMode,
  isContainerEditMode,
  isSeatEditMode,
  selectedContainer,
  selectedSeat,
  onStartAddingContainer,
  onToggleContainerEditMode,
  onDeleteContainer,
  onToggleSeatEditMode,
  onDeleteSeat,
}: EditToolsSectionProps) {
  if (!isEditMode) return null;

  const canDeleteSeat = selectedSeat && selectedContainer && 
    selectedSeat.container_id === selectedContainer.id;

  return (
    <div className="space-y-2 mb-3">
      <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯模式</h3>
      
      <button 
        onClick={onStartAddingContainer}
        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
      >
        新增容器
      </button>
      
      <button 
        onClick={onToggleContainerEditMode}
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
          isContainerEditMode 
            ? 'bg-yellow-600 hover:bg-yellow-700' 
            : 'bg-orange-600 hover:bg-orange-700'
        }`}
      >
        {isContainerEditMode ? '退出編輯容器' : '編輯容器'}
      </button>
      
      <button 
        onClick={onDeleteContainer}
        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
      >
        刪除容器
      </button>
      
      <button 
        onClick={onToggleSeatEditMode}
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
        onClick={onDeleteSeat}
        disabled={!canDeleteSeat}
        className={`w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors ${
          !canDeleteSeat ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        刪除座位
      </button>
    </div>
  );
}
