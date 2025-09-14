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
    <Card className={`p-4 shadow-soft transition-all duration-300 border-l-4 ${
      isCompleted ? 'bg-muted/30 opacity-75' : 'hover:shadow-card'
    }`} style={{ borderLeftColor: course.color }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{startTime} - {endTime}</span>
            <Badge variant="secondary" className="text-xs">{duration}m</Badge>
          </div>
          <h3 className="font-medium text-foreground">{task.title}</h3>
          <p className="text-sm text-muted-foreground">{course.name}</p>
        </div>
        {isCompleted && (
          <Check className="w-5 h-5 text-accent" />
        )}
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium text-primary mb-1">{session.method}</div>
        <p className="text-sm text-muted-foreground">{session.tip}</p>
      </div>

      {!isCompleted && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onComplete?.(session.id)}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Done
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSnooze?.(session.id)}
          >
            Snooze 30m
          </Button>
        </div>
      )}
    </Card>
  );
}