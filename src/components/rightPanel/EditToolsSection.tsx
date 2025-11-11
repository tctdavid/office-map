interface EditToolsSectionProps {
  startAddingContainer: () => void;
  toggleContainerEditMode: () => void;
  isContainerEditMode: boolean;
  deleteContainer: () => void;
  toggleSeatEditMode: () => void;
  selectedContainer: any;
  isSeatEditMode: boolean;
  deleteSeat: () => void;
  selectedSeat: any;
}

const EditToolsSection = (props: EditToolsSectionProps) => {
  return (
    <div className="space-y-2 mb-3">
      <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯模式</h3>
      <button 
        onClick={props.startAddingContainer}
        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
      >
        新增容器
      </button>
      <button 
        onClick={props.toggleContainerEditMode}
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
          props.isContainerEditMode 
            ? 'bg-yellow-600 hover:bg-yellow-700' 
            : 'bg-orange-600 hover:bg-orange-700'
        }`}
      >
        {props.isContainerEditMode ? '退出編輯容器' : '編輯容器'}
      </button>
      <button 
        onClick={props.deleteContainer}
        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
      >
        刪除容器
      </button>
      <button 
        onClick={props.toggleSeatEditMode}
        disabled={!props.selectedContainer}
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
          props.isSeatEditMode 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-green-600 hover:bg-green-700'
        } ${!props.selectedContainer ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        新增座位
      </button>
      <button 
        onClick={props.deleteSeat}
        disabled={!props.selectedSeat || !props.selectedContainer || props.selectedSeat.container_id !== props.selectedContainer.id}
        className={`w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors ${
          (!props.selectedSeat || !props.selectedContainer || props.selectedSeat.container_id !== props.selectedContainer.id) 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
        }`}
      >
        刪除座位
      </button>
    </div>
  );
};

export default EditToolsSection;
