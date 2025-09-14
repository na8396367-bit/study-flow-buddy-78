import { Task, AvailabilityWindow, PlanSession, UserPreferences } from "@/types";
import { STUDY_METHODS, STUDY_TIPS } from "@/types";
import { addMinutes, isAfter, isBefore, format } from "date-fns";

export interface ScheduleResult {
  sessions: PlanSession[];
  conflicts: string[];
  totalPlannedHours: number;
}

export function generateSchedule(
  tasks: Task[],
  availability: AvailabilityWindow[],
  preferences: UserPreferences
): ScheduleResult {
  const openTasks = tasks.filter(t => t.status === 'open');
  const sessions: PlanSession[] = [];
  const conflicts: string[] = [];

  // Create study blocks from availability
  const studyBlocks = createStudyBlocks(availability, preferences);
  
  // Sort tasks by priority and urgency
  const sortedTasks = sortTasksByPriority(openTasks);
  
  // Allocate sessions for each task
  for (const task of sortedTasks) {
    const taskSessions = allocateTaskSessions(task, studyBlocks, preferences);
    
    if (taskSessions.length === 0) {
      conflicts.push(`No available time for "${task.title}" before ${format(task.dueAt, 'MMM d')}`);
      continue;
    }
    
    sessions.push(...taskSessions);
    
    // Remove allocated blocks
    taskSessions.forEach(session => {
      const blockIndex = studyBlocks.findIndex(block => 
        block.startAt.getTime() === session.startAt.getTime()
      );
      if (blockIndex >= 0) {
        studyBlocks.splice(blockIndex, 1);
      }
    });
  }

  // Add breaks between sessions
  const sessionsWithBreaks = addBreaksToSessions(sessions, preferences);
  
  const totalPlannedHours = sessions.reduce((total, session) => {
    const duration = (session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60 * 60);
    return total + duration;
  }, 0);

  return {
    sessions: sessionsWithBreaks,
    conflicts,
    totalPlannedHours
  };
}

function createStudyBlocks(
  availability: AvailabilityWindow[],
  preferences: UserPreferences
): Array<{ startAt: Date; endAt: Date }> {
  const blocks: Array<{ startAt: Date; endAt: Date }> = [];
  const blockDuration = preferences.blockLengthMinutes;
  
  const studyWindows = availability.filter(w => w.type === 'available');
  
  for (const window of studyWindows) {
    let currentStart = new Date(window.startAt);
    
    while (currentStart < window.endAt) {
      const blockEnd = addMinutes(currentStart, blockDuration);
      
      if (blockEnd <= window.endAt) {
        // Check for conflicts with meals/sleep
        const hasConflict = availability.some(conflict => 
          (conflict.type === 'meal' || conflict.type === 'sleep' || conflict.type === 'no-study') &&
          (
            (currentStart >= conflict.startAt && currentStart < conflict.endAt) ||
            (blockEnd > conflict.startAt && blockEnd <= conflict.endAt) ||
            (currentStart <= conflict.startAt && blockEnd >= conflict.endAt)
          )
        );
        
        if (!hasConflict) {
          blocks.push({ startAt: new Date(currentStart), endAt: new Date(blockEnd) });
        }
      }
      
      currentStart = addMinutes(currentStart, blockDuration + preferences.breakLengthMinutes);
    }
  }
  
  return blocks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function sortTasksByPriority(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Calculate urgency (days until due)
    const now = new Date();
    const urgencyA = Math.max(1, (a.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgencyB = Math.max(1, (b.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Priority weights
    const priorityWeight = { low: 1, medium: 1.3, high: 1.7 };
    
    // Calculate scores
    const scoreA = (1 / urgencyA) * priorityWeight[a.priority] * (1 + (a.difficulty - 3) * 0.1);
    const scoreB = (1 / urgencyB) * priorityWeight[b.priority] * (1 + (b.difficulty - 3) * 0.1);
    
    return scoreB - scoreA; // Higher score first
  });
}

function allocateTaskSessions(
  task: Task,
  availableBlocks: Array<{ startAt: Date; endAt: Date }>,
  preferences: UserPreferences
): PlanSession[] {
  const sessions: PlanSession[] = [];
  const totalMinutesNeeded = task.estHours * 60;
  const blockDuration = preferences.blockLengthMinutes;
  
  let remainingMinutes = totalMinutesNeeded;
  
  for (const block of availableBlocks) {
    if (remainingMinutes <= 0) break;
    if (isAfter(block.startAt, task.dueAt)) continue; // Don't schedule after due date
    
    const sessionDuration = Math.min(blockDuration, remainingMinutes);
    const sessionEnd = addMinutes(block.startAt, sessionDuration);
    
    if (sessionEnd <= block.endAt) {
      sessions.push({
        id: `${task.id}-${sessions.length}`,
        taskId: task.id,
        startAt: new Date(block.startAt),
        endAt: sessionEnd,
        method: STUDY_METHODS[task.type],
        tip: STUDY_TIPS[task.type],
        status: 'planned'
      });
      
      remainingMinutes -= sessionDuration;
    }
  }
  
  return sessions;
}

function addBreaksToSessions(
  sessions: PlanSession[],
  preferences: UserPreferences
): PlanSession[] {
  const allBlocks: PlanSession[] = [];
  const sortedSessions = [...sessions].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  
  for (let i = 0; i < sortedSessions.length; i++) {
    allBlocks.push(sortedSessions[i]);
    
    // Add break after session (except for the last one)
    if (i < sortedSessions.length - 1) {
      const nextSession = sortedSessions[i + 1];
      const currentEnd = sortedSessions[i].endAt;
      
      // Check if there's a natural gap for a break
      const gapMinutes = (nextSession.startAt.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes >= preferences.breakLengthMinutes && gapMinutes <= preferences.breakLengthMinutes + 30) {
        allBlocks.push({
          id: `break-${i}`,
          taskId: '',
          startAt: new Date(currentEnd),
          endAt: addMinutes(currentEnd, preferences.breakLengthMinutes),
          method: 'break',
          tip: 'Take a moment to stretch, hydrate, and rest your mind.',
          status: 'planned'
        });
      }
    }
  }
  
  return allBlocks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}