import { Task, AvailabilityWindow, PlanSession, UserPreferences } from "@/types";
import { STUDY_METHODS, STUDY_TIPS } from "@/types";
import { addMinutes, isAfter, isBefore, format, startOfDay, endOfDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export interface EnhancedUserPreferences extends UserPreferences {
  timezone: string;
  weeklySchedule: {
    [key: string]: { // 'monday', 'tuesday', etc.
      startTime: string; // "09:00"
      endTime: string; // "18:00"
      mealBreaks: Array<{ start: string; end: string; label: string }>;
      isAvailable: boolean;
    };
  };
  optimalStudyTimes: {
    morning: boolean; // 6-12
    afternoon: boolean; // 12-18
    evening: boolean; // 18-22
  };
}

export interface IntelligentScheduleResult {
  sessions: PlanSession[];
  conflicts: string[];
  suggestions: string[];
  totalPlannedHours: number;
  coverage: number; // percentage of task hours scheduled
}

export function generateIntelligentSchedule(
  tasks: Task[],
  preferences: EnhancedUserPreferences,
  daysAhead: number = 7
): IntelligentScheduleResult {
  const userTimezone = preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = toZonedTime(new Date(), userTimezone);
  
  const openTasks = tasks.filter(t => t.status === 'open');
  const sessions: PlanSession[] = [];
  const conflicts: string[] = [];
  const suggestions: string[] = [];

  // Generate dynamic availability for the next X days
  const availability = generateDynamicAvailability(now, daysAhead, preferences, userTimezone);
  
  // Create intelligent study blocks
  const studyBlocks = createIntelligentStudyBlocks(availability, preferences, userTimezone);
  
  // Sort tasks intelligently
  const sortedTasks = sortTasksIntelligently(openTasks, userTimezone);
  
  // Allocate sessions with intelligent distribution
  let totalTaskHours = 0;
  let scheduledHours = 0;

  for (const task of sortedTasks) {
    totalTaskHours += task.estHours;
    
    const taskSessions = allocateTaskSessionsIntelligently(
      task, 
      studyBlocks, 
      preferences, 
      userTimezone
    );
    
    if (taskSessions.length === 0) {
      const dueDateFormatted = formatInTimeZone(task.dueAt, userTimezone, 'MMM d, h:mm a');
      conflicts.push(`No available time for "${task.title}" before ${dueDateFormatted}`);
      continue;
    }
    
    sessions.push(...taskSessions);
    scheduledHours += taskSessions.reduce((total, session) => {
      return total + (session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    
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

  // Add intelligent breaks and meals
  const sessionsWithBreaks = addIntelligentBreaks(sessions, preferences, userTimezone);
  
  // Generate suggestions
  generateSchedulingSuggestions(tasks, sessions, preferences, suggestions);

  const coverage = totalTaskHours > 0 ? (scheduledHours / totalTaskHours) * 100 : 100;

  return {
    sessions: sessionsWithBreaks,
    conflicts,
    suggestions,
    totalPlannedHours: scheduledHours,
    coverage
  };
}

function generateDynamicAvailability(
  startDate: Date,
  daysAhead: number,
  preferences: EnhancedUserPreferences,
  timezone: string
): AvailabilityWindow[] {
  const availability: AvailabilityWindow[] = [];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let i = 0; i < daysAhead; i++) {
    const currentDate = addDays(startDate, i);
    const dayName = dayNames[currentDate.getDay()];
    const daySchedule = preferences.weeklySchedule[dayName];

    if (!daySchedule || !daySchedule.isAvailable) continue;

    // Create main availability window
    const dayStart = new Date(currentDate);
    const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
    dayStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(currentDate);
    const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    availability.push({
      id: `available-${i}`,
      type: 'available',
      startAt: fromZonedTime(dayStart, timezone),
      endAt: fromZonedTime(dayEnd, timezone)
    });

    // Add meal breaks
    daySchedule.mealBreaks.forEach((meal, mealIndex) => {
      const mealStart = new Date(currentDate);
      const [mealStartHour, mealStartMinute] = meal.start.split(':').map(Number);
      mealStart.setHours(mealStartHour, mealStartMinute, 0, 0);

      const mealEnd = new Date(currentDate);
      const [mealEndHour, mealEndMinute] = meal.end.split(':').map(Number);
      mealEnd.setHours(mealEndHour, mealEndMinute, 0, 0);

      availability.push({
        id: `meal-${i}-${mealIndex}`,
        type: 'meal',
        startAt: fromZonedTime(mealStart, timezone),
        endAt: fromZonedTime(mealEnd, timezone),
        label: meal.label
      });
    });
  }

  return availability;
}

function createIntelligentStudyBlocks(
  availability: AvailabilityWindow[],
  preferences: EnhancedUserPreferences,
  timezone: string
): Array<{ startAt: Date; endAt: Date; priority: number }> {
  const blocks: Array<{ startAt: Date; endAt: Date; priority: number }> = [];
  const blockDuration = preferences.blockLengthMinutes;
  
  const studyWindows = availability.filter(w => w.type === 'available');
  
  for (const window of studyWindows) {
    let currentStart = new Date(window.startAt);
    
    while (currentStart < window.endAt) {
      const blockEnd = addMinutes(currentStart, blockDuration);
      
      if (blockEnd <= window.endAt) {
        // Check for conflicts
        const hasConflict = availability.some(conflict => 
          (conflict.type === 'meal' || conflict.type === 'sleep' || conflict.type === 'no-study') &&
          (
            (currentStart >= conflict.startAt && currentStart < conflict.endAt) ||
            (blockEnd > conflict.startAt && blockEnd <= conflict.endAt) ||
            (currentStart <= conflict.startAt && blockEnd >= conflict.endAt)
          )
        );
        
        if (!hasConflict) {
          const priority = calculateBlockPriority(currentStart, preferences, timezone);
          blocks.push({ 
            startAt: new Date(currentStart), 
            endAt: new Date(blockEnd),
            priority
          });
        }
      }
      
      currentStart = addMinutes(currentStart, blockDuration + preferences.breakLengthMinutes);
    }
  }
  
  // Sort by priority (higher priority first)
  return blocks.sort((a, b) => b.priority - a.priority);
}

function calculateBlockPriority(
  blockStart: Date,
  preferences: EnhancedUserPreferences,
  timezone: string
): number {
  const hour = parseInt(formatInTimeZone(blockStart, timezone, 'H'));
  let priority = 1;

  // Boost priority based on optimal study times
  if (hour >= 6 && hour < 12 && preferences.optimalStudyTimes.morning) priority += 2;
  if (hour >= 12 && hour < 18 && preferences.optimalStudyTimes.afternoon) priority += 2;
  if (hour >= 18 && hour < 22 && preferences.optimalStudyTimes.evening) priority += 2;

  // Peak focus times (research-based)
  if (hour >= 9 && hour <= 11) priority += 1; // Morning peak
  if (hour >= 14 && hour <= 16) priority += 0.5; // Afternoon mini-peak

  return priority;
}

function sortTasksIntelligently(tasks: Task[], timezone: string): Task[] {
  const now = toZonedTime(new Date(), timezone);
  
  return tasks.sort((a, b) => {
    // Calculate urgency in timezone-aware manner
    const urgencyA = Math.max(0.1, (a.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgencyB = Math.max(0.1, (b.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Enhanced priority weights
    const priorityWeight = { low: 1, medium: 1.5, high: 2.2 };
    
    // Task type difficulty multipliers
    const typeWeight = {
      'reading': 1.0,
      'problem-set': 1.3,
      'essay': 1.4,
      'exam-prep': 1.6,
      'memorization': 1.2
    };
    
    // Calculate comprehensive scores
    const scoreA = (1 / urgencyA) * priorityWeight[a.priority] * typeWeight[a.type] * (1 + (a.difficulty - 3) * 0.15);
    const scoreB = (1 / urgencyB) * priorityWeight[b.priority] * typeWeight[b.type] * (1 + (b.difficulty - 3) * 0.15);
    
    return scoreB - scoreA;
  });
}

function allocateTaskSessionsIntelligently(
  task: Task,
  availableBlocks: Array<{ startAt: Date; endAt: Date; priority: number }>,
  preferences: EnhancedUserPreferences,
  timezone: string
): PlanSession[] {
  const sessions: PlanSession[] = [];
  const totalMinutesNeeded = task.estHours * 60;
  const blockDuration = preferences.blockLengthMinutes;
  
  // Intelligent session distribution
  const optimalSessionLength = Math.min(blockDuration, getOptimalSessionLength(task.type));
  const maxSessionsPerDay = Math.floor(480 / (optimalSessionLength + preferences.breakLengthMinutes)); // 8 hours max
  
  let remainingMinutes = totalMinutesNeeded;
  let sessionsToday = 0;
  let lastSessionDate = '';
  
  for (const block of availableBlocks) {
    if (remainingMinutes <= 0) break;
    if (isAfter(block.startAt, task.dueAt)) continue;
    
    const currentDate = formatInTimeZone(block.startAt, timezone, 'yyyy-MM-dd');
    
    // Reset daily session counter
    if (lastSessionDate !== currentDate) {
      sessionsToday = 0;
      lastSessionDate = currentDate;
    }
    
    // Limit sessions per day for better learning
    if (sessionsToday >= maxSessionsPerDay) continue;
    
    const sessionDuration = Math.min(optimalSessionLength, remainingMinutes, blockDuration);
    const sessionEnd = addMinutes(block.startAt, sessionDuration);
    
    if (sessionEnd <= block.endAt) {
      sessions.push({
        id: `${task.id}-${sessions.length}`,
        taskId: task.id,
        startAt: new Date(block.startAt),
        endAt: sessionEnd,
        method: STUDY_METHODS[task.type],
        tip: getEnhancedTip(task.type, sessions.length + 1),
        status: 'planned'
      });
      
      remainingMinutes -= sessionDuration;
      sessionsToday++;
    }
  }
  
  return sessions;
}

function getOptimalSessionLength(taskType: Task['type']): number {
  const optimalLengths = {
    'reading': 45,
    'problem-set': 60,
    'essay': 50,
    'exam-prep': 40,
    'memorization': 30
  };
  
  return optimalLengths[taskType] || 45;
}

function getEnhancedTip(taskType: Task['type'], sessionNumber: number): string {
  const baseTips = STUDY_TIPS[taskType];
  
  if (sessionNumber === 1) {
    return `Session ${sessionNumber}: ${baseTips}`;
  }
  
  const progressTips = {
    'reading': 'Review previous chapter highlights before starting new material.',
    'problem-set': 'Start by reviewing errors from previous session.',
    'essay': 'Review your outline and previous paragraphs before continuing.',
    'exam-prep': 'Test yourself on yesterday\'s material first.',
    'memorization': 'Quick review of previous cards before new ones.'
  };
  
  return `Session ${sessionNumber}: ${progressTips[taskType]} Then ${baseTips.toLowerCase()}`;
}

function addIntelligentBreaks(
  sessions: PlanSession[],
  preferences: EnhancedUserPreferences,
  timezone: string
): PlanSession[] {
  const allBlocks: PlanSession[] = [];
  const sortedSessions = [...sessions].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  
  for (let i = 0; i < sortedSessions.length; i++) {
    allBlocks.push(sortedSessions[i]);
    
    if (i < sortedSessions.length - 1) {
      const currentSession = sortedSessions[i];
      const nextSession = sortedSessions[i + 1];
      const gapMinutes = (nextSession.startAt.getTime() - currentSession.endAt.getTime()) / (1000 * 60);
      
      // Add appropriate break
      if (gapMinutes >= preferences.breakLengthMinutes && gapMinutes <= preferences.breakLengthMinutes + 45) {
        const breakType = gapMinutes >= 60 ? 'long-break' : 'break';
        
        allBlocks.push({
          id: `${breakType}-${i}`,
          taskId: '',
          startAt: new Date(currentSession.endAt),
          endAt: addMinutes(currentSession.endAt, Math.min(gapMinutes, preferences.breakLengthMinutes)),
          method: breakType,
          tip: getBreakTip(breakType, i),
          status: 'planned'
        });
      }
    }
  }
  
  return allBlocks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function getBreakTip(breakType: string, sessionIndex: number): string {
  const shortBreakTips = [
    'Take a 5-minute walk to boost circulation.',
    'Do some light stretching to relieve tension.',
    'Hydrate and have a healthy snack.',
    'Practice deep breathing to reset focus.'
  ];
  
  const longBreakTips = [
    'Go for a longer walk or light exercise.',
    'Have a proper meal to refuel your brain.',
    'Take a short power nap if feeling tired.',
    'Do something completely different to reset.'
  ];
  
  const tips = breakType === 'long-break' ? longBreakTips : shortBreakTips;
  return tips[sessionIndex % tips.length];
}

function generateSchedulingSuggestions(
  tasks: Task[],
  sessions: PlanSession[],
  preferences: EnhancedUserPreferences,
  suggestions: string[]
): void {
  const openTasks = tasks.filter(t => t.status === 'open');
  
  if (sessions.length === 0 && openTasks.length > 0) {
    suggestions.push('Consider adjusting your availability or extending study hours to fit all tasks.');
  }
  
  const urgentTasks = openTasks.filter(t => {
    const daysUntilDue = (t.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 2;
  });
  
  if (urgentTasks.length > 0) {
    suggestions.push(`${urgentTasks.length} task(s) due within 2 days. Consider prioritizing these.`);
  }
  
  const totalEstHours = openTasks.reduce((sum, t) => sum + t.estHours, 0);
  const scheduledHours = sessions.length * (preferences.blockLengthMinutes / 60);
  
  if (scheduledHours < totalEstHours * 0.8) {
    suggestions.push('Consider extending daily study hours or reducing break times to better accommodate all tasks.');
  }
}

// Default preferences for new users
export function getDefaultEnhancedPreferences(): EnhancedUserPreferences {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    blockLengthMinutes: 45,
    breakLengthMinutes: 15,
    dayStart: "09:00",
    dayEnd: "18:00",
    timezone,
    weeklySchedule: {
      monday: {
        startTime: "09:00",
        endTime: "18:00",
        mealBreaks: [
          { start: "12:00", end: "13:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      tuesday: {
        startTime: "09:00",
        endTime: "18:00",
        mealBreaks: [
          { start: "12:00", end: "13:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      wednesday: {
        startTime: "09:00",
        endTime: "18:00",
        mealBreaks: [
          { start: "12:00", end: "13:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      thursday: {
        startTime: "09:00",
        endTime: "18:00",
        mealBreaks: [
          { start: "12:00", end: "13:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      friday: {
        startTime: "09:00",
        endTime: "18:00",
        mealBreaks: [
          { start: "12:00", end: "13:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      saturday: {
        startTime: "10:00",
        endTime: "16:00",
        mealBreaks: [
          { start: "13:00", end: "14:00", label: "Lunch" }
        ],
        isAvailable: true
      },
      sunday: {
        startTime: "10:00",
        endTime: "16:00",
        mealBreaks: [
          { start: "13:00", end: "14:00", label: "Lunch" }
        ],
        isAvailable: false
      }
    },
    optimalStudyTimes: {
      morning: true,
      afternoon: true,
      evening: false
    }
  };
}