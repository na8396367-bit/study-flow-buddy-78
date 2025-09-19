// Smart time interval parser that handles messy user input
// Returns a single 12-hour interval formatted as "H:MM AM - H:MM PM" or "NO_TIME"

interface ParsedTime {
  hours: number;
  minutes: number;
  period?: 'AM' | 'PM';
}

// Convert spelled numbers to digits
const wordToNumber = (word: string): number | null => {
  const words: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
    'thirty': 30, 'forty': 40, 'fifty': 50
  };
  return words[word.toLowerCase()] ?? null;
};

// Parse time phrases like "nine thirty", "ten fifteen"
const parseTimePhrase = (phrase: string): ParsedTime | null => {
  const words = phrase.toLowerCase().split(/\s+/);
  
  // Handle special cases
  if (phrase.includes('noon')) return { hours: 12, minutes: 0, period: 'PM' };
  if (phrase.includes('midnight')) return { hours: 12, minutes: 0, period: 'AM' };
  
  // Try to find hour and minute words
  let hours: number | null = null;
  let minutes = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const num = wordToNumber(word);
    
    if (num !== null && hours === null && num >= 1 && num <= 23) {
      hours = num;
      
      // Check next word for minutes
      if (i + 1 < words.length) {
        const nextWord = words[i + 1];
        if (nextWord === 'thirty') minutes = 30;
        else if (nextWord === 'fifteen') minutes = 15;
        else if (nextWord === 'forty-five') minutes = 45;
        else {
          const nextNum = wordToNumber(nextWord);
          if (nextNum !== null && nextNum <= 59) minutes = nextNum;
        }
      }
      break;
    }
  }
  
  return hours !== null ? { hours, minutes } : null;
};

// Extract AM/PM indicators from text
const extractPeriod = (text: string): 'AM' | 'PM' | null => {
  const lower = text.toLowerCase();
  
  // Direct AM/PM markers
  if (/\b(am|a\.m\.|a)\b/.test(lower)) return 'AM';
  if (/\b(pm|p\.m\.|p)\b/.test(lower)) return 'PM';
  
  // Context clues
  if (/\b(morning)\b/.test(lower)) return 'AM';
  if (/\b(afternoon|evening|night|tonight)\b/.test(lower)) return 'PM';
  
  return null;
};

// Parse numeric time (handles various formats)
const parseNumericTime = (timeStr: string): ParsedTime | null => {
  // Remove non-digit characters except colon
  const cleaned = timeStr.replace(/[^\d:]/g, '');
  
  if (!cleaned) return null;
  
  let hours: number;
  let minutes = 0;
  
  if (cleaned.includes(':')) {
    const [h, m] = cleaned.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    hours = h;
    minutes = m;
  } else {
    const num = parseInt(cleaned);
    if (isNaN(num)) return null;
    
    if (num < 24) {
      // Single/double digit hour
      hours = num;
    } else if (num < 100) {
      // Two digit time like "30" = 30 minutes past hour (assume hour 0)
      hours = 0;
      minutes = num;
    } else if (num < 2400) {
      // Three/four digit time like "930" or "1430"
      hours = Math.floor(num / 100);
      minutes = num % 100;
    } else {
      return null;
    }
  }
  
  // Handle minute overflow
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }
  
  // Convert 24-hour to 12-hour if needed
  if (hours > 23) return null;
  if (hours === 0) hours = 24; // midnight case
  
  return { hours, minutes };
};

// Round minutes to nearest 5-minute interval
const roundToFiveMinutes = (minutes: number): number => {
  return Math.round(minutes / 5) * 5;
};

// Format time to 12-hour AM/PM format
const formatTime = (time: ParsedTime): string => {
  let { hours, minutes } = time;
  minutes = roundToFiveMinutes(minutes);
  
  // Handle minute overflow after rounding
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }
  
  // Convert to 12-hour format
  let period = time.period;
  if (!period) {
    period = hours >= 12 ? 'PM' : 'AM';
  }
  
  // Handle 24-hour conversion
  if (hours > 12) {
    hours = hours - 12;
    period = 'PM';
  } else if (hours === 0) {
    hours = 12;
    period = 'AM';
  } else if (hours === 12) {
    period = 'PM';
  }
  
  // Validate final result
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return 'NO_TIME';
  }
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Extract connector words that indicate ranges
const findRangeConnector = (text: string): boolean => {
  const connectors = ['-', '–', '—', 'to', 'til', 'until', 'through', 'thru', 'from', 'between'];
  return connectors.some(connector => text.toLowerCase().includes(connector));
};

