import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface WorkLogViewerProps {
  employeeId: string;
  employeeName: string;
}

export default function WorkLogViewer({ employeeId, employeeName }: WorkLogViewerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workLog, setWorkLog] = useState<string | null>(null);

  // 載入工作日誌
  const fetchWorkLog = async (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
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

    setWorkLog(data?.work_log ?? null);
  };

  // 當選擇的日期改變時
  useEffect(() => {
    fetchWorkLog(selectedDate);
  }, [selectedDate, employeeId]);

  return (
    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
      <h3 className="text-white text-lg font-medium mb-4">工作日誌查詢</h3>
      
      {/* 日期選擇器 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">選擇日期</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-slate-700 border-slate-500 text-white hover:bg-slate-600",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "yyyy年MM月dd日") : "選擇日期"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="pointer-events-auto bg-slate-800 text-white"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 工作日誌顯示區域 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          工作內容
          <span className="ml-2 text-xs text-yellow-400">(僅供查詢)</span>
        </label>
        <div
          className={cn(
            "min-h-[120px] p-3 bg-slate-800 border border-slate-500 rounded-md text-white",
            "whitespace-pre-wrap break-words"
          )}
        >
          {workLog || "該日期無工作日誌記錄"}
        </div>
      </div>
    </div>
  );
}