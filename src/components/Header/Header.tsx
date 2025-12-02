import TimeDisplay from './TimeDisplay';
import HeaderTitle from './HeaderTitle';
import HeaderActions from './HeaderActions';

interface HeaderProps {
  currentTime: Date;
  formatTime: (d: Date) => string;
  formatDate: (d: Date) => string;
  currentEmployeeName?: string | null;
  user: any;
  isAdmin: boolean;
  isEditMode: boolean;
  isSelectingSeatForPc: boolean;
  isSelectingSeatForEquipment: boolean;
  isViewingEquipment: boolean;
  isEquipmentModalOpen: boolean;
  isManagingEmployees: boolean;
  isSwappingEmployees: boolean;
  onToggleEditMode: () => void;
  onAddPcClick: () => void;
  onStartAddEquipment: () => void;
  onToggleManagingEmployees: () => void;
  onToggleSwappingEmployees: () => void;
  onRestoreMissingEmployees: () => void;
  onOpenPasswordReset: () => void;
  onProfileEdit: () => void;
  onOpenTimeClock: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const Header = ({
  currentTime,
  formatTime,
  formatDate,
  currentEmployeeName,
  user,
  isAdmin,
  isEditMode,
  isSelectingSeatForPc,
  isSelectingSeatForEquipment,
  isViewingEquipment,
  isEquipmentModalOpen,
  isManagingEmployees,
  isSwappingEmployees,
  onToggleEditMode,
  onAddPcClick,
  onStartAddEquipment,
  onToggleManagingEmployees,
  onToggleSwappingEmployees,
  onRestoreMissingEmployees,
  onOpenPasswordReset,
  onProfileEdit,
  onOpenTimeClock,
  onLogout,
  onLogin,
  onRegister,
}: HeaderProps) => {
  return (
    <header className="h-20 w-[1400px] flex items-center justify-between px-6 bg-slate-800/50">
      <TimeDisplay 
        currentTime={currentTime}
        formatTime={formatTime}
        formatDate={formatDate}
      />
      
      <HeaderTitle currentEmployeeName={currentEmployeeName} />
      
      <HeaderActions
        user={user}
        isAdmin={isAdmin}
        isEditMode={isEditMode}
        isSelectingSeatForPc={isSelectingSeatForPc}
        isSelectingSeatForEquipment={isSelectingSeatForEquipment}
        isViewingEquipment={isViewingEquipment}
        isEquipmentModalOpen={isEquipmentModalOpen}
        isManagingEmployees={isManagingEmployees}
        isSwappingEmployees={isSwappingEmployees}
        onToggleEditMode={onToggleEditMode}
        onAddPcClick={onAddPcClick}
        onStartAddEquipment={onStartAddEquipment}
        onToggleManagingEmployees={onToggleManagingEmployees}
        onToggleSwappingEmployees={onToggleSwappingEmployees}
        onRestoreMissingEmployees={onRestoreMissingEmployees}
        onOpenPasswordReset={onOpenPasswordReset}
        onProfileEdit={onProfileEdit}
        onOpenTimeClock={onOpenTimeClock}
        onLogout={onLogout}
        onLogin={onLogin}
        onRegister={onRegister}
      />
    </header>
  );
};

export default Header;
