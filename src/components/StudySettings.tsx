import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Clock, Target } from "lucide-react";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface StudySettingsProps {
  availableBlocks: TimeBlock[];
  pomodoroEnabled: boolean;
  sessionLength: number;
  breakLength: number;
  onUpdateBlocks: (blocks: TimeBlock[]) => void;
  onUpdatePomodoro: (enabled: boolean) => void;
  onUpdateSessionLength: (minutes: number) => void;
  onUpdateBreakLength: (minutes: number) => void;
  onClose: () => void;
}

export function StudySettings({
  availableBlocks,
  pomodoroEnabled,
  sessionLength,
  breakLength,
  onUpdateBlocks,
  onUpdatePomodoro,
  onUpdateSessionLength,
  onUpdateBreakLength,
  onClose
}: StudySettingsProps) {
  const [newBlock, setNewBlock] = useState({ startTime: "", endTime: "" });

  const addTimeBlock = () => {
    if (newBlock.startTime && newBlock.endTime) {
      // Validate time format and round to nearest 5 minutes
      const validateAndRoundTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return null;
        }
        const roundedMinutes = Math.round(minutes / 5) * 5;
        return `${hours.toString().padStart(2, '0')}:${(roundedMinutes % 60).toString().padStart(2, '0')}`;
      };

      const validStartTime = validateAndRoundTime(newBlock.startTime);
      const validEndTime = validateAndRoundTime(newBlock.endTime);

      if (validStartTime && validEndTime) {
        const block: TimeBlock = {
          id: Date.now().toString(),
          startTime: validStartTime,
          endTime: validEndTime,
          label: `${validStartTime} - ${validEndTime}`
        };
        onUpdateBlocks([...availableBlocks, block]);
        setNewBlock({ startTime: "", endTime: "" });
      }
    }
  };

  const removeTimeBlock = (id: string) => {
    onUpdateBlocks(availableBlocks.filter(block => block.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">Study Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Study Method */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <Switch
                id="pomodoro"
                checked={pomodoroEnabled}
                onCheckedChange={onUpdatePomodoro}
              />
              <div className="flex-1">
                <Label htmlFor="pomodoro" className="font-medium">Pomodoro Technique</Label>
              </div>
            </div>
          </div>

          {/* Session & Break Length */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session" className="text-sm">Session Length (minutes)</Label>
              <Input
                id="session"
                type="number"
                value={sessionLength}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 25;
                  const rounded = Math.round(value / 5) * 5;
                  onUpdateSessionLength(Math.max(15, Math.min(120, rounded)));
                }}
                min="15"
                max="120"
                step="5"
                className="h-9"
              />
            </div>
            
            {pomodoroEnabled && (
              <div className="space-y-2">
                <Label htmlFor="break" className="text-sm">Break Length (minutes)</Label>
                <Input
                  id="break"
                  type="number"
                  value={breakLength}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 5;
                    const rounded = Math.round(value / 5) * 5;
                    onUpdateBreakLength(Math.max(5, Math.min(30, rounded)));
                  }}
                  min="5"
                  max="30"
                  step="5"
                  className="h-9"
                />
              </div>
            )}
          </div>

          {/* Available Time Blocks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Study Times</Label>
            
            {/* Current blocks */}
            {availableBlocks.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                {availableBlocks.map((block) => (
                  <Badge 
                    key={block.id} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    {block.startTime} - {block.endTime}
                    <button
                      onClick={() => removeTimeBlock(block.id)}
                      className="hover:bg-destructive/20 rounded-full p-0.5 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new block */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={newBlock.startTime}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d:]/g, '');
                  if (value.length <= 5) {
                    setNewBlock({ ...newBlock, startTime: value });
                  }
                }}
                placeholder="Start (e.g. 9:00)"
                className="h-9"
              />
              <Input
                type="text"
                value={newBlock.endTime}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d:]/g, '');
                  if (value.length <= 5) {
                    setNewBlock({ ...newBlock, endTime: value });
                  }
                }}
                placeholder="End (e.g. 17:00)"
                className="h-9"
              />
              <Button 
                onClick={addTimeBlock} 
                size="sm" 
                className="px-4 h-9"
                disabled={!newBlock.startTime || !newBlock.endTime}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}