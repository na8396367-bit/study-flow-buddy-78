import { PlanSession, Task } from "@/types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";

interface StudyStatsProps {
  sessions: PlanSession[];
  tasks: Task[];
}

export function StudyStats({ sessions, tasks }: StudyStatsProps) {
  const taskSessions = sessions.filter(s => s.type === 'task');
  const completedSessions = taskSessions.filter(s => s.status === 'done');
  const totalMinutes = taskSessions.reduce((acc, s) => acc + (s.endAt.getTime() - s.startAt.getTime()) / 60000, 0);
  const completedMinutes = completedSessions.reduce((acc, s) => acc + (s.endAt.getTime() - s.startAt.getTime()) / 60000, 0);
  const completionPct = taskSessions.length > 0 ? Math.round((completedSessions.length / taskSessions.length) * 100) : 0;

  const openTasks = tasks.filter(t => t.status === 'open').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const stats = [
    { icon: CheckCircle2, label: "Sessions Done", value: `${completedSessions.length}/${taskSessions.length}`, color: "text-emerald-600" },
    { icon: Clock, label: "Time Studied", value: `${Math.round(completedMinutes)}m`, color: "text-primary" },
    { icon: Target, label: "Tasks Left", value: `${openTasks}`, color: "text-amber-600" },
    { icon: TrendingUp, label: "Completed", value: `${doneTasks}`, color: "text-emerald-600" },
  ];

  if (taskSessions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Progress</h3>
      <div className="space-y-2">
        <Progress value={completionPct} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">{completionPct}% of sessions complete</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-2 rounded-lg bg-muted/30 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className="text-sm font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
