import { Task, Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, AlertTriangle, Star } from "lucide-react";
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

const DIFFICULTY_DISPLAY = {
  1: { text: "VE", color: "text-emerald-600" },
  2: { text: "E", color: "text-green-600" },
  3: { text: "M", color: "text-yellow-600" },
  4: { text: "H", color: "text-orange-600" },
  5: { text: "VH", color: "text-red-600" }
};

export function TaskCard({ task, course, onComplete }: TaskCardProps) {
  const isOverdue = task.dueAt < new Date() && task.status === 'open';
  const dueDate = format(task.dueAt, "MMM d");
  const difficultyInfo = DIFFICULTY_DISPLAY[task.difficulty];

  return (
    <div className="group p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: course.color }}
        />
        
        {/* Task content */}
        <div className="flex-1 min-w-0">
          {/* Title row with priority */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm text-foreground truncate flex-1">{task.title}</h3>
            {/* Priority indicator */}
            {task.priority === 'high' && (
              <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
            )}
          </div>
          
          {/* Info row */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="truncate">{course.name}</span>
            <span>•</span>
            <span className="whitespace-nowrap">{Math.floor(task.estHours)}h {Math.round((task.estHours % 1) * 60)}m</span>
            <span>•</span>
            <span className={`whitespace-nowrap ${isOverdue ? 'text-destructive' : ''}`}>
              {dueDate}
            </span>
            <span>•</span>
            <span className={`font-medium whitespace-nowrap ${difficultyInfo.color}`}>
              {difficultyInfo.text}
            </span>
          </div>
        </div>
        
        {/* Done button */}
        {task.status === 'open' && onComplete && (
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2 flex-shrink-0"
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