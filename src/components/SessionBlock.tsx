import { PlanSession, Task, Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Coffee, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface SessionBlockProps {
  session: PlanSession;
  task: Task;
  course: Course;
  onComplete?: (sessionId: string) => void;
  onSnooze?: (sessionId: string) => void;
}

export function SessionBlock({ session, task, course, onComplete, onSnooze }: SessionBlockProps) {
  const startTime = format(session.startAt, "h:mm a");
  const endTime = format(session.endAt, "h:mm a");
  const duration = Math.round((session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60));
  
  const isBreak = session.method === 'break';
  const isMeal = session.method === 'meal';
  const isCompleted = session.status === 'done';

  if (isBreak) {
    return (
      <Card className="p-3 bg-muted/50 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Coffee className="w-4 h-4" />
          <span className="font-medium">{startTime} - {endTime}</span>
          <span className="text-sm">Break ({duration}m)</span>
        </div>
      </Card>
    );
  }

  if (isMeal) {
    return (
      <Card className="p-3 bg-accent-soft/30 border-accent/30">
        <div className="flex items-center gap-2 text-accent">
          <span className="font-medium">{startTime} - {endTime}</span>
          <span className="text-sm">Meal Time</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group p-3 transition-all duration-200 border-l-4 cursor-pointer ${
      isCompleted ? 'bg-muted/30 opacity-75' : 'hover:scale-[1.01]'
    }`} style={{ borderLeftColor: course.color }}
          onClick={() => !isCompleted && onComplete?.(session.id)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{startTime}</span>
          <span className="text-xs text-muted-foreground">({duration}m)</span>
        </div>
        {isCompleted && (
          <Check className="w-4 h-4 text-accent" />
        )}
      </div>

      <div className="mb-1">
        <h3 className="font-medium text-sm text-foreground">{task.title}</h3>
        <p className="text-xs text-muted-foreground">{course.name}</p>
      </div>

      <p className="text-xs text-muted-foreground/80">{session.tip}</p>

      {!isCompleted && (
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(session.id);
            }}
            className="w-full text-xs py-1 h-7"
          >
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Button>
        </div>
      )}
    </Card>
  );
}