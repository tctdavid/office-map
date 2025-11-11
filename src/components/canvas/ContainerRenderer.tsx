import SeatRenderer from './SeatRenderer';

interface ContainerRendererProps {
  container: any;
  selectedContainer: any;
  editingContainer: any;
  isContainerEditMode: boolean;
  isDragging: boolean;
  dragHandle: string | null;
  seatCoordinates: any[];
  selectedSeat: any;
  selectedSeatsForSwap: any[];
  isEditMode: boolean;
  isDraggingSeat: boolean;
  seatDragPosition: { x: number; y: number };
  handleContainerClick: (container: any) => void;
  handleMouseDown: (e: React.MouseEvent, handle: string, container: any) => void;
  handleContainerClickForSeat: (e: React.MouseEvent, container: any) => void;
  handleSeatClick: (e: React.MouseEvent, seat: any) => void;
}

const ContainerRenderer = (props: ContainerRendererProps) => {
  const { container } = props;
  const isSelected = props.selectedContainer?.id === container.id;
  const isEditing = props.editingContainer?.id === container.id;
  
  const displayContainer = isEditing ? props.editingContainer : container;
  
  return (
    <div
      key={container.id}
      onClick={(e) => {
        e.stopPropagation();
        if (!props.isContainerEditMode) {
          props.handleContainerClickForSeat(e, container);
        }
      }}
      className={`absolute border-2 rounded-lg transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
      } ${props.isContainerEditMode ? 'cursor-pointer' : ''}`}
      style={{
        left: `${displayContainer.x}px`,
        top: `${displayContainer.y}px`,
        width: `${displayContainer.width}px`,
        height: `${displayContainer.height}px`,
      }}
    >
      {/* 容器名稱 */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          props.handleContainerClick(container);
        }}
        className="absolute -top-6 left-0 text-white text-sm font-medium bg-slate-800/80 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-700/80"
      >
        {displayContainer.name || '未命名容器'}
      </div>
      
      {/* Resize handles - 僅在選中且編輯模式下顯示 */}
      {isSelected && props.isContainerEditMode && (
        <>
          {/* 右下角 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 'br', displayContainer)}
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
            style={{ right: '-8px', bottom: '-8px' }}
          />
          {/* 右邊 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 'r', displayContainer)}
            className="absolute w-2 h-8 bg-white border border-blue-500 rounded cursor-e-resize hover:scale-110 transition-transform"
            style={{ right: '-5px', top: '50%', transform: 'translateY(-50%)' }}
          />
          {/* 下邊 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 'b', displayContainer)}
            className="absolute w-8 h-2 bg-white border border-blue-500 rounded cursor-s-resize hover:scale-110 transition-transform"
            style={{ bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }}
          />
          {/* 左上角 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 'tl', displayContainer)}
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
            style={{ left: '-8px', top: '-8px' }}
          />
          {/* 左邊 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 'l', displayContainer)}
            className="absolute w-2 h-8 bg-white border border-blue-500 rounded cursor-w-resize hover:scale-110 transition-transform"
            style={{ left: '-5px', top: '50%', transform: 'translateY(-50%)' }}
          />
          {/* 上邊 */}
          <div
            onMouseDown={(e) => props.handleMouseDown(e, 't', displayContainer)}
            className="absolute w-8 h-2 bg-white border border-blue-500 rounded cursor-n-resize hover:scale-110 transition-transform"
            style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }}
          />
        </>
      )}
      
      {/* 容器內的座位 */}
      {props.seatCoordinates
        .filter(seat => seat.container_id === container.id)
        .map((seat) => (
          <SeatRenderer
            key={seat.id}
            seat={seat}
            selectedSeat={props.selectedSeat}
            selectedSeatsForSwap={props.selectedSeatsForSwap}
            isEditMode={props.isEditMode}
            isDraggingSeat={props.isDraggingSeat}
            seatDragPosition={props.seatDragPosition}
            handleSeatClick={props.handleSeatClick}
          />
        ))}
    </div>
  );
};

export default ContainerRenderer;