// Split text into start and end parts
const splitTimeRange = (text: string): [string, string] | null => {
  const lower = text.toLowerCase();
  
  // Handle "from X to Y" and "between X and Y"
  const fromToMatch = lower.match(/(from|between)\s+(.+?)\s+(to|and)\s+(.+)/);
  if (fromToMatch) {
    return [fromToMatch[2], fromToMatch[4]];
  }
  
  // Handle direct connectors
  for (const connector of ['-', '–', '—', ' to ', ' til ', ' until ', ' through ', ' thru ']) {
    if (text.includes(connector)) {
      const parts = text.split(connector);
      if (parts.length === 2) {
        return [parts[0].trim(), parts[1].trim()];
      }
    }
  }
  
  return null;
};

// Main parsing function
export function parseTimeInterval(input: string): string {
  if (!input || typeof input !== 'string') {
    return 'NO_TIME';
  }
  
  const trimmed = input.trim().toLowerCase();
  
  // Check if it's clearly not time-related
  if (/^[a-z]+$/.test(trimmed) && !trimmed.match(/\b(noon|midnight|morning|afternoon|evening|night|am|pm|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/)) {
    return 'NO_TIME';
  }
  
  // Extract global period indicators
  const globalPeriod = extractPeriod(input);
  
  // Check if this is a range
  if (findRangeConnector(input)) {
    const rangeParts = splitTimeRange(input);
    if (!rangeParts) return 'NO_TIME';
    
    const [startText, endText] = rangeParts;
    
    // Parse start time
    let startTime = parseTimePhrase(startText) || parseNumericTime(startText);
    if (!startTime) return 'NO_TIME';
    
    // Parse end time  
    let endTime = parseTimePhrase(endText) || parseNumericTime(endText);
    if (!endTime) return 'NO_TIME';
    
    // Apply period logic
    const startPeriod = extractPeriod(startText) || startTime.period;
    const endPeriod = extractPeriod(endText) || endTime.period;
    
    if (startPeriod) startTime.period = startPeriod;
    if (endPeriod) endTime.period = endPeriod;
    
    // If neither time has explicit period, apply smart defaults
    if (!startTime.period && !endTime.period) {
      if (globalPeriod) {
        // If global period indicator, apply to both
        startTime.period = globalPeriod;
        endTime.period = globalPeriod;
      } else if (endTime.hours < startTime.hours) {
        // End is smaller, assume crossing periods
        startTime.period = 'AM';
        endTime.period = 'PM';
      } else {
        // Same period, assume AM unless context suggests PM
        const defaultPeriod = input.includes('evening') || input.includes('night') || input.includes('afternoon') ? 'PM' : 'AM';
        startTime.period = defaultPeriod;
        endTime.period = defaultPeriod;
      }
    } else if (!startTime.period) {
      // Only end has period, assume start is same unless crossing
      if (endTime.period === 'PM' && endTime.hours < startTime.hours) {
        startTime.period = 'AM';
      } else {
        startTime.period = endTime.period;
      }
    } else if (!endTime.period) {
      // Only start has period, assume end is same unless crossing
      if (startTime.period === 'AM' && endTime.hours < startTime.hours) {
        endTime.period = 'PM';
      } else {
        endTime.period = startTime.period;
      }
    }
    
    const formattedStart = formatTime(startTime);
    const formattedEnd = formatTime(endTime);
    
    if (formattedStart === 'NO_TIME' || formattedEnd === 'NO_TIME') {
      return 'NO_TIME';
    }
    
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  // Not a range - single time only
  return 'NO_TIME';
}

// Helper function to convert the result back to 24-hour format for internal use
export function parseToInternalFormat(interval: string): { startTime: string; endTime: string } | null {
  if (interval === 'NO_TIME') return null;
  
  const parts = interval.split(' - ');
  if (parts.length !== 2) return null;
  
  const convert12to24 = (timeStr: string): string => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/);
    if (!match) return '';
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3];
    
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };
  
  const startTime = convert12to24(parts[0]);
  const endTime = convert12to24(parts[1]);
  
  if (!startTime || !endTime) return null;
  
  return { startTime, endTime };
}