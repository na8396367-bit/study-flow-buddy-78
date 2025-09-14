import { useState, useEffect } from "react";
import { Task, Course, PlanSession, UserPreferences, AvailabilityWindow } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { SessionBlock } from "@/components/SessionBlock";
import { AddTaskForm } from "@/components/AddTaskForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, AlertTriangle, Sparkles } from "lucide-react";
import { generateSchedule } from "@/lib/scheduler";
import { format, isToday, addDays } from "date-fns";

// Sample data for MVP
const sampleCourses: Course[] = [
  { id: "1", name: "Biology 101", color: "#22c55e" },
  { id: "2", name: "Economics", color: "#3b82f6" },
  { id: "3", name: "History", color: "#f59e0b" }
];

const sampleTasks: Task[] = [
  {
    id: "1",
    courseId: "1",
    title: "Study Cell Division",
    type: "memorization",
    dueAt: addDays(new Date(), 2),
    estHours: 2,
    difficulty: 3,
    priority: "high",
    status: "open"
  },
  {
    id: "2", 
    courseId: "2",
    title: "Supply & Demand Problem Set",
    type: "problem-set",
    dueAt: addDays(new Date(), 1),
    estHours: 3,
    difficulty: 4,
    priority: "medium",
    status: "open"
  }
];

const sampleAvailability: AvailabilityWindow[] = [
  {
    id: "1",
    type: "available",
    startAt: new Date(new Date().setHours(16, 0, 0, 0)), // 4 PM today
    endAt: new Date(new Date().setHours(19, 30, 0, 0)), // 7:30 PM today
    label: "Evening Study"
  },
  {
    id: "2",
    type: "meal",
    startAt: new Date(new Date().setHours(18, 30, 0, 0)), // 6:30 PM
    endAt: new Date(new Date().setHours(19, 0, 0, 0)), // 7 PM
    label: "Dinner"
  }
];

const defaultPreferences: UserPreferences = {
  blockLengthMinutes: 50,
  breakLengthMinutes: 10,
  dayStart: "08:00",
  dayEnd: "22:00"
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [courses] = useState<Course[]>(sampleCourses);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);

  const openTasks = tasks.filter(t => t.status === 'open');
  const todaySessions = sessions.filter(s => isToday(s.startAt));
  const completedToday = todaySessions.filter(s => s.status === 'done').length;

  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString()
    };
    setTasks([...tasks, newTask]);
    setShowAddTask(false);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: 'done' as const } : t
    ));
  };

  const handleCompleteSession = (sessionId: string) => {
    setSessions(sessions.map(s =>
      s.id === sessionId ? { ...s, status: 'done' as const } : s
    ));
  };

  const generatePlan = () => {
    const result = generateSchedule(tasks, sampleAvailability, defaultPreferences);
    setSessions(result.sessions);
    setHasGeneratedPlan(true);
  };

  return (
    <div className="min-h-screen bg-gradient-calm">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            StudyFlow
          </h1>
          <p className="text-muted-foreground">
            Turn assignments into a realistic, kind daily plan ✨
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-gradient-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Open Tasks</p>
                <p className="text-2xl font-bold">{openTasks.length}</p>
              </div>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Today's Sessions</p>
                <p className="text-2xl font-bold">{todaySessions.length}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {completedToday} done
              </Badge>
            </div>
          </Card>

          <Card className="p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Study Hours</p>
                <p className="text-2xl font-bold">
                  {openTasks.reduce((sum, task) => sum + task.estHours, 0)}h
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Tasks</h2>
              <Button onClick={() => setShowAddTask(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {showAddTask && (
              <div className="mb-6">
                <AddTaskForm
                  courses={courses}
                  onAddTask={handleAddTask}
                  onClose={() => setShowAddTask(false)}
                />
              </div>
            )}

            <div className="space-y-4">
              {openTasks.map(task => {
                const course = courses.find(c => c.id === task.courseId)!;
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
                <Card className="p-8 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground mb-4">
                    You've completed all your tasks. Time to add some new ones or take a well-deserved break.
                  </p>
                  <Button variant="outline" onClick={() => setShowAddTask(true)}>
                    Add Your First Task
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Plan Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Today's Plan</h2>
              {openTasks.length > 0 && (
                <Button 
                  onClick={generatePlan}
                  variant={hasGeneratedPlan ? "outline" : "default"}
                  className="bg-gradient-focus hover:bg-gradient-focus/90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {hasGeneratedPlan ? "Regenerate Plan" : "Generate Plan"}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {todaySessions.length > 0 ? (
                todaySessions.map(session => {
                  if (session.method === 'break' || session.method === 'meal') {
                    return (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        task={{} as Task}
                        course={{} as Course}
                      />
                    );
                  }
                  
                  const task = tasks.find(t => t.id === session.taskId)!;
                  const course = courses.find(c => c.id === task.courseId)!;
                  
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
              ) : !hasGeneratedPlan && openTasks.length > 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Ready to create your plan?</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a personalized study schedule with breaks and helpful tips.
                  </p>
                  <Button onClick={generatePlan} className="bg-gradient-focus hover:bg-gradient-focus/90">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Your Plan
                  </Button>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No study sessions today</h3>
                  <p className="text-muted-foreground">
                    Add some tasks to get started with your personalized study plan.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}