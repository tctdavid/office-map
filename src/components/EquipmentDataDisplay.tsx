import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Hash, Wifi, Phone, FileText, Edit } from "lucide-react";

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
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/equipment/${photo}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-xl font-bold">設備詳細資訊</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Equipment Photo */}
            {equipment.photo && (
              <div className="flex justify-center">
                <img
                  src={getImageUrl(equipment.photo)}
                  alt={equipment.product}
                  className="max-w-full h-auto max-h-64 object-cover rounded-lg border-2 border-border"
                />
              </div>
            )}

            {/* Equipment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">產品名稱</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{equipment.product}</p>
                </div>
              </div>

              {equipment.supplier && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    供應商
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{equipment.supplier}</p>
                  </div>
                </div>
              )}

              {equipment.ip && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    IP 位址
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant="secondary">{equipment.ip}</Badge>
                  </div>
                </div>
              )}

              {equipment.sn && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    序號
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm">{equipment.sn}</p>
                  </div>
                </div>
              )}

              {equipment.contact_person && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    聯絡人
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{equipment.contact_person}</p>
                  </div>
                </div>
              )}

              {equipment.mac_adds && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    MAC 位址
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm">{equipment.mac_adds}</p>
                  </div>
                </div>
              )}

              {equipment.purchase_date && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    購買日期
                  </label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{new Date(equipment.purchase_date).toLocaleDateString('zh-TW')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {equipment.notes && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  備註
                </label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{equipment.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {isAdmin && onEdit && (
                  <Button onClick={onEdit} variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    編輯設備
                  </Button>
                )}
              </div>
              <Button onClick={onClose} variant="outline">
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