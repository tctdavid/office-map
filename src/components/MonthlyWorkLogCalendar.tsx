import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyWorkLog {
  [date: string]: {
    workLog: string | null;
    hasRecord: boolean;
    isEditable: boolean;
  };
}

interface MonthlyWorkLogCalendarProps {
  employeeId: string;
  employeeName: string;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  selectedDate: Date;
}

export default function MonthlyWorkLogCalendar({ 
  employeeId, 
  employeeName, 
  onDateSelect, 
  onClose,
  selectedDate 
}: MonthlyWorkLogCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [monthlyLogs, setMonthlyLogs] = useState<MonthlyWorkLog>({});
  const [isLoading, setIsLoading] = useState(false);

  // 獲取月份的工作日誌數據
  const fetchMonthlyLogs = async (month: Date) => {
    setIsLoading(true);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('record_date, work_log')
        .eq('employee_id', employeeId)
        .gte('record_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('record_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const logs: MonthlyWorkLog = {};
      const today = startOfDay(new Date());

      // 初始化整個月的數據
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      daysInMonth.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayStart = startOfDay(day);
        logs[dateKey] = {
          workLog: null,
          hasRecord: false,
          isEditable: !isBefore(dayStart, today)
        };
      });

      // 填入實際的工作日誌數據
      if (data) {
        data.forEach(record => {
          logs[record.record_date] = {
            workLog: record.work_log,
            hasRecord: !!record.work_log,
            isEditable: logs[record.record_date].isEditable
          };
        });
      }

      setMonthlyLogs(logs);
    } catch (error) {
      console.error('Error fetching monthly logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyLogs(currentMonth);
  }, [currentMonth, employeeId]);

  // 獲取要顯示的所有日期（包括前後月份的日期以填滿網格）
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // 獲取月份第一天是星期幾（0=星期日，1=星期一...）
    const startDayOfWeek = monthStart.getDay();
    
    // 計算日曆網格的開始日期（可能是上個月的日期）
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - startDayOfWeek);
    
    // 計算日曆網格的結束日期（需要42個格子，6週）
    const calendarEnd = new Date(calendarStart);
    calendarEnd.setDate(calendarStart.getDate() + 41);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // 獲取工作內容摘要
  const getWorkLogSummary = (dateKey: string) => {
    const log = monthlyLogs[dateKey];
    if (!log?.workLog) return null;
    
    // 限制顯示前30個字符
    const summary = log.workLog.length > 30 
      ? log.workLog.substring(0, 30) + '...' 
      : log.workLog;
    
    return summary;
  };

  const calendarDays = getCalendarDays();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {employeeName} - 工作日誌月視圖
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 月份導航 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-xl font-medium text-foreground">
            {format(currentMonth, 'yyyy年MM月')}
          </h3>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 星期標題 */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekdays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 日期網格 */}
        <div className="grid grid-cols-7 h-[400px]">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayLog = monthlyLogs[dateKey];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const workLogSummary = getWorkLogSummary(dateKey);

            return (
              <div
                key={dateKey}
                className={cn(
                  "border-r border-b border-border last:border-r-0 p-2 cursor-pointer transition-colors relative h-full",
                  "hover:bg-accent",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isSelected && "bg-primary/20 border-primary",
                  isTodayDate && "bg-secondary/50",
                  dayLog?.hasRecord && "bg-blue-50 dark:bg-blue-950/20"
                )}
                onClick={() => handleDateClick(day)}
                title={workLogSummary ? dayLog?.workLog || '' : '點擊查看詳情'}
              >
                {/* 日期數字 */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isTodayDate && "text-primary font-bold",
                  isSelected && "text-primary",
                  !dayLog?.isEditable && "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </div>

                {/* 工作內容摘要 */}
                {workLogSummary && (
                  <div className="text-xs text-foreground/80 leading-tight line-clamp-3 overflow-hidden">
                    {workLogSummary}
                  </div>
                )}

                {/* 狀態指示器 */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {dayLog?.hasRecord && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  {!dayLog?.isEditable && (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 載入狀態 */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-muted-foreground">載入中...</div>
          </div>
        )}

        {/* 說明 */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>有工作記錄</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>過去日期(不可編輯)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/20 border border-primary rounded" />
              <span>當前選中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}