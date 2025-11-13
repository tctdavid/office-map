import EmployeeInfoSection from "./EmployeeInfoSection";
import EditToolsSection from "./EditToolsSection";
import SeatTemplateSelector from "./SeatTemplateSelector";
import WorkLogSection from "./WorkLogSection";

interface RightPanelProps {
  // Employee info props
  isSelectingSeatForRegistration: boolean;
  isEditMode: boolean;
  selectedSeatEmployee: any;
  onCancelSelection: () => void;
  
  // Edit tools props
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  selectedContainer: any;
  selectedSeat: any;
  onStartAddingContainer: () => void;
  onToggleContainerEditMode: () => void;
  onDeleteContainer: () => void;
  onToggleSeatEditMode: () => void;
  onDeleteSeat: () => void;
  
  // Seat template props
  selectedSeatTemplate: string;
  onTemplateChange: (template: string) => void;
  
  // Work log props
  currentUserId: string | null;
  pcData?: {
    id: string;
    name: string;
    cpu?: string;
    memory?: string;
    storage?: string;
    graphics?: string;
    case_photo?: string;
    monitor_a?: string;
    monitor_a_photo?: string;
    monitor_b?: string;
    monitor_b_photo?: string;
  };
}

export default function RightPanel(props: RightPanelProps) {
  const {
    isSelectingSeatForRegistration,
    isEditMode,
    selectedSeatEmployee,
    onCancelSelection,
    isContainerEditMode,
    isSeatEditMode,
    selectedContainer,
    selectedSeat,
    onStartAddingContainer,
    onToggleContainerEditMode,
    onDeleteContainer,
    onToggleSeatEditMode,
    onDeleteSeat,
    selectedSeatTemplate,
    onTemplateChange,
    currentUserId,
    pcData,
  } = props;

  return (
    <div className="bg-gray-800 p-4 overflow-y-auto">
      {/* Employee Info Section */}
      <EmployeeInfoSection
        isSelectingSeatForRegistration={isSelectingSeatForRegistration}
        isEditMode={isEditMode}
        selectedSeatEmployee={selectedSeatEmployee}
        onCancelSelection={onCancelSelection}
      />

      {/* Edit Tools Section */}
      <EditToolsSection
        isEditMode={isEditMode}
        isContainerEditMode={isContainerEditMode}
        isSeatEditMode={isSeatEditMode}
        selectedContainer={selectedContainer}
        selectedSeat={selectedSeat}
        onStartAddingContainer={onStartAddingContainer}
        onToggleContainerEditMode={onToggleContainerEditMode}
        onDeleteContainer={onDeleteContainer}
        onToggleSeatEditMode={onToggleSeatEditMode}
        onDeleteSeat={onDeleteSeat}
      />

      {/* Seat Template Selector */}
      <SeatTemplateSelector
        isSeatEditMode={isSeatEditMode}
        selectedSeatTemplate={selectedSeatTemplate}
        onTemplateChange={onTemplateChange}
      />

      {/* Work Log Section */}
      <WorkLogSection
        selectedSeatEmployee={selectedSeatEmployee}
        currentUserId={currentUserId}
        pcData={pcData}
      />
    </div>
  );
}
