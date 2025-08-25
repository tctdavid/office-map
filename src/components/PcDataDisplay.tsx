import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Monitor, HardDrive } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
interface PcDataDisplayProps {
  pcData: {
    id: string;
    name: string;
    cpu?: string;
    memory?: string;
    storage?: string;
    graphics?: string;
    case_photo?: string;
    monitor_a?: string;
    monitor_a_photo?: string;
    monitor_b?: string;
    monitor_b_photo?: string;
  };
  isAdmin?: boolean;
  onDelete?: () => void;
}

export default function PcDataDisplay({ pcData, isAdmin = false, onDelete }: PcDataDisplayProps) {
  const getImageUrl = (imageName?: string) => {
    if (!imageName) return null;
    if (imageName.startsWith('http')) return imageName;
    return `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/pcs/${imageName}`;
  };

  const [serialNumber, setSerialNumber] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('pc_details')
        .select('*')
        .eq('pc_id', pcData.id)
        .maybeSingle();
      if (!error && isMounted) {
        setSerialNumber(data?.serial_number ?? null);
        setDetails(data ?? null);
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [pcData.id]);

  return (
    <>
      {/* Three images in a row */}
      <TooltipProvider>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Case Photo */}
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-16 bg-slate-700 rounded-lg border border-slate-500 overflow-hidden mb-1">
                  {pcData.case_photo ? (
                    <img
                      src={getImageUrl(pcData.case_photo)}
                      alt="主機"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-slate-600 flex items-center justify-center"><span class="text-white text-2xl">💻</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                      <HardDrive className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {pcData.name || '主機'}
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-slate-300">主機</span>
          </div>

          {/* Monitor A Photo */}
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-16 bg-slate-700 rounded-lg border border-slate-500 overflow-hidden mb-1">
                  {pcData.monitor_a_photo ? (
                    <img
                      src={getImageUrl(pcData.monitor_a_photo)}
                      alt="螢幕A"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-slate-600 flex items-center justify-center"><span class="text-white text-2xl">🖥️</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {pcData.monitor_a || '螢幕A'}
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-slate-300">螢幕A</span>
          </div>

          {/* Monitor B Photo */}
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-16 bg-slate-700 rounded-lg border border-slate-500 overflow-hidden mb-1">
                  {pcData.monitor_b_photo ? (
                    <img
                      src={getImageUrl(pcData.monitor_b_photo)}
                      alt="螢幕B"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class=\"w-full h-full bg-slate-600 flex items-center justify-center\"><span class=\"text-white text-2xl\">🖥️</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {pcData.monitor_b || '螢幕B'}
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-slate-300">螢幕B</span>
          </div>
        </div>
      </TooltipProvider>

      {/* Quick specs */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5"><span className="text-slate-400">序號</span><span className="text-white font-medium">{serialNumber || '未設定'}</span></div>
        <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5"><span className="text-slate-400">處理器</span><span className="text-white font-medium">{pcData.cpu || '未設定'}</span></div>
        <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5"><span className="text-slate-400">記憶體</span><span className="text-white font-medium">{pcData.memory || '未設定'}</span></div>
        <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5"><span className="text-slate-400">顯示卡</span><span className="text-white font-medium">{pcData.graphics || '未設定'}</span></div>
        <div className="col-span-2 flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5"><span className="text-slate-400">儲存空間</span><span className="text-white font-medium">{pcData.storage || '未設定'}</span></div>
      </div>

      {/* Details button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
          >
            查看詳細規格
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{pcData.name} - 詳細規格（僅檢視）</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本規格 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">💻 基本規格</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">電腦名稱</Label>
                  <Input id="name" value={pcData.name} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="cpu" className="text-white">處理器</Label>
                  <Input id="cpu" value={pcData.cpu || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="memory" className="text-white">記憶體</Label>
                  <Input id="memory" value={pcData.memory || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="storage" className="text-white">儲存空間</Label>
                  <Input id="storage" value={pcData.storage || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>

              <div>
                <Label htmlFor="graphics" className="text-white">顯示卡</Label>
                <Input id="graphics" value={pcData.graphics || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
              </div>

              {/* 照片預覽 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">機殼照片</Label>
                  <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                    {pcData.case_photo ? (
                      <img src={getImageUrl(pcData.case_photo) ?? ''} alt="機殼照片" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">📷</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-white">主顯示器照片</Label>
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                    {pcData.monitor_a_photo ? (
                      <img src={getImageUrl(pcData.monitor_a_photo) ?? ''} alt="主顯示器照片" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">🖥️</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-white">副顯示器照片</Label>
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
                    {pcData.monitor_b_photo ? (
                      <img src={getImageUrl(pcData.monitor_b_photo) ?? ''} alt="副顯示器照片" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">🖥️</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monitor_a" className="text-white">主顯示器</Label>
                  <Input id="monitor_a" value={pcData.monitor_a || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="monitor_b" className="text-white">副顯示器</Label>
                  <Input id="monitor_b" value={pcData.monitor_b || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
            </div>

            {/* 詳細資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">📋 詳細資訊</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand" className="text-white">品牌</Label>
                  <Input id="brand" value={details?.brand || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="mac_add" className="text-white">MAC地址</Label>
                  <Input id="mac_add" value={details?.mac_add || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="serial_number" className="text-white">序號</Label>
                  <Input id="serial_number" value={serialNumber || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="purchase_date" className="text-white">購買日期</Label>
                  <Input id="purchase_date" value={details?.purchase_date || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="warranty_expiry" className="text-white">保固到期</Label>
                  <Input id="warranty_expiry" value={details?.warranty_expiry || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="case" className="text-white">機殼</Label>
                  <Input id="case" value={details?.case || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="psu" className="text-white">電源供應器</Label>
                  <Input id="psu" value={details?.psu || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="main_board" className="text-white">主機板</Label>
                  <Input id="main_board" value={details?.main_board || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="os" className="text-white">作業系統</Label>
                  <Input id="os" value={details?.os || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="cpu_fan" className="text-white">CPU散熱器</Label>
                  <Input id="cpu_fan" value={details?.cpu_fan || ''} disabled className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
            </div>

            {/* 備註 */}
            <div>
              <Label htmlFor="notes" className="text-white">備註</Label>
              <Textarea id="notes" value={details?.notes || ''} disabled rows={3} className="bg-slate-700 border-slate-600 text-white" />
            </div>

            <DialogFooter className="gap-2">
              {isAdmin ? (
                <>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // 這裡可以添加編輯功能，暫時使用 toast 提示
                      console.log('Update PC clicked');
                    }}
                  >
                    更新電腦
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => onDelete?.()}
                  >
                    刪除電腦
                  </Button>
                </>
              ) : (
                <DialogClose asChild>
                  <Button variant="outline">關閉</Button>
                </DialogClose>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}