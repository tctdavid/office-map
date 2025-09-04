import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Eye, EyeOff, KeyRound } from "lucide-react";

interface AdminPasswordResetProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminEmail: string;
}

const AdminPasswordReset = ({ isOpen, onClose, currentAdminEmail }: AdminPasswordResetProps) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 載入員工列表
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, department, position, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "載入員工失敗",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setEmployees(data || []);
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "密碼長度至少需要 6 個字元";
    }
    return null;
  };

  const handlePasswordReset = async () => {
    // 驗證輸入
    if (!selectedEmployeeId) {
      toast({
        title: "請選擇員工",
        description: "請選擇要重設密碼的員工",
        variant: "destructive"
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "密碼格式錯誤",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "密碼不一致",
        description: "新密碼與確認密碼不一致",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('開始密碼重設流程');

      // 呼叫 Edge Function 來重設密碼
      const { data, error } = await supabase.functions.invoke('reset-employee-password', {
        body: {
          employeeId: selectedEmployeeId,
          newPassword: newPassword,
          adminEmail: currentAdminEmail
        }
      });

      if (error) {
        console.error('Edge Function 呼叫失敗:', error);
        toast({
          title: "密碼重設失敗",
          description: "系統錯誤，請稍後再試",
          variant: "destructive"
        });
        return;
      }

      if (!data.success) {
        console.error('密碼重設失敗:', data.error);
        toast({
          title: "密碼重設失敗",
          description: data.error || "未知錯誤",
          variant: "destructive"
        });
        return;
      }

      console.log('密碼重設成功:', data.message);

      // 獲取員工資訊用於顯示
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      
      toast({
        title: "密碼重設成功",
        description: `已成功重設 ${selectedEmployee?.name} 的密碼`,
      });

      handleClose();

    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "密碼重設失敗",
        description: "發生未預期的錯誤",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            管理員密碼重設
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 員工選擇 */}
          <div>
            <label className="block text-sm font-medium mb-2">選擇員工</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇要重設密碼的員工" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 新密碼 */}
          <div>
            <label className="block text-sm font-medium mb-2">新密碼</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入新密碼（至少6個字元）"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 確認密碼 */}
          <div>
            <label className="block text-sm font-medium mb-2">確認新密碼</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="請再次輸入新密碼"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 管理員確認提示 */}
          <div className="border-t pt-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                <strong>管理員確認：</strong> {currentAdminEmail}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                由於您已通過系統認證登入，無需再次輸入密碼確認
              </p>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              取消
            </Button>
            <Button 
              onClick={handlePasswordReset} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "重設中..." : "確認重設"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPasswordReset;