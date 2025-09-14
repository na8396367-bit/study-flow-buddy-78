import { Task, Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  course: Course;
  onComplete?: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/20 text-accent",
  high: "bg-destructive/20 text-destructive"
};

export function TaskCard({ task, course, onComplete }: TaskCardProps) {
  const isOverdue = task.dueAt < new Date() && task.status === 'open';
  const dueDate = format(task.dueAt, "MMM d, h:mm a");

  return (
    <Card className="group p-4 transition-all duration-300 hover:scale-105 hover:shadow-hover cursor-pointer transform ease-bounce" 
          onClick={() => task.status === 'open' && onComplete?.(task.id)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: course.color }} />
          <div>
            <h3 className="font-medium text-foreground">{task.title}</h3>
            <p className="text-xs text-muted-foreground">{course.name}</p>
          </div>
        </div>
        <Badge className={`text-xs px-2 py-0.5 ${PRIORITY_COLORS[task.priority]} hover:scale-110 transition-transform`}>
          {task.priority}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{task.estHours}h</span>
        </div>
        <div className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {dueDate}
        </div>
      </div>

      {task.status === 'open' && (
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button 
            size="sm" 
            className="w-full hover:shadow-glow hover:scale-105 transform transition-all ease-bounce" 
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(task.id);
            }}
          >
            <Check className="w-3 h-3 mr-1" />
            Done
          </Button>
        </div>
      )}
    </Card>
  );
}