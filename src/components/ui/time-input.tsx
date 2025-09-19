import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string; // 24-hour format like "14:30"
  onChange: (value: string) => void; // callback with 24-hour format
  className?: string;
  placeholder?: string;
}

// Convert 24-hour time to 12-hour format
const to12Hour = (time24: string) => {
  if (!time24) return { hours: "", minutes: "", period: "AM" };
  
  const [hours24, minutes] = time24.split(':').map(Number);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  
  return {
    hours: hours12.toString(),
    minutes: minutes.toString().padStart(2, '0'),
    period
  };
};

// Convert 12-hour time to 24-hour format
const to24Hour = (hours: string, minutes: string, period: string) => {
  if (!hours || !minutes) return "";
  
  const h = parseInt(hours);
  const m = parseInt(minutes);
  
  if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) return "";
  
  let hours24 = h;
  if (period === 'AM' && h === 12) hours24 = 0;
  if (period === 'PM' && h !== 12) hours24 = h + 12;
  
  return `${hours24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function TimeInput({ value, onChange, className, placeholder }: TimeInputProps) {
  const { hours: initialHours, minutes: initialMinutes, period: initialPeriod } = to12Hour(value);
  
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [period, setPeriod] = useState<"AM" | "PM">(initialPeriod as "AM" | "PM");

  useEffect(() => {
    const { hours: newHours, minutes: newMinutes, period: newPeriod } = to12Hour(value);
    setHours(newHours);
    setMinutes(newMinutes);
    setPeriod(newPeriod as "AM" | "PM");
  }, [value]);

  const updateTime = (newHours: string, newMinutes: string, newPeriod: string) => {
    const time24 = to24Hour(newHours, newMinutes, newPeriod);
    if (time24) {
      onChange(time24);
    }
  };

  const handleHoursChange = (newHours: string) => {
    setHours(newHours);
    updateTime(newHours, minutes, period);
  };

  const handleMinutesChange = (newMinutes: string) => {
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as "AM" | "PM");
    updateTime(hours, minutes, newPeriod);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        type="number"
        value={hours}
        onChange={(e) => handleHoursChange(e.target.value)}
        placeholder="12"
        min="1"
        max="12"
        className="w-14 text-center"
      />
      <span className="text-muted-foreground">:</span>
      <Input
        type="number"
        value={minutes}
        onChange={(e) => handleMinutesChange(e.target.value.padStart(2, '0'))}
        placeholder="00"
        min="0"
        max="59"
        className="w-16 text-center"
      />
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}