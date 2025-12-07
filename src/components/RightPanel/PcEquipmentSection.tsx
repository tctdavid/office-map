import PcDataDisplay from "@/components/PcDataDisplay";

interface PcEquipmentSectionProps {
  selectedSeat: any;
}

export default function PcEquipmentSection({ selectedSeat }: PcEquipmentSectionProps) {
  if (selectedSeat?.pc) {
    return (
      <>
        <h3 className="text-sm font-medium text-cyan-300 text-center mb-3">電腦設備</h3>
        <PcDataDisplay pcData={selectedSeat.pc} />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 mb-3 border border-gray-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-6 border border-gray-600 rounded"></div>
      </div>
      <p className="text-xs text-gray-400 text-center">電腦設備</p>
    </div>
  );
}
