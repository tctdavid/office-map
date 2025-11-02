import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const isAdmin = currentEmployee?.role === 'admin';

  const handleLoginSuccess = async (employee: Employee) => {
    // 立即設置員工資訊（包含 role）
    setCurrentEmployee({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
    
    console.log('登入成功，員工角色:', employee.role, '是否為管理員:', employee.role === 'admin');

    // 獲取 Supabase user
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    setUser(supabaseUser);

    toast({
      title: "登入成功",
      description: `歡迎回來，${employee.name}！`,
    });
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentEmployee(null);
    
    toast({
      title: "登出成功",
      description: "已成功登出系統",
    });
  };

  return {
    user,
    currentEmployee,
    isAdmin,
    login: handleLoginSuccess,
    logout: handleLogout,
    setUser,
    setCurrentEmployee
  };
};
