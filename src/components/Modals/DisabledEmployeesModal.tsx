interface DisabledEmployee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
}

interface DisabledEmployeesModalProps {
  isOpen: boolean;
  disabledEmployees: DisabledEmployee[];
  selectedEmptySeatId?: string;
  onEnableEmployee: (employeeId: string, seatId?: string) => void;
  onClose: () => void;
}

const DisabledEmployeesModal = ({
  isOpen,
  disabledEmployees,
  selectedEmptySeatId,
  onEnableEmployee,
  onClose,
}: DisabledEmployeesModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">選擇要啟用的員工</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {disabledEmployees.length === 0 ? (
            <p className="text-gray-400 text-sm">沒有已停用的員工</p>
          ) : (
            disabledEmployees.map(employee => (
              <button
                key={employee.id}
                onClick={() => onEnableEmployee(employee.id, selectedEmptySeatId)}
                className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <div className="text-white font-medium">{employee.name}</div>
                <div className="text-gray-400 text-sm">{employee.email}</div>
                <div className="text-gray-400 text-sm">{employee.department} - {employee.position}</div>
              </button>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisabledEmployeesModal;
