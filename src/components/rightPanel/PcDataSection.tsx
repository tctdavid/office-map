import PcDataDisplay from '@/components/PcDataDisplay';

interface PcDataSectionProps {
  selectedSeat: any;
  isEditMode: boolean;
  editingContainer: any;
  isSeatEditMode: boolean;
  selectedSeatTemplate: string;
  handleContainerNameChange: (value: string) => void;
  saveContainerChanges: () => void;
  cancelContainerChanges: () => void;
  setSelectedSeatTemplate: (value: string) => void;
}

const PcDataSection = (props: PcDataSectionProps) => {
  if (props.selectedSeat?.pc) {
    return (
      <>
        <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
        <PcDataDisplay pcData={props.selectedSeat.pc} />
      </>
    );
  }

  if (props.isEditMode) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">編輯容器</h3>
        {props.editingContainer && (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">名稱:</label>
              <input 
                type="text" 
                value={props.editingContainer.name}
                placeholder="容器名稱"
                onChange={(e) => props.handleContainerNameChange(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-slate-600 border border-gray-500 rounded text-xs"
              />
            </div>
            <div className="text-xs text-gray-400">
              <div>位置: ({Math.round(props.editingContainer.x)}, {Math.round(props.editingContainer.y)})</div>
              <div>大小: {Math.round(props.editingContainer.width)}×{Math.round(props.editingContainer.height)}</div>
            </div>
            <div className="space-y-1">
              <button 
                onClick={props.saveContainerChanges}
                className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
              >
                保存變更
              </button>
              <button 
                onClick={props.cancelContainerChanges}
                className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
              >
                取消變更
              </button>
            </div>
          </div>
        )}
        {props.isSeatEditMode && (
          <div className="mt-3 space-y-2">
            <h4 className="text-xs font-medium text-cyan-300">座位模板</h4>
            <div className="space-y-1">
              {['120x70', '70x90', '40x40'].map((template) => (
                <div key={template}>
                  <input 
                    type="radio" 
                    id={`template-${template}`}
                    name="seatTemplate" 
                    value={template}
                    checked={props.selectedSeatTemplate === template}
                    onChange={(e) => props.setSelectedSeatTemplate(e.target.value)}
                    className="mr-2"
                  />
                  <label htmlFor={`template-${template}`} className="text-xs text-gray-300">
                    {template}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-6 border border-gray-600 rounded"></div>
      </div>
      <p className="text-xs text-gray-400 text-center">電腦設備</p>
    </div>
  );
};

export default PcDataSection;
