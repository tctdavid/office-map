import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  isAdmin?: boolean;
}

export default function TimeClockModal({ isOpen, onClose, employeeId, employeeName, isAdmin = false }: TimeClockModalProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
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

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const downloadCSV = (data: any[], filename: string) => {
    const headers = [
      '員工姓名',
      '日期', 
      '上班時間',
      '下班時間',
      '加班上班時間',
      '加班下班時間',
      '工作記錄'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.employee_name || '',
        record.record_date || '',
        record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString('zh-TW', { hour12: false }) : '',
        record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString('zh-TW', { hour12: false }) : '',
        record.overtime_in_time ? new Date(record.overtime_in_time).toLocaleTimeString('zh-TW', { hour12: false }) : '',
        record.overtime_out_time ? new Date(record.overtime_out_time).toLocaleTimeString('zh-TW', { hour12: false }) : '',
        record.work_log || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      // 計算下個月的第一天，然後減一天得到當月最後一天
      const nextMonth = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(nextMonth.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employees(name)
        `)
        .gte('record_date', startDate)
        .lte('record_date', endDate);

      // 如果不是管理員，只查詢自己的記錄
      if (!isAdmin) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query.order('record_date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "無資料",
          description: "選擇的月份沒有出勤記錄",
          variant: "destructive"
        });
        return;
      }

      // 轉換資料格式
      const csvData = data.map(record => ({
        ...record,
        employee_name: record.employees?.name || ''
      }));

      const filename = isAdmin 
        ? `全員出勤記錄_${selectedMonth}.csv`
        : `${employeeName}_出勤記錄_${selectedMonth}.csv`;

      downloadCSV(csvData, filename);

      toast({
        title: "匯出成功",
        description: `已匯出 ${data.length} 筆記錄`
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "匯出失敗",
        description: "匯出CSV時發生錯誤",
        variant: "destructive"
      });
    }
  };

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

          {/* CSV匯出功能 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">匯出出勤記錄</span>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="選擇月份" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                匯出CSV
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "將匯出所有員工的出勤記錄" : "將匯出您的個人出勤記錄"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}