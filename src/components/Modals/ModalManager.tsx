import AuthModal from "@/components/AuthModal";
import RegistrationModal from "@/components/RegistrationModal";
import AddPcModal from "@/components/AddPcModal";
import TimeClockModal from "@/components/TimeClockModal";
import EquipmentModal from "@/components/EquipmentModal";
import EquipmentDataDisplay from "@/components/EquipmentDataDisplay";
import AdminMigrationPanel from "@/components/AdminMigrationPanel";
import AdminPasswordReset from "@/components/AdminPasswordReset";
import ContainerNameDialog from "./ContainerNameDialog";
import DisabledEmployeesModal from "./DisabledEmployeesModal";
import SwapConfirmModal from "./SwapConfirmModal";

interface ModalManagerProps {
  // Auth Modal
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  onLoginSuccess: (employee: any) => void;

  // Registration Modal
  isRegistrationModalOpen: boolean;
  registrationModalKey: number;
  setIsRegistrationModalOpen: (open: boolean) => void;
  selectedSeatForRegistration: any;
  setSelectedSeatForRegistration: (seat: any) => void;
  setIsSelectingSeatForRegistration: (selecting: boolean) => void;
  containers: any[];
  onRegistrationSuccess: () => void;
  user: any;
  currentEmployee: any;

  // Add PC Modal
  isAddPcModalOpen: boolean;
  setIsAddPcModalOpen: (open: boolean) => void;
  selectedSeatForPc: any;
  setSelectedSeatForPc: (seat: any) => void;
  setIsSelectingSeatForPc: (selecting: boolean) => void;
  onAddPcSuccess: () => void;

  // Equipment Modal
  isEquipmentModalOpen: boolean;
  selectedSeatForEquipment: any;
  onEquipmentCancel: () => void;
  onEquipmentSave: (equipment: any) => void;

  // Equipment Data Display
  isViewingEquipment: boolean;
  selectedEquipment: any;
  onCloseEquipmentView: () => void;
  onEquipmentEdit: () => void;
  isAdmin: boolean;

  // Time Clock Modal
  isTimeClockModalOpen: boolean;
  setIsTimeClockModalOpen: (open: boolean) => void;

  // Admin Migration Panel
  isAdminMigrationPanelOpen: boolean;

  // Container Name Dialog
  showNameDialog: boolean;
  newContainerName: string;
  setNewContainerName: (name: string) => void;
  onSaveNewContainer: () => void;
  onCancelNewContainer: () => void;

  // Disabled Employees Modal
  showDisabledEmployeesModal: boolean;
  setShowDisabledEmployeesModal: (show: boolean) => void;
  disabledEmployees: any[];
  selectedEmptySeat: any;
  onEnableEmployee: (employeeId: string, seatId?: string) => void;

  // Swap Confirm Modal
  showSwapConfirmModal: boolean;
  setShowSwapConfirmModal: (show: boolean) => void;
  selectedSeatsForSwap: any[];
  setSelectedSeatsForSwap: (seats: any[]) => void;
  onSwapEmployees: (includePcs: boolean) => void;
  onSwapPcsOnly: () => void;

  // Admin Password Reset
  isPasswordResetModalOpen: boolean;
  setIsPasswordResetModalOpen: (open: boolean) => void;
}

