/**
 * 容器渲染組件 - 渲染單個容器及其座位
 */

import SeatRenderer from "./SeatRenderer";

interface ContainerRendererProps {
  container: any;
  editingContainer: any;
  selectedContainer: any;
  isContainerEditMode: boolean;
  isSeatEditMode: boolean;
  isEditMode: boolean;
  seatCoordinates: any[];
  selectedSeat: any;
  isDraggingSeat: boolean;
  seatDragPosition: { x: number; y: number };
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: any[];
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: any;
  onContainerClick: (container: any) => void;
  onContainerClickForSeat: (e: React.MouseEvent, container: any) => void;
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  onSeatClick: (e: React.MouseEvent, seat: any) => void;
  onEquipmentClick: (equipment: any) => void;
}

const ContainerRenderer = ({
  container,
  editingContainer,
  selectedContainer,
  isContainerEditMode,
  isSeatEditMode,
  isEditMode,
  seatCoordinates,
  selectedSeat,
  isDraggingSeat,
  seatDragPosition,
  isSwappingEmployees,
  selectedSeatsForSwap,
  isSelectingSeatForRegistration,
  selectedSeatForRegistration,
  onContainerClick,
  onContainerClickForSeat,
  onMouseDown,
  onSeatClick,
  onEquipmentClick
}: ContainerRendererProps) => {
  // 優先使用編輯中的容器狀態，避免資料庫重載影響編輯
  const currentContainer = (editingContainer && editingContainer.id === container.id) 
    ? editingContainer 
    : container;
  const isSelected = selectedContainer?.id === container.id;
  
  // 過濾屬於此容器的座位
  const containerSeats = seatCoordinates.filter(seat => seat.container_id === container.id);
  
  return (
    <div 
      className={`relative border bg-opacity-10 ${
        isContainerEditMode ? 'cursor-pointer hover:border-yellow-400' : ''
      } ${
        isSelected ? 'border-yellow-400 border-2' : 'border-gray-700'
      }`}
      onClick={(e) => {
        if (isSeatEditMode) {
          onContainerClickForSeat(e, container);
        }
        if (isEditMode) {
          onContainerClick(container);
        }
      }}
      style={{ 
        position: 'absolute',
        left: `${currentContainer.x}px`,
        top: `${currentContainer.y}px`,
        width: `${currentContainer.width}px`,
        height: `${currentContainer.height}px`,
        backgroundColor: 'transparent'
      }}
      title={`容器: ${currentContainer.name} 位置:(${currentContainer.x}, ${currentContainer.y}) 大小:(${currentContainer.width}×${currentContainer.height})`}
    >
      {/* 容器名稱 */}
      <div className="absolute inset-0 flex items-start justify-center text-lg font-medium text-white pointer-events-none pt-2">
        {currentContainer.name}
      </div>
      
      {/* Resize Handles - 只在選中時顯示 */}
      {isSelected && isContainerEditMode && (
        <>
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-2 bg-yellow-400 cursor-n-resize select-none"
            onMouseDown={(e) => onMouseDown(e, 'top')}
            style={{ userSelect: 'none' }}
          />
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-6 h-2 bg-yellow-400 cursor-s-resize select-none"
            onMouseDown={(e) => onMouseDown(e, 'bottom')}
            style={{ userSelect: 'none' }}
          />
          <div 
            className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-w-resize select-none"
            onMouseDown={(e) => onMouseDown(e, 'left')}
            style={{ userSelect: 'none' }}
          />
          <div 
            className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-6 bg-yellow-400 cursor-e-resize select-none"
            onMouseDown={(e) => onMouseDown(e, 'right')}
            style={{ userSelect: 'none' }}
          />
        </>
      )}

      {/* 渲染座位 */}
      {containerSeats.map((seat) => (
        <SeatRenderer
          key={seat.id}
          seat={seat}
          selectedSeat={selectedSeat}
          isDraggingSeat={isDraggingSeat}
          seatDragPosition={seatDragPosition}
          isSwappingEmployees={isSwappingEmployees}
          selectedSeatsForSwap={selectedSeatsForSwap}
          isSelectingSeatForRegistration={isSelectingSeatForRegistration}
          selectedSeatForRegistration={selectedSeatForRegistration}
          onSeatClick={onSeatClick}
          onEquipmentClick={onEquipmentClick}
        />
      ))}
    </div>
  );
};

export default ContainerRenderer;
