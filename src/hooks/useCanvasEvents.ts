/**
 * 畫布事件處理 Hook
 */

interface UseCanvasEventsProps {
  isDraggingSeat: boolean;
  selectedSeat: any;
  selectedContainer: any;
  seatDragPosition: { x: number; y: number };
  canvasSize: { width: number; height: number };
  setIsDraggingSeat: (value: boolean) => void;
  setSeatDragPosition: (value: { x: number; y: number }) => void;
  updateSeatPosition: (seatId: string, x: number, y: number) => Promise<boolean>;
  handleCanvasMouseDownForContainer: (e: React.MouseEvent, canvasSize: { width: number; height: number }) => void;
  handleCanvasMouseMoveForContainer: (e: React.MouseEvent, canvasSize: { width: number; height: number }) => void;
  handleCanvasMouseUpForContainer: () => void;
}

export const useCanvasEvents = ({
  isDraggingSeat,
  selectedSeat,
  selectedContainer,
  seatDragPosition,
  canvasSize,
  setIsDraggingSeat,
  setSeatDragPosition,
  updateSeatPosition,
  handleCanvasMouseDownForContainer,
  handleCanvasMouseMoveForContainer,
  handleCanvasMouseUpForContainer,
}: UseCanvasEventsProps) => {

  const handleCanvasMouseDown = async (e: React.MouseEvent) => {
    // 處理座位拖拽釋放
    if (isDraggingSeat && selectedSeat && selectedContainer) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 檢查點擊是否在選中的容器內
      const isInSelectedContainer = 
        mouseX >= selectedContainer.x && 
        mouseX <= selectedContainer.x + selectedContainer.width &&
        mouseY >= selectedContainer.y && 
        mouseY <= selectedContainer.y + selectedContainer.height;
      
      if (isInSelectedContainer) {
        await updateSeatPosition(selectedSeat.id, seatDragPosition.x, seatDragPosition.y);
      }
      
      // 退出拖拽模式
      setIsDraggingSeat(false);
      setSeatDragPosition({ x: 0, y: 0 });
      return;
    }
    
    // 處理容器相關操作
    handleCanvasMouseDownForContainer(e, canvasSize);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    handleCanvasMouseMoveForContainer(e, canvasSize);
  };

  const handleCanvasMouseUp = () => {
    handleCanvasMouseUpForContainer();
  };

  return {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
};
