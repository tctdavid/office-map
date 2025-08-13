import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Eye, EyeOff } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat?: any;
  containers?: any[];
  onRegistrationSuccess?: () => void;
  isEditMode?: boolean;
  currentEmployee?: {name: string, email: string, id?: string} | null;
}

const RegistrationModal = ({ isOpen, onClose, selectedSeat, containers = [], onRegistrationSuccess, isEditMode = false, currentEmployee }: RegistrationModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    position: "",
    extension: "",
    photo: "",
    photoPreview: ""
  });
  
  // 加載當前員工數據用於編輯模式
  useEffect(() => {
    if (isEditMode && currentEmployee && isOpen) {
      // 從資料庫載入完整的員工資料
      const loadEmployeeData = async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department, position, extension, photo, role, is_active, created_at, updated_at')
          .eq('email', currentEmployee.email)
          .single();
        
        if (!error && data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            password: "", // 不預填密碼
            department: data.department || "",
            position: data.position || "",
            extension: data.extension || "",
            photo: data.photo || "",
            photoPreview: data.photo && data.photo.startsWith('http') 
              ? data.photo 
              : data.photo 
                ? `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/staff/${data.photo}`
                : ""
          });
        }
      };
      
      loadEmployeeData();
    } else if (!isEditMode) {
      // 重置表單用於註冊模式
      setFormData({
        name: "",
        email: "",
        password: "",
        department: "",
        position: "",
        extension: "",
        photo: "",
        photoPreview: ""
      });
    }
  }, [isEditMode, currentEmployee, isOpen]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 生成唯一檔名
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${formData.email || 'user'}_${timestamp}.${fileExt}`;
      
      // 上傳到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('staff')
        .upload(fileName, file, { upsert: true });
      
      if (error) {
        throw error;
      }
      
      // 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('staff')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({
        ...prev,
        photo: fileName,
        photoPreview: publicUrl
      }));
      
      toast({
        title: "照片上傳成功",
        description: `照片已上傳: ${file.name}`,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "上傳失敗",
        description: "照片上傳失敗，請重試",
        variant: "destructive"
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "請填寫姓名",
        description: "姓名為必填欄位",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "請填寫電子郵件",
        description: "電子郵件為必填欄位",
        variant: "destructive"
      });
      return false;
    }
    
    // 在編輯模式下，如果密碼為空則跳過密碼驗證（表示不修改密碼）
    if (!isEditMode) {
      if (!formData.password.trim()) {
        toast({
          title: "請填寫密碼",
          description: "密碼為必填欄位",
          variant: "destructive"
        });
        return false;
      }
      
      if (formData.password.length < 6) {
        toast({
          title: "密碼太短",
          description: "密碼至少需要6個字元",
          variant: "destructive"
        });
        return false;
      }
    } else if (formData.password.trim() && formData.password.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要6個字元",
        variant: "destructive"
      });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "電子郵件格式錯誤",
        description: "請輸入有效的電子郵件地址",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditMode && currentEmployee) {
        // 編輯模式：更新現有員工資料
        const updateData: any = {
          department: formData.department || null,
          position: formData.position || null,
          extension: formData.extension || null,
          photo: formData.photo || null,
        };
        
        const { error } = await supabase
          .from('employees')
          .update(updateData)
          .eq('email', currentEmployee.email);
        
        if (error) {
          console.error('Update error:', error);
          toast({
            title: "更新失敗",
            description: "更新個人資料時發生錯誤，請重試",
            variant: "destructive"
          });
          return;
        }
        
        // 如果有新密碼，更新 Supabase Auth 密碼
        if (formData.password.trim()) {
          const { error: pwdError } = await supabase.auth.updateUser({ password: formData.password });
          if (pwdError) {
            toast({ title: '密碼更新失敗', description: pwdError.message, variant: 'destructive' });
          }
        }
        
        toast({
          title: "更新成功",
          description: "個人資料已成功更新",
        });
        
      } else {
        // 註冊模式：使用 Supabase Auth 建立帳號
        const redirectUrl = `${window.location.origin}/`;
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { emailRedirectTo: redirectUrl }
        });
        if (signUpError) {
          toast({ title: '註冊失敗', description: signUpError.message, variant: 'destructive' });
          return;
        }
        
        // 嘗試立即登入以建立會話（若需信箱驗證則可能失敗）
        await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
        
        // 嘗試建立員工資料（若無權限會被 RLS 阻擋）
        const safeInsert = {
          name: formData.name,
          email: formData.email,
          department: formData.department || null,
          position: formData.position || null,
          extension: formData.extension || null,
          photo: formData.photo || null,
          role: 'employee',
          is_active: true,
          password_hash: ''
        };
        const { data: newEmployee, error: insertError } = await supabase
          .from('employees')
          .insert(safeInsert as any)
          .select('id, name, email')
          .maybeSingle();
        
        if (selectedSeat && newEmployee) {
          const { error: seatError } = await supabase
            .from('seat_coordinates')
            .update({ employee_id: newEmployee.id, is_empty: false })
            .eq('id', selectedSeat.id);
          if (seatError) {
            toast({ title: '座位分配失敗', description: '員工已註冊，但座位分配失敗', variant: 'destructive' });
          }
        }
        
        toast({
          title: '註冊成功',
          description: '請查看電子郵件完成驗證，之後可登入並完善個人資料。'
        });
      }
      
      // 重置表單
      setFormData({
        name: "",
        email: "",
        password: "",
        department: "",
        position: "",
        extension: "",
        photo: "",
        photoPreview: ""
      });
      
      // 關閉對話框
      onClose();
      
      // 通知父組件註冊成功
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "註冊失敗",
        description: "註冊過程中發生錯誤，請重試",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[480px] max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          {isEditMode ? "修改個人資料" : "加入我們的團隊"}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isEditMode ? "請修改您的個人資訊" : "請填寫您的資訊以完成註冊"}
        </p>
        
        {/* Seat Selection Notice - 只在註冊模式顯示 */}
        {!isEditMode && (selectedSeat ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2"></div>
              <span className="text-sm text-orange-800">
                已選擇座位
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              容器：{containers.find(c => c.id === selectedSeat.container_id)?.name || selectedSeat.container || '未知容器'} | 
              座位：{selectedSeat.id}
            </p>
            {selectedSeat.employee_id && (
              <p className="text-sm text-red-600 mt-1 font-medium">
                ⚠️ 此座位已被佔用，請重新選擇其他座位
              </p>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-2"></div>
              <span className="text-sm text-blue-800">
                請先選擇座位
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              請在平面圖中選擇一個空的座位
            </p>
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {formData.photoPreview ? (
                <img 
                  src={formData.photoPreview} 
                  alt="預覽照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <label htmlFor="photo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors">
                <span className="text-sm text-gray-600">📤 上傳照片</span>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Name and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
                disabled={isEditMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件 *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
                disabled={isEditMode}
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼 {isEditMode ? "(留空表示不修改)" : "*"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={isEditMode ? "輸入新密碼（可選）" : "請設定您的密碼"}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required={!isEditMode}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Department and Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                部門
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="如：資訊部"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                職位
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="如：軟體工程師"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          
          {/* Extension */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分機號碼
            </label>
            <input
              type="text"
              value={formData.extension}
              onChange={(e) => handleInputChange('extension', e.target.value)}
              placeholder="如：1002"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-medium"
            >
              {isLoading ? (isEditMode ? "更新中..." : "註冊中...") : (isEditMode ? "儲存變更" : "完成註冊")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;