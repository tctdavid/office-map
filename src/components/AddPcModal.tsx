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
  case: string;
  psu: string;
  main_board: string;
  os: string;
  cpu_fan: string;
}

const AddPcModal = ({ isOpen, onClose, selectedSeat, existingPc, onSuccess }: AddPcModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
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
    case: '',
    psu: '',
    main_board: '',
    os: '',
    cpu_fan: ''
  });

  // 重置表單數據
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
      case: '',
      psu: '',
      main_board: '',
      os: '',
      cpu_fan: ''
    });
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
      }));

      // 載入 PC 詳細資料
      const fetchPcDetails = async () => {
        const { data: details } = await supabase
          .from('pc_details')
          .select('*')
          .eq('pc_id', existingPc.id)
          .single();

        if (details) {
          setPcData(prev => ({
            ...prev,
            brand: details.brand || '',
            mac_add: details.mac_add || '',
            serial_number: details.serial_number || '',
            purchase_date: details.purchase_date || '',
            warranty_expiry: details.warranty_expiry || '',
            notes: details.notes || '',
            case: details.case || '',
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

    setLoading(true);

    try {
      let pcId = existingPc?.id;

      if (existingPc) {
        // 更新現有電腦
        const { error: pcError } = await supabase
          .from('pcs')
          .update({
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
              case: pcData.case,
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
              case: pcData.case,
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
            case: pcData.case,
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

    try {
      // 創建唯一檔名
      const fileExt = file.name.split('.').pop();
      const fileName = `${field}_${Date.now()}.${fileExt}`;
      
      // 上傳到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('pcs')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // 創建預覽URL
      const previewUrl = URL.createObjectURL(file);
      
      setPcData(prev => ({
        ...prev,
        [field]: fileName,
        [`${field}_preview`]: previewUrl
      }));
      
      toast({
        title: "上傳成功",
        description: `${field === 'case_photo' ? '機殼' : field === 'monitor_a_photo' ? '主顯示器' : '副顯示器'}照片已成功上傳`,
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "上傳失敗",
        description: "照片上傳失敗，請重試",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本規格 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              💻 基本規格
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">電腦名稱 *</Label>
                <Input
                  id="name"
                  placeholder="例：辦公室PC-001"
                  value={pcData.name}
                  onChange={(e) => setPcData({ ...pcData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="cpu" className="text-white">處理器</Label>
                <Input
                  id="cpu"
                  placeholder="例：Intel Core i5-12400"
                  value={pcData.cpu}
                  onChange={(e) => setPcData({ ...pcData, cpu: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="memory" className="text-white">記憶體</Label>
                <Input
                  id="memory"
                  placeholder="例：16GB DDR4"
                  value={pcData.memory}
                  onChange={(e) => setPcData({ ...pcData, memory: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="storage" className="text-white">儲存空間</Label>
                <Input
                  id="storage"
                  placeholder="例：512GB SSD"
                  value={pcData.storage}
                  onChange={(e) => setPcData({ ...pcData, storage: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="graphics" className="text-white">顯示卡</Label>
              <Input
                id="graphics"
                placeholder="例：NVIDIA GeForce RTX 3060"
                value={pcData.graphics}
                onChange={(e) => setPcData({ ...pcData, graphics: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            
            {/* 機殼照片上傳 */}
            <div>
              <Label className="text-white">機殼照片</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                  {pcData.case_photo_preview ? (
                    <img 
                      src={pcData.case_photo_preview} 
                      alt="機殼照片預覽" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">📷</span>
                  )}
                </div>
                <label htmlFor="case-photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-3 hover:border-slate-500 transition-colors">
                    <span className="text-sm text-gray-300">📤 選擇機殼照片</span>
                  </div>
                  <input
                    id="case-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'case_photo')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monitor_a" className="text-white">主顯示器</Label>
                <Input
                  id="monitor_a"
                  placeholder="例：Dell 27 inch 4K Monitor"
                  value={pcData.monitor_a}
                  onChange={(e) => setPcData({ ...pcData, monitor_a: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="monitor_b" className="text-white">副顯示器</Label>
                <Input
                  id="monitor_b"
                  placeholder="例：ASUS 24 inch Monitor"
                  value={pcData.monitor_b}
                  onChange={(e) => setPcData({ ...pcData, monitor_b: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 顯示器照片上傳 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">主顯示器照片</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                    {pcData.monitor_a_photo_preview ? (
                      <img 
                        src={pcData.monitor_a_photo_preview} 
                        alt="主顯示器照片預覽" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">🖥️</span>
                    )}
                  </div>
                  <label htmlFor="monitor-a-photo-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-2 hover:border-slate-500 transition-colors">
                      <span className="text-xs text-gray-300">📤 選擇照片</span>
                    </div>
                    <input
                      id="monitor-a-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'monitor_a_photo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <Label className="text-white">副顯示器照片</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                    {pcData.monitor_b_photo_preview ? (
                      <img 
                        src={pcData.monitor_b_photo_preview} 
                        alt="副顯示器照片預覽" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">🖥️</span>
                    )}
                  </div>
                  <label htmlFor="monitor-b-photo-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-2 hover:border-slate-500 transition-colors">
                      <span className="text-xs text-gray-300">📤 選擇照片</span>
                    </div>
                    <input
                      id="monitor-b-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'monitor_b_photo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 詳細資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">📋 詳細資訊</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand" className="text-white">品牌</Label>
                <Input
                  id="brand"
                  placeholder="例：Dell"
                  value={pcData.brand}
                  onChange={(e) => setPcData({ ...pcData, brand: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="mac_add" className="text-white">MAC地址</Label>
                <Input
                  id="mac_add"
                  placeholder="例：00:11:22:33:44:55"
                  value={pcData.mac_add}
                  onChange={(e) => setPcData({ ...pcData, mac_add: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="serial_number" className="text-white">序號</Label>
                <Input
                  id="serial_number"
                  placeholder="例：ABC123456789"
                  value={pcData.serial_number}
                  onChange={(e) => setPcData({ ...pcData, serial_number: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="purchase_date" className="text-white">購買日期</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={pcData.purchase_date}
                  onChange={(e) => setPcData({ ...pcData, purchase_date: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="warranty_expiry" className="text-white">保固到期</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={pcData.warranty_expiry}
                  onChange={(e) => setPcData({ ...pcData, warranty_expiry: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="case" className="text-white">機殼</Label>
                <Input
                  id="case"
                  placeholder="例：Corsair 4000D"
                  value={pcData.case}
                  onChange={(e) => setPcData({ ...pcData, case: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="psu" className="text-white">電源供應器</Label>
                <Input
                  id="psu"
                  placeholder="例：Corsair RM750x 750W"
                  value={pcData.psu}
                  onChange={(e) => setPcData({ ...pcData, psu: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="main_board" className="text-white">主機板</Label>
                <Input
                  id="main_board"
                  placeholder="例：ASUS ROG STRIX B550-F"
                  value={pcData.main_board}
                  onChange={(e) => setPcData({ ...pcData, main_board: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="os" className="text-white">作業系統</Label>
                <Input
                  id="os"
                  placeholder="例：Windows 11 Pro"
                  value={pcData.os}
                  onChange={(e) => setPcData({ ...pcData, os: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="cpu_fan" className="text-white">CPU散熱器</Label>
                <Input
                  id="cpu_fan"
                  placeholder="例：Noctua NH-D15"
                  value={pcData.cpu_fan}
                  onChange={(e) => setPcData({ ...pcData, cpu_fan: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 備註 */}
          <div>
            <Label htmlFor="notes" className="text-white">備註</Label>
            <Textarea
              id="notes"
              placeholder="其他相關資訊..."
              value={pcData.notes}
              onChange={(e) => setPcData({ ...pcData, notes: e.target.value })}
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : (existingPc ? '更新電腦' : '新增電腦')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPcModal;