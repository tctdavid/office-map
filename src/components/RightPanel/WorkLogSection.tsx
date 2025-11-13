import WorkLogPanel from "@/components/WorkLogPanel";
import WorkLogViewer from "@/components/WorkLogViewer";

interface WorkLogSectionProps {
  selectedSeatEmployee: any;
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

export default function WorkLogSection({
  selectedSeatEmployee,
  currentUserId,
  pcData,
}: WorkLogSectionProps) {
  if (!selectedSeatEmployee) return null;

  const isOwnSeat = currentUserId === selectedSeatEmployee.id;

  return (
    <div className="mt-4">
      {isOwnSeat ? (
        <WorkLogPanel
          employeeId={selectedSeatEmployee.id}
          employeeName={selectedSeatEmployee.name}
          currentUserId={currentUserId}
          pcData={pcData}
        />
      ) : (
        <WorkLogViewer
          employeeId={selectedSeatEmployee.id}
          employeeName={selectedSeatEmployee.name}
          currentUserId={currentUserId}
          pcData={pcData}
        />
      )}
    </div>
  );
}
