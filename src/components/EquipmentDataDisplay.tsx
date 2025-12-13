import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Hash, Wifi, Phone, FileText, Edit } from "lucide-react";
import { getEquipmentPhotoUrl } from "@/lib/supabase-storage";

interface Equipment {
  id: string;
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

interface EquipmentDataDisplayProps {
  equipment: Equipment;
  onClose: () => void;
  onEdit?: () => void;
  isAdmin?: boolean;
}

const EquipmentDataDisplay: React.FC<EquipmentDataDisplayProps> = ({
  equipment,
  onClose,
  onEdit,
  isAdmin = false,
}) => {
  const getImageUrl = (photo: string | undefined) => {
    return getEquipmentPhotoUrl(photo);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl">
        <Card className="border-0 shadow-none">
          <CardHeader className="bg-primary text-primary-foreground py-3">
            <CardTitle className="text-lg font-bold">設備詳細資訊</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-6">
              {/* Equipment Photo - Left Side */}
              <div className="flex-shrink-0">
                {equipment.photo ? (
                  <img
                    src={getImageUrl(equipment.photo)}
                    alt={equipment.product}
                    className="w-[336px] h-[240px] object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-[336px] h-[240px] bg-muted rounded-lg border border-border flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">無圖片</span>
                  </div>
                )}
              </div>

              {/* Equipment Details - Right Side */}
              <div className="flex-1 space-y-3">
                {/* Row 1: 產品名稱, 供應商, 聯絡人 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">產品名稱</label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="font-medium text-sm">{equipment.product}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      供應商
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm">{equipment.supplier || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      聯絡人
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm">{equipment.contact_person || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Row 2: IP位址, MAC位址, 序號 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      IP 位址
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm font-mono">{equipment.ip || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      MAC 位址
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm font-mono">{equipment.mac_adds || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      序號
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm font-mono">{equipment.sn || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Row 3: 購買日期 */}
                <div className="w-1/3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      購買日期
                    </label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-sm">
                        {equipment.purchase_date 
                          ? new Date(equipment.purchase_date).toLocaleDateString('zh-TW') 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 備註 - Aligned with fields */}
            <div className="flex gap-6">
              <div className="w-[336px] flex-shrink-0"></div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  備註
                </label>
                <div className="p-2 bg-muted rounded-md min-h-[40px]">
                  <p className="text-sm whitespace-pre-wrap">{equipment.notes || '-'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-2 border-t">
              {isAdmin && onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm" className="mr-2 flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  編輯設備
                </Button>
              )}
              <Button onClick={onClose} variant="outline" size="sm">
                關閉
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentDataDisplay;