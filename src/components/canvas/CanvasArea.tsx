import ContainerRenderer from './ContainerRenderer';
import { getSeatSize } from "@/utils/seatCalculations";

interface CanvasAreaProps {
  canvasSize: { width: number; height: number };
  containers: any[];
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
  isAddingContainer: boolean;
  newContainerStart: { x: number; y: number } | null;
  newContainerEnd: { x: number; y: number } | null;
  showSeatPreview: boolean;
  selectedSeatTemplate: string;
  containerMousePosition: { x: number; y: number };
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleCanvasMouseMove: (e: React.MouseEvent) => void;
  handleCanvasMouseUp: () => void;
  handleContainerClick: (container: any) => void;
  handleMouseDown: (e: React.MouseEvent, handle: string, container: any) => void;
  handleContainerClickForSeat: (e: React.MouseEvent, container: any) => void;
  handleSeatClick: (e: React.MouseEvent, seat: any) => void;
  getRubberBandStyle: () => any;
}

const CanvasArea = (props: CanvasAreaProps) => {
  return (
    <div className="flex-1 flex flex-col p-2 overflow-hidden">
      {/* Canvas */}
      <div 
        onMouseDown={props.handleCanvasMouseDown}
        onMouseMove={props.handleCanvasMouseMove}
        onMouseUp={props.handleCanvasMouseUp}
        className="relative bg-slate-800/50 rounded-lg border border-gray-700"
        style={{
          width: `${props.canvasSize.width}px`,
          height: `${props.canvasSize.height}px`,
          cursor: props.isAddingContainer ? 'crosshair' : 'default',
        }}
      >
        {/* 渲染所有容器 */}
        {props.containers.map((container) => (
          <ContainerRenderer
            key={container.id}
            container={container}
            selectedContainer={props.selectedContainer}
            editingContainer={props.editingContainer}
            isContainerEditMode={props.isContainerEditMode}
            isDragging={props.isDragging}
            dragHandle={props.dragHandle}
            seatCoordinates={props.seatCoordinates}
            selectedSeat={props.selectedSeat}
            selectedSeatsForSwap={props.selectedSeatsForSwap}
            isEditMode={props.isEditMode}
            isDraggingSeat={props.isDraggingSeat}
            seatDragPosition={props.seatDragPosition}
            handleContainerClick={props.handleContainerClick}
            handleMouseDown={props.handleMouseDown}
            handleContainerClickForSeat={props.handleContainerClickForSeat}
            handleSeatClick={props.handleSeatClick}
          />
        ))}
        
        {/* 橡皮筋矩形 */}
        {props.isAddingContainer && props.newContainerStart && props.newContainerEnd && (
          <div
            className="absolute border-2 border-dashed border-blue-400 bg-blue-500/10 pointer-events-none"
            style={props.getRubberBandStyle()}
          />
        )}
        
        {/* 座位預覽 */}
        {props.showSeatPreview && props.selectedContainer && (
          <div
            className="absolute rounded bg-yellow-400/50 border-2 border-yellow-500 pointer-events-none"
            style={{
              left: `${props.containerMousePosition.x}px`,
              top: `${props.containerMousePosition.y}px`,
              width: `${getSeatSize(props.selectedSeatTemplate).width}px`,
              height: `${getSeatSize(props.selectedSeatTemplate).height}px`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black/60">
              {props.selectedSeatTemplate}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-xs text-gray-300">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ade80' }}></div>
          <span>有員工+電腦</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
          <span>有員工無電腦</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#94a3b8' }}></div>
          <span>空座位</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span>已停用</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
