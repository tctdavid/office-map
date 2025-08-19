import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MonthlyWorkLog {
  [date: string]: {
    workLog: string | null;
    hasRecord: boolean;
    isEditable: boolean;
  };
}

interface EditingState {
  [dateKey: string]: {
    isEditing: boolean;
    originalValue: string;
    currentValue: string;
    isSaving: boolean;
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
  const [editingState, setEditingState] = useState<EditingState>({});
  const { toast } = useToast();

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

  // 處理日期格子點擊事件
  const handleDateClick = (date: Date, dateKey: string) => {
    const dayLog = monthlyLogs[dateKey];
    
    // 如果是可編輯的日期，進入編輯模式
    if (dayLog?.isEditable) {
      setEditingState(prev => ({
        ...prev,
        [dateKey]: {
          isEditing: true,
          originalValue: dayLog.workLog || '',
          currentValue: dayLog.workLog || '',
          isSaving: false
        }
      }));
    } else {
      // 不可編輯的日期，選擇日期並關閉
      onDateSelect(date);
      onClose();
    }
  };

  // 保存工作日誌
  const handleSaveWorkLog = async (dateKey: string) => {
    const editing = editingState[dateKey];
    if (!editing) return;

    setEditingState(prev => ({
      ...prev,
      [dateKey]: { ...editing, isSaving: true }
    }));

    try {
      // 先檢查是否已有記錄
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('record_date', dateKey)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRecord) {
        // 更新現有記錄
        const { error } = await supabase
          .from('attendance_records')
          .update({ work_log: editing.currentValue })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // 創建新記錄
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: employeeId,
            record_date: dateKey,
            work_log: editing.currentValue
          });

        if (error) throw error;
      }

      // 更新本地狀態
      setMonthlyLogs(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          workLog: editing.currentValue,
          hasRecord: !!editing.currentValue
        }
      }));

      // 退出編輯模式
      setEditingState(prev => {
        const newState = { ...prev };
        delete newState[dateKey];
        return newState;
      });

      toast({
        title: "保存成功",
        description: "工作日誌已保存"
      });

    } catch (error) {
      console.error('Error saving work log:', error);
      toast({
        title: "保存失敗",
        description: "工作日誌保存時發生錯誤",
        variant: "destructive"
      });
      
      setEditingState(prev => ({
        ...prev,
        [dateKey]: { ...editing, isSaving: false }
      }));
    }
  };

  // 取消編輯
  const handleCancelEdit = (dateKey: string) => {
    setEditingState(prev => {
      const newState = { ...prev };
      delete newState[dateKey];
      return newState;
    });
  };

  // 處理文本變更
  const handleTextChange = (dateKey: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        currentValue: value
      }
    }));
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent, dateKey: string) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSaveWorkLog(dateKey);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit(dateKey);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[95vh] overflow-auto transform scale-120">
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
        <div className="grid grid-cols-7 h-[500px]">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayLog = monthlyLogs[dateKey];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const workLogSummary = getWorkLogSummary(dateKey);
            const editing = editingState[dateKey];

            return (
              <div
                key={dateKey}
                className={cn(
                  "border-r border-b border-border last:border-r-0 p-2 transition-colors relative h-full flex flex-col",
                  !editing && dayLog?.isEditable && "cursor-pointer hover:bg-accent",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isSelected && "bg-primary/20 border-primary",
                  isTodayDate && "bg-secondary/50",
                  dayLog?.hasRecord && "bg-blue-50 dark:bg-blue-950/20",
                  editing && "bg-accent"
                )}
                onClick={() => !editing && handleDateClick(day, dateKey)}
              >
                {/* 日期數字和操作按鈕 */}
                <div className="flex items-center justify-between mb-1">
                  <div className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-primary font-bold",
                    isSelected && "text-primary",
                    !dayLog?.isEditable && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {editing && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveWorkLog(dateKey);
                        }}
                        disabled={editing.isSaving}
                      >
                        {editing.isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit(dateKey);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* 工作內容 - 編輯模式或顯示模式 */}
                <div className="flex-1 min-h-0">
                  {editing ? (
                    <Textarea
                      value={editing.currentValue}
                      onChange={(e) => handleTextChange(dateKey, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, dateKey)}
                      placeholder="輸入工作內容..."
                      className="w-full h-full min-h-[60px] text-xs resize-none border-0 bg-transparent p-1 focus:ring-0"
                      autoFocus
                    />
                  ) : (
                    workLogSummary && (
                      <div className="text-xs text-foreground/80 leading-tight line-clamp-4 overflow-hidden">
                        {workLogSummary}
                      </div>
                    )
                  )}
                </div>

                {/* 狀態指示器 */}
                {!editing && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    {dayLog?.hasRecord && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    {!dayLog?.isEditable && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                )}
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
            <div className="text-muted-foreground ml-4">
              <span>點擊可編輯日期直接輸入 • Ctrl+Enter 保存 • Esc 取消</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}