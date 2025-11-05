/**
 * 座位交換處理工具函數
 */

import { supabase } from "@/integrations/supabase/client";

export interface SwapResult {
  success: boolean;
  error?: any;
}

/**
 * 交換員工位置（可選擇是否同時交換電腦）
 */
export const swapEmployees = async (
  seat1: any,
  seat2: any,
  swapPc: boolean = false
): Promise<SwapResult> => {
  try {
    const timestamp = new Date().toISOString();
    
    // 準備更新的數據
    const seat1Updates: any = {
      employee_id: seat2.employee_id || null,
      is_empty: seat2.employee_id ? false : true,
      updated_at: timestamp
    };
    
    const seat2Updates: any = {
      employee_id: seat1.employee_id || null,
      is_empty: seat1.employee_id ? false : true,
      updated_at: timestamp
    };

    // 如果選擇交換電腦
    if (swapPc) {
      seat1Updates.pc_id = seat2.pc_id || null;
      seat2Updates.pc_id = seat1.pc_id || null;
    }

    console.log('Update data:', { seat1Updates, seat2Updates });

    // 同時更新兩個座位
    const [result1, result2] = await Promise.all([
      supabase
        .from('seat_coordinates')
        .update(seat1Updates)
        .eq('id', seat1.id),
      supabase
        .from('seat_coordinates')
        .update(seat2Updates)
        .eq('id', seat2.id)
    ]);

    const results = [result1, result2];
    
    // 檢查所有更新是否成功
    results.forEach((result, index) => {
      if (result.error) {
        console.error(`Update ${index + 1} failed:`, result.error);
        throw result.error;
      }
    });

    console.log('All updates successful');

    // 等待一小段時間確保數據庫更新完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  } catch (error) {
    console.error('Error swapping employees:', error);
    return { success: false, error };
  }
};

/**
 * 僅交換電腦
 */
export const swapPcsOnly = async (
  seat1: any,
  seat2: any
): Promise<SwapResult> => {
  try {
    const timestamp = new Date().toISOString();
    
    // 準備更新的數據 - 只交換電腦ID
    const seat1Updates: any = {
      pc_id: seat2.pc_id || null,
      updated_at: timestamp
    };
    
    const seat2Updates: any = {
      pc_id: seat1.pc_id || null,
      updated_at: timestamp
    };

    console.log('Update PC data:', { seat1Updates, seat2Updates });

    // 同時更新兩個座位的電腦ID
    const [result1, result2] = await Promise.all([
      supabase
        .from('seat_coordinates')
        .update(seat1Updates)
        .eq('id', seat1.id),
      supabase
        .from('seat_coordinates')
        .update(seat2Updates)
        .eq('id', seat2.id)
    ]);

    const results = [result1, result2];
    
    // 檢查所有更新是否成功
    results.forEach((result, index) => {
      if (result.error) {
        console.error(`PC swap ${index + 1} failed:`, result.error);
        throw result.error;
      }
    });

    console.log('PC swap successful');

    // 等待一小段時間確保數據庫更新完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  } catch (error) {
    console.error('Error swapping PCs:', error);
    return { success: false, error };
  }
};

/**
 * 修復遺失的員工分配
 */
export const restoreMissingEmployeeAssignments = async (): Promise<{
  success: boolean;
  assignedCount: number;
  error?: any;
}> => {
  try {
    // 獲取所有活躍員工
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name')
      .eq('is_active', true)
      .neq('role', 'admin');

    if (empError) throw empError;

    // 獲取已分配座位的員工ID
    const { data: assignedSeats, error: seatError } = await supabase
      .from('seat_coordinates')
      .select('employee_id')
      .not('employee_id', 'is', null);

    if (seatError) throw seatError;

    const assignedEmployeeIds = assignedSeats.map(seat => seat.employee_id);
    const unassignedEmployees = employees.filter(emp => !assignedEmployeeIds.includes(emp.id));

    if (unassignedEmployees.length === 0) {
      return { success: true, assignedCount: 0 };
    }

    // 獲取空座位
    const { data: emptySeats, error: emptySeatError } = await supabase
      .from('seat_coordinates')
      .select('id')
      .eq('is_empty', true)
      .limit(unassignedEmployees.length);

    if (emptySeatError) throw emptySeatError;

    // 分配員工到空座位
    let assignedCount = 0;
    for (let i = 0; i < Math.min(unassignedEmployees.length, emptySeats.length); i++) {
      const { error: updateError } = await supabase
        .from('seat_coordinates')
        .update({
          employee_id: unassignedEmployees[i].id,
          is_empty: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', emptySeats[i].id);

      if (updateError) throw updateError;
      assignedCount++;
    }

    return { success: true, assignedCount };
  } catch (error) {
    console.error('修復員工位置時發生錯誤:', error);
    return { success: false, assignedCount: 0, error };
  }
};
