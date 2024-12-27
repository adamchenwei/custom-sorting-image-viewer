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

const HOLIDAY_CONFIGS: HolidayConfigs = {
  'new-years-day': {
    name: "New Year's Day",
    check: (date: Date): boolean => date.getMonth() === 0 && date.getDate() === 1
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
    check: (date: Date): boolean => date.getMonth() === 5 && date.getDate() === 19
  },
  'independence-day': {
    name: "Independence Day",
    check: (date: Date): boolean => date.getMonth() === 6 && date.getDate() === 4
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
    check: (date: Date): boolean => date.getMonth() === 10 && date.getDate() === 11
  },
  'thanksgiving-day': {
    name: "Thanksgiving Day",
    check: (date: Date): boolean => {
      const thanksgiving = getNthWeekdayOfMonth(date.getFullYear(), 10, 4, 4);
      return date.getTime() === thanksgiving.getTime();
    }
  },
  'christmas-day': {
    name: "Christmas Day",
    check: (date: Date): boolean => date.getMonth() === 11 && date.getDate() === 25
  }
};

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

const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): Date => {
  const date = new Date(year, month + 1, 0); // Last day of the month
  
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
};

/**
 * Check if a given date string is a US holiday
 * @param dateStr - Date string in 'yyyy-mm-dd' format
 * @returns Holiday information or null if not a holiday
 * @throws Error if date format is invalid
 */
export const isUSHoliday = (dateStr: string): HolidayResult | null => {
  // Validate date string format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Date must be in yyyy-mm-dd format');
  }

  const date = new Date(dateStr);
  
  // Validate if date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  // Check against all holiday configurations
  for (const [id, config] of Object.entries(HOLIDAY_CONFIGS)) {
    if (config.check(date)) {
      return {
        id,
        name: config.name
      };
    }
  }

  return null;
};