import { Task, PlanSession } from "@/types";
import { STUDY_TIPS } from "@/types";
import { EnhancedUserPreferences } from "./timezone-scheduler";

// Helper functions for enhanced scheduling

export function createOptimalTaskDistribution(
  tasks: Task[],
  availableBlocks: Array<{ startAt: Date; endAt: Date; priority: number }>,
  preferences: EnhancedUserPreferences
): Record<string, { maxSessionsPerDay: number; preferredDays: number[] }> {
  const distribution: Record<string, { maxSessionsPerDay: number; preferredDays: number[] }> = {};
  
  tasks.forEach(task => {
    // Base sessions per day on task difficulty and type
    let maxSessionsPerDay = 2;
    
    if (task.difficulty <= 2) maxSessionsPerDay = 3; // Easier tasks can have more sessions
    if (task.difficulty >= 4) maxSessionsPerDay = 1; // Harder tasks need focus
    
    // Adjust based on task type
    switch (task.type) {
      case 'memorization':
        maxSessionsPerDay = Math.min(maxSessionsPerDay + 1, 4); // Memorization benefits from repetition
        break;
      case 'exam-prep':
        maxSessionsPerDay = Math.max(maxSessionsPerDay - 1, 1); // Focus sessions for exams
        break;
      case 'essay':
        maxSessionsPerDay = Math.max(maxSessionsPerDay - 1, 1); // Essays need deep focus
        break;
    }
    
    distribution[task.id] = {
      maxSessionsPerDay,
      preferredDays: [] // Could be enhanced to prefer certain days
    };
  });
  
  return distribution;
}

export function removeAllocatedBlocks(
  availableBlocks: Array<{ startAt: Date; endAt: Date; priority: number }>,
  allocatedSessions: PlanSession[]
): void {
  allocatedSessions.forEach(session => {
    const blockIndex = availableBlocks.findIndex(block => 
      block.startAt.getTime() === session.startAt.getTime()
    );
    if (blockIndex >= 0) {
      availableBlocks.splice(blockIndex, 1);
    }
  });
}

export function getDailySessionLimit(task: Task, baseLimit: number): number {
  // Adjust based on task urgency
  const daysUntilDue = (task.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilDue <= 1) return Math.min(baseLimit + 1, 4); // More sessions if urgent
  if (daysUntilDue >= 7) return Math.max(baseLimit - 1, 1); // Fewer sessions if not urgent
  
  return baseLimit;
}

export function getEnhancedTip(taskType: Task['type'], sessionNumber: number, difficulty: number): string {
  const baseTips = STUDY_TIPS[taskType];
  
  if (sessionNumber === 1) {
    const difficultyAdjustment = difficulty >= 4 ? ' Take your time and focus deeply.' : ' Start with confidence!';
    return `Session ${sessionNumber}: ${baseTips}${difficultyAdjustment}`;
  }
  
  const progressTips = {
    'reading': 'Review previous chapter highlights before starting new material.',
    'problem-set': 'Start by reviewing errors from previous session.',
    'essay': 'Review your outline and previous paragraphs before continuing.',
    'exam-prep': 'Test yourself on yesterday\'s material first.',
    'memorization': 'Quick review of previous cards before new ones.'
  };
  
  const continuityBoost = sessionNumber > 3 ? ' You\'re building great momentum!' : '';
  
  return `Session ${sessionNumber}: ${progressTips[taskType]} Then ${baseTips.toLowerCase()}${continuityBoost}`;
}

export function generateComprehensiveSchedulingSuggestions(
  tasks: Task[],
  sessions: PlanSession[],
  preferences: EnhancedUserPreferences,
  suggestions: string[],
  remainingBlocks: Array<{ startAt: Date; endAt: Date; priority: number }>
): void {
  const openTasks = tasks.filter(t => t.status === 'open');
  
  if (sessions.length === 0 && openTasks.length > 0) {
    suggestions.push('No study sessions could be scheduled. Consider extending your daily availability or adjusting task due dates.');
    return;
  }
  
  // Check for urgent tasks
  const urgentTasks = openTasks.filter(t => {
    const daysUntilDue = (t.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 2;
  });
  
  if (urgentTasks.length > 0) {
    suggestions.push(`⚠️ ${urgentTasks.length} task(s) due within 2 days. Consider prioritizing these or extending study hours.`);
  }
  
  // Check coverage
  const totalEstHours = openTasks.reduce((sum, t) => sum + t.estHours, 0);
  const scheduledHours = sessions.length * (preferences.blockLengthMinutes / 60);
  const coverage = totalEstHours > 0 ? (scheduledHours / totalEstHours) * 100 : 100;
  
  if (coverage < 80) {
    suggestions.push(`📊 Only ${coverage.toFixed(0)}% of your study hours are scheduled. Consider adding more study time or extending the planning period.`);
  }
  
  // Check for task type distribution
  const taskTypes = openTasks.map(t => t.type);
  const uniqueTypes = [...new Set(taskTypes)];
  
  if (uniqueTypes.length > 3) {
    suggestions.push('💡 You have many different types of tasks. Consider grouping similar tasks together for better focus.');
  }
  
  // Check for high difficulty tasks
  const difficultTasks = openTasks.filter(t => t.difficulty >= 4);
  if (difficultTasks.length > 0) {
    suggestions.push(`🎯 ${difficultTasks.length} high-difficulty task(s) detected. Schedule these during your peak focus hours.`);
  }
  
  // Suggest optimal times if many blocks remain unused
  if (remainingBlocks.length > sessions.length) {
    suggestions.push('⏰ You have additional study time available. Consider adding more tasks or breaking large tasks into smaller ones.');
  }
}