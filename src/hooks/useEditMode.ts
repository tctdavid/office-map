/**
 * 編輯模式管理 Hook
 */
import { useToast } from "@/hooks/use-toast";
import { enterEditMode, hasChanges, resetEditState } from "@/utils/editModeHandlers";

interface UseEditModeProps {
  containers: any[];
  seatCoordinates: any[];
  backupContainers: any[];
  backupSeatCoordinates: any[];
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  setContainers: (value: any[]) => void;
  setSeatCoordinates: (value: any[]) => void;
  setBackupContainers: (value: any[]) => void;
  setBackupSeatCoordinates: (value: any[]) => void;
  setIsContainerEditMode: (value: boolean) => void;
  setSelectedContainer: (value: any) => void;
  setEditingContainer: (value: any) => void;
  setIsAddingContainer: (value: boolean) => void;
  setIsSeatEditMode: (value: boolean) => void;
  setSelectedSeat: (value: any) => void;
  setIsDraggingSeat: (value: boolean) => void;
  setSeatDragPosition: (value: { x: number; y: number }) => void;
  setShowSeatPreview: (value: boolean) => void;
}

export const useEditMode = ({
  containers,
  seatCoordinates,
  backupContainers,
  backupSeatCoordinates,
  isEditMode,
  setIsEditMode,
  setContainers,
  setSeatCoordinates,
  setBackupContainers,
  setBackupSeatCoordinates,
  setIsContainerEditMode,
  setSelectedContainer,
  setEditingContainer,
  setIsAddingContainer,
  setIsSeatEditMode,
  setSelectedSeat,
  setIsDraggingSeat,
  setSeatDragPosition,
  setShowSeatPreview,
}: UseEditModeProps) => {
  const { toast } = useToast();

  const clearEditStates = () => {
    const state = resetEditState();
    setIsEditMode(state.isEditMode!);
    setIsContainerEditMode(state.isContainerEditMode!);
    setSelectedContainer(state.selectedContainer);
    setEditingContainer(state.editingContainer);
    setIsAddingContainer(state.isAddingContainer!);
    setIsSeatEditMode(state.isSeatEditMode!);
    setSelectedSeat(state.selectedSeat);
    setIsDraggingSeat(state.isDraggingSeat!);
    setSeatDragPosition({ x: 0, y: 0 });
    setShowSeatPreview(false);
    setBackupContainers([]);
    setBackupSeatCoordinates([]);
  };

  const exitEditModeWithSave = () => {
    clearEditStates();
    toast({
      title: "變更已保存",
      description: "已退出編輯模式並保存變更",
    });
  };

  const cancelAllChanges = () => {
    // 恢復備份數據
    setContainers([...backupContainers]);
    setSeatCoordinates([...backupSeatCoordinates]);
    clearEditStates();
    toast({
      title: "變更已取消",
      description: "已退出編輯模式並取消所有變更",
    });
  };

  const exitEditModeWithoutChanges = () => {
    clearEditStates();
    toast({
      title: "退出編輯模式",
      description: "已退出編輯模式",
    });
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // 進入編輯模式 - 備份當前數據
      const backup = enterEditMode(containers, seatCoordinates);
      setBackupContainers(backup.containers);
      setBackupSeatCoordinates(backup.seatCoordinates);
      setIsEditMode(true);
      toast({
        title: "進入編輯模式",
        description: "已進入編輯模式",
      });
    } else {
      // 退出編輯模式 - 提供保存或取消選項
      const changes = hasChanges(
        { containers, seatCoordinates },
        { containers: backupContainers, seatCoordinates: backupSeatCoordinates }
      );
      
      if (changes.hasContainerChanges || changes.hasSeatChanges) {
        if (confirm("您有未保存的變更。是否要保存變更？\n點擊「確定」保存變更，點擊「取消」放棄變更。")) {
          exitEditModeWithSave();
        } else {
          cancelAllChanges();
        }
      } else {
        exitEditModeWithoutChanges();
      }
    }
  };

  return {
    toggleEditMode,
    exitEditModeWithSave,
    cancelAllChanges,
    exitEditModeWithoutChanges,
  };
};
