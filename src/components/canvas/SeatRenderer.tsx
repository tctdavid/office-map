import { getSeatSize, snapToGrid } from "@/utils/seatCalculations";
import { getSeatColor } from "@/utils/colorMapping";
import { getStaffPhotoUrl } from "@/lib/supabase-storage";

interface SeatRendererProps {
  seat: any;
  selectedSeat: any;
  selectedSeatsForSwap: any[];
  isEditMode: boolean;
  isDraggingSeat: boolean;
  seatDragPosition: { x: number; y: number };
  handleSeatClick: (e: React.MouseEvent, seat: any) => void;
}

const SeatRenderer = (props: SeatRendererProps) => {
  const { seat } = props;
  const seatSize = getSeatSize(seat.seat_template);
  const isSelected = props.selectedSeat?.id === seat.id;
  const isSelectedForSwap = props.selectedSeatsForSwap.some(s => s.id === seat.id);
  
  // 如果這是被拖拽的座位且正在拖拽中，使用拖拽位置
  const displayX = (props.isDraggingSeat && isSelected) ? props.seatDragPosition.x : seat.pixel_x;
  const displayY = (props.isDraggingSeat && isSelected) ? props.seatDragPosition.y : seat.pixel_y;

  const seatColorResult = getSeatColor(seat, isSelected, isSelectedForSwap, false);
  const seatColor = seatColorResult.backgroundColor;
  
  return (
    <div
      onClick={(e) => props.handleSeatClick(e, seat)}
      className={`absolute rounded transition-all ${
        props.isEditMode ? 'cursor-move hover:opacity-80' : 'cursor-pointer hover:scale-105'
      } ${isSelected ? 'ring-4 ring-yellow-400' : ''} ${isSelectedForSwap ? 'ring-4 ring-purple-400' : ''}`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${seatSize.width}px`,
        height: `${seatSize.height}px`,
        backgroundColor: seatColor,
        opacity: props.isDraggingSeat && isSelected ? 0.5 : 1,
      }}
    >
      {/* 員工頭像 */}
      {seat.employee && seat.employee.photo && (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <img 
            src={getStaffPhotoUrl(seat.employee.photo) || ''}
            alt={seat.employee.name}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* 員工名稱 */}
      {seat.employee && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5 rounded-b truncate px-1">
          {seat.employee.name}
        </div>
      )}
      
      {/* PC 圖標 */}
      {seat.pc && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-bl flex items-center justify-center">
          <span className="text-white text-xs">💻</span>
        </div>
      )}
      
      {/* 設備圖標 */}
      {seat.equipment_id && (
        <div className="absolute top-0 left-0 w-4 h-4 bg-purple-500 rounded-br flex items-center justify-center">
          <span className="text-white text-xs">🔧</span>
        </div>
      )}
    </div>
  );
};

export default SeatRenderer;
