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
  const dueDate = format(task.dueAt, "MMM d");

  return (
    <div className="group p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        {/* Color indicator */}
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: course.color }}
        />
        
        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate">{task.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{course.name}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{Math.floor(task.estHours)}h {Math.round((task.estHours % 1) * 60)}m</span>
            {task.dueAt && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className={`text-xs ${
                  isOverdue ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {dueDate}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Done button */}
        {task.status === 'open' && onComplete && (
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task.id);
            }}
          >
            Done
          </Button>
        )}
      </div>
    </div>
  );
}