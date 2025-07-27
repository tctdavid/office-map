import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat?: any;
  onRegistrationSuccess?: () => void;
}

const RegistrationModal = ({ isOpen, onClose, selectedSeat, onRegistrationSuccess }: RegistrationModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    position: "",
    extension: "",
    photo: ""
  });
  const [isLoading, setIsLoading] = useState(false);
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
      // 這裡可以實現照片上傳功能
      // 暫時只顯示檔案名稱
      setFormData(prev => ({
        ...prev,
        photo: file.name
      }));
      
      toast({
        title: "照片已選擇",
        description: `已選擇照片: ${file.name}`,
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
      // 檢查電子郵件是否已存在
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('email')
        .eq('email', formData.email)
        .single();
      
      if (existingEmployee) {
        toast({
          title: "電子郵件已存在",
          description: "此電子郵件已被註冊，請使用其他電子郵件",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // 創建新員工記錄
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert({
          name: formData.name,
          email: formData.email,
          password_hash: formData.password, // 注意：實際應用中應該使用適當的密碼加密
          department: formData.department || null,
          position: formData.position || null,
          extension: formData.extension || null,
          photo: formData.photo || null,
          role: 'employee',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "註冊失敗",
          description: "註冊過程中發生錯誤，請重試",
          variant: "destructive"
        });
        return;
      }
      
      // 如果有選中的座位，更新座位的員工資訊
      if (selectedSeat && newEmployee) {
        const { error: seatError } = await supabase
          .from('seat_coordinates')
          .update({
            employee_id: newEmployee.id,
            is_empty: false
          })
          .eq('id', selectedSeat.id);
        
        if (seatError) {
          console.error('Error updating seat:', seatError);
          toast({
            title: "座位分配失敗",
            description: "員工註冊成功，但座位分配失敗",
            variant: "destructive"
          });
        } else {
          toast({
            title: "註冊成功",
            description: `歡迎 ${formData.name}！您已成功註冊並分配到座位。`,
          });
        }
      } else {
        toast({
          title: "註冊成功",
          description: `歡迎 ${formData.name}！您已成功註冊。`,
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
        photo: ""
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
      <div className="bg-white rounded-lg p-6 w-[480px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">加入我們的團隊</h2>
        <p className="text-gray-600 text-center mb-6">請填寫您的資訊以完成註冊</p>
        
        {/* Seat Selection Notice */}
        {selectedSeat && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2"></div>
              <span className="text-sm text-orange-800">
                請先選擇座位
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              請在平面圖中選擇一個空的座位
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼 *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="請設定您的密碼"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-medium"
            >
              {isLoading ? "註冊中..." : "完成註冊"}
            </Button>
          </div>
        </form>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default RegistrationModal;