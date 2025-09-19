import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TimeInput } from "@/components/ui/time-input";
import { X, Plus, Coffee, UtensilsCrossed } from "lucide-react";

// Helper function to format 24-hour time to 12-hour AM/PM format
const formatTimeToAmPm = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface AvailabilitySettingsProps {
  availableBlocks: TimeBlock[];
  lunchDuration: number; // minutes
  snackDuration: number; // minutes
  onUpdateAvailability: (blocks: TimeBlock[]) => void;
  onUpdateBreaks: (lunch: number, snack: number) => void;
}

export function AvailabilitySettings({
  availableBlocks,
  lunchDuration,
  snackDuration,
  onUpdateAvailability,
  onUpdateBreaks
}: AvailabilitySettingsProps) {
  const [newBlock, setNewBlock] = useState({ startTime: "", endTime: "", label: "" });
  const [tempLunch, setTempLunch] = useState(lunchDuration.toString());
  const [tempSnack, setTempSnack] = useState(snackDuration.toString());

  const addTimeBlock = () => {
    if (newBlock.startTime && newBlock.endTime) {
      const block: TimeBlock = {
        id: Date.now().toString(),
        ...newBlock,
        label: newBlock.label || `${newBlock.startTime} - ${newBlock.endTime}`
      };
      onUpdateAvailability([...availableBlocks, block]);
      setNewBlock({ startTime: "", endTime: "", label: "" });
    }
  };

  const removeTimeBlock = (id: string) => {
    onUpdateAvailability(availableBlocks.filter(block => block.id !== id));
  };

  const updateBreaks = () => {
    onUpdateBreaks(parseInt(tempLunch) || 30, parseInt(tempSnack) || 15);
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Study Availability</h3>
        
        {/* Break Duration Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Lunch Break (minutes)
            </Label>
            <Input
              type="number"
              value={tempLunch}
              onChange={(e) => setTempLunch(e.target.value)}
              onBlur={updateBreaks}
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Snack Break (minutes)
            </Label>
            <Input
              type="number"
              value={tempSnack}
              onChange={(e) => setTempSnack(e.target.value)}
              onBlur={updateBreaks}
              placeholder="15"
            />
          </div>
        </div>

        {/* Available Time Blocks */}
        <div className="space-y-4">
          <h4 className="font-medium">Available Study Times</h4>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {availableBlocks.map((block) => (
              <Badge key={block.id} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                <span>{formatTimeToAmPm(block.startTime)} - {formatTimeToAmPm(block.endTime)}</span>
                <button
                  onClick={() => removeTimeBlock(block.id)}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Time Block */}
          <div className="grid grid-cols-3 gap-2">
            <TimeInput
              value={newBlock.startTime}
              onChange={(value) => setNewBlock({ ...newBlock, startTime: value })}
              placeholder="Start time"
            />
            <TimeInput
              value={newBlock.endTime}
              onChange={(value) => setNewBlock({ ...newBlock, endTime: value })}
              placeholder="End time"
            />
            <Button onClick={addTimeBlock} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}