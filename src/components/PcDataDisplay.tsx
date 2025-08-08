import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Monitor, HardDrive } from "lucide-react";
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
}

export default function PcDataDisplay({ pcData }: PcDataDisplayProps) {
  const getImageUrl = (imageName?: string) => {
    if (!imageName) return null;
    if (imageName.startsWith('http')) return imageName;
    return `https://ivhyhwjmseubvwqbvajb.supabase.co/storage/v1/object/public/pcs/${imageName}`;
  };

  const [serialNumber, setSerialNumber] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSerial = async () => {
      const { data, error } = await supabase
        .from('pc_details')
        .select('serial_number')
        .eq('pc_id', pcData.id)
        .maybeSingle();
      if (!error && isMounted) {
        setSerialNumber(data?.serial_number ?? null);
      }
    };
    fetchSerial();
    return () => {
      isMounted = false;
    };
  }, [pcData.id]);

  return (
    <>
      {/* Three images in a row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Case Photo */}
        <div className="text-center">
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
          <span className="text-xs text-slate-300">主機</span>
        </div>

        {/* Monitor A Photo */}
        <div className="text-center">
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
          <span className="text-xs text-slate-300">螢幕A</span>
        </div>

        {/* Monitor B Photo */}
        <div className="text-center">
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
          <span className="text-xs text-slate-300">螢幕B</span>
        </div>
      </div>

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
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{pcData.name} - 詳細規格</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-slate-400">處理器:</span>
                <p className="text-white">{pcData.cpu || '未設定'}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">記憶體:</span>
                <p className="text-white">{pcData.memory || '未設定'}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">儲存空間:</span>
                <p className="text-white">{pcData.storage || '未設定'}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">顯示卡:</span>
                <p className="text-white">{pcData.graphics || '未設定'}</p>
              </div>
            </div>
            {pcData.monitor_a && (
              <div>
                <span className="text-sm text-slate-400">螢幕A:</span>
                <p className="text-white">{pcData.monitor_a}</p>
              </div>
            )}
            {pcData.monitor_b && (
              <div>
                <span className="text-sm text-slate-400">螢幕B:</span>
                <p className="text-white">{pcData.monitor_b}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}