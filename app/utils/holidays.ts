interface HolidayConfig {
  name: string;
  check: (date: Date) => boolean;
}

interface HolidayResult {
  id: string;
  name: string;
}

type HolidayConfigs = {
  [key: string]: HolidayConfig;
};

// Helper function for timezone-safe date validation
const validateDate = (dateStr: string): { isValid: boolean; errorMessage?: string } => {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return { 
      isValid: false, 
      errorMessage: `Invalid month: ${month}. Month must be between 1 and 12`
    };
  }
  
  // Validate day based on month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { 
      isValid: false, 
      errorMessage: `Invalid day: ${day}. Day must be between 1 and ${daysInMonth} for month ${month}`
    };
  }
  
  return { isValid: true };
};

// Helper function for timezone-safe date creation
const createDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to get the nth occurrence of a weekday in a month
const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): Date => {
  const date = new Date(year, month, 1);
  
  // Find the first occurrence of weekday
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1);
  }
  
  // Add weeks until we reach the nth occurrence
  date.setDate(date.getDate() + (n - 1) * 7);
  
  return date;
};

// Helper function to get the last occurrence of a weekday in a month
const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): Date => {
  const date = new Date(year, month + 1, 0); // Last day of the month
  
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
};

// Helper function to check if a date is in the week before Christmas
const isInWeekBeforeChristmas = (date: Date): boolean => {
  const christmas = new Date(date.getFullYear(), 11, 25); // December 25th
  const weekBeforeStart = new Date(christmas);
  weekBeforeStart.setDate(christmas.getDate() - 7);
  
  return date >= weekBeforeStart && date < christmas;
};

const HOLIDAY_CONFIGS: HolidayConfigs = {
  'new-years-day': {
    name: "New Year's Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 0 && date.getDate() === 1;
    }
  },
  'martin-luther-king-jr-day': {
    name: "Martin Luther King Jr. Day",
    check: (date: Date): boolean => {
      const mlkDay = getNthWeekdayOfMonth(date.getFullYear(), 0, 1, 3);
      return date.getTime() === mlkDay.getTime();
    }
  },
  'presidents-day': {
    name: "Presidents Day",
    check: (date: Date): boolean => {
      const presDay = getNthWeekdayOfMonth(date.getFullYear(), 1, 1, 3);
      return date.getTime() === presDay.getTime();
    }
  },
  'memorial-day': {
    name: "Memorial Day",
    check: (date: Date): boolean => {
      const memorialDay = getLastWeekdayOfMonth(date.getFullYear(), 4, 1);
      return date.getTime() === memorialDay.getTime();
    }
  },
  'juneteenth': {
    name: "Juneteenth",
    check: (date: Date): boolean => {
      return date.getMonth() === 5 && date.getDate() === 19;
    }
  },
  'independence-day': {
    name: "Independence Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 6 && date.getDate() === 4;
    }
  },
  'labor-day': {
    name: "Labor Day",
    check: (date: Date): boolean => {
      const laborDay = getNthWeekdayOfMonth(date.getFullYear(), 8, 1, 1);
      return date.getTime() === laborDay.getTime();
    }
  },
  'columbus-day': {
    name: "Columbus Day",
    check: (date: Date): boolean => {
      const columbusDay = getNthWeekdayOfMonth(date.getFullYear(), 9, 1, 2);
      return date.getTime() === columbusDay.getTime();
    }
  },
  'veterans-day': {
    name: "Veterans Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 10 && date.getDate() === 11;
    }
  },
  'thanksgiving-day': {
    name: "Thanksgiving Day",
    check: (date: Date): boolean => {
      const thanksgiving = getNthWeekdayOfMonth(date.getFullYear(), 10, 4, 4);
      return date.getTime() === thanksgiving.getTime();
    }
  },
  'week-before-christmas': {
    name: "The Week Before Christmas",
    check: (date: Date): boolean => {
      return isInWeekBeforeChristmas(date);
    }
  },
  'christmas-day': {
    name: "Christmas Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 11 && date.getDate() === 25;
    }
  },
  'day-after-christmas': {
    name: "The Day After Christmas",
    check: (date: Date): boolean => {
      return date.getMonth() === 11 && date.getDate() === 26;
    }
  }
};

/**
 * Check if a given date string is a US holiday
 * @param dateStr - Date string in 'yyyy-mm-dd' format
 * @returns Holiday information or error information
 */
export const isUSHoliday = (dateStr: string): HolidayResult => {
  // Validate date string format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      id: 'error',
      name: 'Date must be in yyyy-mm-dd format'
    };
  }

  // Validate date components
  const validation = validateDate(dateStr);
  if (!validation.isValid) {
    return {
      id: 'error',
      name: validation.errorMessage!
    };
  }

  const date = createDate(dateStr);

  // Check against all holiday configurations
  for (const [id, config] of Object.entries(HOLIDAY_CONFIGS)) {
    if (config.check(date)) {
      return {
        id,
        name: config.name
      };
    }
  }

  return {
    id: 'not-holiday',
    name: `${dateStr} is not a holiday`
  };
};