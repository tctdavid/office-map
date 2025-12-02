/**
 * 座位預覽組件 - 跟隨鼠標的座位模板預覽
 */

import { getSeatSize } from "@/utils/seatCalculations";

interface SeatPreviewProps {
  containerMousePosition: { x: number; y: number };
  selectedSeatTemplate: string;
}

const SeatPreview = ({ containerMousePosition, selectedSeatTemplate }: SeatPreviewProps) => {
  const seatSize = getSeatSize(selectedSeatTemplate);
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${containerMousePosition.x}px`,
        top: `${containerMousePosition.y}px`,
        width: `${seatSize.width}px`,
        height: `${seatSize.height}px`,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        border: '2px dashed #22c55e',
        borderRadius: '4px',
        zIndex: 1000
      }}
    >
      {/* 十字線在左上角 */}
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
        {/* 垂直線 */}
        <div
          className="absolute bg-red-500"
          style={{
            left: '7px',
            top: '0px',
            width: '2px',
            height: '16px'
          }}
        />
        {/* 水平線 */}
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
      
      {/* 座位模板標示 */}
      <div
        className="absolute text-white text-xs font-bold flex items-center justify-center bg-black/60 rounded px-1"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px'
        }}
      >
        {selectedSeatTemplate}
      </div>
    </div>
  );
};

export default SeatPreview;
