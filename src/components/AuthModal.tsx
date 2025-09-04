import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, X, Eye, EyeOff, UserPlus } from "lucide-react";
import { User, Session } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (employee: {id: string, name: string, email: string}) => void;
}

const AuthModal = ({ isOpen, onClose, onLoginSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session && event === 'SIGNED_IN') {
          onClose();
          toast({
            title: "登入成功",
            description: "歡迎回來！",
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [onClose, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          toast({
            title: "註冊失敗",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "註冊成功",
            description: "請查看您的電子郵件以確認帳號",
          });
          setEmail("");
          setPassword("");
          setShowPassword(false);
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          let errorMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = '電子郵件或密碼錯誤，請確認後重試';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '請先到電子郵件確認您的帳號';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = '嘗試次數過多，請稍後再試';
          }
          
          toast({
            title: "登入失敗",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        // 取得或建立員工資料
        const safeColumns = 'id, name, email, department, position, extension, photo, role, is_active, created_at, updated_at';
        let { data: employeeProfile } = await supabase
          .from('employees')
          .select(safeColumns)
          .eq('email', email)
          .maybeSingle();

        if (!employeeProfile) {
          const guessedName = email.split('@')[0];
          const { data: inserted } = await supabase
            .from('employees')
            .insert({
              name: guessedName,
              email,
              department: null,
              position: null,
              extension: null,
              photo: null,
              role: 'employee',
              is_active: true,
              password_hash: ''
            })
            .select(safeColumns)
            .single();
          employeeProfile = inserted || null;
        }

        if (onLoginSuccess && employeeProfile) {
          onLoginSuccess({ id: employeeProfile.id, name: employeeProfile.name, email: employeeProfile.email });
        }

        // 清空輸入框
        setEmail('');
        setPassword('');
        setShowPassword(false);
      }
    } catch (error) {
      toast({
        title: isSignUp ? "註冊失敗" : "登入失敗",
        description: "發生未預期的錯誤",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-md">
        {/* Login Form */}
        <div className="bg-gray-100 rounded-lg p-8 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              {isSignUp ? <UserPlus className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">
            {isSignUp ? "建立新帳號" : "歡迎回來"}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {isSignUp ? "請填寫以下資訊以建立帳號" : "請登入您的帳號以繼續使用系統"}
          </p>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 電子郵件
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入您的電子郵件"
                required
                className="w-full bg-transparent border-gray-300 text-gray-800 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">請輸入您的公司電子郵件地址</p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔒 密碼
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入您的密碼"
                  required
                  className="w-full pr-10 bg-transparent border-gray-300 text-gray-800 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">請輸入您的登入密碼</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isLoading ? 
                (isSignUp ? "註冊中..." : "登入中...") : 
                (isSignUp ? "立即註冊" : "立即登入")
              }
            </Button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
                setShowPassword(false);
              }}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              {isSignUp ? "已有帳號？點此登入" : "沒有帳號？點此註冊"}
            </button>
          </div>

          {/* 密碼重設提示 */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">
                如需重設密碼，請聯繫系統管理員
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;