import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Monitor, HardDrive } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getPcPhotoUrl } from "@/lib/supabase-storage";
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
}

export default function PcDataDisplay({ pcData }: PcDataDisplayProps) {
  
  const getImageUrl = (imageName?: string) => {
    return getPcPhotoUrl(imageName);
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
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-5xl max-h-[90vh] overflow-y-auto border-2 border-yellow-400/40">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">👁️</span>
              </div>
              {pcData.name} - 詳細規格（僅檢視）
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Horizontal layout: Photos left, Fields right */}
            <div className="flex gap-6">
              {/* Left: Photos */}
              <div className="flex-shrink-0 w-[336px] space-y-3">
                {/* Case Photo */}
                <div>
                  <Label className="text-slate-300 text-xs">機殼照片</Label>
                  <div className="w-[336px] h-[180px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                    {pcData.case_photo ? (
                      <img src={getImageUrl(pcData.case_photo) ?? ''} alt="機殼照片" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><HardDrive className="w-10 h-10 text-slate-500" /></div>
                    )}
                  </div>
                </div>
                {/* Monitor Photos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs">主顯示器</Label>
                    <div className="h-[100px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                      {pcData.monitor_a_photo ? (
                        <img src={getImageUrl(pcData.monitor_a_photo) ?? ''} alt="主顯示器" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Monitor className="w-8 h-8 text-slate-500" /></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">副顯示器</Label>
                    <div className="h-[100px] bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                      {pcData.monitor_b_photo ? (
                        <img src={getImageUrl(pcData.monitor_b_photo) ?? ''} alt="副顯示器" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Monitor className="w-8 h-8 text-slate-500" /></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Fields in 3-column grid */}
              <div className="flex-1 space-y-3">
                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">電腦名稱</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm font-medium text-white">{pcData.name || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">處理器</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.cpu || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">記憶體</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.memory || '-'}</p></div>
                  </div>
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">儲存空間</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.storage || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">顯示卡</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.graphics || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">序號</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm font-mono text-white">{serialNumber || '-'}</p></div>
                  </div>
                </div>
                {/* Row 3 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">品牌</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.brand || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">MAC 地址</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm font-mono text-white">{details?.mac_add || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">作業系統</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.os || '-'}</p></div>
                  </div>
                </div>
                {/* Row 4 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">主機板</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.main_board || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">電源供應器</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.psu || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">CPU 散熱器</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.cpu_fan || '-'}</p></div>
                  </div>
                </div>
                {/* Row 5 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">機殼</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.pc_case || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">購買日期</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.purchase_date || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">保固到期</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{details?.warranty_expiry || '-'}</p></div>
                  </div>
                </div>
                {/* Row 6: Monitors */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">主顯示器型號</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.monitor_a || '-'}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">副顯示器型號</Label>
                    <div className="p-2 bg-slate-700/50 rounded-md"><p className="text-sm text-white">{pcData.monitor_b || '-'}</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 備註 - Aligned with fields */}
            <div className="flex gap-6">
              <div className="w-[336px] flex-shrink-0"></div>
              <div className="flex-1 space-y-1">
                <Label className="text-slate-400 text-xs">備註</Label>
                <div className="p-2 bg-slate-700/50 rounded-md min-h-[40px]">
                  <p className="text-sm whitespace-pre-wrap text-white">{details?.notes || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-600">
              <DialogClose asChild>
                <Button variant="outline" size="sm">關閉</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}