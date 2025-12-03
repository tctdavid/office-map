/**
 * 員工位置交換 Hook
 */
import { useToast } from "@/hooks/use-toast";
import { swapEmployees, swapPcsOnly, restoreMissingEmployeeAssignments } from "@/utils/seatSwapHandlers";

interface UseEmployeeSwapProps {
  selectedSeatsForSwap: any[];
  setSelectedSeatsForSwap: (value: any[]) => void;
  setShowSwapConfirmModal: (value: boolean) => void;
  setIsSwappingEmployees: (value: boolean) => void;
  fetchSeatCoordinates: () => Promise<void>;
}

export const useEmployeeSwap = ({
  selectedSeatsForSwap,
  setSelectedSeatsForSwap,
  setShowSwapConfirmModal,
  setIsSwappingEmployees,
  fetchSeatCoordinates,
}: UseEmployeeSwapProps) => {
  const { toast } = useToast();

  // 交換員工位置
  const handleSwapEmployees = async (swapPc: boolean = false) => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    
    console.log('Swapping seats:', { seat1, seat2 });
    
    const result = await swapEmployees(seat1, seat2, swapPc);
    
    if (result.success) {
      await fetchSeatCoordinates();
      
      setSelectedSeatsForSwap([]);
      setShowSwapConfirmModal(false);
      setIsSwappingEmployees(false);

      toast({
        title: "交換成功",
        description: swapPc ? "員工位置和電腦已成功交換" : "員工位置已成功交換",
      });
    } else {
      toast({
        title: "交換失敗",
        description: "無法完成位置交換",
        variant: "destructive"
      });
    }
  };

  // 僅交換電腦
  const handleSwapPcsOnly = async () => {
    if (selectedSeatsForSwap.length !== 2) return;
    
    const [seat1, seat2] = selectedSeatsForSwap;
    
    console.log('Swapping PCs only:', { seat1, seat2 });
    
    const result = await swapPcsOnly(seat1, seat2);
    
    if (result.success) {
      await fetchSeatCoordinates();
      
      setSelectedSeatsForSwap([]);
      setShowSwapConfirmModal(false);
      setIsSwappingEmployees(false);

      toast({
        title: "電腦交換成功",
        description: "電腦設備已成功交換",
      });
    } else {
      toast({
        title: "電腦交換失敗",
        description: "無法完成電腦交換",
        variant: "destructive"
      });
    }
  };

  // 修復遺失的員工分配
  const restoreMissingEmployees = async () => {
    const result = await restoreMissingEmployeeAssignments();
    
    if (result.success) {
      await fetchSeatCoordinates();
      
      if (result.assignedCount > 0) {
        toast({
          title: "員工位置已修復",
          description: `已重新分配 ${result.assignedCount} 位員工到座位`,
        });
      } else {
        toast({
          title: "無需修復",
          description: "所有員工都已正確分配座位",
        });
      }
    } else {
      toast({
        title: "修復失敗",
        description: "無法修復員工位置分配",
        variant: "destructive"
      });
    }
  };

  return {
    handleSwapEmployees,
    handleSwapPcsOnly,
    restoreMissingEmployees,
  };
};
