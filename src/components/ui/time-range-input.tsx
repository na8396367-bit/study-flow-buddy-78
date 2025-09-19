import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseTimeInterval, parseToInternalFormat } from "@/lib/time-parser";

interface TimeRangeInputProps {
  startTime: string; // 24-hour format like "14:30"
  endTime: string; // 24-hour format like "16:00"
  onChange: (startTime: string, endTime: string) => void;
  onEnter?: () => void; // Called when Enter is pressed
  className?: string;
  placeholder?: string;
}

// Convert internal times to display format
const formatTimeRange = (start: string, end: string): string => {
  if (!start || !end) return "";
  
  const formatTime = (time24: string): string => {
    const [hours24, minutes] = time24.split(':').map(Number);
    if (isNaN(hours24) || isNaN(minutes)) return "";
    
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};

export function TimeRangeInput({ 
  startTime, 
  endTime, 
  onChange, 
  onEnter,
  className, 
  placeholder 
}: TimeRangeInputProps) {
  const [inputValue, setInputValue] = useState(formatTimeRange(startTime, endTime));

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    const parsed = parseTimeInterval(newValue);
    if (parsed !== 'NO_TIME') {
      const internal = parseToInternalFormat(parsed);
      if (internal) {
        onChange(internal.startTime, internal.endTime);
      }
    }
  };

  const handleBlur = () => {
    // On blur, ensure we show the correctly formatted time range or reset
    const displayValue = formatTimeRange(startTime, endTime);
    if (displayValue) {
      setInputValue(displayValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={(e) => handleInputChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || "e.g., 9 to 5, 9:30am-2pm, nine to three"}
      className={cn("text-center", className)}
    />
  );
}