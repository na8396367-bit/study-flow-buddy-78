import { Task, Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  course: Course;
  onEdit?: (task: Task) => void;
  onComplete?: (taskId: string) => void;
}

const PRIORITY_STYLES = {
  low: "border-muted text-muted-foreground",
  medium: "border-accent text-accent",
  high: "border-destructive text-destructive"
};

const DIFFICULTY_DOTS = {
  1: "●",
  2: "●●", 
  3: "●●●",
  4: "●●●●",
  5: "●●●●●"
};

export function TaskCard({ task, course, onEdit, onComplete }: TaskCardProps) {
  const isOverdue = task.dueAt < new Date() && task.status === 'open';
  const dueDate = format(task.dueAt, "MMM d, h:mm a");

  return (
    <Card className="p-4 shadow-soft hover:shadow-card transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: course.color }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
          <p className="text-sm text-muted-foreground">{course.name}</p>
        </div>
        <Badge variant={task.status === 'done' ? 'secondary' : 'outline'} 
               className={task.status === 'open' ? PRIORITY_STYLES[task.priority] : ''}>
          {task.priority}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{task.estHours}h</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{task.type.replace('-', ' ')}</span>
        </div>
        <div className="font-mono text-xs">
          {DIFFICULTY_DOTS[task.difficulty]}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {isOverdue && <AlertCircle className="w-4 h-4 inline mr-1" />}
          Due {dueDate}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              Edit
            </Button>
          )}
          {task.status === 'open' && onComplete && (
            <Button variant="outline" size="sm" onClick={() => onComplete(task.id)}>
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}