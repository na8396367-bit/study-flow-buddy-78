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
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onClose: () => void;
}

export function AddTaskForm({ courses, onAddTask, onAddCourse, onClose }: AddTaskFormProps) {
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
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

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

  const handleAddCourse = () => {
    if (!newCourseName.trim()) return;
    
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCourse = {
      name: newCourseName.trim(),
      color: randomColor
    };
    
    onAddCourse(newCourse);
    setNewCourseName('');
    setShowAddCourse(false);
  };

  return (
    <Card className="p-4 shadow-soft">&gt;
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What needs to be done?"
            className="text-base focus:shadow-glow transition-shadow"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block">Course</Label>
            <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
              <SelectTrigger className="focus:shadow-glow transition-shadow">
                <SelectValue placeholder="Select course" />
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
                <div className="p-2 border-t">
                  {!showAddCourse ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCourse(true)}
                      className="w-full justify-start"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add new course
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Input
                        placeholder="Course name"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="text-xs h-8"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                      />
                      <Button type="button" size="sm" onClick={handleAddCourse} className="h-8 px-2">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block">Estimated Hours</Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.estHours}
              onChange={(e) => setFormData({ ...formData, estHours: e.target.value })}
              placeholder="e.g. 2.5"
              className="focus:shadow-glow transition-shadow"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block">Due Date</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="focus:shadow-glow transition-shadow"
              required
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
              <SelectTrigger className="focus:shadow-glow transition-shadow">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            className="flex-1 hover:shadow-glow hover:scale-105 transform transition-all ease-bounce"
          >
            Add
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="hover:scale-110 transition-transform ease-bounce"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}