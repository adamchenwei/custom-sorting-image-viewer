interface HolidayConfig {
  name: string;
  check: (date: Date) => boolean;
  priority?: number; // Lower number means higher priority
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
  // Create a date for the first day of the specified month
  const date = new Date(year, month, 1);
  
  // Find the first occurrence of the specified weekday
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1);
  }
  
  // Add weeks to get to the nth occurrence
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

// Helper function to check if a date is within n days before new year
const isWithinDaysBeforeNewYear = (date: Date, days: number): boolean => {
  const newYear = new Date(date.getFullYear() + 1, 0, 1); // January 1st of next year
  const daysBeforeStart = new Date(newYear);
  daysBeforeStart.setDate(newYear.getDate() - days);
  
  return date >= daysBeforeStart && date < newYear;
};

// Helper function to check if a date is within n days after new year
const isWithinDaysAfterNewYear = (date: Date, days: number): boolean => {
  const newYear = new Date(date.getFullYear(), 0, 1); // January 1st of current year
  const daysAfterEnd = new Date(newYear);
  daysAfterEnd.setDate(newYear.getDate() + days);
  
  return date >= newYear && date <= daysAfterEnd;
};

// Helper function to check if a date is during Daylight Saving Time
const isDuringDST = (date: Date): boolean => {
  // Get the second Sunday in March
  const dstStart = new Date(date.getFullYear(), 2, 1);
  while (dstStart.getDay() !== 0) {
    dstStart.setDate(dstStart.getDate() + 1);
  }
  dstStart.setDate(dstStart.getDate() + 7);
  dstStart.setHours(2, 0, 0, 0);

  // Get the first Sunday in November
  const dstEnd = new Date(date.getFullYear(), 10, 1);
  while (dstEnd.getDay() !== 0) {
    dstEnd.setDate(dstEnd.getDate() + 1);
  }
  dstEnd.setHours(2, 0, 0, 0);

  return date >= dstStart && date < dstEnd;
};

const HOLIDAY_CONFIGS: HolidayConfigs = {
  'new-years-day': {
    name: "New Year's Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 0 && date.getDate() === 1;
    },
    priority: 1
  },
  'three-days-before-new-year': {
    name: "Three Days Before New Year",
    check: (date: Date): boolean => {
      return isWithinDaysBeforeNewYear(date, 3);
    },
    priority: 2
  },
  'three-days-after-new-year': {
    name: "Three Days After New Year",
    check: (date: Date): boolean => {
      return isWithinDaysAfterNewYear(date, 3);
    },
    priority: 2
  },
  'time-saving-applied': {
    name: "Daylight Saving Time Active",
    check: (date: Date): boolean => {
      return isDuringDST(date);
    },
    priority: 10 // Lower priority since it's a long-running period
  },
  'martin-luther-king-jr-day': {
    name: "Martin Luther King Jr. Day",
    check: (date: Date): boolean => {
      const mlkDay = getNthWeekdayOfMonth(date.getFullYear(), 0, 1, 3);
      return date.getTime() === mlkDay.getTime();
    },
    priority: 1
  },
  'presidents-day': {
    name: "Presidents Day",
    check: (date: Date): boolean => {
      const presDay = getNthWeekdayOfMonth(date.getFullYear(), 1, 1, 3);
      return date.getTime() === presDay.getTime();
    },
    priority: 1
  },
  'memorial-day': {
    name: "Memorial Day",
    check: (date: Date): boolean => {
      const memorialDay = getLastWeekdayOfMonth(date.getFullYear(), 4, 1);
      return date.getTime() === memorialDay.getTime();
    },
    priority: 1
  },
  'juneteenth': {
    name: "Juneteenth",
    check: (date: Date): boolean => {
      return date.getMonth() === 5 && date.getDate() === 19;
    },
    priority: 1
  },
  'independence-day': {
    name: "Independence Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 6 && date.getDate() === 4;
    },
    priority: 1
  },
  'labor-day': {
    name: "Labor Day",
    check: (date: Date): boolean => {
      const laborDay = getNthWeekdayOfMonth(date.getFullYear(), 8, 1, 1);
      return date.getTime() === laborDay.getTime();
    },
    priority: 1
  },
  'columbus-day': {
    name: "Columbus Day",
    check: (date: Date): boolean => {
      const columbusDay = getNthWeekdayOfMonth(date.getFullYear(), 9, 1, 2);
      return date.getTime() === columbusDay.getTime();
    },
    priority: 1
  },
  'veterans-day': {
    name: "Veterans Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 10 && date.getDate() === 11;
    },
    priority: 1
  },
  'thanksgiving-day': {
    name: "Thanksgiving Day",
    check: (date: Date): boolean => {
      const thanksgiving = getNthWeekdayOfMonth(date.getFullYear(), 10, 4, 4);
      return date.getTime() === thanksgiving.getTime();
    },
    priority: 1
  },
  'week-before-christmas': {
    name: "The Week Before Christmas",
    check: (date: Date): boolean => {
      return isInWeekBeforeChristmas(date);
    },
    priority: 2
  },
  'christmas-day': {
    name: "Christmas Day",
    check: (date: Date): boolean => {
      return date.getMonth() === 11 && date.getDate() === 25;
    },
    priority: 1
  },
  'day-after-christmas': {
    name: "The Day After Christmas",
    check: (date: Date): boolean => {
      return date.getMonth() === 11 && date.getDate() === 26;
    },
    priority: 1
  }
};

/**
 * Check if a given date string is a US holiday
 * @param dateStr - Date string in 'yyyy-mm-dd' format
 * @returns Array of holiday information or error information
 */
export const isUSHoliday = (dateStr: string): HolidayResult[] => {
  // Validate date string format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return [{
      id: 'error',
      name: 'Date must be in yyyy-mm-dd format'
    }];
  }

  // Validate date components
  const validation = validateDate(dateStr);
  if (!validation.isValid) {
    return [{
      id: 'error',
      name: validation.errorMessage!
    }];
  }

  const date = createDate(dateStr);
  const holidays: HolidayResult[] = [];

  // Check against all holiday configurations
  for (const [id, config] of Object.entries(HOLIDAY_CONFIGS)) {
    if (config.check(date)) {
      holidays.push({
        id,
        name: config.name
      });
    }
  }

  // Sort holidays by priority (if specified)
  holidays.sort((a, b) => {
    const priorityA = HOLIDAY_CONFIGS[a.id].priority ?? 5;
    const priorityB = HOLIDAY_CONFIGS[b.id].priority ?? 5;
    return priorityA - priorityB;
  });

  return holidays.length > 0 ? holidays : [{
    id: 'not-holiday',
    name: `${dateStr} is not a holiday`
  }];
};