/**
 * 座位顏色映射工具函數
 */

export interface SeatColorResult {
  backgroundColor: string;
  borderColor: string;
}

/**
 * 獲取座位顏色
 * @param seat 座位資料
 * @param isSelected 是否為選中座位
 * @param isSwapping 是否在交換模式中被選中
 * @param isSelectingForRegistration 是否在註冊選擇模式
 * @returns 座位背景色和邊框色
 */
export const getSeatColor = (
  seat: any,
  isSelected: boolean,
  isSwapping: boolean,
  isSelectingForRegistration: boolean = false
): SeatColorResult => {
  // 選中的座位
  if (isSelected) {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)'
    };
  }
  
  // 交換模式中選中的座位
  if (isSwapping) {
    return {
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)'
    };
  }
  
  // 註冊選擇模式中選中的座位
  if (isSelectingForRegistration) {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgba(239, 68, 68, 0.8)'
    };
  }
  
  // 根據座位狀態決定顏色
  if (seat.employee_id) {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.6)', // 透明藍色 (有員工)
      borderColor: 'rgba(59, 130, 246, 0.8)'
    };
  } else if (seat.pc_id) {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.6)', // 透明綠色 (有PC)
      borderColor: 'rgba(156, 163, 175, 0.4)'
    };
  } else if (seat.equipment_id) {
    return {
      backgroundColor: 'rgba(147, 51, 234, 0.6)', // 透明紫色 (有設備)
      borderColor: 'rgba(147, 51, 234, 0.8)'
    };
  }
  
  // 空位
  return {
    backgroundColor: 'rgba(107, 114, 128, 0.6)', // 透明灰色
    borderColor: 'rgba(156, 163, 175, 0.4)'
  };
};
