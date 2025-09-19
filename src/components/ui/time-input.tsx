import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseTimeInterval, parseToInternalFormat } from "@/lib/time-parser";

interface TimeInputProps {
  value: string; // 24-hour format like "14:30"
  onChange: (value: string) => void; // callback with 24-hour format
  className?: string;
  placeholder?: string;
}

// Convert 24-hour time to 12-hour format for display
const to12Hour = (time24: string): string => {
  if (!time24) return "";
  
  const [hours24, minutes] = time24.split(':').map(Number);
  if (isNaN(hours24) || isNaN(minutes)) return "";
  
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function TimeInput({ value, onChange, className, placeholder }: TimeInputProps) {
  const [inputValue, setInputValue] = useState(to12Hour(value));

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    // Try to parse as a single time first, then fall back to treating as start of range
    let parsed = parseTimeInterval(newValue + " to " + newValue);
    if (parsed === 'NO_TIME') {
      // Try just parsing the input as a time range with a default end
      parsed = parseTimeInterval(newValue + " to " + (newValue.includes('AM') ? '11:59 AM' : '11:59 PM'));
    }
    
    if (parsed !== 'NO_TIME') {
      const internal = parseToInternalFormat(parsed);
      if (internal) {
        onChange(internal.startTime);
      }
    }
  };

  const handleBlur = () => {
    // On blur, ensure we show the correctly formatted time or reset to current value
    const displayValue = to12Hour(value);
    if (displayValue) {
      setInputValue(displayValue);
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={(e) => handleInputChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder || "e.g., 9am, 2:30pm, nine thirty"}
      className={cn("text-center", className)}
    />
  );
}