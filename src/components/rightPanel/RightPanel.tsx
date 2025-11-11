import StaffInfoSection from './StaffInfoSection';
import WorkLogSection from './WorkLogSection';
import PcDataSection from './PcDataSection';
import EditToolsSection from './EditToolsSection';

interface RightPanelProps {
  selectedSeatEmployee: any;
  isSelectingSeatForRegistration: boolean;
  isEditMode: boolean;
  currentEmployee: any;
  selectedSeat: any;
  editingContainer: any;
  isSeatEditMode: boolean;
  selectedContainer: any;
  selectedSeatTemplate: string;
  setIsSelectingSeatForRegistration: (value: boolean) => void;
  startAddingContainer: () => void;
  toggleContainerEditMode: () => void;
  isContainerEditMode: boolean;
  deleteContainer: () => void;
  toggleSeatEditMode: () => void;
  deleteSeat: () => void;
  handleContainerNameChange: (value: string) => void;
  saveContainerChanges: () => void;
  cancelContainerChanges: () => void;
  setSelectedSeatTemplate: (value: string) => void;
}

const RightPanel = (props: RightPanelProps) => {
  return (
    <div className="w-[250px] flex flex-col gap-2 h-[calc(100vh-120px)]">
      {/* Combined Staff Info + Work Log Container */}
      <div className="flex-[1.8] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4 space-y-4">
        <StaffInfoSection 
          selectedSeatEmployee={props.selectedSeatEmployee}
          isSelectingSeatForRegistration={props.isSelectingSeatForRegistration}
          isEditMode={props.isEditMode}
          setIsSelectingSeatForRegistration={props.setIsSelectingSeatForRegistration}
        />

        {props.isEditMode && (
          <EditToolsSection
            startAddingContainer={props.startAddingContainer}
            toggleContainerEditMode={props.toggleContainerEditMode}
            isContainerEditMode={props.isContainerEditMode}
            deleteContainer={props.deleteContainer}
            toggleSeatEditMode={props.toggleSeatEditMode}
            selectedContainer={props.selectedContainer}
            isSeatEditMode={props.isSeatEditMode}
            deleteSeat={props.deleteSeat}
            selectedSeat={props.selectedSeat}
          />
        )}

        <WorkLogSection 
          selectedSeatEmployee={props.selectedSeatEmployee}
          currentEmployee={props.currentEmployee}
          isEditMode={props.isEditMode}
          startAddingContainer={props.startAddingContainer}
          toggleContainerEditMode={props.toggleContainerEditMode}
          isContainerEditMode={props.isContainerEditMode}
          deleteContainer={props.deleteContainer}
          toggleSeatEditMode={props.toggleSeatEditMode}
          selectedContainer={props.selectedContainer}
          isSeatEditMode={props.isSeatEditMode}
          deleteSeat={props.deleteSeat}
          selectedSeat={props.selectedSeat}
        />
      </div>

      {/* PC Data Container */}
      <div className="flex-[1.2] bg-slate-800/30 rounded-lg border border-gray-700 px-2 py-4">
        <PcDataSection 
          selectedSeat={props.selectedSeat}
          isEditMode={props.isEditMode}
          editingContainer={props.editingContainer}
          isSeatEditMode={props.isSeatEditMode}
          selectedSeatTemplate={props.selectedSeatTemplate}
          handleContainerNameChange={props.handleContainerNameChange}
          saveContainerChanges={props.saveContainerChanges}
          cancelContainerChanges={props.cancelContainerChanges}
          setSelectedSeatTemplate={props.setSelectedSeatTemplate}
        />
      </div>
    </div>
  );
};

export default RightPanel;
