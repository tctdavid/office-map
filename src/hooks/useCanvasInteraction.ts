import { useState } from 'react';

/**
 * Canvas 交互邏輯 Hook
 * 處理座位拖拽、預覽、鼠標事件等
 */
export const useCanvasInteraction = () => {
  const [seatDragPosition, setSeatDragPosition] = useState({ x: 0, y: 0 });
  const [showSeatPreview, setShowSeatPreview] = useState(false);
  const [containerMousePosition, setContainerMousePosition] = useState({ x: 0, y: 0 });

  /**
   * 處理 Canvas 鼠標按下事件
   */
  const handleCanvasMouseDown = async (
    e: React.MouseEvent,
    isDraggingSeat: boolean,
    selectedSeat: any,
    selectedContainer: any,
    updateSeatPosition: (seatId: string, x: number, y: number) => Promise<void>,
    setIsDraggingSeat: (value: boolean) => void,
    handleCanvasMouseDownForContainer: (e: React.MouseEvent, canvasSize: any) => void,
    canvasSize: any
  ) => {
    // 處理座位拖拽釋放
    if (isDraggingSeat && selectedSeat && selectedContainer) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const isInSelectedContainer = 
        mouseX >= selectedContainer.x && 
        mouseX <= selectedContainer.x + selectedContainer.width &&
        mouseY >= selectedContainer.y && 
        mouseY <= selectedContainer.y + selectedContainer.height;
      
      if (isInSelectedContainer) {
        await updateSeatPosition(selectedSeat.id, seatDragPosition.x, seatDragPosition.y);
      }
      
      setIsDraggingSeat(false);
      setSeatDragPosition({ x: 0, y: 0 });
      return;
    }
    
    handleCanvasMouseDownForContainer(e, canvasSize);
  };

  /**
   * 處理 Canvas 鼠標移動事件
   */
  const handleCanvasMouseMove = (
    e: React.MouseEvent,
    handleCanvasMouseMoveForContainer: (e: React.MouseEvent, canvasSize: any) => void,
    canvasSize: any
  ) => {
    handleCanvasMouseMoveForContainer(e, canvasSize);
  };

  /**
   * 處理 Canvas 鼠標釋放事件
   */
  const handleCanvasMouseUp = (
    handleCanvasMouseUpForContainer: () => void
  ) => {
    handleCanvasMouseUpForContainer();
  };

  return {
    seatDragPosition,
    showSeatPreview,
    containerMousePosition,
    setSeatDragPosition,
    setShowSeatPreview,
    setContainerMousePosition,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
};
