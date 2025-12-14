import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Trash2, Edit, Save, Calendar, User, MapPin, Hash, Wifi, Phone, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminPasswordConfirm from "@/components/AdminPasswordConfirm";
import { getEquipmentPhotoUrl } from "@/lib/supabase-storage";

// ... [Interfaces remain the same] ...

interface Equipment {
  id?: string;
  product: string;
  supplier?: string;
  ip?: string;
  sn?: string;
  contact_person?: string;
  mac_adds?: string;
  purchase_date?: string;
  photo?: string;
  notes?: string;
}

interface Employee {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  onSave: (equipment: Equipment) => void;
  currentEmployee: Employee | null;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSave,
  currentEmployee,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  const [formData, setFormData] = useState<Equipment>({
    product: "",
    supplier: "",
    ip: "",
    sn: "",
    contact_person: "",
    mac_adds: "",
    purchase_date: "",
    photo: "",
    notes: "",
  });

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
      setExistingPhoto(equipment.photo || null);
    } else {
      setFormData({
        product: "",
        supplier: "",
        ip: "",
        sn: "",
        contact_person: "",
        mac_adds: "",
        purchase_date: "",
        photo: "",
        notes: "",
      });
      setExistingPhoto(null);
    }
    setSelectedFiles([]);
  }, [equipment, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('equipment')
        .upload(fileName, file);
      
      if (error) {
        throw new Error(`上傳 ${file.name} 失敗: ${error.message}`);
      }
      
      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product.trim()) {
      toast({
        title: "錯誤",
        description: "產品名稱為必填項目",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let photoPath = existingPhoto;

      if (selectedFiles.length > 0) {
        const uploadedPaths = await uploadFiles(selectedFiles);
        photoPath = uploadedPaths[0];
      }

      const equipmentData = {
        ...formData,
        photo: photoPath,
      };

      if (equipment?.id) {
        // Update existing equipment
        const { error } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', equipment.id);

        if (error) throw error;

        toast({
          title: "成功",
          description: "設備資訊已更新",
        });
      } else {
        // Create new equipment
        const { data, error } = await supabase
          .from('equipment')
          .insert(equipmentData)
          .select()
          .single();

        if (error) throw error;
        equipmentData.id = data.id;

        toast({
          title: "成功",
          description: "設備已新增",
        });
      }

      onSave(equipmentData as Equipment);
      onClose();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "錯誤",
        description: error instanceof Error ? error.message : "操作失敗",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setIsPasswordConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipment?.id) return;

    setIsDeleting(true);
    setIsPasswordConfirmOpen(false);

    try {
      // Delete equipment record
      const { error: deleteError } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipment.id);

      if (deleteError) throw deleteError;

      // Update seat_coordinates to remove equipment reference
      const { error: updateError } = await supabase
        .from('seat_coordinates')
        .update({ equipment_id: null })
        .eq('equipment_id', equipment.id);

      if (updateError) {
        console.error('Error updating seat coordinates:', updateError);
      }

      toast({
        title: "成功",
        description: "設備已刪除",
      });

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "錯誤",
        description: error instanceof Error ? error.message : "刪除失敗",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getImageUrl = (photo: string | undefined) => {
    return getEquipmentPhotoUrl(photo);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {/* V E R T I C A L   S T R U C T U R E */}
        {/* 變動點 1: 調整最大寬度為 max-w-5xl，以容納三欄佈局。 */}
        <div className="bg-background rounded-lg shadow-xl w-full **max-w-5xl** max-h-[90vh] overflow-y-auto"> // <---【紅色變動點】
          <Card className="border-0 shadow-none">
            {/* 變動點 2: 調整 CardHeader 垂直內邊距，使其更緊湊。 */}
            <CardHeader className="bg-primary text-primary-foreground **py-3**"> // <---【紅色變動點】
              {/* 變動點 3: 調整標題字體大小。 */}
              <CardTitle className="**text-lg** font-bold flex items-center gap-2"> // <---【紅色變動點】
                {equipment ? <Edit className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                {equipment ? "編輯設備" : "新增設備"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 **space-y-4**"> // <---【紅色變動點：調整內容區塊間距】
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* H O R I Z O N T A L   S T R U C T U R E */}
                {/* 變動點 4: 新增 Flex 容器，將照片區和欄位區左右並排。 */}
                <div className="**flex gap-6**"> // <---【紅色變動點：新的 Flex 容器】
                  
                  {/* Equipment Photo - Left Side (固定寬度區塊) */}
                  {/* 變動點 5: 設定左側照片區塊的固定寬度 (w-[336px]) 且不收縮 (flex-shrink-0)。 */}
                  <div className="**flex-shrink-0 space-y-3**"> // <---【紅色變動點：設定寬度和不收縮】
                    <Label className="text-sm font-medium">設備照片</Label>
                    <div className="space-y-3">
                      {(existingPhoto || selectedFiles.length > 0) && (
                        {/* 變動點 6: 圖片居中改為靠左對齊。 */}
                        <div className="**flex justify-start**"> // <---【紅色變動點：對齊方式變更】
                          <img
                            src={selectedFiles.length > 0 
                              ? URL.createObjectURL(selectedFiles[0])
                              : getImageUrl(existingPhoto) || undefined
                            }
                            alt="設備照片"
                            {/* 變動點 7: 設定圖片的固定尺寸 (w-[336px] h-[240px])。 */}
                            className="**w-[336px] h-[240px]** object-cover rounded-lg border-2 border-border" // <---【紅色變動點：尺寸變更】
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {existingPhoto || selectedFiles.length > 0 ? "更換照片" : "上傳照片"}
                        </Button>
                        {(existingPhoto || selectedFiles.length > 0) && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedFiles([]);
                              setExistingPhoto(null);
                            }}
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            移除照片
                          </Button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Equipment Details - Right Side (彈性佔滿空間區塊) */}
                  {/* 變動點 8: 設定右側欄位區塊佔滿剩餘空間 (flex-1)，並調整內部垂直間距。 */}
                  <div className="**flex-1 space-y-6**"> // <---【紅色變動點：Flex 屬性與間距調整】
                    
                    {/* 變動點 9: 欄位佈局改為三欄 (sm:grid-cols-3)，取代原來的 md:grid-cols-2。 */}
                    <div className="**grid grid-cols-1 sm:grid-cols-3 gap-4**"> // <---【紅色變動點：網格佈局變更】
                      <div className="space-y-2">
                        <Label htmlFor="product" className="flex items-center gap-2">
                          產品名稱 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="product"
                          name="product"
                          value={formData.product}
                          onChange={handleInputChange}
                          placeholder="輸入產品名稱"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          供應商
                        </Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          placeholder="輸入供應商"
                        />
                      </div>
                      
                      {/* 變動點 10: 聯絡人欄位從原來的下一行移到第一行，以適應三欄佈局。 */}
                      <div className="space-y-2">
                        <Label htmlFor="contact_person" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          聯絡人
                        </Label>
                        <Input
                          id="contact_person"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          placeholder="輸入聯絡人"
                        />
                      </div>

                      {/* 新的一行：IP, MAC, SN */}
                      <div className="space-y-2">
                        <Label htmlFor="ip" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          IP 位址
                        </Label>
                        <Input
                          id="ip"
                          name="ip"
                          value={formData.ip}
                          onChange={handleInputChange}
                          placeholder="輸入 IP 位址"
                        />
                      </div>

                      {/* 變動點 11: MAC 位址欄位從原來的下一行移到此行，與 IP/SN 並排。 */}
                      <div className="space-y-2">
                        <Label htmlFor="mac_adds" className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          MAC 位址
                        </Label>
                        <Input
                          id="mac_adds"
                          name="mac_adds"
                          value={formData.mac_adds}
                          onChange={handleInputChange}
                          placeholder="輸入 MAC 位址"
                        />
                      </div>
                      
                      {/* 變動點 12: 序號欄位從原來的下一行移到此行，與 IP/MAC 並排。 */}
                      <div className="space-y-2">
                        <Label htmlFor="sn" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          序號
                        </Label>
                        <Input
                          id="sn"
                          name="sn"
                          value={formData.sn}
                          onChange={handleInputChange}
                          placeholder="輸入序號"
                        />
                      </div>
                      
                      {/* 變動點 13: 購買日期單獨一行，不再需要跨兩欄，且不再需要 md:col-span-2 類別。 */}
                      <div className="space-y-2">
                        <Label htmlFor="purchase_date" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          購買日期
                        </Label>
                        <Input
                          id="purchase_date"
                          name="purchase_date"
                          type="date"
                          value={formData.purchase_date}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 備註欄位：獨立區塊，與右側欄位對齊 */}
                {/* 變動點 14: 新增 Flex 容器，並使用一個空 div 佔位以與上方照片對齊。 */}
                <div className="**flex gap-6**"> // <---【紅色變動點：新的 Flex 容器】
                    {/* 變動點 15: 佔位符 div，寬度和不收縮屬性必須與左側照片區塊一致。 */}
                    <div className="**w-[336px] flex-shrink-0**"></div> // <---【紅色變動點：佔位符】
                    
                    {/* 變動點 16: 備註區塊佔滿剩餘空間。 */}
                    <div className="**flex-1 space-y-2**"> // <---【紅色變動點：Flex 屬性】
                      <Label htmlFor="notes" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        備註
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="輸入備註"
                        className="min-h-[100px]"
                      />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <div>
                    {equipment && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isSubmitting || isDeleting}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "刪除中..." : "刪除設備"}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.product.trim()}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "儲存中..." : equipment ? "更新設備" : "新增設備"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Confirmation Dialog */}
      {currentEmployee && (
        <AdminPasswordConfirm
          isOpen={isPasswordConfirmOpen}
          onClose={() => setIsPasswordConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          adminEmail={currentEmployee.email}
          title="確認刪除設備"
          description={`您即將刪除設備 "${equipment?.product}"，此操作無法復原。請輸入管理員密碼以確認。`}
        />
      )}
    </>
  );
};

export default EquipmentModal;