const ModalManager = ({
  // Auth Modal
  isLoginModalOpen,
  setIsLoginModalOpen,
  onLoginSuccess,

  // Registration Modal
  isRegistrationModalOpen,
  registrationModalKey,
  setIsRegistrationModalOpen,
  selectedSeatForRegistration,
  setSelectedSeatForRegistration,
  setIsSelectingSeatForRegistration,
  containers,
  onRegistrationSuccess,
  user,
  currentEmployee,

  // Add PC Modal
  isAddPcModalOpen,
  setIsAddPcModalOpen,
  selectedSeatForPc,
  setSelectedSeatForPc,
  setIsSelectingSeatForPc,
  onAddPcSuccess,

  // Equipment Modal
  isEquipmentModalOpen,
  selectedSeatForEquipment,
  onEquipmentCancel,
  onEquipmentSave,

  // Equipment Data Display
  isViewingEquipment,
  selectedEquipment,
  onCloseEquipmentView,
  onEquipmentEdit,
  isAdmin,

  // Time Clock Modal
  isTimeClockModalOpen,
  setIsTimeClockModalOpen,

  // Admin Migration Panel
  isAdminMigrationPanelOpen,

  // Container Name Dialog
  showNameDialog,
  newContainerName,
  setNewContainerName,
  onSaveNewContainer,
  onCancelNewContainer,

  // Disabled Employees Modal
  showDisabledEmployeesModal,
  setShowDisabledEmployeesModal,
  disabledEmployees,
  selectedEmptySeat,
  onEnableEmployee,

  // Swap Confirm Modal
  showSwapConfirmModal,
  setShowSwapConfirmModal,
  selectedSeatsForSwap,
  setSelectedSeatsForSwap,
  onSwapEmployees,
  onSwapPcsOnly,

  // Admin Password Reset
  isPasswordResetModalOpen,
  setIsPasswordResetModalOpen,
}: ModalManagerProps) => {
  return (
    <>
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={onLoginSuccess}
      />

      {/* Registration Modal */}
      <RegistrationModal 
        key={registrationModalKey}
        isOpen={isRegistrationModalOpen} 
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setSelectedSeatForRegistration(null);
          setIsSelectingSeatForRegistration(false);
        }}
        selectedSeat={selectedSeatForRegistration}
        containers={containers}
        onRegistrationSuccess={onRegistrationSuccess}
        isEditMode={!!user}
        currentEmployee={currentEmployee}
      />

      {/* Add PC Modal */}
      <AddPcModal 
        isOpen={isAddPcModalOpen}
        onClose={() => {
          setIsAddPcModalOpen(false);
          setSelectedSeatForPc(null);
          setIsSelectingSeatForPc(false);
        }}
        selectedSeat={selectedSeatForPc}
        existingPc={selectedSeatForPc?.pc}
        onSuccess={onAddPcSuccess}
      />

      {/* Equipment Modal */}
      <EquipmentModal 
        isOpen={isEquipmentModalOpen}
        onClose={onEquipmentCancel}
        equipment={selectedSeatForEquipment?.equipment}
        onSave={onEquipmentSave}
        currentEmployee={currentEmployee}
      />

      {/* Equipment Data Display */}
      {isViewingEquipment && selectedEquipment && (
        <EquipmentDataDisplay 
          equipment={selectedEquipment}
          onClose={onCloseEquipmentView}
          onEdit={isAdmin ? onEquipmentEdit : undefined}
          isAdmin={isAdmin}
        />
      )}

      {/* Time Clock Modal */}
      {currentEmployee && (
        <TimeClockModal 
          isOpen={isTimeClockModalOpen}
          onClose={() => setIsTimeClockModalOpen(false)}
          employeeId={currentEmployee.id}
          employeeName={currentEmployee.name}
          isAdmin={currentEmployee.role === 'admin'}
        />
      )}

      {/* Admin Migration Panel */}
      <AdminMigrationPanel
        isVisible={isAdminMigrationPanelOpen}
        currentEmployee={currentEmployee}
      />

      {/* Container Name Dialog */}
      <ContainerNameDialog
        isOpen={showNameDialog}
        containerName={newContainerName}
        onNameChange={setNewContainerName}
        onSave={onSaveNewContainer}
        onCancel={onCancelNewContainer}
      />

      {/* Disabled Employees Modal */}
      <DisabledEmployeesModal
        isOpen={showDisabledEmployeesModal}
        disabledEmployees={disabledEmployees}
        selectedEmptySeatId={selectedEmptySeat?.id}
        onEnableEmployee={onEnableEmployee}
        onClose={() => setShowDisabledEmployeesModal(false)}
      />

      {/* Swap Confirm Modal */}
      <SwapConfirmModal
        isOpen={showSwapConfirmModal}
        selectedSeats={selectedSeatsForSwap}
        onSwapEmployees={onSwapEmployees}
        onSwapPcsOnly={onSwapPcsOnly}
        onCancel={() => {
          setShowSwapConfirmModal(false);
          setSelectedSeatsForSwap([]);
        }}
      />

      {/* Admin Password Reset */}
      {isAdmin && (
        <AdminPasswordReset
          isOpen={isPasswordResetModalOpen}
          onClose={() => setIsPasswordResetModalOpen(false)}
          currentAdminEmail={currentEmployee?.email || ''}
        />
      )}
    </>
  );
};

export default ModalManager;
