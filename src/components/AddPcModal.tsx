import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminPasswordConfirm from "./AdminPasswordConfirm";
import { getPcPhotoUrl } from "@/lib/supabase-storage";

interface AddPcModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat?: any;
  existingPc?: any; // 用於編輯現有電腦
  onSuccess?: () => void;
}

interface PcData {
  name: string;
  cpu: string;
  memory: string;
  storage: string;
  graphics: string;
  case_photo: string;
  case_photo_preview?: string;
  monitor_a: string;
  monitor_a_photo: string;
  monitor_a_photo_preview?: string;
  monitor_b: string;
  monitor_b_photo: string;
  monitor_b_photo_preview?: string;
  brand: string;
  mac_add: string;
  serial_number: string;
  purchase_date: string;
  warranty_expiry: string;
  notes: string;
  pc_case: string;
  psu: string;
  main_board: string;
  os: string;
  cpu_fan: string;
}

const AddPcModal = ({ isOpen, onClose, selectedSeat, existingPc, onSuccess }: AddPcModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  
  const [pcData, setPcData] = useState<PcData>({
    name: '',
    cpu: '',
    memory: '',
    storage: '',
    graphics: '',
    case_photo: '',
    monitor_a: '',
    monitor_a_photo: '',
    monitor_b: '',
    monitor_b_photo: '',
    brand: '',
    mac_add: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
    pc_case: '',
    psu: '',
    main_board: '',
    os: '',
    cpu_fan: ''
  });

  // 載入當前員工資料
  useEffect(() => {
    const checkCurrentEmployee = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('email', user.email)
          .single();
        setCurrentEmployee(employee);
      }
    };
    checkCurrentEmployee();
  }, []);
  const resetForm = () => {
    setPcData({
      name: '',
      cpu: '',
      memory: '',
      storage: '',
      graphics: '',
      case_photo: '',
      monitor_a: '',
      monitor_a_photo: '',
      monitor_b: '',
      monitor_b_photo: '',
      brand: '',
      mac_add: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      notes: '',
      pc_case: '',
      psu: '',
      main_board: '',
      os: '',
      cpu_fan: ''
    });
  };

  // 處理刪除電腦
  const handleDeletePc = async () => {
    if (!existingPc || !currentEmployee) return;
    
    setLoading(true);
    
    try {
      // 刪除 pc_details 記錄
      const { error: detailsError } = await supabase
        .from('pc_details')
        .delete()
        .eq('pc_id', existingPc.id);
      
      if (detailsError) throw detailsError;
      
      // 更新相關座位的 pc_id 為 null
      const { error: seatUpdateError } = await supabase
        .from('seat_coordinates')
        .update({ pc_id: null })
        .eq('pc_id', existingPc.id);
      
      if (seatUpdateError) throw seatUpdateError;
      
      // 刪除 pcs 記錄
      const { error: pcError } = await supabase
        .from('pcs')
        .delete()
        .eq('id', existingPc.id);
      
      if (pcError) throw pcError;
      
      toast({
        title: "刪除成功",
        description: "電腦設備已成功刪除",
      });
      
      setShowDeleteConfirm(false);
      onSuccess?.();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Error deleting PC:', error);
      toast({
        title: "刪除失敗",
        description: "電腦設備刪除失敗，請重試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 載入現有電腦數據（如果是編輯模式）
  useEffect(() => {
    if (existingPc) {
      // 載入 PC 基本資料
      setPcData(prev => ({
        ...prev,
        name: existingPc.name || '',
        cpu: existingPc.cpu || '',
        memory: existingPc.memory || '',
        storage: existingPc.storage || '',
        graphics: existingPc.graphics || '',
        case_photo: existingPc.case_photo || '',
        monitor_a: existingPc.monitor_a || '',
        monitor_a_photo: existingPc.monitor_a_photo || '',
        monitor_b: existingPc.monitor_b || '',
        monitor_b_photo: existingPc.monitor_b_photo || '',
        // 設置現有圖片的預覽URL
        case_photo_preview: getPcPhotoUrl(existingPc.case_photo) || '',
        monitor_a_photo_preview: getPcPhotoUrl(existingPc.monitor_a_photo) || '',
        monitor_b_photo_preview: getPcPhotoUrl(existingPc.monitor_b_photo) || '',
      }));

      // 載入 PC 詳細資料
      const fetchPcDetails = async () => {
        const { data: details } = await supabase
          .from('pc_details')
          .select('*')
          .eq('pc_id', existingPc.id)
          .maybeSingle();

        if (details) {
          setPcData(prev => ({
            ...prev,
            brand: details.brand || '',
            mac_add: details.mac_add || '',
            serial_number: details.serial_number || '',
            purchase_date: details.purchase_date || '',
            warranty_expiry: details.warranty_expiry || '',
            notes: details.notes || '',
            pc_case: details.pc_case || '',
            psu: details.psu || '',
            main_board: details.main_board || '',
            os: details.os || '',
            cpu_fan: details.cpu_fan || ''
          }));
        }
      };

      fetchPcDetails();
    } else {
      resetForm();
    }
  }, [existingPc, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pcData.name.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入電腦名稱",
        variant: "destructive",
      });
      return;
    }

    if (!existingPc && !selectedSeat) {
      toast({
        title: "錯誤", 
        description: "請先選擇一個座位",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting PC data:', pcData);
    console.log('Image files:', {
      case_photo: pcData.case_photo,
      monitor_a_photo: pcData.monitor_a_photo,
      monitor_b_photo: pcData.monitor_b_photo
    });

    setLoading(true);

    try {
      let pcId = existingPc?.id;

      if (existingPc) {
        // 更新現有電腦
        const updateData = {
          name: pcData.name,
          cpu: pcData.cpu,
          memory: pcData.memory,
          storage: pcData.storage,
          graphics: pcData.graphics,
          case_photo: pcData.case_photo,
          monitor_a: pcData.monitor_a,
          monitor_a_photo: pcData.monitor_a_photo,
          monitor_b: pcData.monitor_b,
          monitor_b_photo: pcData.monitor_b_photo,
        };
        
        console.log('Updating PC with data:', updateData);
        
        const { error: pcError } = await supabase
          .from('pcs')
          .update(updateData)
          .eq('id', existingPc.id);

        if (pcError) throw pcError;

        // 更新或插入詳細資料
        const { data: existingDetails } = await supabase
          .from('pc_details')
          .select('id')
          .eq('pc_id', existingPc.id)
          .single();

        if (existingDetails) {
          const { error: detailsError } = await supabase
            .from('pc_details')
            .update({
              brand: pcData.brand,
              mac_add: pcData.mac_add,
              serial_number: pcData.serial_number,
              purchase_date: pcData.purchase_date || null,
              warranty_expiry: pcData.warranty_expiry || null,
              notes: pcData.notes,
              pc_case: pcData.pc_case,
              psu: pcData.psu,
              main_board: pcData.main_board,
              os: pcData.os,
              cpu_fan: pcData.cpu_fan,
            })
            .eq('pc_id', existingPc.id);

          if (detailsError) throw detailsError;
        } else {
          const { error: detailsError } = await supabase
            .from('pc_details')
            .insert({
              pc_id: existingPc.id,
              brand: pcData.brand,
              mac_add: pcData.mac_add,
              serial_number: pcData.serial_number,
              purchase_date: pcData.purchase_date || null,
              warranty_expiry: pcData.warranty_expiry || null,
              notes: pcData.notes,
              pc_case: pcData.pc_case,
              psu: pcData.psu,
              main_board: pcData.main_board,
              os: pcData.os,
              cpu_fan: pcData.cpu_fan,
            });

          if (detailsError) throw detailsError;
        }

        toast({
          title: "成功",
          description: "電腦資料更新成功",
        });
      } else {
        // 新增電腦
        const { data: newPc, error: pcError } = await supabase
          .from('pcs')
          .insert({
            name: pcData.name,
            cpu: pcData.cpu,
            memory: pcData.memory,
            storage: pcData.storage,
            graphics: pcData.graphics,
            case_photo: pcData.case_photo,
            monitor_a: pcData.monitor_a,
            monitor_a_photo: pcData.monitor_a_photo,
            monitor_b: pcData.monitor_b,
            monitor_b_photo: pcData.monitor_b_photo,
          })
          .select()
          .single();

        if (pcError) throw pcError;
        pcId = newPc.id;

        // 插入詳細資料
        const { error: detailsError } = await supabase
          .from('pc_details')
          .insert({
            pc_id: pcId,
            brand: pcData.brand,
            mac_add: pcData.mac_add,
            serial_number: pcData.serial_number,
            purchase_date: pcData.purchase_date || null,
            warranty_expiry: pcData.warranty_expiry || null,
            notes: pcData.notes,
            pc_case: pcData.pc_case,
            psu: pcData.psu,
            main_board: pcData.main_board,
            os: pcData.os,
            cpu_fan: pcData.cpu_fan,
          });

        if (detailsError) throw detailsError;

        // 更新座位的電腦資訊
        const { error: seatError } = await supabase
          .from('seat_coordinates')
          .update({ pc_id: pcId })
          .eq('id', selectedSeat.id);

        if (seatError) throw seatError;

        toast({
          title: "成功",
          description: "電腦新增成功",
        });
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving PC:', error);
      toast({
        title: "錯誤",
        description: "電腦資料保存失敗",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 處理照片上傳
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'case_photo' | 'monitor_a_photo' | 'monitor_b_photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 先創建預覽URL
    const previewUrl = URL.createObjectURL(file);
    setPcData(prev => ({
      ...prev,
      [`${field}_preview`]: previewUrl
    }));

    try {
      // 創建唯一檔名
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${field}_${timestamp}.${fileExt}`;
      
      console.log('Starting upload for:', fileName);
      
      // 上傳到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('pcs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);
      
      // 設置檔名到表單數據
      setPcData(prev => ({
        ...prev,
        [field]: fileName
      }));
      
      toast({
        title: "上傳成功",
        description: `${field === 'case_photo' ? '機殼' : field === 'monitor_a_photo' ? '主顯示器' : '副顯示器'}照片已成功上傳`,
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "上傳失敗",
        description: `照片上傳失敗: ${error.message || '請重試'}`,
        variant: "destructive",
      });
      
      // 清除預覽和檔名
      setPcData(prev => ({
        ...prev,
        [field]: '',
        [`${field}_preview`]: ''
      }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-2 border-yellow-400/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">💻</span>
            </div>
            {existingPc ? '編輯電腦設備' : '新增電腦設備'}
          </DialogTitle>
          {selectedSeat && !existingPc && (
            <p className="text-sm text-gray-500">
              為座位 {selectedSeat.container}-{selectedSeat.id} 新增電腦設備
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Horizontal layout: Photos left, Fields right */}
          <div className="flex gap-6">
            {/* Left: Photos */}
            <div className="flex-shrink-0 w-[336px] space-y-3">
              {/* Case Photo */}
              <div>
                <Label className="text-slate-300 text-xs">機殼照片</Label>
                <div className="w-[336px] h-[180px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden relative group">
                  {pcData.case_photo_preview ? (
                    <img src={pcData.case_photo_preview} alt="機殼照片" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-gray-400 text-3xl">📷</span></div>
                  )}
                  <label htmlFor="case-photo-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                    <span className="text-white text-sm">📤 更換照片</span>
                  </label>
                  <input id="case-photo-upload" type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'case_photo')} className="hidden" />
                </div>
              </div>
              {/* Monitor Photos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs">主顯示器照片</Label>
                  <div className="h-[100px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden relative group">
                    {pcData.monitor_a_photo_preview ? (
                      <img src={pcData.monitor_a_photo_preview} alt="主顯示器" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-gray-400 text-2xl">🖥️</span></div>
                    )}
                    <label htmlFor="monitor-a-photo-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                      <span className="text-white text-xs">📤 更換</span>
                    </label>
                    <input id="monitor-a-photo-upload" type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'monitor_a_photo')} className="hidden" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">副顯示器照片</Label>
                  <div className="h-[100px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden relative group">
                    {pcData.monitor_b_photo_preview ? (
                      <img src={pcData.monitor_b_photo_preview} alt="副顯示器" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-gray-400 text-2xl">🖥️</span></div>
                    )}
                    <label htmlFor="monitor-b-photo-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                      <span className="text-white text-xs">📤 更換</span>
                    </label>
                    <input id="monitor-b-photo-upload" type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'monitor_b_photo')} className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Fields in 3-column grid */}
            <div className="flex-1 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">電腦名稱 *</Label>
                  <Input value={pcData.name} onChange={(e) => setPcData({ ...pcData, name: e.target.value })} required placeholder="例：PC-001" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">處理器</Label>
                  <Input value={pcData.cpu} onChange={(e) => setPcData({ ...pcData, cpu: e.target.value })} placeholder="例：i5-12400" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">記憶體</Label>
                  <Input value={pcData.memory} onChange={(e) => setPcData({ ...pcData, memory: e.target.value })} placeholder="例：16GB DDR4" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">儲存空間</Label>
                  <Input value={pcData.storage} onChange={(e) => setPcData({ ...pcData, storage: e.target.value })} placeholder="例：512GB SSD" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">顯示卡</Label>
                  <Input value={pcData.graphics} onChange={(e) => setPcData({ ...pcData, graphics: e.target.value })} placeholder="例：RTX 3060" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">序號</Label>
                  <Input value={pcData.serial_number} onChange={(e) => setPcData({ ...pcData, serial_number: e.target.value })} placeholder="例：ABC123" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">品牌</Label>
                  <Input value={pcData.brand} onChange={(e) => setPcData({ ...pcData, brand: e.target.value })} placeholder="例：Dell" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">MAC 地址</Label>
                  <Input value={pcData.mac_add} onChange={(e) => setPcData({ ...pcData, mac_add: e.target.value })} placeholder="例：00:11:22:33:44:55" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">作業系統</Label>
                  <Input value={pcData.os} onChange={(e) => setPcData({ ...pcData, os: e.target.value })} placeholder="例：Win 11 Pro" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">主機板</Label>
                  <Input value={pcData.main_board} onChange={(e) => setPcData({ ...pcData, main_board: e.target.value })} placeholder="例：ASUS B550-F" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">電源供應器</Label>
                  <Input value={pcData.psu} onChange={(e) => setPcData({ ...pcData, psu: e.target.value })} placeholder="例：RM750x" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">CPU 散熱器</Label>
                  <Input value={pcData.cpu_fan} onChange={(e) => setPcData({ ...pcData, cpu_fan: e.target.value })} placeholder="例：NH-D15" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
              </div>
              {/* Row 5 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">機殼</Label>
                  <Input value={pcData.pc_case} onChange={(e) => setPcData({ ...pcData, pc_case: e.target.value })} placeholder="例：4000D" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">購買日期</Label>
                  <Input type="date" value={pcData.purchase_date} onChange={(e) => setPcData({ ...pcData, purchase_date: e.target.value })} className="h-9 bg-slate-700 border-slate-600 text-white text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">保固到期</Label>
                  <Input type="date" value={pcData.warranty_expiry} onChange={(e) => setPcData({ ...pcData, warranty_expiry: e.target.value })} className="h-9 bg-slate-700 border-slate-600 text-white text-sm" />
                </div>
              </div>
              {/* Row 6: Monitors */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">主顯示器型號</Label>
                  <Input value={pcData.monitor_a} onChange={(e) => setPcData({ ...pcData, monitor_a: e.target.value })} placeholder="例：Dell 27吋" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">副顯示器型號</Label>
                  <Input value={pcData.monitor_b} onChange={(e) => setPcData({ ...pcData, monitor_b: e.target.value })} placeholder="例：ASUS 24吋" className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* 備註 - Aligned with fields */}
          <div className="flex gap-6">
            <div className="w-[336px] flex-shrink-0"></div>
            <div className="flex-1 space-y-1">
              <Label className="text-slate-400 text-xs">備註</Label>
              <Textarea value={pcData.notes} onChange={(e) => setPcData({ ...pcData, notes: e.target.value })} placeholder="其他相關資訊..." rows={2} className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 text-sm" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-600">
            {existingPc && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                刪除電腦
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? '保存中...' : (existingPc ? '更新電腦' : '新增電腦')}
            </Button>
          </div>
        </form>
        
        <AdminPasswordConfirm
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeletePc}
          adminEmail={currentEmployee?.email || ''}
          title="確認刪除電腦"
          description="此操作將永久刪除電腦設備資料，請輸入管理員密碼確認。"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddPcModal;