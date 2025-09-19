import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      s.id === sessionId ? { 
        ...s, 
        status: s.status === 'done' ? 'planned' as const : 'done' as const 
      } : s
    ));
  };

  const generateScheduleWithTasks = (tasksToSchedule: Task[], pomodoroOverride?: boolean, blocksOverride?: TimeBlock[]) => {
    // Create base schedule with no availability
    const baseSchedule = {
      monday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      tuesday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      wednesday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      thursday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      friday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] },
      sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00', mealBreaks: [] }
    };

    // If no available blocks defined, use default 9-5 schedule
    if (availableBlocks.length === 0) {
      Object.keys(baseSchedule).forEach(day => {
        baseSchedule[day] = {
          isAvailable: true,
          startTime: '09:00',
          endTime: '17:00',
          mealBreaks: []
        };
      });
    }

    const currentPomodoroState = pomodoroOverride !== undefined ? pomodoroOverride : pomodoroEnabled;
    
    const currentBlocks = blocksOverride || availableBlocks;
    
    const updatedPreferences = {
      ...userPreferences,
      weeklySchedule: baseSchedule,
      blockLengthMinutes: sessionLength,
      breakLengthMinutes: currentPomodoroState ? breakLength : 0,
      availableTimeBlocks: currentBlocks // Pass the specific time blocks to the scheduler
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
    // Always regenerate schedule when time blocks change, if there are tasks
    if (tasks.length > 0) {
      // Pass the new blocks directly to avoid race condition
      generateScheduleWithTasks(tasks, undefined, blocks);
      setHasGeneratedPlan(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
      {/* Background pattern matching home page */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/20 via-sky-200/10 to-cyan-200/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
      </div>
      
      {/* Subtle floating orbs for ambient feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-40 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 left-32 w-72 h-72 bg-gradient-to-br from-cyan-200/15 to-sky-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced header with gradient and glass effect */}
        <div className="border-b border-blue-200/30 backdrop-blur-sm bg-white/40 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')}
              className="text-2xl font-normal bg-gradient-to-br from-slate-700 via-blue-800 to-cyan-700 bg-clip-text text-transparent font-dm-serif hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              Clarity
            </button>
            <Button 
              onClick={() => setShowAddTask(true)} 
              className="bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400 hover:from-blue-500 hover:via-sky-600 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-300/25 hover:scale-105 transform transition-all duration-300 ease-out font-medium rounded-full px-6 border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Enhanced sidebar with glass effect */}
          <div className="w-80 border-r border-blue-200/30 backdrop-blur-sm bg-white/30 h-screen overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent mb-4">Tasks</h2>
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