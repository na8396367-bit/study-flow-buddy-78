import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedUserPreferences } from "@/lib/timezone-scheduler";
import { ConstraintsManager } from "./ConstraintsManager";
import { TimeConstraint } from "@/types";
import { TimeInput } from "@/components/ui/time-input";
import { useState } from "react";
import { X, Clock, Calendar, Settings2 } from "lucide-react";

interface ScheduleSettingsProps {
  preferences: EnhancedUserPreferences;
  onSave: (preferences: EnhancedUserPreferences) => void;
  onClose: () => void;
}

export function ScheduleSettings({ preferences, onSave, onClose }: ScheduleSettingsProps) {
  const [settings, setSettings] = useState<EnhancedUserPreferences>(preferences);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateConstraints = (constraints: TimeConstraint[]) => {
    setSettings(prev => ({ ...prev, constraints }));
  };

  const updateWeeklySchedule = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          [field]: value
        }
      }
    }));
  };

  const updateOptimalTimes = (time: keyof typeof settings.optimalStudyTimes, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      optimalStudyTimes: {
        ...prev.optimalStudyTimes,
        [time]: value
      }
    }));
  };

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Schedule Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2">
                <Settings2 className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="constraints" className="gap-2">
                <Clock className="w-4 h-4" />
                Constraints
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockLength">Session Length (minutes)</Label>
                  <Input
                    id="blockLength"
                    type="number"
                    value={settings.blockLengthMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, blockLengthMinutes: parseInt(e.target.value) || 45 }))}
                    min="15"
                    max="120"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="breakLength">Break Length (minutes)</Label>
                  <Input
                    id="breakLength"
                    type="number"
                    value={settings.breakLengthMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, breakLengthMinutes: parseInt(e.target.value) || 15 }))}
                    min="5"
                    max="60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Your Best Study Times</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="morning"
                      checked={settings.optimalStudyTimes.morning}
                      onCheckedChange={(checked) => updateOptimalTimes('morning', checked)}
                    />
                    <Label htmlFor="morning">Morning (6AM - 12PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="afternoon"
                      checked={settings.optimalStudyTimes.afternoon}
                      onCheckedChange={(checked) => updateOptimalTimes('afternoon', checked)}
                    />
                    <Label htmlFor="afternoon">Afternoon (12PM - 6PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="evening"
                      checked={settings.optimalStudyTimes.evening}
                      onCheckedChange={(checked) => updateOptimalTimes('evening', checked)}
                    />
                    <Label htmlFor="evening">Evening (6PM - 10PM)</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Weekly Availability</Label>
                <div className="space-y-3">
                  {days.map(day => {
                    const daySchedule = settings.weeklySchedule[day];
                    return (
                      <div key={day} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={daySchedule.isAvailable}
                            onCheckedChange={(checked) => updateWeeklySchedule(day, 'isAvailable', checked)}
                          />
                          <Label className="capitalize font-medium">{day}</Label>
                        </div>
                        
                        {daySchedule.isAvailable && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">Start Time</Label>
                              <TimeInput
                                value={daySchedule.startTime}
                                onChange={(value) => updateWeeklySchedule(day, 'startTime', value)}
                                className="text-xs"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">End Time</Label>
                              <TimeInput
                                value={daySchedule.endTime}
                                onChange={(value) => updateWeeklySchedule(day, 'endTime', value)}
                                className="text-xs"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Lunch Start</Label>
                              <TimeInput
                                value={daySchedule.mealBreaks[0]?.start || "12:00"}
                                onChange={(value) => {
                                  const newMealBreaks = [...daySchedule.mealBreaks];
                                  if (newMealBreaks[0]) {
                                    newMealBreaks[0].start = value;
                                  } else {
                                    newMealBreaks[0] = { start: value, end: "13:00", label: "Lunch" };
                                  }
                                  updateWeeklySchedule(day, 'mealBreaks', newMealBreaks);
                                }}
                                className="text-xs"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Lunch End</Label>
                              <TimeInput
                                value={daySchedule.mealBreaks[0]?.end || "13:00"}
                                onChange={(value) => {
                                  const newMealBreaks = [...daySchedule.mealBreaks];
                                  if (newMealBreaks[0]) {
                                    newMealBreaks[0].end = value;
                                  } else {
                                    newMealBreaks[0] = { start: "12:00", end: value, label: "Lunch" };
                                  }
                                  updateWeeklySchedule(day, 'mealBreaks', newMealBreaks);
                                }}
                                className="text-xs"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="mt-6">
              <ConstraintsManager 
                constraints={settings.constraints || []}
                onUpdate={updateConstraints}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}