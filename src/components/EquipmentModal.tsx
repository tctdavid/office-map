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
        <div className="bg-background rounded-xl shadow-xl w-full max-w-5xl border-2 border-yellow-400/40 overflow-hidden">
          <Card className="border-0 shadow-none">
            <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-xl">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {equipment ? <Edit className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                {equipment ? "編輯設備" : "新增設備"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-6">
                  {/* Equipment Photo - Left Side */}
                  <div className="flex-shrink-0 space-y-3">
                    {(existingPhoto || selectedFiles.length > 0) ? (
                      <img
                        src={selectedFiles.length > 0 
                          ? URL.createObjectURL(selectedFiles[0])
                          : getImageUrl(existingPhoto) || undefined
                        }
                        alt="設備照片"
                        className="w-[336px] h-[240px] object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-[336px] h-[240px] bg-muted rounded-lg border border-border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">無圖片</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        {existingPhoto || selectedFiles.length > 0 ? "更換照片" : "上傳照片"}
                      </Button>
                      {(existingPhoto || selectedFiles.length > 0) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFiles([]);
                            setExistingPhoto(null);
                          }}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
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

                  {/* Equipment Details - Right Side */}
                  <div className="flex-1 space-y-3">
                    {/* Row 1: 產品名稱, 供應商, 聯絡人 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="product" className="text-sm font-medium text-muted-foreground">
                          產品名稱 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="product"
                          name="product"
                          value={formData.product}
                          onChange={handleInputChange}
                          placeholder="輸入產品名稱"
                          required
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="supplier" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          供應商
                        </Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          placeholder="輸入供應商"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="contact_person" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          聯絡人
                        </Label>
                        <Input
                          id="contact_person"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          placeholder="輸入聯絡人"
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Row 2: IP位址, MAC位址, 序號 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="ip" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          IP 位址
                        </Label>
                        <Input
                          id="ip"
                          name="ip"
                          value={formData.ip}
                          onChange={handleInputChange}
                          placeholder="輸入 IP 位址"
                          className="h-9 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mac_adds" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          MAC 位址
                        </Label>
                        <Input
                          id="mac_adds"
                          name="mac_adds"
                          value={formData.mac_adds}
                          onChange={handleInputChange}
                          placeholder="輸入 MAC 位址"
                          className="h-9 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sn" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          序號
                        </Label>
                        <Input
                          id="sn"
                          name="sn"
                          value={formData.sn}
                          onChange={handleInputChange}
                          placeholder="輸入序號"
                          className="h-9 font-mono"
                        />
                      </div>
                    </div>

                    {/* Row 3: 購買日期 */}
                    <div className="w-1/3">
                      <div className="space-y-1">
                        <Label htmlFor="purchase_date" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          購買日期
                        </Label>
                        <Input
                          id="purchase_date"
                          name="purchase_date"
                          type="date"
                          value={formData.purchase_date}
                          onChange={handleInputChange}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 備註 - Aligned with fields */}
                <div className="flex gap-6">
                  <div className="w-[336px] flex-shrink-0"></div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      備註
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="輸入備註"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-2 border-t">
                  <div>
                    {equipment && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isSubmitting || isDeleting}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        {isDeleting ? "刪除中..." : "刪除設備"}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || !formData.product.trim()}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" />
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