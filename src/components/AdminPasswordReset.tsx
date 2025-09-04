import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import bcrypt from 'bcryptjs';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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

    if (!adminPassword) {
      toast({
        title: "請輸入管理員密碼",
        description: "需要輸入您的管理員密碼以確認身份",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 驗證管理員密碼
      const { data: adminData, error: adminError } = await supabase
        .from('employees')
        .select('password_hash')
        .eq('email', currentAdminEmail)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminData) {
        toast({
          title: "管理員驗證失敗",
          description: "無法驗證管理員身份",
          variant: "destructive"
        });
        return;
      }

      // 比較管理員密碼
      const isAdminPasswordValid = await bcrypt.compare(adminPassword, adminData.password_hash);
      if (!isAdminPasswordValid) {
        toast({
          title: "管理員密碼錯誤",
          description: "管理員密碼驗證失敗",
          variant: "destructive"
        });
        return;
      }

      // 加密新密碼
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新員工密碼
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployeeId);

      if (updateError) {
        toast({
          title: "密碼重設失敗",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      // 獲取員工資訊用於顯示
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      
      toast({
        title: "密碼重設成功",
        description: `已成功重設 ${selectedEmployee?.name} 的密碼`,
      });

      // 重置表單
      setSelectedEmployeeId("");
      setNewPassword("");
      setConfirmPassword("");
      setAdminPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowAdminPassword(false);
      onClose();

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
    setAdminPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAdminPassword(false);
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
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入新密碼（至少6個字元）"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

          {/* 管理員密碼確認 */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2 text-destructive">
              管理員密碼確認 *
            </label>
            <div className="relative">
              <Input
                type={showAdminPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="請輸入您的管理員密碼以確認操作"
                className="pr-10 border-destructive/30"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              當前管理員：{currentAdminEmail}
            </p>
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