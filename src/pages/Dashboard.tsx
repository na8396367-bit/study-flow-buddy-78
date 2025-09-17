import { useState, useEffect } from "react";
import { Task, Course, PlanSession, UserPreferences, AvailabilityWindow } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { SessionBlock } from "@/components/SessionBlock";
import { SequentialTaskForm } from "@/components/SequentialTaskForm";
import { ScheduleSettings } from "@/components/ScheduleSettings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Settings, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { generateIntelligentSchedule, getDefaultEnhancedPreferences, EnhancedUserPreferences } from "@/lib/timezone-scheduler";
import { format, isToday, addDays } from "date-fns";

// Empty courses array - users will add their own
const initialCourses: Course[] = [];

// Start with empty tasks - users add their own
const initialTasks: Task[] = [];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [planNeedsUpdate, setPlanNeedsUpdate] = useState(false);
  const [userPreferences, setUserPreferences] = useState<EnhancedUserPreferences>(getDefaultEnhancedPreferences());

  const openTasks = tasks.filter(t => t.status === 'open');
  const todaySessions = sessions.filter(s => isToday(s.startAt));

  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString()
    };
    setTasks([...tasks, newTask]);
    setShowAddTask(false);
    
    // Mark plan as needing update
    if (hasGeneratedPlan) {
      setPlanNeedsUpdate(true);
    }
  };

  const handleAddCourse = (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString()
    };
    setCourses([...courses, newCourse]);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: 'done' as const } : t
    ));
    
    // Mark plan as needing update
    if (hasGeneratedPlan) {
      setPlanNeedsUpdate(true);
    }
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(sessions.map(s =>
      s.id === sessionId ? { ...s, status: 'done' as const } : s
    ));
  };

  const generatePlan = () => {
    const result = generateIntelligentSchedule(tasks, userPreferences, 7);
    setSessions(result.sessions);
    setHasGeneratedPlan(true);
    setPlanNeedsUpdate(false);
    
    // Show feedback to user
    if (result.suggestions.length > 0) {
      console.log('Scheduling suggestions:', result.suggestions);
    }
    if (result.conflicts.length > 0) {
      console.log('Scheduling conflicts:', result.conflicts);
    }
    console.log(`Scheduled ${result.coverage.toFixed(0)}% of total task hours`);
  };

  const updatePlan = () => {
    generatePlan();
  };

  const handleSaveSettings = (newPreferences: EnhancedUserPreferences) => {
    setUserPreferences(newPreferences);
    // Automatically regenerate plan if it exists
    if (hasGeneratedPlan) {
      const result = generateIntelligentSchedule(tasks, newPreferences, 7);
      setSessions(result.sessions);
      setPlanNeedsUpdate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Clarity
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <Button 
                onClick={() => setShowAddTask(true)} 
                className="bg-gradient-focus hover:bg-gradient-focus/90 hover:shadow-hover hover:scale-110 transform transition-all ease-bounce"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-4">
              {openTasks.map(task => {
                const course = courses.find(c => c.id === task.courseId) || {
                  id: task.courseId,
                  name: 'Unknown Course',
                  color: '#3b82f6'
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
              
              {openTasks.length === 0 && !showAddTask && (
                <Card className="p-8 text-center bg-background/60 backdrop-blur-sm border-0">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h3 className="text-xl font-semibold mb-2">All done! 🎉</h3>
                  <p className="text-muted-foreground">
                    Take a break or add more tasks when you're ready
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Plan Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Plan</h2>
                {planNeedsUpdate && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Needs Update
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {hasGeneratedPlan && planNeedsUpdate && (
                  <Button 
                    onClick={updatePlan}
                    size="sm" 
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update Plan
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSettings(true)}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {todaySessions.length > 0 ? (
                todaySessions.map(session => {
                  if (session.type === 'break' || session.type === 'meal') {
                    return (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        task={{} as Task}
                        course={{} as Course}
                      />
                    );
                  }
                  
                  const task = tasks.find(t => t.id === session.taskId);
                  const course = courses.find(c => c.id === task?.courseId) || {
                    id: task?.courseId || '',
                    name: 'Unknown Course',
                    color: '#3b82f6'
                  };
                  
                  if (!task) return null;
                  
                  return (
                    <SessionBlock
                      key={session.id}
                      session={session}
                      task={task}
                      course={course}
                      onComplete={handleCompleteSession}
                    />
                  );
                })
              ) : openTasks.length > 0 ? (
                <Card className="p-8 text-center bg-background/60 backdrop-blur-sm border-0">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Plan?</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an optimized schedule for all your tasks considering priorities, deadlines, and constraints
                  </p>
                  <Button 
                    onClick={generatePlan} 
                    size="lg" 
                    className="bg-gradient-focus hover:bg-gradient-focus/90 hover:shadow-glow hover:scale-110 transform transition-all ease-bounce"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Intelligent Plan
                  </Button>
                </Card>
              ) : (
                <Card className="p-8 text-center bg-background/60 backdrop-blur-sm border-0">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No plan yet</h3>
                  <p className="text-muted-foreground">
                    Add tasks first
                  </p>
                </Card>
              )}
            </div>
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
          <ScheduleSettings
            preferences={userPreferences}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}