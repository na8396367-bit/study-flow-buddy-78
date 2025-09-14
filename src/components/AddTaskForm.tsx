import { useState } from "react";
import { Task, Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";

interface AddTaskFormProps {
  courses: Course[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onClose: () => void;
}

export function AddTaskForm({ courses, onAddTask, onClose }: AddTaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    type: 'reading' as Task['type'],
    dueDate: '',
    dueTime: '',
    estHours: '',
    difficulty: '3' as string,
    priority: 'medium' as Task['priority'],
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.courseId || !formData.dueDate || !formData.estHours) {
      return;
    }

    const dueAt = new Date(`${formData.dueDate}T${formData.dueTime || '23:59'}`);
    
    onAddTask({
      title: formData.title,
      courseId: formData.courseId,
      type: formData.type,
      dueAt,
      estHours: parseFloat(formData.estHours),
      difficulty: parseInt(formData.difficulty) as Task['difficulty'],
      priority: formData.priority,
      notes: formData.notes,
      status: 'open'
    });
    
    onClose();
  };

  return (
    <Card className="p-4 shadow-soft">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What do you need to study?"
            className="text-base"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                    {course.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            step="0.5"
            min="0.5"
            value={formData.estHours}
            onChange={(e) => setFormData({ ...formData, estHours: e.target.value })}
            placeholder="Hours needed"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            Add Task
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}