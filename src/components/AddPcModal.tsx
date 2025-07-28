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
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  warranty_expiry: string;
  notes: string;
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
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    notes: ''
  });

  // 重置表單數據
  const resetForm = () => {
    setPcData({
      name: '',
      cpu: '',
      memory: '',
      storage: '',
      graphics: '',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      notes: ''
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
            model: details.model || '',
            serial_number: details.serial_number || '',
            purchase_date: details.purchase_date || '',
            warranty_expiry: details.warranty_expiry || '',
            notes: details.notes || ''
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
              model: pcData.model,
              serial_number: pcData.serial_number,
              purchase_date: pcData.purchase_date || null,
              warranty_expiry: pcData.warranty_expiry || null,
              notes: pcData.notes,
            })
            .eq('pc_id', existingPc.id);

          if (detailsError) throw detailsError;
        } else {
          const { error: detailsError } = await supabase
            .from('pc_details')
            .insert({
              pc_id: existingPc.id,
              brand: pcData.brand,
              model: pcData.model,
              serial_number: pcData.serial_number,
              purchase_date: pcData.purchase_date || null,
              warranty_expiry: pcData.warranty_expiry || null,
              notes: pcData.notes,
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
            model: pcData.model,
            serial_number: pcData.serial_number,
            purchase_date: pcData.purchase_date || null,
            warranty_expiry: pcData.warranty_expiry || null,
            notes: pcData.notes,
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
                <Label htmlFor="model" className="text-white">型號</Label>
                <Input
                  id="model"
                  placeholder="例：OptiPlex 7090"
                  value={pcData.model}
                  onChange={(e) => setPcData({ ...pcData, model: e.target.value })}
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
              
              <div className="col-span-2">
                <Label htmlFor="warranty_expiry" className="text-white">保固到期</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={pcData.warranty_expiry}
                  onChange={(e) => setPcData({ ...pcData, warranty_expiry: e.target.value })}
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