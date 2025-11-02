/**
 * 座位計算工具函數
 */

/**
 * 獲取座位模板尺寸
 */
export const getSeatSize = (template: string) => {
  switch (template) {
    case '120x70': return { width: 120, height: 70 };
    case '70x90': return { width: 70, height: 90 };
    case '40x40': return { width: 40, height: 40 };
    default: return { width: 40, height: 40 };
  }
};

/**
 * 檢查座位重疊
 */
export const checkSeatOverlap = (newSeat: any, seats: any[], containerId: string) => {
  return seats.some(seat => {
    if (seat.container_id !== containerId) return false;
    if (seat.id === newSeat.id) return false;
    
    // 檢查兩個矩形是否重疊
    const isOverlapping = !(
      newSeat.x + newSeat.pixel_x <= seat.x ||
      seat.x + seat.pixel_x <= newSeat.x ||
      newSeat.y + newSeat.pixel_y <= seat.y ||
      seat.y + seat.pixel_y <= newSeat.y
    );
    
    return isOverlapping;
  });
};

/**
 * 鎖定到網格點 (20px 網格)
 */
export const snapToGrid = (value: number) => {
  return Math.round(value / 20) * 20;
};
