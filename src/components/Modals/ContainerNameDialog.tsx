interface ContainerNameDialogProps {
  isOpen: boolean;
  containerName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ContainerNameDialog = ({
  isOpen,
  containerName,
  onNameChange,
  onSave,
  onCancel,
}: ContainerNameDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium text-white mb-4">新增容器</h3>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">容器名稱</label>
          <input
            type="text"
            value={containerName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="請輸入容器名稱"
            className="w-full px-3 py-2 bg-slate-600 border border-gray-500 rounded text-white"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={!containerName.trim()}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContainerNameDialog;
