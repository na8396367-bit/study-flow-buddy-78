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
  method: string;
  tip: string;
  status: 'planned' | 'done' | 'snoozed';
}

export interface UserPreferences {
  blockLengthMinutes: number;
  breakLengthMinutes: number;
  dayStart: string; // "08:00"
  dayEnd: string; // "22:00"
}

export const STUDY_METHODS = {
  'reading': 'SQ3R Method',
  'problem-set': 'Worked Examples',
  'essay': 'Structured Outlining',
  'exam-prep': 'Active Recall',
  'memorization': 'Spaced Repetition'
} as const;

export const STUDY_TIPS = {
  'reading': 'Survey, Question, Read, Recite, Review. End with 5 retrieval questions.',
  'problem-set': 'Start with worked examples, then practice independently. Keep an error log.',
  'essay': 'Create detailed outline first, then write in focused 25-minute sprints.',
  'exam-prep': 'Use flashcards and practice tests. Mix different topics (interleaving).',
  'memorization': 'Active recall with flashcards. Review in increasingly spaced intervals.'
} as const;