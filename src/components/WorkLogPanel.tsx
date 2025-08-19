import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import PcDataDisplay from "./PcDataDisplay";
import MonthlyWorkLogCalendar from "./MonthlyWorkLogCalendar";

interface WorkLogPanelProps {
  employeeId: string;
  employeeName: string;
  pcData?: {
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

export default function WorkLogPanel({ employeeId, employeeName, pcData }: WorkLogPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workLog, setWorkLog] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showMonthView, setShowMonthView] = useState(false);
  const { toast } = useToast();

  // 檢查日期是否為過去
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // 載入工作日誌
  const fetchWorkLog = async (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('work_log')
      .eq('employee_id', employeeId)
      .eq('record_date', dateString)
      .maybeSingle();

    if (error) {
      console.error('Error fetching work log:', error);
      return;
    }

    setWorkLog(data?.work_log ?? "");
  };

  // 當選擇的日期改變時
  useEffect(() => {
    const readonly = isPastDate(selectedDate);
    setIsReadOnly(readonly);
    fetchWorkLog(selectedDate);
  }, [selectedDate, employeeId]);

  // 保存工作日誌
  const handleSaveWorkLog = async () => {
    if (isReadOnly) {
      toast({
        title: "無法編輯",
        description: "過去的工作日誌無法修改",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // 先檢查是否已有記錄
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('record_date', dateString)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingRecord) {
        // 更新現有記錄
        const { error } = await supabase
          .from('attendance_records')
          .update({ work_log: workLog })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // 創建新記錄
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: employeeId,
            record_date: dateString,
            work_log: workLog
          });

        if (error) throw error;
      }

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 月視圖日曆 */}
      {showMonthView && (
        <MonthlyWorkLogCalendar
          employeeId={employeeId}
          employeeName={employeeName}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setShowMonthView(false);
          }}
          onClose={() => setShowMonthView(false)}
        />
      )}

      {/* 日期選擇器 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">選擇日期</label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowMonthView(true)}
            className={cn(
              "flex-1 justify-start text-left font-normal bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "yyyy年MM月dd日") : "選擇日期"}
          </Button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                  setCalendarOpen(false);
                }}
                initialFocus
                className="pointer-events-auto bg-slate-800 text-white"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 工作日誌輸入區域 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          工作內容
          {isReadOnly && (
            <span className="ml-2 text-xs text-yellow-400">(過去記錄，僅供查詢)</span>
          )}
        </label>
        <Textarea
          value={workLog}
          onChange={(e) => setWorkLog(e.target.value)}
          placeholder={isReadOnly ? "尚未記錄工作日誌" : "請輸入今日工作內容..."}
          readOnly={isReadOnly}
          className={cn(
            "min-h-[120px] bg-slate-700 border-slate-500 text-white placeholder:text-slate-400",
            "focus:border-blue-400 focus:ring-1 focus:ring-blue-400",
            isReadOnly && "bg-slate-800 cursor-not-allowed opacity-75"
          )}
        />
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        {!isReadOnly ? (
          <Button
            onClick={handleSaveWorkLog}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "保存中..." : "保存"}
          </Button>
        ) : (
          <Button
            disabled
            variant="secondary"
            className="flex-1 bg-slate-600 text-slate-300 cursor-not-allowed"
          >
            <Eye className="mr-2 h-4 w-4" />
            僅供查詢
          </Button>
        )}
      </div>
      
      {/* PC Data Display */}
      {pcData && <PcDataDisplay pcData={pcData} />}
    </>
  );
}