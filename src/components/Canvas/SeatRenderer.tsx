/**
 * 座位渲染組件 - 渲染單個座位及其內容（員工、電腦、設備）
 */

import { getStaffPhotoUrl, getEquipmentPhotoUrl } from "@/lib/supabase-storage";
import { getSeatColor } from "@/utils/colorMapping";

interface SeatRendererProps {
  seat: any;
  selectedSeat: any;
  isDraggingSeat: boolean;
  seatDragPosition: { x: number; y: number };
  isSwappingEmployees: boolean;
  selectedSeatsForSwap: any[];
  isSelectingSeatForRegistration: boolean;
  selectedSeatForRegistration: any;
  onSeatClick: (e: React.MouseEvent, seat: any) => void;
  onEquipmentClick: (equipment: any) => void;
}

const SeatRenderer = ({
  seat,
  selectedSeat,
  isDraggingSeat,
  seatDragPosition,
  isSwappingEmployees,
  selectedSeatsForSwap,
  isSelectingSeatForRegistration,
  selectedSeatForRegistration,
  onSeatClick,
  onEquipmentClick
}: SeatRendererProps) => {
  const isSelected = selectedSeat?.id === seat.id;
  const isSwapping = isSwappingEmployees && selectedSeatsForSwap.find(s => s.id === seat.id);
  const isSelectingForReg = isSelectingSeatForRegistration && selectedSeatForRegistration?.id === seat.id;
  
  const { backgroundColor: seatColor, borderColor } = getSeatColor(
    seat,
    isSelected,
    !!isSwapping,
    isSelectingForReg
  );
  
  // 如果是選中的座位並且在拖拽模式，使用拖拽位置
  const isCurrentSeatDragging = isDraggingSeat && selectedSeat?.id === seat.id;
  const displayX = isCurrentSeatDragging ? seatDragPosition.x : seat.x;
  const displayY = isCurrentSeatDragging ? seatDragPosition.y : seat.y;
  
  return (
    <div
      className={`seat-container absolute rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isSelected ? 'ring-2 ring-red-400 ring-opacity-80' : ''
      } ${
        isSwapping ? 'ring-4 ring-purple-400 ring-opacity-100' : ''
      }`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${seat.pixel_x}px`,
        height: `${seat.pixel_y}px`,
        backgroundColor: seatColor,
        border: `2px solid ${borderColor}`,
        backdropFilter: 'blur(4px)',
        opacity: isCurrentSeatDragging ? 0.8 : 1,
        transform: isCurrentSeatDragging ? 'scale(1.05)' : 'scale(1)',
        zIndex: isCurrentSeatDragging ? 1000 : 'auto'
      }}
      onClick={(e) => onSeatClick(e, seat)}
      title={`座位 ${seat.id} 容器內位置:(${seat.x}, ${seat.y}) 大小:(${seat.pixel_x}×${seat.pixel_y}) ${seat.employee ? `員工: ${seat.employee.name}` : '空座位'}`}
    >
      {/* 員工資訊顯示 */}
      {seat.employee && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          {seat.employee.photo ? (
            <div className="relative group">
              <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                <img
                  src={getStaffPhotoUrl(seat.employee.photo) || ''}
                  alt={seat.employee.name}
                  className="employee-avatar w-full h-full object-cover transition-all duration-300"
                  onLoad={() => {
                    console.log('頭像載入成功:', seat.employee.name, seat.employee.photo);
                  }}
                  onError={(e) => {
                    console.error('頭像載入失敗:', seat.employee.name, seat.employee.photo);
                    console.error('嘗試載入的URL:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'employee-avatar w-full h-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-300';
                      fallback.innerHTML = '<div class="text-2xl">👤</div>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              {/* 懸停時顯示名字 */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {seat.employee.name}
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="employee-avatar w-[60px] h-[60px] rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/50 shadow-lg transition-all duration-300">
                <div className="w-full h-full text-white flex items-center justify-center">
                  <div className="text-2xl">👤</div>
                </div>
              </div>
              {/* 懸停時顯示名字 */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {seat.employee.name}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 電腦圖示顯示 */}
      {seat.pc && (
        <div className="absolute bottom-1 right-1">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs">💻</span>
          </div>
        </div>
      )}
      
      {/* 設備圖示顯示 - 充滿整個座位 */}
      {seat.equipment && (
        <div className="absolute inset-0">
          {seat.equipment.photo ? (
            <div 
              className="w-full h-full rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onEquipmentClick(seat.equipment);
              }}
              title={`設備: ${seat.equipment.product}`}
            >
              <img
                src={getEquipmentPhotoUrl(seat.equipment.photo) || ''}
                alt={seat.equipment.product}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('設備圖片載入失敗:', seat.equipment.product, seat.equipment.photo);
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-purple-500/80 rounded-lg flex items-center justify-center"><span class="text-white text-2xl">⚙️</span></div>';
                  }
                }}
              />
            </div>
          ) : (
            <div 
              className="w-full h-full bg-purple-500/80 rounded-lg flex items-center justify-center shadow-lg cursor-pointer hover:bg-purple-500/90 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onEquipmentClick(seat.equipment);
              }}
              title={`設備: ${seat.equipment.product}`}
            >
              <span className="text-white text-2xl">⚙️</span>
            </div>
          )}
        </div>
      )}
      
      {/* 拖拽中的座位顯示十字線 */}
      {isCurrentSeatDragging && (
        <div
          className="absolute"
          style={{
            left: '-8px',
            top: '-8px',
            width: '16px',
            height: '16px',
            pointerEvents: 'none'
          }}
        >
          <div
            className="absolute bg-red-500"
            style={{
              left: '7px',
              top: '0px',
              width: '2px',
              height: '16px'
            }}
          />
          <div
            className="absolute bg-red-500"
            style={{
              left: '0px',
              top: '7px',
              width: '16px',
              height: '2px'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SeatRenderer;
