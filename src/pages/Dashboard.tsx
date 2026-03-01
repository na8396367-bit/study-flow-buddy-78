import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Task, Course, PlanSession } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { SequentialTaskForm } from "@/components/SequentialTaskForm";
import { StudySettings } from "@/components/StudySettings";
import { CalendarView } from "@/components/CalendarView";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { StudyStats } from "@/components/StudyStats";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Sparkles, Menu, X } from "lucide-react";
import { generateIntelligentSchedule, getDefaultEnhancedPreferences } from "@/lib/timezone-scheduler";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

const SAMPLE_COURSES: Course[] = [
  { id: "sample-1", name: "Computer Science", color: "#3b82f6" },
  { id: "sample-2", name: "Mathematics", color: "#22c55e" },
  { id: "sample-3", name: "History", color: "#f59e0b" },
];

const makeSampleTasks = (): Task[] => {
  const now = new Date();
  return [
    { id: "s1", courseId: "sample-1", title: "Read Chapter 5 – Data Structures", type: "reading", dueAt: new Date(now.getTime() + 3 * 86400000), estHours: 2, difficulty: 3, priority: "high", status: "open" },
    { id: "s2", courseId: "sample-2", title: "Problem Set 4 – Linear Algebra", type: "problem-set", dueAt: new Date(now.getTime() + 5 * 86400000), estHours: 1.5, difficulty: 4, priority: "medium", status: "open" },
    { id: "s3", courseId: "sample-3", title: "Essay Draft – Industrial Revolution", type: "essay", dueAt: new Date(now.getTime() + 7 * 86400000), estHours: 3, difficulty: 2, priority: "low", status: "open" },
  ];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useLocalStorage<Task[]>("clarity-tasks", []);
  const [courses, setCourses] = useLocalStorage<Course[]>("clarity-courses", []);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [showOnboarding, setShowOnboarding] = useLocalStorage<boolean>("clarity-onboarding", true);
  const [availableBlocks, setAvailableBlocks] = useLocalStorage<TimeBlock[]>("clarity-blocks", [
    { id: "1", startTime: "09:00", endTime: "12:00", label: "Morning" },
    { id: "2", startTime: "14:00", endTime: "17:00", label: "Afternoon" },
  ]);
  const [pomodoroEnabled, setPomodoroEnabled] = useLocalStorage<boolean>("clarity-pomodoro", false);
  const [sessionLength, setSessionLength] = useLocalStorage<number>("clarity-session-len", 45);
  const [breakLength, setBreakLength] = useLocalStorage<number>("clarity-break-len", 15);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openTasks = tasks.filter(t => t.status === "open");

  // Auto-generate schedule on mount if there are tasks
  useEffect(() => {
    if (tasks.length > 0 && !hasGeneratedPlan) {
      generateScheduleWithTasks(tasks);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateScheduleWithTasks = (tasksToSchedule: Task[], pomodoroOverride?: boolean, blocksOverride?: TimeBlock[]) => {
    const openOnly = tasksToSchedule.filter(t => t.status === "open");
    if (openOnly.length === 0) {
      setSessions([]);
      setHasGeneratedPlan(true);
      return;
    }

    const baseSchedule: Record<string, any> = {};
    ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].forEach(day => {
      baseSchedule[day] = { isAvailable: false, startTime: "09:00", endTime: "17:00", mealBreaks: [] };
    });

    const currentBlocks = blocksOverride || availableBlocks;
    if (currentBlocks.length === 0) {
      Object.keys(baseSchedule).forEach(day => {
        baseSchedule[day].isAvailable = true;
      });
    }

    const currentPomodoro = pomodoroOverride !== undefined ? pomodoroOverride : pomodoroEnabled;
    const prefs = {
      ...getDefaultEnhancedPreferences(),
      weeklySchedule: baseSchedule,
      blockLengthMinutes: sessionLength,
      breakLengthMinutes: currentPomodoro ? breakLength : 0,
      availableTimeBlocks: currentBlocks,
    };

    try {
      const result = generateIntelligentSchedule(tasksToSchedule, prefs, 7);
      setSessions(result.sessions);
      setHasGeneratedPlan(true);
    } catch (e) {
      console.error("Schedule generation failed:", e);
      toast.error("Failed to generate schedule. Please check your settings.");
    }
  };

  const handleAddTask = (taskData: Omit<Task, "id">) => {
    if (!taskData.title.trim()) {
      toast.error("Task name cannot be empty.");
      return;
    }
    if (taskData.estHours <= 0) {
      toast.error("Estimated time must be greater than zero.");
      return;
    }
    const newTask: Task = { ...taskData, id: Date.now().toString() };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setShowAddTask(false);
    toast.success(`"${newTask.title}" added`);
    setTimeout(() => generateScheduleWithTasks(updated), 100);
  };

  const handleAddCourse = (courseData: Omit<Course, "id">) => {
    const newCourse: Course = { ...courseData, id: Date.now().toString() };
    setCourses([...courses, newCourse]);
  };

  const handleCompleteTask = (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: "done" as const } : t);
    setTasks(updated);
    toast.success("Task completed!");
    setTimeout(() => generateScheduleWithTasks(updated), 100);
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: s.status === "done" ? "planned" as const : "done" as const } : s
    ));
  };

  const handleUpdateBlocks = (blocks: TimeBlock[]) => {
    setAvailableBlocks(blocks);
    if (tasks.length > 0) {
      setSessions([]);
      setTimeout(() => { generateScheduleWithTasks(tasks, undefined, blocks); setHasGeneratedPlan(true); }, 10);
    }
  };

  const handleUpdatePomodoro = (enabled: boolean) => {
    setPomodoroEnabled(enabled);
    if (hasGeneratedPlan && tasks.length > 0) setTimeout(() => generateScheduleWithTasks(tasks, enabled), 100);
  };

  const handleUpdateSessionLength = (minutes: number) => {
    setSessionLength(minutes);
    if (hasGeneratedPlan && tasks.length > 0) setTimeout(() => generateScheduleWithTasks(tasks), 100);
  };

  const handleUpdateBreakLength = (minutes: number) => {
    setBreakLength(minutes);
    if (hasGeneratedPlan && tasks.length > 0) setTimeout(() => generateScheduleWithTasks(tasks), 100);
  };

  const loadSampleData = () => {
    setCourses(SAMPLE_COURSES);
    const sampleTasks = makeSampleTasks();
    setTasks(sampleTasks);
    setTimeout(() => generateScheduleWithTasks(sampleTasks), 100);
    toast.success("Sample data loaded!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/20 via-sky-200/10 to-cyan-200/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-40 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl animate-float hidden md:block" />
        <div className="absolute bottom-40 left-32 w-72 h-72 bg-gradient-to-br from-cyan-200/15 to-sky-200/20 rounded-full blur-3xl animate-float hidden md:block" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="border-b border-blue-200/30 backdrop-blur-sm bg-white/40 px-4 md:px-6 py-3 md:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 w-8 p-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <button
                onClick={() => navigate("/")}
                className="text-xl md:text-2xl font-normal bg-gradient-to-br from-slate-700 via-blue-800 to-cyan-700 bg-clip-text text-transparent font-dm-serif hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                Clarity
              </button>
            </div>
            <Button
              onClick={() => setShowAddTask(true)}
              className="bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-400 hover:from-blue-500 hover:via-sky-600 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-300/25 hover:scale-105 transform transition-all duration-300 ease-out font-medium rounded-full px-4 md:px-6 border-0 text-sm md:text-base"
            >
              <Plus className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Create</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <div className="flex relative">
          {/* Sidebar – responsive: overlay on mobile, static on desktop */}
          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <div className={`
            fixed md:static top-0 left-0 h-full md:h-auto z-30 md:z-auto
            w-72 md:w-80 border-r border-blue-200/30 backdrop-blur-sm bg-white/80 md:bg-white/30
            md:block overflow-y-auto transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            pt-16 md:pt-0
          `}>
            <div className="p-4 md:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent mb-4">Tasks</h2>
                <div className="space-y-2">
                  {openTasks.map(task => {
                    const course = courses.find(c => c.id === task.courseId) || { id: task.courseId, name: "Unknown", color: "#4285f4" };
                    return <TaskCard key={task.id} task={task} course={course} onComplete={handleCompleteTask} />;
                  })}
                  {openTasks.length === 0 && (
                    <div className="py-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                      <p className="text-sm text-muted-foreground">Add new tasks to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Study Stats */}
              <StudyStats sessions={sessions} tasks={tasks} />
            </div>
          </div>

          {/* Main calendar area */}
          <div className="flex-1 p-4 md:p-6 min-w-0">
            <div className="flex items-center justify-end mb-4 md:mb-6">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>

            {hasGeneratedPlan && sessions.filter(s => s.type === "task").length > 0 ? (
              <CalendarView sessions={sessions} tasks={tasks} courses={courses} onCompleteSession={handleCompleteSession} />
            ) : (
              <div className="flex items-center justify-center h-64 md:h-96">
                <div className="text-center px-4">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No schedule yet</h3>
                  <p className="text-muted-foreground mb-4">Add some tasks to get started</p>
                  <Button onClick={() => setShowAddTask(true)} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Add your first task
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showAddTask && (
          <SequentialTaskForm courses={courses} onAddTask={handleAddTask} onAddCourse={handleAddCourse} onClose={() => setShowAddTask(false)} />
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
        {showOnboarding && (
          <OnboardingOverlay onComplete={() => setShowOnboarding(false)} onLoadSampleData={loadSampleData} />
        )}
      </div>
    </div>
  );
}
