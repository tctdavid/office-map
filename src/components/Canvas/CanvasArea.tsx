/**
 * 畫布區域組件 - 主要的座位平面圖渲染區域
 */

import { getSeatSize, snapToGrid } from "@/utils/seatCalculations";
import ContainerRenderer from "./ContainerRenderer";
import SeatPreview from "./SeatPreview";

interface CanvasAreaProps {
  canvasSize: { width: number; height: number };
  isEditMode: boolean;
  isAddingContainer: boolean;
  isDraggingSeat: boolean;
  isSeatEditMode: boolean;
  selectedContainer: any;
  containers: any[];
  editingContainer: any;
  isContainerEditMode: boolean;
  seatCoordinates: any[];
  selectedSeat: any;
  seatDragPosition: { x: number; y: number };
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: any[];
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: any;
  selectedSeatTemplate: string;
  showSeatPreview: boolean;
  containerMousePosition: { x: number; y: number };
  newContainerStart: { x: number; y: number } | null;
  newContainerEnd: { x: number; y: number } | null;
  // Event handlers
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onContainerClick: (container: any) => void;
  onContainerClickForSeat: (e: React.MouseEvent, container: any) => void;
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  onSeatClick: (e: React.MouseEvent, seat: any) => void;
  onEquipmentClick: (equipment: any) => void;
  getRubberBandStyle: () => React.CSSProperties;
  // Seat drag and preview handlers
  setSeatDragPosition: (pos: { x: number; y: number }) => void;
  setContainerMousePosition: (pos: { x: number; y: number }) => void;
  setShowSeatPreview: (show: boolean) => void;
}

const CanvasArea = ({
  canvasSize,
  isEditMode,
  isAddingContainer,
  isDraggingSeat,
  isSeatEditMode,
  selectedContainer,
  containers,
  editingContainer,
  isContainerEditMode,
  seatCoordinates,
  selectedSeat,
  seatDragPosition,
  isSwappingEmployees,
  selectedSeatsForSwap,
  isSelectingSeatForRegistration,
  selectedSeatForRegistration,
  selectedSeatTemplate,
  showSeatPreview,
  containerMousePosition,
  newContainerStart,
  newContainerEnd,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onContainerClick,
  onContainerClickForSeat,
  onMouseDown,
  onSeatClick,
  onEquipmentClick,
  getRubberBandStyle,
  setSeatDragPosition,
  setContainerMousePosition,
  setShowSeatPreview
}: CanvasAreaProps) => {
  
  const handleMouseMove = (e: React.MouseEvent) => {
    onCanvasMouseMove(e);
    
    // 處理座位拖拽
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
        const relativeX = mouseX - selectedContainer.x;
        const relativeY = mouseY - selectedContainer.y;
        const seatX = snapToGrid(relativeX);
        const seatY = snapToGrid(relativeY);
        
        const maxX = selectedContainer.width - selectedSeat.pixel_x;
        const maxY = selectedContainer.height - selectedSeat.pixel_y;
        
        setSeatDragPosition({
          x: Math.max(0, Math.min(seatX, maxX)),
          y: Math.max(0, Math.min(seatY, maxY))
        });
      }
    }
    // 追蹤鼠標位置用於座位預覽
    else if (isSeatEditMode && selectedContainer) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const isInSelectedContainer = 
        mouseX >= selectedContainer.x && 
        mouseX <= selectedContainer.x + selectedContainer.width &&
        mouseY >= selectedContainer.y && 
        mouseY <= selectedContainer.y + selectedContainer.height;
      
      if (isInSelectedContainer) {
        const seatSize = getSeatSize(selectedSeatTemplate);
        const seatX = snapToGrid(mouseX);
        const seatY = snapToGrid(mouseY);
        
        const maxX = selectedContainer.x + selectedContainer.width - seatSize.width;
        const maxY = selectedContainer.y + selectedContainer.height - seatSize.height;
        
        setContainerMousePosition({
          x: Math.max(selectedContainer.x, Math.min(seatX, maxX)),
          y: Math.max(selectedContainer.y, Math.min(seatY, maxY))
        });
        setShowSeatPreview(true);
      } else {
        setShowSeatPreview(false);
      }
    } else {
      setShowSeatPreview(false);
    }
  };

  const handleMouseLeave = () => {
    onCanvasMouseUp();
    setShowSeatPreview(false);
  };

  return (
    <div 
      className={`bg-slate-800/30 rounded-lg relative overflow-hidden ${
        isAddingContainer ? 'cursor-crosshair' : 
        isDraggingSeat ? 'cursor-move' : 
        isSeatEditMode && selectedContainer ? 'cursor-none' : ''
      }`}
      style={{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        backgroundImage: (isEditMode || isAddingContainer)
          ? `repeating-linear-gradient(to right, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px),
             repeating-linear-gradient(to bottom, transparent, transparent 19px, rgba(156, 163, 175, 0.15) 19px, rgba(156, 163, 175, 0.15) 20px)`
          : 'none',
        backgroundSize: (isEditMode || isAddingContainer) ? '20px 20px' : 'auto',
        userSelect: 'none'
      }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* 橡皮筋矩形 */}
      {isAddingContainer && newContainerStart && newContainerEnd && (
        <div style={getRubberBandStyle()} />
      )}

      {/* 渲染容器 */}
      {containers.map((container) => (
        <ContainerRenderer
          key={container.id}
          container={container}
          editingContainer={editingContainer}
          selectedContainer={selectedContainer}
          isContainerEditMode={isContainerEditMode}
          isSeatEditMode={isSeatEditMode}
          isEditMode={isEditMode}
          seatCoordinates={seatCoordinates}
          selectedSeat={selectedSeat}
          isDraggingSeat={isDraggingSeat}
          seatDragPosition={seatDragPosition}
          isSwappingEmployees={isSwappingEmployees}
          selectedSeatsForSwap={selectedSeatsForSwap}
          isSelectingSeatForRegistration={isSelectingSeatForRegistration}
          selectedSeatForRegistration={selectedSeatForRegistration}
          onContainerClick={onContainerClick}
          onContainerClickForSeat={onContainerClickForSeat}
          onMouseDown={onMouseDown}
          onSeatClick={onSeatClick}
          onEquipmentClick={onEquipmentClick}
        />
      ))}
      
      {/* 座位預覽 */}
      {showSeatPreview && isSeatEditMode && selectedContainer && (
        <SeatPreview
          containerMousePosition={containerMousePosition}
          selectedSeatTemplate={selectedSeatTemplate}
        />
      )}
    </div>
  );
};

export default CanvasArea;
