import { useState } from "react";
import { TimeConstraint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";

// Helper function to format 24-hour time to 12-hour AM/PM format
const formatTimeToAmPm = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

interface ConstraintsManagerProps {
  constraints: TimeConstraint[];
  onUpdate: (constraints: TimeConstraint[]) => void;
}

export function ConstraintsManager({ constraints, onUpdate }: ConstraintsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConstraint, setNewConstraint] = useState<Partial<TimeConstraint>>({
    type: 'unavailable',
    startTime: '09:00',
    endTime: '10:00',
    days: [],
    label: '',
    isRecurring: true
  });

  const constraintTypes = [
    { value: 'sleep', label: '😴 Sleep', color: 'bg-slate-100 text-slate-800' },
    { value: 'meal', label: '🍽️ Meal', color: 'bg-orange-100 text-orange-800' },
    { value: 'work', label: '💼 Work', color: 'bg-blue-100 text-blue-800' },
    { value: 'class', label: '📚 Class', color: 'bg-green-100 text-green-800' },
    { value: 'personal', label: '🏠 Personal', color: 'bg-purple-100 text-purple-800' },
    { value: 'unavailable', label: '❌ Unavailable', color: 'bg-red-100 text-red-800' }
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const addConstraint = () => {
    if (!newConstraint.label || !newConstraint.startTime || !newConstraint.endTime) return;
    
    const constraint: TimeConstraint = {
      id: Date.now().toString(),
      type: newConstraint.type as TimeConstraint['type'],
      startTime: newConstraint.startTime,
      endTime: newConstraint.endTime,
      days: newConstraint.days || [],
      label: newConstraint.label,
      isRecurring: newConstraint.isRecurring || true,
      specificDate: newConstraint.specificDate
    };
    
    onUpdate([...constraints, constraint]);
    setNewConstraint({
      type: 'unavailable',
      startTime: '09:00',
      endTime: '10:00',
      days: [],
      label: '',
      isRecurring: true
    });
    setShowAddForm(false);
  };

  const removeConstraint = (id: string) => {
    onUpdate(constraints.filter(c => c.id !== id));
  };

  const toggleDay = (day: number) => {
    setNewConstraint(prev => ({
      ...prev,
      days: prev.days?.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...(prev.days || []), day]
    }));
  };

  const getConstraintTypeInfo = (type: string) => {
    return constraintTypes.find(ct => ct.value === type) || constraintTypes[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Time Constraints</h3>
        <Button 
          onClick={() => setShowAddForm(true)} 
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Constraint
        </Button>
      </div>

      {/* Existing Constraints */}
      <div className="space-y-3">
        {constraints.map(constraint => {
          const typeInfo = getConstraintTypeInfo(constraint.type);
          return (
            <Card key={constraint.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={typeInfo.color}>
                    {typeInfo.label}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{constraint.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeToAmPm(constraint.startTime)} - {formatTimeToAmPm(constraint.endTime)}
                      {constraint.isRecurring && (
                        <span className="ml-2">
                          {constraint.days.length === 7 ? 'Daily' : 
                           constraint.days.map(d => dayNames[d]).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeConstraint(constraint.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add New Constraint Form */}
      {showAddForm && (
        <Card className="p-4 border-primary/20">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">Add Time Constraint</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={newConstraint.type} 
                  onValueChange={(value) => setNewConstraint(prev => ({ ...prev, type: value as TimeConstraint['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {constraintTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Label</Label>
                <Input
                  placeholder="e.g., Morning jog, Dinner, etc."
                  value={newConstraint.label}
                  onChange={(e) => setNewConstraint(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newConstraint.startTime}
                  onChange={(e) => setNewConstraint(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newConstraint.endTime}
                  onChange={(e) => setNewConstraint(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Days (for recurring constraints)</Label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={newConstraint.days?.includes(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(index)}
                    className="w-12 h-8 text-xs"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={addConstraint}>
                Add Constraint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
