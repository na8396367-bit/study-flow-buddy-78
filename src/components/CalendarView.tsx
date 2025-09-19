import { useState } from "react";
import { PlanSession, Task, Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Maximize2, Minimize2 } from "lucide-react";

interface CalendarViewProps {
  sessions: PlanSession[];
  tasks: Task[];
  courses: Course[];
  onCompleteSession: (sessionId: string) => void;
}

export function CalendarView({ sessions, tasks, courses, onCompleteSession }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => isSameDay(session.startAt, date));
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(t => t.id === taskId);
  };

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const formatDuration = (start: Date, end: Date) => {
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    setCurrentDate(prev => addDays(prev, days));
  };

  const navigateDay = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -1 : 1;
    setCurrentDate(prev => addDays(prev, days));
  };

  const SessionCard = ({ session, task, course }: { session: PlanSession; task?: Task; course?: Course }) => {
    const isBreak = session.type === 'break' || session.type === 'meal';
    
    return (
      <div 
        className={`flex items-center gap-3 py-2 px-0 cursor-pointer group hover:bg-muted/50 transition-colors rounded-sm ${
          session.status === 'done' ? 'opacity-60' : ''
        }`}
        onClick={() => !isBreak && onCompleteSession(session.id)}
      >
        {/* Time column */}
        <div className="w-20 text-right">
          <span className="text-xs text-muted-foreground">
            {formatTime(session.startAt)}
          </span>
        </div>
        
        {/* Event bar */}
        <div 
          className={`flex-1 border-l-4 pl-3 py-1 rounded-r-sm ${
            session.status === 'done' ? 'bg-muted/60' : 'bg-card'
          }`}
          style={{ 
            borderLeftColor: course?.color || '#4285f4',
            backgroundColor: session.status === 'done' ? 'hsl(var(--muted))' : `${course?.color || '#4285f4'}10`
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {isBreak ? session.label : task?.title}
              </h4>
              {!isBreak && course && (
                <p className="text-xs text-muted-foreground">{course.name}</p>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(session.startAt)} - {formatTime(session.endAt)}
              </span>
            </div>
            {session.status === 'done' && (
              <span className="text-xs text-muted-foreground">Done</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === "day") {
    const daySchedule = getSessionsForDay(currentDate);
    
  return (
    <div className="space-y-6">
      {/* Header with clean Google Calendar styling */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-normal text-foreground">
            {format(currentDate, "EEEE, MMMM d")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigateDay("prev")} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateDay("next")} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2"></div>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("week")} className="text-sm font-normal">
            Week
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-0">
        {daySchedule.length > 0 ? (
          daySchedule
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
            .map(session => {
              const task = session.taskId ? getTaskById(session.taskId) : undefined;
              const course = task ? getCourseById(task.courseId) : undefined;
              
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  task={task}
                  course={course}
                />
              );
            })
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No events for this day</p>
          </div>
        )}
      </div>
    </div>
  );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h2 className="text-2xl font-normal text-foreground">
          {format(weekStart, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2"></div>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("day")} className="text-sm font-normal">
            Day
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDays.map(day => {
          const daySessions = getSessionsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toISOString()} 
              className={`bg-background p-3 min-h-32 cursor-pointer hover:bg-muted/50 transition-colors ${
                isCurrentDay ? 'bg-primary/5' : ''
              }`}
              onClick={() => {
                setCurrentDate(day);
                setViewMode("day");
              }}
            >
              {/* Day header */}
              <div className="flex flex-col items-center mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {format(day, "EEE")}
                </span>
                <span className={`text-lg ${
                  isCurrentDay 
                    ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium' 
                    : 'text-foreground'
                }`}>
                  {format(day, "d")}
                </span>
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {daySessions.slice(0, 3).map(session => {
                  const task = session.taskId ? getTaskById(session.taskId) : undefined;
                  const course = task ? getCourseById(task.courseId) : undefined;
                  const isBreak = session.type === 'break' || session.type === 'meal';
                  
                  return (
                    <div
                      key={session.id}
                      className={`text-xs p-1.5 rounded text-white truncate ${
                        session.status === 'done' ? 'opacity-60' : ''
                      }`}
                      style={{ 
                        backgroundColor: course?.color || '#4285f4'
                      }}
                    >
                      <div className="font-medium">
                        {formatTime(session.startAt)} {isBreak ? session.label : task?.title}
                      </div>
                    </div>
                  );
                })}
                {daySessions.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1.5">
                    {daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}