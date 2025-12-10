import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Employee, SeatWithRelations } from '@/types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSeatEmployee, setSelectedSeatEmployee] = useState<Employee | null>(null);
  const [isManagingEmployees, setIsManagingEmployees] = useState(false);
  const [disabledEmployees, setDisabledEmployees] = useState<Employee[]>([]);
  const [showDisabledEmployeesModal, setShowDisabledEmployeesModal] = useState(false);
  const [selectedEmptySeat, setSelectedEmptySeat] = useState<SeatWithRelations | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // 載入員工資料
  const fetchEmployees = useCallback(async (isAdmin: boolean) => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: employeeData, error: fetchError } = await supabase
        .from('employees')
        .select('id, name, email, department, position, extension, photo, role, is_active');
      
      if (fetchError) {
        console.error('Error fetching employees:', fetchError);
        setError(fetchError.message);
        toast({
          title: "載入失敗",
          description: "無法載入員工資料",
          variant: "destructive"
        });
      } else if (employeeData) {
        const typedEmployees: Employee[] = employeeData.map(emp => ({
          ...emp,
          created_at: null,
          updated_at: null
        }));
        setEmployees(typedEmployees);
        setDisabledEmployees(typedEmployees.filter(emp => !emp.is_active));
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      console.error('Error in fetchEmployees:', err);
      setError(errorMessage);
      toast({
        title: "載入失敗",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 停用員工
  const handleDisableEmployee = async (employeeId: string, seatId: string, isAdmin: boolean, onSuccess?: () => void) => {
    try {
      // 停用員工
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', employeeId);

      if (employeeError) throw employeeError;

      // 清空座位
      const { error: seatError } = await supabase
        .from('seat_coordinates')
        .update({ employee_id: null, is_empty: true })
        .eq('id', seatId);

      if (seatError) throw seatError;

      toast({
        title: "員工已停用",
        description: "員工已被停用並從座位移除",
      });

      // 重新載入員工資料
      await fetchEmployees(isAdmin);
      
      // 調用回調函數重新載入座位資料
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error disabling employee:', error);
      toast({
        title: "停用失敗",
        description: "無法停用員工",
        variant: "destructive"
      });
    }
  };

  // 啟用員工並分配座位
  const handleEnableEmployee = async (employeeId: string, seatId: string, isAdmin: boolean, onSuccess?: () => void) => {
    try {
      // 啟用員工
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ is_active: true })
        .eq('id', employeeId);

      if (employeeError) throw employeeError;

      // 分配座位
      const { error: seatError } = await supabase
        .from('seat_coordinates')
        .update({ employee_id: employeeId, is_empty: false })
        .eq('id', seatId);

      if (seatError) throw seatError;

      toast({
        title: "員工已啟用",
        description: "員工已被啟用並分配座位",
      });

      // 重新載入員工資料
      await fetchEmployees(isAdmin);
      
      // 調用回調函數重新載入座位資料
      if (onSuccess) {
        onSuccess();
      }
      
      setShowDisabledEmployeesModal(false);
    } catch (error) {
      console.error('Error enabling employee:', error);
      toast({
        title: "啟用失敗",
        description: "無法啟用員工",
        variant: "destructive"
      });
    }
  };

  // 重置員工管理狀態
  const resetEmployeeManagement = () => {
    setIsManagingEmployees(false);
    setShowDisabledEmployeesModal(false);
    setSelectedEmptySeat(null);
  };

  return {
    employees,
    selectedSeatEmployee,
    isManagingEmployees,
    disabledEmployees,
    showDisabledEmployeesModal,
    selectedEmptySeat,
    isLoading,
    error,
    setEmployees,
    setSelectedSeatEmployee,
    setIsManagingEmployees,
    setDisabledEmployees,
    setShowDisabledEmployeesModal,
    setSelectedEmptySeat,
    fetchEmployees,
    handleDisableEmployee,
    handleEnableEmployee,
    resetEmployeeManagement,
  };
};
