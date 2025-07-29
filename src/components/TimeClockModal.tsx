import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export default function TimeClockModal({ isOpen, onClose, employeeId, employeeName }: TimeClockModalProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTodayRecord();
    }
  }, [isOpen, employeeId]);

  const fetchTodayRecord = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('record_date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today record:', error);
    } else {
      setTodayRecord(data);
    }
  };

  const isWorkingHours = (time: Date) => {
    const hour = time.getHours();
    return hour >= 9 && hour < 17;
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('zh-TW', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (time: Date) => {
    return time.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleClockAction = async (action: 'clock_in' | 'clock_out' | 'overtime_in' | 'overtime_out') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeString = now.toISOString();

    // 驗證打卡順序
    if (action === 'clock_out' && !todayRecord?.clock_in_time) {
      toast({
        title: "打卡失敗",
        description: "請先打卡上班",
        variant: "destructive"
      });
      return;
    }

    if (action === 'overtime_out' && !todayRecord?.overtime_in_time) {
      toast({
        title: "打卡失敗", 
        description: "請先打卡加班上班",
        variant: "destructive"
      });
      return;
    }

    try {
      let updateData: any = {};
      
      switch (action) {
        case 'clock_in':
          updateData.clock_in_time = timeString;
          break;
        case 'clock_out':
          updateData.clock_out_time = timeString;
          break;
        case 'overtime_in':
          updateData.overtime_in_time = timeString;
          break;
        case 'overtime_out':
          updateData.overtime_out_time = timeString;
          break;
      }

      if (todayRecord) {
        // 更新現有記錄
        const { error } = await supabase
          .from('attendance_records')
          .update(updateData)
          .eq('id', todayRecord.id);

        if (error) throw error;
      } else {
        // 創建新記錄
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: employeeId,
            record_date: today,
            ...updateData
          });

        if (error) throw error;
      }

      await fetchTodayRecord();
      
      const actionNames = {
        clock_in: '上班',
        clock_out: '下班', 
        overtime_in: '加班上班',
        overtime_out: '加班下班'
      };

      toast({
        title: "打卡成功",
        description: `${actionNames[action]}打卡完成 - ${formatTime(now)}`
      });

    } catch (error) {
      console.error('Clock action error:', error);
      toast({
        title: "打卡失敗",
        description: "系統錯誤，請稍後再試",
        variant: "destructive"
      });
    }
  };

  const getButtonState = (action: 'clock_in' | 'clock_out' | 'overtime_in' | 'overtime_out') => {
    if (!todayRecord) {
      return action === 'clock_in';
    }

    switch (action) {
      case 'clock_in':
        return !todayRecord.clock_in_time;
      case 'clock_out':
        return todayRecord.clock_in_time && !todayRecord.clock_out_time;
      case 'overtime_in':
        return !todayRecord.overtime_in_time;
      case 'overtime_out':
        return todayRecord.overtime_in_time && !todayRecord.overtime_out_time;
      default:
        return false;
    }
  };

  const timeColor = isWorkingHours(currentTime) ? "text-blue-600" : "text-red-600";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              打卡鐘
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 員工信息 */}
          <div className="text-center">
            <p className="text-lg font-medium">{employeeName}</p>
            <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
          </div>

          {/* 當前時間 */}
          <div className="text-center">
            <div className={`text-3xl font-mono font-bold ${timeColor}`}>
              {formatTime(currentTime)}
            </div>
          </div>

          {/* 打卡按鈕 */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleClockAction('clock_in')}
                disabled={!getButtonState('clock_in')}
                variant={getButtonState('clock_in') ? "default" : "secondary"}
                className="w-full"
              >
                上班
                {todayRecord?.clock_in_time && (
                  <span className="ml-2 text-xs">
                    {new Date(todayRecord.clock_in_time).toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => handleClockAction('clock_out')}
                disabled={!getButtonState('clock_out')}
                variant={getButtonState('clock_out') ? "default" : "secondary"}
                className="w-full"
              >
                下班
                {todayRecord?.clock_out_time && (
                  <span className="ml-2 text-xs">
                    {new Date(todayRecord.clock_out_time).toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => handleClockAction('overtime_in')}
                disabled={!getButtonState('overtime_in')}
                variant={getButtonState('overtime_in') ? "outline" : "secondary"}
                className="w-full"
              >
                加班上班
                {todayRecord?.overtime_in_time && (
                  <span className="ml-2 text-xs">
                    {new Date(todayRecord.overtime_in_time).toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => handleClockAction('overtime_out')}
                disabled={!getButtonState('overtime_out')}
                variant={getButtonState('overtime_out') ? "outline" : "secondary"}
                className="w-full"
              >
                加班下班
                {todayRecord?.overtime_out_time && (
                  <span className="ml-2 text-xs">
                    {new Date(todayRecord.overtime_out_time).toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}