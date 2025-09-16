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

// Empty courses array - users will add their own
const initialCourses: Course[] = [];

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
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
            Clarity
          </h1>
          <p className="text-muted-foreground">
            Your personalized study plan
          </p>
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

            {showAddTask && (
              <div className="mb-6">
                <AddTaskForm
                  courses={courses}
                  onAddTask={handleAddTask}
                  onAddCourse={handleAddCourse}
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
              <h2 className="text-xl font-semibold">Today</h2>
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
              ) : openTasks.length > 0 ? (
                <Card className="p-8 text-center bg-background/60 backdrop-blur-sm border-0">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h3 className="text-xl font-semibold mb-2">Ready?</h3>
                  <p className="text-muted-foreground mb-6">
                    Let's create your plan
                  </p>
                  <Button 
                    onClick={generatePlan} 
                    size="lg" 
                    className="bg-gradient-focus hover:bg-gradient-focus/90 hover:shadow-glow hover:scale-110 transform transition-all ease-bounce"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Plan
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
      </div>
    </div>
  );
}