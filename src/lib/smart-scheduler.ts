import { Task, PlanSession, TimeConstraint } from "@/types";
import { EnhancedUserPreferences } from "./timezone-scheduler";
import { addMinutes, isAfter, isBefore, format, startOfDay, endOfDay, addDays, getDay } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export interface ScheduleResult {
  sessions: PlanSession[];
  conflicts: string[];
  suggestions: string[];
  totalPlannedHours: number;
  coverage: number;
}

export function generateOptimalSchedule(
  tasks: Task[],
  preferences: EnhancedUserPreferences,
  daysAhead: number = 7
): ScheduleResult {
  const userTimezone = preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = toZonedTime(new Date(), userTimezone);
  
  const openTasks = tasks.filter(t => t.status === 'open');
  const sessions: PlanSession[] = [];
  const conflicts: string[] = [];
  const suggestions: string[] = [];

  if (openTasks.length === 0) {
    return {
      sessions: [],
      conflicts: [],
      suggestions: ['Add some tasks to get started with your personalized study plan!'],
      totalPlannedHours: 0,
      coverage: 100
    };
  }

  // Generate time slots for the next X days
  const timeSlots = generateAvailableTimeSlots(now, daysAhead, preferences, userTimezone);
  
  // Sort tasks by priority and deadline
  const prioritizedTasks = prioritizeTasks(openTasks, userTimezone);
  
  // Allocate optimal time slots
  let totalTaskHours = openTasks.reduce((sum, task) => sum + task.estHours, 0);
  let scheduledHours = 0;
  let availableSlots = [...timeSlots];

  for (const task of prioritizedTasks) {
    const taskSessions = allocateTaskSessions(task, availableSlots, preferences, userTimezone);
    
    if (taskSessions.length === 0) {
      const dueDateFormatted = formatInTimeZone(task.dueAt, userTimezone, 'MMM d, h:mm a');
      conflicts.push(`Cannot schedule "${task.title}" before ${dueDateFormatted} - not enough available time`);
      continue;
    }
    
    sessions.push(...taskSessions);
    scheduledHours += taskSessions.reduce((total, session) => {
      return total + (session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    // Remove allocated slots
    taskSessions.forEach(session => {
      const slotIndex = availableSlots.findIndex(slot => 
        slot.startAt.getTime() === session.startAt.getTime()
      );
      if (slotIndex >= 0) {
        availableSlots.splice(slotIndex, 1);
      }
    });
  }

  // Add breaks between sessions
  const sessionsWithBreaks = addOptimalBreaks(sessions, preferences);
  
  // Generate suggestions
  generateSchedulingSuggestions(openTasks, sessions, preferences, suggestions, availableSlots);

  const coverage = totalTaskHours > 0 ? (scheduledHours / totalTaskHours) * 100 : 100;

  return {
    sessions: sessionsWithBreaks,
    conflicts,
    suggestions,
    totalPlannedHours: scheduledHours,
    coverage
  };
}

function generateAvailableTimeSlots(
  startDate: Date,
  daysAhead: number,
  preferences: EnhancedUserPreferences,
  timezone: string
): Array<{ startAt: Date; endAt: Date; priority: number }> {
  const slots: Array<{ startAt: Date; endAt: Date; priority: number }> = [];
  
  // Use specific time blocks if available
  const availableBlocks = (preferences as any).availableTimeBlocks || [];
  
  for (let i = 0; i < daysAhead; i++) {
    const currentDate = addDays(startDate, i);
    
    if (availableBlocks.length > 0) {
      // Use specific time blocks
      for (const block of availableBlocks) {
        const blockStart = new Date(currentDate);
        const [startHour, startMinute] = block.startTime.split(':').map(Number);
        blockStart.setHours(startHour, startMinute, 0, 0);
        
        const blockEnd = new Date(currentDate);
        const [endHour, endMinute] = block.endTime.split(':').map(Number);
        blockEnd.setHours(endHour, endMinute, 0, 0);
        
        // Create slots within this time block
        let currentSlotStart = new Date(blockStart);
        
        while (currentSlotStart < blockEnd) {
          const slotEnd = addMinutes(currentSlotStart, preferences.blockLengthMinutes);
          
          if (slotEnd <= blockEnd) {
            // Check if this slot conflicts with constraints
            if (!hasConstraintConflict(currentSlotStart, slotEnd, preferences, currentDate)) {
              const priority = calculateSlotPriority(currentSlotStart, preferences, timezone);
              slots.push({
                startAt: new Date(currentSlotStart),
                endAt: new Date(slotEnd),
                priority
              });
            }
          }
          
          currentSlotStart = addMinutes(currentSlotStart, preferences.blockLengthMinutes + preferences.breakLengthMinutes);
        }
      }
    } else {
      // Fallback to weekly schedule if no specific blocks
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[currentDate.getDay()];
      const daySchedule = preferences.weeklySchedule[dayName];

      if (!daySchedule || !daySchedule.isAvailable) continue;

      // Create time slots for this day
      const dayStart = new Date(currentDate);
      const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(currentDate);
      const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      // Create slots
      let currentSlotStart = new Date(dayStart);
      
      while (currentSlotStart < dayEnd) {
        const slotEnd = addMinutes(currentSlotStart, preferences.blockLengthMinutes);
        
        if (slotEnd <= dayEnd) {
          // Check if this slot conflicts with constraints
          if (!hasConstraintConflict(currentSlotStart, slotEnd, preferences, currentDate)) {
            const priority = calculateSlotPriority(currentSlotStart, preferences, timezone);
            slots.push({
              startAt: new Date(currentSlotStart),
              endAt: new Date(slotEnd),
              priority
            });
          }
        }
        
        currentSlotStart = addMinutes(currentSlotStart, preferences.blockLengthMinutes + preferences.breakLengthMinutes);
      }
    }
  }

  console.log('Total slots created:', slots.length);
  if (slots.length > 0) {
    console.log('First slot starts at:', format(slots[0].startAt, 'yyyy-MM-dd HH:mm'));
    console.log('Last slot starts at:', format(slots[slots.length - 1].startAt, 'yyyy-MM-dd HH:mm'));
  }
  return slots.sort((a, b) => b.priority - a.priority);
}

function hasConstraintConflict(
  slotStart: Date,
  slotEnd: Date,
  preferences: EnhancedUserPreferences,
  currentDate: Date
): boolean {
  const dayOfWeek = getDay(currentDate);
  
  // Check meal breaks
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
  const daySchedule = preferences.weeklySchedule[dayName];
  
  if (daySchedule?.mealBreaks) {
    for (const meal of daySchedule.mealBreaks) {
      const mealStart = new Date(currentDate);
      const [mealStartHour, mealStartMinute] = meal.start.split(':').map(Number);
      mealStart.setHours(mealStartHour, mealStartMinute, 0, 0);
      
      const mealEnd = new Date(currentDate);
      const [mealEndHour, mealEndMinute] = meal.end.split(':').map(Number);
      mealEnd.setHours(mealEndHour, mealEndMinute, 0, 0);
      
      if (
        (slotStart >= mealStart && slotStart < mealEnd) ||
        (slotEnd > mealStart && slotEnd <= mealEnd) ||
        (slotStart <= mealStart && slotEnd >= mealEnd)
      ) {
        return true;
      }
    }
  }
  
  // Check custom constraints
  for (const constraint of preferences.constraints || []) {
    if (!constraint.isRecurring) {
      if (constraint.specificDate && !isSameDay(currentDate, constraint.specificDate)) {
        continue;
      }
    } else {
      if (!constraint.days.includes(dayOfWeek)) {
        continue;
      }
    }
    
    const constraintStart = new Date(currentDate);
    const [constraintStartHour, constraintStartMinute] = constraint.startTime.split(':').map(Number);
    constraintStart.setHours(constraintStartHour, constraintStartMinute, 0, 0);
    
    const constraintEnd = new Date(currentDate);
    const [constraintEndHour, constraintEndMinute] = constraint.endTime.split(':').map(Number);
    constraintEnd.setHours(constraintEndHour, constraintEndMinute, 0, 0);
    
    if (
      (slotStart >= constraintStart && slotStart < constraintEnd) ||
      (slotEnd > constraintStart && slotEnd <= constraintEnd) ||
      (slotStart <= constraintStart && slotEnd >= constraintEnd)
    ) {
      return true;
    }
  }
  
  return false;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function calculateSlotPriority(
  slotStart: Date,
  preferences: EnhancedUserPreferences,
  timezone: string
): number {
  const hour = parseInt(formatInTimeZone(slotStart, timezone, 'H'));
  let priority = 1;

  // Boost priority based on optimal study times
  if (hour >= 6 && hour < 12 && preferences.optimalStudyTimes.morning) priority += 3;
  if (hour >= 12 && hour < 18 && preferences.optimalStudyTimes.afternoon) priority += 3;
  if (hour >= 18 && hour < 22 && preferences.optimalStudyTimes.evening) priority += 3;

  // Research-based peak focus times
  if (hour >= 9 && hour <= 11) priority += 2; // Morning peak
  if (hour >= 14 && hour <= 16) priority += 1; // Afternoon mini-peak

  return priority;
}

function prioritizeTasks(tasks: Task[], timezone: string): Task[] {
  const now = toZonedTime(new Date(), timezone);
  
  return tasks.sort((a, b) => {
    // Priority is the most important factor - use much higher weights
    const priorityWeight = { low: 1, medium: 5, high: 15 };
    
    // Calculate urgency (days until due)
    const urgencyA = Math.max(0.1, (a.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgencyB = Math.max(0.1, (b.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Task type complexity (secondary factor)
    const complexityWeight = {
      'reading': 1.0,
      'memorization': 1.1,
      'problem-set': 1.3,
      'essay': 1.5,
      'exam-prep': 1.6
    };
    
    // Primary sort: Priority (highest weight)
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Secondary sort: Urgency (if same priority)
    const urgencyScore = (1 / urgencyA) - (1 / urgencyB);
    if (Math.abs(urgencyScore) > 0.1) {
      return urgencyScore;
    }
    
    // Tertiary sort: Complexity and difficulty (if same priority and similar urgency)
    const scoreA = complexityWeight[a.type] * (1 + (a.difficulty - 3) * 0.2);
    const scoreB = complexityWeight[b.type] * (1 + (b.difficulty - 3) * 0.2);
    
    return scoreB - scoreA;
  });
}

function allocateTaskSessions(
  task: Task,
  availableSlots: Array<{ startAt: Date; endAt: Date; priority: number }>,
  preferences: EnhancedUserPreferences,
  timezone: string
): PlanSession[] {
  const sessions: PlanSession[] = [];
  const totalMinutesNeeded = Math.round(task.estHours * 60); // Round to ensure exact matching
  const optimalSessionLength = getOptimalSessionLength(task.type, task.difficulty);
  
  let remainingMinutes = totalMinutesNeeded;
  let sessionsToday = 0;
  let lastSessionDate = '';
  const maxSessionsPerDay = getMaxSessionsPerDay(task.type, task.difficulty);
  
  for (const slot of availableSlots) {
    console.log('Checking slot for task allocation:', format(slot.startAt, 'yyyy-MM-dd HH:mm'), 'to', format(slot.endAt, 'yyyy-MM-dd HH:mm'));
    if (remainingMinutes <= 0) break;
    if (isAfter(slot.startAt, task.dueAt)) continue;
    
    const currentDate = formatInTimeZone(slot.startAt, timezone, 'yyyy-MM-dd');
    
    // Reset daily session counter
    if (lastSessionDate !== currentDate) {
      sessionsToday = 0;
      lastSessionDate = currentDate;
    }
    
    if (sessionsToday >= maxSessionsPerDay) continue;
    
    const sessionDuration = Math.min(
      optimalSessionLength,
      remainingMinutes,
      preferences.blockLengthMinutes
    );
    
    const sessionEnd = addMinutes(slot.startAt, sessionDuration);
    
    if (sessionEnd <= slot.endAt) {
      console.log('Allocating session for task:', task.title, 'from', format(slot.startAt, 'HH:mm'), 'to', format(sessionEnd, 'HH:mm'));
      sessions.push({
        id: `${task.id}-${sessions.length}`,
        taskId: task.id,
        startAt: new Date(slot.startAt),
        endAt: sessionEnd,
        type: 'task',
        status: 'planned'
      });
      
      remainingMinutes -= sessionDuration;
      sessionsToday++;
    }
  }
  
  // CRITICAL: Ensure allocated time exactly matches task duration
  if (sessions.length > 0) {
    const totalAllocated = sessions.reduce((sum, session) => 
      sum + Math.round((session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60)), 0
    );
    
    const difference = totalMinutesNeeded - totalAllocated;
    
    if (difference > 0) {
      // Need to add more time - extend sessions or add new ones
      let remainingToAdd = difference;
      
      // First, try extending existing sessions within reasonable limits
      for (let i = sessions.length - 1; i >= 0 && remainingToAdd > 0; i--) {
        const session = sessions[i];
        const maxExtension = Math.min(remainingToAdd, 15); // Max 15min extension per session
        session.endAt = addMinutes(session.endAt, maxExtension);
        remainingToAdd -= maxExtension;
      }
      
      // If still need time, distribute across all sessions
      if (remainingToAdd > 0) {
        const extraPerSession = Math.ceil(remainingToAdd / sessions.length);
        sessions.forEach(session => {
          const extension = Math.min(extraPerSession, remainingToAdd);
          session.endAt = addMinutes(session.endAt, extension);
          remainingToAdd -= extension;
        });
      }
    } else if (difference < 0) {
      // Need to reduce time - trim from sessions
      let remainingToReduce = Math.abs(difference);
      
      for (let i = sessions.length - 1; i >= 0 && remainingToReduce > 0; i--) {
        const session = sessions[i];
        const currentDuration = Math.round((session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60));
        const reduction = Math.min(remainingToReduce, Math.max(0, currentDuration - 15)); // Keep min 15min sessions
        
        if (reduction > 0) {
          session.endAt = addMinutes(session.endAt, -reduction);
          remainingToReduce -= reduction;
        }
      }
    }
  }
  
  return sessions;
}

function getOptimalSessionLength(taskType: Task['type'], difficulty: number): number {
  const baseLengths = {
    'reading': 45,
    'memorization': 30,
    'problem-set': 60,
    'essay': 90,
    'exam-prep': 50
  };
  
  let length = baseLengths[taskType] || 45;
  
  // Adjust for difficulty
  if (difficulty >= 4) length = Math.min(length + 15, 120); // Harder tasks get longer sessions
  if (difficulty <= 2) length = Math.max(length - 15, 30); // Easier tasks can be shorter
  
  return length;
}

function getMaxSessionsPerDay(taskType: Task['type'], difficulty: number): number {
  let maxSessions = 2;
  
  // Adjust based on task type
  switch (taskType) {
    case 'memorization':
      maxSessions = 4; // Benefits from spaced repetition
      break;
    case 'essay':
    case 'exam-prep':
      maxSessions = 1; // Need focused deep work
      break;
    case 'reading':
    case 'problem-set':
      maxSessions = 3;
      break;
  }
  
  // Adjust for difficulty
  if (difficulty >= 4) maxSessions = Math.max(1, maxSessions - 1);
  
  return maxSessions;
}

function mergeAdjacentTaskSessions(sessions: PlanSession[]): PlanSession[] {
  if (sessions.length === 0) return sessions;
  
  const taskSessions = sessions.filter(s => s.type === 'task');
  const nonTaskSessions = sessions.filter(s => s.type !== 'task');
  
  // Group task sessions by taskId
  const sessionsByTask = taskSessions.reduce((groups, session) => {
    if (!groups[session.taskId]) {
      groups[session.taskId] = [];
    }
    groups[session.taskId].push(session);
    return groups;
  }, {} as Record<string, PlanSession[]>);
  
  const mergedSessions: PlanSession[] = [];
  
  // Merge sessions for each task
  Object.values(sessionsByTask).forEach(taskSessions => {
    if (taskSessions.length === 0) return;
    
    // Sort sessions by start time
    const sortedSessions = taskSessions.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    
    let currentMergedSession = { ...sortedSessions[0] };
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const nextSession = sortedSessions[i];
      
      // Check if this session should be merged with the current one
      // We merge if it's the same task and within the same day (no other tasks in between)
      const timeDifference = nextSession.startAt.getTime() - currentMergedSession.endAt.getTime();
      const withinReasonableGap = timeDifference <= 60 * 60 * 1000; // Within 1 hour (allows for break gaps)
      
      if (withinReasonableGap) {
        // Merge by extending the end time
        currentMergedSession.endAt = new Date(nextSession.endAt);
        currentMergedSession.id = `${currentMergedSession.taskId}-merged-${mergedSessions.length}`;
      } else {
        // Save current merged session and start a new one
        mergedSessions.push(currentMergedSession);
        currentMergedSession = { ...nextSession };
      }
    }
    
    // Add the last merged session
    mergedSessions.push(currentMergedSession);
  });
  
  // Combine merged task sessions with non-task sessions and sort by time
  const allSessions = [...mergedSessions, ...nonTaskSessions];
  return allSessions.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function addOptimalBreaks(sessions: PlanSession[], preferences: EnhancedUserPreferences): PlanSession[] {
  const allBlocks: PlanSession[] = [];
  const sortedSessions = [...sessions].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  
  // If Pomodoro is disabled (breakLengthMinutes = 0), merge adjacent task sessions
  if (preferences.breakLengthMinutes === 0) {
    return mergeAdjacentTaskSessions(sortedSessions);
  }
  
  for (let i = 0; i < sortedSessions.length; i++) {
    allBlocks.push(sortedSessions[i]);
    
    if (i < sortedSessions.length - 1) {
      const currentSession = sortedSessions[i];
      const nextSession = sortedSessions[i + 1];
      const gapMinutes = (nextSession.startAt.getTime() - currentSession.endAt.getTime()) / (1000 * 60);
      
      // Add break if there's a natural gap
      if (gapMinutes >= preferences.breakLengthMinutes && gapMinutes <= 90) {
        const breakDuration = Math.min(gapMinutes, preferences.breakLengthMinutes);
        
        allBlocks.push({
          id: `break-${i}`,
          taskId: '',
          startAt: new Date(currentSession.endAt),
          endAt: addMinutes(currentSession.endAt, breakDuration),
          type: 'break',
          status: 'planned',
          label: gapMinutes >= 60 ? 'Long Break' : 'Break'
        });
      }
    }
  }
  
  return allBlocks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function generateSchedulingSuggestions(
  tasks: Task[],
  sessions: PlanSession[],
  preferences: EnhancedUserPreferences,
  suggestions: string[],
  remainingSlots: Array<{ startAt: Date; endAt: Date; priority: number }>
): void {
  const openTasks = tasks.filter(t => t.status === 'open');
  
  if (sessions.length === 0 && openTasks.length > 0) {
    suggestions.push('⚠️ No study sessions could be scheduled. Consider extending your available hours or adjusting task deadlines.');
    return;
  }
  
  // Check urgency
  const urgentTasks = openTasks.filter(t => {
    const daysUntilDue = (t.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 2;
  });
  
  if (urgentTasks.length > 0) {
    suggestions.push(`🚨 ${urgentTasks.length} task(s) due within 2 days - prioritize these immediately!`);
  }
  
  // Coverage analysis
  const totalEstHours = openTasks.reduce((sum, t) => sum + t.estHours, 0);
  const scheduledHours = sessions.filter(s => s.type === 'task').length * (preferences.blockLengthMinutes / 60);
  const coverage = totalEstHours > 0 ? (scheduledHours / totalEstHours) * 100 : 100;
  
  if (coverage < 80) {
    suggestions.push(`📊 Only ${coverage.toFixed(0)}% of study time scheduled. Consider extending available hours or reducing task scope.`);
  }
  
  // Workload distribution
  const tasksByDifficulty = openTasks.reduce((acc, task) => {
    if (task.difficulty >= 4) acc.hard++;
    else if (task.difficulty >= 3) acc.medium++;
    else acc.easy++;
    return acc;
  }, { hard: 0, medium: 0, easy: 0 });
  
  if (tasksByDifficulty.hard > 3) {
    suggestions.push('🎯 You have many high-difficulty tasks. Schedule these during your peak focus hours.');
  }
  
  // Available time optimization
  if (remainingSlots.length > sessions.length * 0.5) {
    suggestions.push('⏰ You have significant unused study time. Consider breaking large tasks into smaller sessions for better retention.');
  }
}