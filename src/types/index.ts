export interface Course {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  courseId: string;
  title: string;
  type: 'reading' | 'problem-set' | 'essay' | 'exam-prep' | 'memorization';
  dueAt: Date;
  estHours: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  status: 'open' | 'done';
}

export interface AvailabilityWindow {
  id: string;
  type: 'available' | 'meal' | 'sleep' | 'no-study';
  startAt: Date;
  endAt: Date;
  label?: string;
}

export interface PlanSession {
  id: string;
  taskId: string;
  startAt: Date;
  endAt: Date;
  type: 'task' | 'break' | 'meal' | 'sleep' | 'unavailable';
  status: 'planned' | 'done' | 'snoozed';
  label?: string; // For breaks/meals/sleep
}

export interface UserPreferences {
  blockLengthMinutes: number;
  breakLengthMinutes: number;
  dayStart: string; // "08:00"
  dayEnd: string; // "22:00"
}

export interface TimeConstraint {
  id: string;
  type: 'sleep' | 'meal' | 'work' | 'class' | 'personal' | 'unavailable';
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format  
  days: number[]; // 0=Sunday, 1=Monday, etc.
  label: string;
  isRecurring: boolean;
  specificDate?: Date; // For one-time constraints
}