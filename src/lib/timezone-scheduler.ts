import { Task, AvailabilityWindow, PlanSession, UserPreferences, TimeConstraint } from "@/types";
import { addMinutes, isAfter, isBefore, format, startOfDay, endOfDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { generateOptimalSchedule, ScheduleResult } from "./smart-scheduler";

export interface EnhancedUserPreferences extends UserPreferences {
  timezone: string;
  constraints: TimeConstraint[];
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

export function generateIntelligentSchedule(
  tasks: Task[],
  preferences: EnhancedUserPreferences,
  daysAhead: number = 7
): ScheduleResult {
  return generateOptimalSchedule(tasks, preferences, daysAhead);
}

// Deprecated functions - using new smart-scheduler.ts

// Default preferences for new users
export function getDefaultEnhancedPreferences(): EnhancedUserPreferences {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    blockLengthMinutes: 45,
    breakLengthMinutes: 15,
    dayStart: "09:00",
    dayEnd: "18:00",
    timezone,
    constraints: [],
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