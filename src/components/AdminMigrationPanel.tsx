import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, AlertTriangle, CheckCircle } from "lucide-react";

interface AdminMigrationPanelProps {
  isVisible: boolean;
  currentEmployee?: { id: string; name: string; email: string; role?: string } | null;
}

const AdminMigrationPanel = ({ isVisible, currentEmployee }: AdminMigrationPanelProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isVisible || currentEmployee?.role !== 'admin') {
    return null;
  }

  const handleCreateAuthAccounts = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc('create_auth_for_existing_employees');
      
      if (error) {
        throw error;
      }
      
      setResult(data || "操作完成");
      toast({
        title: "Auth 帳號建立完成",
        description: "已為現有員工建立 Supabase Auth 帳號",
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "建立失敗",
        description: error.message || "建立 Auth 帳號時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <UserPlus className="w-5 h-5" />
          系統整合管理
        </CardTitle>
        <CardDescription className="text-orange-700">
          為現有員工建立 Supabase Auth 帳號，啟用完整的認證功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            此操作會為資料庫中尚未有 Auth 帳號的員工建立對應的 Supabase Auth 帳號。
            建立後的帳號會有臨時密碼 "temp123456"，員工需要透過忘記密碼功能重設密碼。
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-orange-800">執行步驟：</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
            <li>檢查 employees 表中沒有對應 Auth 帳號的員工</li>
            <li>為這些員工建立 Supabase Auth 帳號</li>
            <li>設定臨時密碼並標記為已驗證</li>
            <li>通知員工重設密碼</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleCreateAuthAccounts}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRunning ? "建立中..." : "為現有員工建立 Auth 帳號"}
          </Button>

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {result}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-xs text-orange-600 bg-orange-100 p-3 rounded">
          <strong>重要提醒：</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>執行後，所有員工都能使用電子郵件和密碼登入系統</li>
            <li>新建立的帳號需要員工透過「忘記密碼」功能重設密碼</li>
            <li>此操作不可逆，建議先備份資料</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMigrationPanel;