interface SeatForSwap {
  id: string;
  employee?: {
    name: string;
    department: string | null;
    position: string | null;
  } | null;
  employee_id?: string | null;
  pc?: {
    name: string;
  } | null;
  pc_id?: string | null;
}

interface SwapConfirmModalProps {
  isOpen: boolean;
  selectedSeats: SeatForSwap[];
  onSwapEmployees: (includePcs: boolean) => void;
  onSwapPcsOnly: () => void;
  onCancel: () => void;
}

const SwapConfirmModal = ({
  isOpen,
  selectedSeats,
  onSwapEmployees,
  onSwapPcsOnly,
  onCancel,
}: SwapConfirmModalProps) => {
  if (!isOpen || selectedSeats.length !== 2) return null;

  const hasPcs = selectedSeats[0].pc_id || selectedSeats[1].pc_id;

  const renderSeatInfo = (seat: SeatForSwap, index: number) => (
    <div className="bg-slate-700 rounded-lg p-4">
      <h4 className="text-white font-medium mb-2">座位 {index + 1}: {seat.id}</h4>
      {seat.employee ? (
        <div>
          <p className="text-gray-300">員工: {seat.employee.name}</p>
          <p className="text-gray-400 text-sm">{seat.employee.department} - {seat.employee.position}</p>
        </div>
      ) : seat.employee_id ? (
        <p className="text-yellow-400">員工: ID {seat.employee_id} (資料載入中)</p>
      ) : (
        <p className="text-gray-400">空座位</p>
      )}
      {seat.pc ? (
        <p className="text-blue-400 text-sm mt-1">電腦: {seat.pc.name}</p>
      ) : seat.pc_id ? (
        <p className="text-yellow-400 text-sm mt-1">電腦: ID {seat.pc_id} (資料載入中)</p>
      ) : null}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">確認交換員工位置</h3>
        
        <div className="space-y-4 mb-6">
          {renderSeatInfo(selectedSeats[0], 0)}

          {/* 交換箭頭 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {renderSeatInfo(selectedSeats[1], 1)}
        </div>

        {/* 是否交換電腦的選項 */}
        {hasPcs && (
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
            <p className="text-yellow-400 text-sm mb-2">⚠️ 檢測到電腦設備</p>
            <p className="text-gray-300 text-sm">是否同時交換電腦設備？</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {hasPcs ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => onSwapEmployees(false)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                >
                  僅交換員工
                </button>
                <button
                  onClick={onSwapPcsOnly}
                  className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm"
                >
                  僅交換電腦
                </button>
                <button
                  onClick={() => onSwapEmployees(true)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
                >
                  交換員工和電腦
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => onSwapEmployees(false)}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              確認交換
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapConfirmModal;
