import { useState, useEffect } from "react";
import { Task, Course, PlanSession, UserPreferences, AvailabilityWindow } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { SequentialTaskForm } from "@/components/SequentialTaskForm";
import { StudySettings } from "@/components/StudySettings";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Sparkles, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { generateIntelligentSchedule, getDefaultEnhancedPreferences, EnhancedUserPreferences } from "@/lib/timezone-scheduler";
import { format, isToday, addDays } from "date-fns";

// Empty courses array - users will add their own
const initialCourses: Course[] = [];

// Start with empty tasks - users add their own
const initialTasks: Task[] = [];

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [userPreferences, setUserPreferences] = useState<EnhancedUserPreferences>(getDefaultEnhancedPreferences());
  const [availableBlocks, setAvailableBlocks] = useState<TimeBlock[]>([
    { id: '1', startTime: '09:00', endTime: '12:00', label: 'Morning' },
    { id: '2', startTime: '14:00', endTime: '17:00', label: 'Afternoon' }
  ]);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [sessionLength, setSessionLength] = useState(45);
  const [breakLength, setBreakLength] = useState(15);

  const openTasks = tasks.filter(t => t.status === 'open');

  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString()
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setShowAddTask(false);
    
    // Automatically generate new schedule
    setTimeout(() => {
      generateScheduleWithTasks(updatedTasks);
    }, 100);
  };

  const handleAddCourse = (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString()
    };
    setCourses([...courses, newCourse]);
  };

  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: 'done' as const } : t
    );
    setTasks(updatedTasks);
    
    // Automatically generate new schedule
    setTimeout(() => {
      generateScheduleWithTasks(updatedTasks);
    }, 100);
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(sessions.map(s =>
      s.id === sessionId ? { ...s, status: 'done' as const } : s
    ));
  };

  const generateScheduleWithTasks = (tasksToSchedule: Task[], pomodoroOverride?: boolean) => {
    // Convert available blocks to weekly schedule
    const baseSchedule = {
      monday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      friday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      saturday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      sunday: { isAvailable: true, startTime: '09:00', endTime: '17:00', mealBreaks: [] }
    };

    // Override with available blocks if they exist
    if (availableBlocks.length > 0) {
      const earliestStart = availableBlocks.reduce((earliest, block) => 
        block.startTime < earliest ? block.startTime : earliest, '23:59'
      );
      const latestEnd = availableBlocks.reduce((latest, block) => 
        block.endTime > latest ? block.endTime : latest, '00:00'
      );
      
      Object.keys(baseSchedule).forEach(day => {
        baseSchedule[day] = {
          isAvailable: true,
          startTime: earliestStart,
          endTime: latestEnd,
          mealBreaks: []
        };
      });
    }

    const currentPomodoroState = pomodoroOverride !== undefined ? pomodoroOverride : pomodoroEnabled;
    
    const updatedPreferences = {
      ...userPreferences,
      weeklySchedule: baseSchedule,
      blockLengthMinutes: sessionLength,
      breakLengthMinutes: currentPomodoroState ? breakLength : 0
    };

    const result = generateIntelligentSchedule(tasksToSchedule, updatedPreferences, 7);
    setSessions(result.sessions);
    setHasGeneratedPlan(true);
    
    // Show feedback to user
    if (result.suggestions.length > 0) {
      console.log('Scheduling suggestions:', result.suggestions);
    }
    if (result.conflicts.length > 0) {
      console.log('Scheduling conflicts:', result.conflicts);
    }
    console.log(`Scheduled ${result.coverage.toFixed(0)}% of total task hours`);
  };

  const generatePlan = () => {
    generateScheduleWithTasks(tasks);
  };

  const handleUpdateBlocks = (blocks: TimeBlock[]) => {
    setAvailableBlocks(blocks);
    if (hasGeneratedPlan && tasks.length > 0) {
      setTimeout(() => generateScheduleWithTasks(tasks), 100);
    }
  };

  const handleUpdatePomodoro = (enabled: boolean) => {
    setPomodoroEnabled(enabled);
    if (hasGeneratedPlan && tasks.length > 0) {
      // Pass the new enabled value directly to avoid stale state
      setTimeout(() => generateScheduleWithTasks(tasks, enabled), 100);
    }
  };

  const handleUpdateSessionLength = (minutes: number) => {
    setSessionLength(minutes);
    if (hasGeneratedPlan && tasks.length > 0) {
      setTimeout(() => generateScheduleWithTasks(tasks), 100);
    }
  };

  const handleUpdateBreakLength = (minutes: number) => {
    setBreakLength(minutes);
    if (hasGeneratedPlan && tasks.length > 0) {
      setTimeout(() => generateScheduleWithTasks(tasks), 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Google Calendar style header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal text-foreground font-dm-serif">
              Clarity
            </h1>
            <Button 
              onClick={() => setShowAddTask(true)} 
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar for tasks */}
          <div className="w-80 border-r border-border h-screen overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-foreground mb-4">Tasks</h2>
                <div className="space-y-2">
                  {openTasks.map(task => {
                    const course = courses.find(c => c.id === task.courseId) || {
                      id: task.courseId,
                      name: 'Unknown Course',
                      color: '#4285f4'
                    };
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        course={course}
                        onComplete={handleCompleteTask}
                      />
                    );
                  })}
                  
                  {openTasks.length === 0 && (
                    <div className="py-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                      <p className="text-sm text-muted-foreground">
                        Add new tasks to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main calendar area */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div></div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSettings(true)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>

            {hasGeneratedPlan && sessions.length > 0 ? (
              <CalendarView
                sessions={sessions}
                tasks={tasks}
                courses={courses}
                onCompleteSession={handleCompleteSession}
              />
            ) : openTasks.length > 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">Ready to schedule?</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Your tasks will be automatically scheduled when you add them.
                  </p>
                  <Button 
                    onClick={generatePlan} 
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-full px-6"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Schedule Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No schedule yet</h3>
                  <p className="text-muted-foreground">
                    Add some tasks to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showAddTask && (
          <SequentialTaskForm
            courses={courses}
            onAddTask={handleAddTask}
            onAddCourse={handleAddCourse}
            onClose={() => setShowAddTask(false)}
          />
        )}

        {showSettings && (
          <StudySettings
            availableBlocks={availableBlocks}
            pomodoroEnabled={pomodoroEnabled}
            sessionLength={sessionLength}
            breakLength={breakLength}
            onUpdateBlocks={handleUpdateBlocks}
            onUpdatePomodoro={handleUpdatePomodoro}
            onUpdateSessionLength={handleUpdateSessionLength}
            onUpdateBreakLength={handleUpdateBreakLength}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}