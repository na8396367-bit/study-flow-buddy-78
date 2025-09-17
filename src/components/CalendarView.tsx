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
      <Card 
        className={`p-3 mb-2 cursor-pointer transition-all hover:shadow-md ${
          session.status === 'done' ? 'opacity-60 bg-muted' : ''
        } ${isBreak ? 'border-l-4 border-accent' : 'border-l-4'}`}
        style={{ borderLeftColor: course?.color || '#3b82f6' }}
        onClick={() => !isBreak && onCompleteSession(session.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-sm">
              {isBreak ? session.label : task?.title}
            </h4>
            {!isBreak && course && (
              <p className="text-xs text-muted-foreground">{course.name}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatTime(session.startAt)} - {formatTime(session.endAt)}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatDuration(session.startAt, session.endAt)}
              </Badge>
            </div>
          </div>
          {session.status === 'done' && (
            <Badge variant="secondary" className="text-xs">Done</Badge>
          )}
        </div>
      </Card>
    );
  };

  if (viewMode === "day") {
    const daySchedule = getSessionsForDay(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </h3>
            {isToday(currentDate) && (
              <Badge variant="default">Today</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDay("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDay("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode("week")}>
              <Maximize2 className="w-4 h-4 mr-1" />
              Week View
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
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
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No sessions planned for this day</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Week of {format(weekStart, "MMMM d, yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("day")}>
            <Minimize2 className="w-4 h-4 mr-1" />
            Day View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const daySessions = getSessionsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <Card 
              key={day.toISOString()} 
              className={`p-3 min-h-32 cursor-pointer transition-all hover:shadow-md ${
                isCurrentDay ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setCurrentDate(day);
                setViewMode("day");
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {format(day, "EEE")}
                </span>
                <span className={`text-sm ${isCurrentDay ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="space-y-1">
                {daySessions.slice(0, 3).map(session => {
                  const task = session.taskId ? getTaskById(session.taskId) : undefined;
                  const course = task ? getCourseById(task.courseId) : undefined;
                  const isBreak = session.type === 'break' || session.type === 'meal';
                  
                  return (
                    <div
                      key={session.id}
                      className={`text-xs p-1 rounded truncate ${
                        session.status === 'done' ? 'opacity-60' : ''
                      }`}
                      style={{ 
                        backgroundColor: course?.color ? `${course.color}20` : '#3b82f620',
                        borderLeft: `2px solid ${course?.color || '#3b82f6'}`
                      }}
                    >
                      {isBreak ? session.label : task?.title}
                    </div>
                  );
                })}
                {daySessions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}