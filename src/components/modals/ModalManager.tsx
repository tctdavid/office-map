import AuthModal from '@/components/AuthModal';
import RegistrationModal from '@/components/RegistrationModal';
import AddPcModal from '@/components/AddPcModal';
import TimeClockModal from '@/components/TimeClockModal';
import EquipmentModal from '@/components/EquipmentModal';
import EquipmentDataDisplay from '@/components/EquipmentDataDisplay';
import AdminPasswordReset from '@/components/AdminPasswordReset';
import AdminPasswordConfirm from '@/components/AdminPasswordConfirm';

interface ModalManagerProps {
  // Auth Modal
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (value: boolean) => void;
  handleLoginSuccess: (employee: any) => Promise<void>;
  
  // Registration Modal
  isRegistrationModalOpen: boolean;
  registrationModalKey: number;
  selectedSeatForRegistration: any;
  cancelRegistration: () => void;
  handleRegistrationSuccess: () => Promise<void>;
  
  // PC Modal
  isAddPcModalOpen: boolean;
  selectedSeatForPc: any;
  seatCoordinates: any[];
  cancelAddPc: () => void;
  handleAddPcSuccess: () => Promise<void>;
  
  // Equipment Modal
  isEquipmentModalOpen: boolean;
  selectedSeatForEquipment: any;
  isViewingEquipment: boolean;
  selectedEquipment: any;
  cancelEquipmentOperation: () => void;
  closeEquipmentView: () => void;
  handleEquipmentSave: (equipment: any) => Promise<void>;
  handleEquipmentClick: (equipment: any) => void;
  handleEquipmentEdit: () => void;
  equipments: any[];
  
  // Time Clock Modal
  isTimeClockModalOpen: boolean;
  setIsTimeClockModalOpen: (value: boolean) => void;
  currentEmployee: any;
  
  // Password Reset Modal
  isPasswordResetModalOpen: boolean;
  setIsPasswordResetModalOpen: (value: boolean) => void;
  
  // Disabled Employees Modal
  showDisabledEmployeesModal: boolean;
  setShowDisabledEmployeesModal: (value: boolean) => void;
  disabledEmployees: any[];
  selectedEmptySeat: any;
  handleEnableEmployee: (employeeId: string, seatId: string) => Promise<void>;
  
  // Swap Confirmation Modal
  showSwapConfirmModal: boolean;
  setShowSwapConfirmModal: (value: boolean) => void;
  selectedSeatsForSwap: any[];
  handleSwapEmployees: (swapPc: boolean) => Promise<void>;
  handleSwapPcsOnly: () => Promise<void>;
  setSelectedSeatsForSwap: (value: any[]) => void;
  
  // Container Name Dialog
  showNameDialog: boolean;
  newContainerName: string;
  setNewContainerName: (value: string) => void;
  saveNewContainer: () => void;
  cancelNewContainer: () => void;
}

const ModalManager = (props: ModalManagerProps) => {
  return (
    <>
      {/* Auth Modal */}
      <AuthModal 
        isOpen={props.isLoginModalOpen}
        onClose={() => props.setIsLoginModalOpen(false)}
        onLoginSuccess={props.handleLoginSuccess}
      />

      {/* Registration Modal */}
      <RegistrationModal 
        key={props.registrationModalKey}
        isOpen={props.isRegistrationModalOpen}
        selectedSeat={props.selectedSeatForRegistration}
        onClose={props.cancelRegistration}
        onRegistrationSuccess={props.handleRegistrationSuccess}
      />

      {/* PC Modal */}
      <AddPcModal 
        isOpen={props.isAddPcModalOpen}
        selectedSeat={props.selectedSeatForPc}
        onClose={props.cancelAddPc}
        onSuccess={props.handleAddPcSuccess}
      />

      {/* Equipment Modal */}
      <EquipmentModal 
        isOpen={props.isEquipmentModalOpen}
        onClose={props.cancelEquipmentOperation}
        equipment={props.selectedEquipment}
        onSave={props.handleEquipmentSave}
        currentEmployee={null}
      />

      {/* Equipment Data Display */}
      {props.isViewingEquipment && props.selectedEquipment && (
        <EquipmentDataDisplay 
          equipment={props.selectedEquipment}
          onClose={props.closeEquipmentView}
          onEdit={props.handleEquipmentEdit}
        />
      )}

      {/* Time Clock Modal */}
      {props.isTimeClockModalOpen && props.currentEmployee && (
        <TimeClockModal 
          isOpen={props.isTimeClockModalOpen}
          onClose={() => props.setIsTimeClockModalOpen(false)}
          employeeId={props.currentEmployee.id}
          employeeName={props.currentEmployee.name}
        />
      )}

      {/* Password Reset Modal */}
      {props.currentEmployee && (
        <AdminPasswordReset 
          isOpen={props.isPasswordResetModalOpen}
          onClose={() => props.setIsPasswordResetModalOpen(false)}
          currentAdminEmail={props.currentEmployee.email}
        />
      )}

      {/* Disabled Employees Modal */}
      {props.showDisabledEmployeesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">選擇要啟用的員工</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {props.disabledEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => props.handleEnableEmployee(employee.id, props.selectedEmptySeat.id)}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-left transition-colors"
                >
                  {employee.name} - {employee.department || '未設定部門'}
                </button>
              ))}
            </div>
            <button
              onClick={() => props.setShowDisabledEmployeesModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Swap Confirmation Modal */}
      {props.showSwapConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">確認交換</h3>
            <p className="text-gray-300 mb-4">您要交換以下兩個座位的員工嗎？</p>
            <div className="space-y-2 mb-4">
              <div className="p-3 bg-slate-700 rounded">
                <div className="font-medium">{props.selectedSeatsForSwap[0]?.employee?.name || '空座位'}</div>
                <div className="text-sm text-gray-400">座位: {props.selectedSeatsForSwap[0]?.container}</div>
              </div>
              <div className="text-center text-gray-400">⬍⬍⬍</div>
              <div className="p-3 bg-slate-700 rounded">
                <div className="font-medium">{props.selectedSeatsForSwap[1]?.employee?.name || '空座位'}</div>
                <div className="text-sm text-gray-400">座位: {props.selectedSeatsForSwap[1]?.container}</div>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => props.handleSwapEmployees(true)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
              >
                交換員工和電腦
              </button>
              <button
                onClick={() => props.handleSwapEmployees(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                只交換員工
              </button>
              <button
                onClick={props.handleSwapPcsOnly}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
              >
                只交換電腦
              </button>
              <button
                onClick={() => {
                  props.setShowSwapConfirmModal(false);
                  props.setSelectedSeatsForSwap([]);
                }}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container Name Dialog */}
      {props.showNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">輸入容器名稱</h3>
            <input
              type="text"
              value={props.newContainerName}
              onChange={(e) => props.setNewContainerName(e.target.value)}
              placeholder="容器名稱"
              className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded text-white mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  props.saveNewContainer();
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={props.saveNewContainer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              >
                確定
              </button>
              <button
                onClick={props.cancelNewContainer}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalManager;
