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
      const block: TimeBlock = {
        id: Date.now().toString(),
        ...newBlock,
        label: `${newBlock.startTime} - ${newBlock.endTime}`
      };
      onUpdateBlocks([...availableBlocks, block]);
      setNewBlock({ startTime: "", endTime: "" });
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Study Method
            </Label>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <Switch
                id="pomodoro"
                checked={pomodoroEnabled}
                onCheckedChange={onUpdatePomodoro}
              />
              <div className="flex-1">
                <Label htmlFor="pomodoro" className="font-medium">Pomodoro Technique</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Add breaks between study sessions to improve focus and retention
                </p>
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
                onChange={(e) => onUpdateSessionLength(parseInt(e.target.value) || 25)}
                min="15"
                max="120"
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
                  onChange={(e) => onUpdateBreakLength(parseInt(e.target.value) || 5)}
                  min="5"
                  max="30"
                  className="h-9"
                />
              </div>
            )}
          </div>

          {/* Available Time Blocks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Available Study Times
            </Label>
            
            {/* Current blocks */}
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-muted/30 rounded-lg">
              {availableBlocks.length > 0 ? (
                availableBlocks.map((block) => (
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
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No time blocks added yet</p>
              )}
            </div>

            {/* Add new block */}
            <div className="flex gap-2">
              <Input
                type="time"
                value={newBlock.startTime}
                onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                placeholder="Start"
                className="h-9"
              />
              <Input
                type="time"
                value={newBlock.endTime}
                onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                placeholder="End"
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