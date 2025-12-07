interface ContainerEditSectionProps {
  editingContainer: any;
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  onContainerNameChange: (name: string) => void;
  onSaveContainerChanges: () => void;
  onCancelContainerChanges: () => void;
  onTemplateChange: (template: string) => void;
}

export default function ContainerEditSection({
  editingContainer,
  isSeatEditMode,
  selectedSeatTemplate,
  onContainerNameChange,
  onSaveContainerChanges,
  onCancelContainerChanges,
  onTemplateChange,
}: ContainerEditSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯容器</h3>
      
      {editingContainer && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400">名稱:</label>
            <input 
              type="text" 
              value={editingContainer.name}
              placeholder="容器名稱"
              onChange={(e) => onContainerNameChange(e.target.value)}
              className="w-full mt-1 px-2 py-1 bg-slate-600 border border-gray-500 rounded text-xs"
            />
          </div>
          <div className="text-xs text-gray-400">
            <div>位置: ({Math.round(editingContainer.x)}, {Math.round(editingContainer.y)})</div>
            <div>大小: {Math.round(editingContainer.width)}×{Math.round(editingContainer.height)}</div>
          </div>
          <div className="space-y-1">
            <button 
              onClick={onSaveContainerChanges} 
              className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
            >
              保存變更
            </button>
            <button 
              onClick={onCancelContainerChanges} 
              className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
            >
              取消變更
            </button>
          </div>
        </div>
      )}
      
      {isSeatEditMode && (
        <div className="mt-3 space-y-2">
          <h4 className="text-xs font-medium text-cyan-300">座位模板</h4>
          <div className="space-y-1">
            {['120x70', '70x90', '40x40'].map(template => (
              <div key={template}>
                <input 
                  type="radio" 
                  id={`template-${template}`}
                  name="seatTemplate" 
                  value={template}
                  checked={selectedSeatTemplate === template}
                  onChange={(e) => onTemplateChange(e.target.value)}
                  className="mr-2"
                />
                <label htmlFor={`template-${template}`} className="text-xs text-gray-300">
                  {template.replace('x', '×')}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
