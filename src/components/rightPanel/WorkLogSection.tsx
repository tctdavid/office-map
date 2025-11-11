import WorkLogPanel from '@/components/WorkLogPanel';
import WorkLogViewer from '@/components/WorkLogViewer';
import EditToolsSection from './EditToolsSection';

interface WorkLogSectionProps {
  selectedSeatEmployee: any;
  currentEmployee: any;
  isEditMode: boolean;
  startAddingContainer: () => void;
  toggleContainerEditMode: () => void;
  isContainerEditMode: boolean;
  deleteContainer: () => void;
  toggleSeatEditMode: () => void;
  selectedContainer: any;
  isSeatEditMode: boolean;
  deleteSeat: () => void;
  selectedSeat: any;
}

const WorkLogSection = (props: WorkLogSectionProps) => {
  if (props.selectedSeatEmployee) {
    if (props.currentEmployee && props.currentEmployee.id === props.selectedSeatEmployee.id) {
      return (
        <WorkLogPanel 
          employeeId={props.selectedSeatEmployee.id}
          employeeName={props.selectedSeatEmployee.name}
          currentUserId={props.currentEmployee?.id || null}
          pcData={null}
        />
      );
    }
    return (
      <WorkLogViewer 
        employeeId={props.selectedSeatEmployee.id}
        employeeName={props.selectedSeatEmployee.name}
        currentUserId={props.currentEmployee?.id || null}
        pcData={null}
      />
    );
  }

  if (props.isEditMode) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-6 border border-gray-600 rounded"></div>
      </div>
      <p className="text-xs text-gray-400 text-center">工作日誌</p>
    </div>
  );
};

export default WorkLogSection;
