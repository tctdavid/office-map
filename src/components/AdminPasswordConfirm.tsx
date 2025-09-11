import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface AdminPasswordConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  adminEmail: string;
  title: string;
  description: string;
}

export default function AdminPasswordConfirm({
  isOpen,
  onClose,
  onConfirm,
  adminEmail,
  title,
  description
}: AdminPasswordConfirmProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "請輸入密碼",
        description: "密碼欄位不能為空",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // 使用 Supabase Auth 進行管理員密碼驗證
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password
      });

      if (error) {
        toast({
          title: "密碼錯誤",
          description: "請輸入正確的管理員密碼",
          variant: "destructive"
        });
        return;
      }

      // 驗證管理員角色
      const { data: employee, error: roleError } = await supabase
        .from('employees')
        .select('role')
        .eq('email', adminEmail)
        .eq('role', 'admin')
        .single();

      if (roleError || !employee) {
        toast({
          title: "權限不足",
          description: "您沒有管理員權限",
          variant: "destructive"
        });
        return;
      }

      // 驗證成功，執行確認動作
      onConfirm();
      onClose();
      setPassword("");
      
    } catch (error) {
      console.error('Password verification error:', error);
      toast({
        title: "驗證錯誤",
        description: "密碼驗證過程中發生錯誤",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🔒</span>
            </div>
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">
            {description}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-email" className="text-white">
              管理員帳號
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              disabled
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="admin-password" className="text-white">
              管理員密碼 *
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入管理員密碼"
              className="bg-slate-700 border-slate-600 text-white"
              autoFocus
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !password.trim()}
            >
              {loading ? "驗證中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}