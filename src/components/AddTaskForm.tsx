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
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Add New Task</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Read Chapter 5, Complete Problem Set 3"
            required
          />
        </div>

        <div>
          <Label htmlFor="course">Course *</Label>
          <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                    {course.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Task Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Task['type'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="problem-set">Problem Set</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
              <SelectItem value="exam-prep">Exam Prep</SelectItem>
              <SelectItem value="memorization">Memorization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="dueTime">Due Time</Label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="estHours">Est. Hours *</Label>
            <Input
              id="estHours"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.estHours}
              onChange={(e) => setFormData({ ...formData, estHours: e.target.value })}
              placeholder="2.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Easy</SelectItem>
                <SelectItem value="2">2 - Light</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - Hard</SelectItem>
                <SelectItem value="5">5 - Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional context or requirements..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}