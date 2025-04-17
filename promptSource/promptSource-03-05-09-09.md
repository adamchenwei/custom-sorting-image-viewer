# Custom Requirements
- 
- This app uses tailwind for css, typescript and nodejs v20
- This app uses typescript and nodejs v20
- This app used for browsing images in productive way to analysis and perform crud on the images
- 

# Content from main directory: /Users/adamchenwei/www/custom-sorting-image-viewer/app

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/types/index.ts

export interface ImageAnalysisResult {
  id: string;
  timestamp: number;
  filename: string;
  redPercentage: number;
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/color/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageUploader } from "@/components/ImageUploader";
import { ResultsList } from "@/components/ResultsList";
import {
  analyzeRedPercentage,
  loadResults,
  saveResults,
} from "@/utils/colorAnalysis";
import { ImageAnalysisResult } from "@/types";

export default function Home() {
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);

  useEffect(() => {
    setResults(loadResults());
  }, []);

  const handleImageSelected = async (file: File) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const redPercentage = analyzeRedPercentage(imageData);

        const newResult: ImageAnalysisResult = {
          id: uuidv4(),
          timestamp: Date.now(),
          filename: file.name,
          redPercentage,
        };

        const updatedResults = [newResult, ...results];
        setResults(updatedResults);
        saveResults(updatedResults);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Image Red Color Analyzer</h1>
      <ImageUploader onImageSelected={handleImageSelected} />
      <ResultsList results={results} />
    </main>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/utils/holidays.ts

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
  'daylight-saving-applied-1h-back': {
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

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/utils/holidays.test.ts

import { isUSHoliday } from "./holidays";

describe('isUSHoliday', () => {
  describe('input validation', () => {
    it('should return error for invalid date format', () => {
      expect(isUSHoliday('2024/12/25')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
      expect(isUSHoliday('12-25-2024')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
      expect(isUSHoliday('invalid')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
    });

    it('should return error for invalid dates', () => {
      expect(isUSHoliday('2024-13-01')).toEqual([{
        id: 'error',
        name: 'Invalid month: 13. Month must be between 1 and 12'
      }]);
      expect(isUSHoliday('2024-00-01')).toEqual([{
        id: 'error',
        name: 'Invalid month: 0. Month must be between 1 and 12'
      }]);
      expect(isUSHoliday('2024-12-32')).toEqual([{
        id: 'error',
        name: 'Invalid day: 32. Day must be between 1 and 31 for month 12'
      }]);
    });
  });

  describe('fixed date holidays', () => {
    it('should identify New Years Day with multiple tags', () => {
      const result = isUSHoliday('2024-01-01');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
      expect(result[1]).toEqual({
        id: 'three-days-after-new-year',
        name: 'Three Days After New Year'
      });
    });

    it('should identify Juneteenth during DST', () => {
      const result = isUSHoliday('2024-06-19');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'juneteenth',
        name: 'Juneteenth'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Independence Day during DST', () => {
      const result = isUSHoliday('2024-07-04');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'independence-day',
        name: 'Independence Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Veterans Day', () => {
      expect(isUSHoliday('2024-11-11')).toEqual([{
        id: 'veterans-day',
        name: 'Veterans Day'
      }]);
    });

    it('should identify Christmas Day', () => {
      expect(isUSHoliday('2024-12-25')).toEqual([{
        id: 'christmas-day',
        name: 'Christmas Day'
      }]);
    });
  });

  describe('floating holidays', () => {
    it('should identify MLK Day (3rd Monday in January)', () => {
      expect(isUSHoliday('2024-01-15')).toEqual([{
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      }]);
      expect(isUSHoliday('2025-01-20')).toEqual([{
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      }]);
    });

    it('should identify Presidents Day (3rd Monday in February)', () => {
      expect(isUSHoliday('2024-02-19')).toEqual([{
        id: 'presidents-day',
        name: 'Presidents Day'
      }]);
    });

    it('should identify Memorial Day (last Monday in May)', () => {
      const result = isUSHoliday('2024-05-27');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'memorial-day',
        name: 'Memorial Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Labor Day (1st Monday in September)', () => {
      const result = isUSHoliday('2024-09-02');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'labor-day',
        name: 'Labor Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Columbus Day (2nd Monday in October)', () => {
      const result = isUSHoliday('2024-10-14');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'columbus-day',
        name: 'Columbus Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Thanksgiving Day (4th Thursday in November)', () => {
      expect(isUSHoliday('2024-11-28')).toEqual([{
        id: 'thanksgiving-day',
        name: 'Thanksgiving Day'
      }]);
    });
  });

  describe('non-holidays', () => {
    it('should return not-holiday for non-holiday dates', () => {
      expect(isUSHoliday('2024-03-15')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-08-01')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-12-27')).toEqual([{
        id: 'not-holiday',
        name: '2024-12-27 is not a holiday'
      }]);
    });

    it('should return not-holiday for weekend dates that are not holidays', () => {
      expect(isUSHoliday('2024-03-16')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-03-17')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
    });
  });

  describe('edge cases', () => {
    it('should handle leap years correctly', () => {
      expect(isUSHoliday('2024-02-19')).toEqual([{
        id: 'presidents-day',
        name: 'Presidents Day'
      }]);
    });

    it('should handle year transitions correctly', () => {
      expect(isUSHoliday('2024-12-31')).toEqual([{
        id: 'three-days-before-new-year',
        name: 'Three Days Before New Year'
      }]);
      const newYearResult = isUSHoliday('2025-01-01');
      expect(newYearResult).toHaveLength(2);
      expect(newYearResult[0]).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
      expect(newYearResult[1]).toEqual({
        id: 'three-days-after-new-year',
        name: 'Three Days After New Year'
      });
    });
  });

  describe('custom holidays', () => {
    describe('week before Christmas', () => {
      it('should identify dates in the week before Christmas', () => {
        expect(isUSHoliday('2024-12-18')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
        expect(isUSHoliday('2024-12-19')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
        expect(isUSHoliday('2024-12-24')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
      });

      it('should not identify dates outside the week before Christmas', () => {
        expect(isUSHoliday('2024-12-17')).toEqual([{
          id: 'not-holiday',
          name: '2024-12-17 is not a holiday'
        }]);
        expect(isUSHoliday('2024-12-25')).toEqual([{
          id: 'christmas-day',
          name: 'Christmas Day'
        }]);
      });
    });

    describe('day after Christmas', () => {
      it('should identify December 26th as the day after Christmas', () => {
        expect(isUSHoliday('2024-12-26')).toEqual([{
          id: 'day-after-christmas',
          name: 'The Day After Christmas'
        }]);
      });

      it('should work across different years', () => {
        expect(isUSHoliday('2025-12-26')).toEqual([{
          id: 'day-after-christmas',
          name: 'The Day After Christmas'
        }]);
      });
    });
  });

  describe('overlapping holidays and priority', () => {
    it('should handle multiple applicable tags with correct priority', () => {
      // Independence Day during DST
      const julyFourth = isUSHoliday('2024-07-04');
      expect(julyFourth).toHaveLength(2);
      expect(julyFourth[0].id).toBe('independence-day'); // Higher priority
      expect(julyFourth[1].id).toBe('daylight-saving-applied-1h-back'); // Lower priority

      // New Year's Day and three days after
      const newYear = isUSHoliday('2024-01-01');
      expect(newYear).toHaveLength(2);
      expect(newYear[0].id).toBe('new-years-day'); // Higher priority
      expect(newYear[1].id).toBe('three-days-after-new-year'); // Lower priority
    });
  });
});

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/utils/colorAnalysis.ts

import { ImageAnalysisResult } from "@/types";

export const analyzeRedPercentage = (imageData: ImageData): number => {
  const data = imageData.data;
  let redPixels = 0;
  let totalPixels = imageData.width * imageData.height;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    // Consider a pixel "red" if red channel is significantly higher than others
    if (red > 150 && red > green * 1.5 && red > blue * 1.5) {
      redPixels++;
    }
  }

  return Number(((redPixels / totalPixels) * 100).toFixed(2));
};


const STORAGE_KEY = 'image-analysis-results';

export const saveResults = (results: ImageAnalysisResult[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }
};

export const loadResults = (): ImageAnalysisResult[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/bulk-delete/page.tsx

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Folder } from "lucide-react";

const Button = ({
  children,
  disabled,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 disabled:hover:bg-blue-500",
    outline: "border border-gray-300 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const Alert = ({ children, type = "error" }) => {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className={`${styles[type]} border p-4 rounded-lg`}>{children}</div>
  );
};

const DeleteImagesPage = () => {
  const [percentage, setPercentage] = useState("");
  const [folder, setFolder] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [matchedFiles, setMatchedFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [pollId, setPollId] = useState(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollId) {
        clearTimeout(pollId);
      }
    };
  }, [pollId]);

  const stopPolling = useCallback(() => {
    if (pollId) {
      clearTimeout(pollId);
      setPollId(null);
    }
    setIsDeleting(false);
  }, [pollId]);

  const pollProgress = useCallback(async () => {
    try {
      const progressResponse = await fetch("/api/deletion-progress");
      const progressData = await progressResponse.json();

      if (progressData.error) {
        setError(progressData.error);
        stopPolling();
        return;
      }

      setProgress(progressData.progress);
      setStatus(progressData.status);
      setMatchedFiles(progressData.matchedFiles || []);
      setProcessedFiles(progressData.processedFiles);
      setTotalFiles(progressData.totalFiles);

      // Check for completion
      if (
        progressData.isCompleted ||
        progressData.status === "completed" ||
        progressData.progress === 100
      ) {
        console.log("Deletion completed");
        stopPolling();
      } else {
        // Continue polling
        const newPollId = setTimeout(pollProgress, 1000);
        setPollId(newPollId);
      }
    } catch (err) {
      setError("Failed to fetch progress");
      stopPolling();
    }
  }, [stopPolling]);

  const handleDelete = async () => {
    if (!percentage || !folder) return;

    setError("");
    setIsDeleting(true);
    setProgress(0);
    setStatus("processing");
    setMatchedFiles([]);
    setProcessedFiles(0);
    setTotalFiles(0);

    try {
      const response = await fetch("/api/delete-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          percentage: Number(percentage),
          folder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to start deletion process");
      }

      // Start polling
      pollProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      stopPolling();
    }
  };

  const getStatusMessage = () => {
    if (status === "completed") {
      return matchedFiles.length > 0
        ? `Completed: Deleted ${matchedFiles.length} files`
        : "Completed: No files matched the criteria";
    }
    return `Processing: ${processedFiles} of ${totalFiles} files`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Delete Images by Red Percentage
            </h1>
            <p className="mt-2 text-gray-600">
              Delete all images with red percentage less than or equal to the
              specified threshold.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Minimum Red Percentage Threshold"
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Enter percentage (0-100)"
              disabled={isDeleting}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Folder Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="Enter folder path"
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <button
                  onClick={() => alert("Folder picker would go here")}
                  disabled={isDeleting}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <Folder className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            {(isDeleting ||
              status === "processing" ||
              status === "completed") && (
              <Alert type={status === "completed" ? "success" : "info"}>
                {getStatusMessage()}
                {matchedFiles.length > 0 && (
                  <div className="mt-2 text-sm">
                    Files: {matchedFiles.join(", ")}
                  </div>
                )}
              </Alert>
            )}

            {(isDeleting || progress > 0) && (
              <div className="space-y-2">
                <ProgressBar progress={progress} />
                <p className="text-sm text-center text-gray-600">
                  {progress}% complete
                </p>
              </div>
            )}

            <Button
              onClick={handleDelete}
              disabled={!percentage || !folder || isDeleting}
              className="w-full"
            >
              {isDeleting ? "Deleting..." : "Delete Images"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteImagesPage;


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/results/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, X, CheckSquare, Square, Layers } from "lucide-react";
import { moveImages, deleteImages } from "../services/imageService";
import { MoveModal } from "../components/MoveModal";
import { SorterModal } from "../components/SorterModal";
import { isUSHoliday } from "../utils/holidays";

interface ImageData {
  fileName: string;
  assetPath: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
}

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

export default function ResultsPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [currentSortOptions, setCurrentSortOptions] =
    useState<SortOptions | null>(null);
  const [isOverlapMode, setIsOverlapMode] = useState(false);

  const loadImagesWithSort = async (sortOptions: SortOptions | null) => {
    try {
      setLoading(true);
      setError(null);

      if (
        sortOptions &&
        Object.values(sortOptions).some((value) => value !== "")
      ) {
        const response = await fetch("/api/sort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sortOptions),
        });
        const data = await response.json();
        setImages(data);
        if (data.length > 0) {
          setSelectedImage(data[0]);
          setSelectedIndex(0);
        }
      } else {
        const response = await fetch("/api/images");
        const data = await response.json();
        setImages(data);
        if (data.length > 0) {
          setSelectedImage(data[0]);
          setSelectedIndex(0);
        }
      }
    } catch (err) {
      console.error("Error loading images:", err);
      setError("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedOptions = localStorage.getItem("imageSortOptions");
    const sortOptions = savedOptions ? JSON.parse(savedOptions) : null;
    setCurrentSortOptions(sortOptions);
    loadImagesWithSort(sortOptions);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
        setSelectedImage(images[selectedIndex - 1]);
      } else if (e.key === "ArrowDown" && selectedIndex < images.length - 1) {
        setSelectedIndex((prev) => prev + 1);
        setSelectedImage(images[selectedIndex + 1]);
      }
    },
    [selectedIndex, images]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleImageSelect = (
    image: ImageData,
    event: React.MouseEvent,
    isCheckboxClick: boolean
  ) => {
    if (isCheckboxClick) {
      setSelectedImages((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(image.assetPath)) {
          newSelection.delete(image.assetPath);
        } else {
          newSelection.add(image.assetPath);
        }
        return newSelection;
      });
      return;
    }

    setSelectedImage(image);
    setSelectedIndex(
      images.findIndex((img) => img.assetPath === image.assetPath)
    );
    if (!isOverlapMode) {
      setSelectedImages(new Set());
    }
  };

  const handleMove = async (targetPath: string) => {
    try {
      setLoading(true);
      setError(null);

      const imagesToMove = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      const moveResult = await moveImages(
        imagesToMove,
        targetPath,
        currentSortOptions || undefined
      );

      if (moveResult.success && moveResult.data) {
        setImages(moveResult.data);

        if (moveResult.data.length > 0) {
          const firstVisibleSelected = moveResult.data.find((img) =>
            selectedImages.has(img.assetPath)
          );
          if (firstVisibleSelected) {
            setSelectedImage(firstVisibleSelected);
            setSelectedIndex(moveResult.data.indexOf(firstVisibleSelected));
          } else {
            setSelectedImage(moveResult.data[0]);
            setSelectedIndex(0);
          }
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      setSelectedImages(new Set());
      setShowMoveModal(false);
    } catch (err) {
      console.error("Error moving images:", err);
      setError("Failed to move images");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image: ImageData, index: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Deleting image:", image);

      await deleteImages([
        { assetPath: image.assetPath, fileName: image.fileName },
      ]);

      setImages((prevImages) =>
        prevImages.filter((img) => img.assetPath !== image.assetPath)
      );

      if (selectedImages.has(image.assetPath)) {
        setSelectedImages((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(image.assetPath);
          return newSelection;
        });
      }

      if (selectedImage?.assetPath === image.assetPath) {
        const nextIndex = Math.min(index, images.length - 2);
        if (nextIndex >= 0) {
          setSelectedImage(images[nextIndex]);
          setSelectedIndex(nextIndex);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setError("Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedImages.size} images?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imagesToDelete = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      await deleteImages(imagesToDelete);

      setImages((prevImages) =>
        prevImages.filter((img) => !selectedImages.has(img.assetPath))
      );

      if (selectedImage && selectedImages.has(selectedImage.assetPath)) {
        const remainingImages = images.filter(
          (img) => !selectedImages.has(img.assetPath)
        );
        if (remainingImages.length > 0) {
          setSelectedImage(remainingImages[0]);
          setSelectedIndex(0);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      setSelectedImages(new Set());
    } catch (err) {
      console.error("Error deleting images:", err);
      setError("Failed to delete images");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySort = async (options: SortOptions) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSortOptions(options);
      await loadImagesWithSort(options);
      setShowSorter(false);
    } catch (err) {
      console.error("Error applying sort:", err);
      setError("Failed to apply sorting");
    } finally {
      setLoading(false);
    }
  };

  const renderImageViewer = () => {
    if (isOverlapMode && selectedImages.size > 0) {
      const selectedImagesList = Array.from(selectedImages)
        .map((assetPath) => images.find((img) => img.assetPath === assetPath))
        .filter((img): img is ImageData => img !== undefined);

      return (
        <div className="relative w-full h-full">
          {selectedImagesList.map((image, index) => (
            <div
              key={image.assetPath}
              className="absolute inset-0 mix-blend-normal"
              style={{
                zIndex: selectedImagesList.length - index,
              }}
            >
              <Image
                src={image.assetPath}
                alt={image.fileName}
                fill
                className="mix-blend-multiply"
                style={{
                  objectFit: "contain",
                  opacity: Math.max(0.7 - index * 0.15, 0.1).toString(),
                  filter: `brightness(${1.2 + index * 0.1})`, // Slightly brighten to compensate
                }}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      );
    }

    return selectedImage ? (
      <Image
        src={selectedImage.assetPath}
        alt={selectedImage.fileName}
        fill
        style={{ objectFit: "contain" }}
        priority
      />
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500">
        No image selected
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Sticky menu section */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSorter(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sort
            </button>
            <button
              onClick={() => setIsOverlapMode(!isOverlapMode)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                isOverlapMode
                  ? "bg-indigo-500 text-white hover:bg-indigo-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Layers size={16} />
              {isOverlapMode ? "Single" : "Overlap"}
            </button>
            {selectedImages.size > 0 && (
              <>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Move Selected ({selectedImages.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Selected ({selectedImages.size})
                </button>
                <button
                  onClick={() => {
                    setSelectedImages(new Set());
                    if (isOverlapMode) {
                      setSelectedImage(null);
                      setSelectedIndex(-1);
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
              Loading...
            </div>
          )}
        </div>

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {images.length === 0 && !loading && (
              <div className="p-2 text-gray-500">
                No images found matching the criteria
              </div>
            )}

            {images.map((image, index) => (
              <div
                key={image.assetPath}
                className={`p-2 cursor-pointer rounded flex items-start group ${
                  selectedImage?.assetPath === image.assetPath
                    ? "bg-blue-100 text-gray-500"
                    : "hover:bg-gray-100 text-black"
                } ${
                  selectedImages.has(image.assetPath)
                    ? "bg-blue-50 text-black"
                    : ""
                }`}
                onClick={(e) => handleImageSelect(image, e, false)}
              >
                <div
                  className="flex-shrink-0 mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageSelect(image, e, true);
                  }}
                >
                  {selectedImages.has(image.assetPath) ? (
                    <CheckSquare className="text-blue-500" size={20} />
                  ) : (
                    <Square className="text-gray-400" size={20} />
                  )}
                </div>

                <div className="flex-shrink-0 mr-3 relative w-16 h-16">
                  <Image
                    src={image.assetPath}
                    alt={image.fileName}
                    fill
                    sizes="64px"
                    className="rounded object-cover"
                    priority={index < 10}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="break-words truncate">{image.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {format(
                      new Date(
                        image.yyyy,
                        image.mm - 1,
                        image.dd,
                        image.hh,
                        image.minute,
                        image.ss
                      ),
                      "PPpp"
                    )}
                  </div>
                  {(() => {
                    const dateStr = `${image.yyyy}-${String(image.mm).padStart(
                      2,
                      "0"
                    )}-${String(image.dd).padStart(2, "0")}`;
                    const holidays = isUSHoliday(dateStr);
                    if (
                      holidays[0].id !== "error" &&
                      holidays[0].id !== "not-holiday"
                    ) {
                      return (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {holidays.map((holiday) => (
                            <span
                              key={holiday.id}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-900"
                            >
                              {holiday.id}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center ml-2 flex-shrink-0">
                  <button
                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image, index);
                    }}
                    aria-label="Delete image"
                  >
                    <X size={16} />
                  </button>
                  <button
                    className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImages(new Set([image.assetPath]));
                      setShowMoveModal(true);
                    }}
                    aria-label="Move image"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Image preview */}
      <div className="w-1/2 h-full relative">{renderImageViewer()}</div>

      {/* Modals */}
      {showMoveModal && selectedImages.size > 0 && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedImages(new Set());
          }}
          onSubmit={handleMove}
          selectionCount={selectedImages.size}
        />
      )}

      {showSorter && (
        <SorterModal
          onClose={() => setShowSorter(false)}
          onApply={handleApplySort}
        />
      )}
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/MoveModal.tsx

// app/components/MoveModal.tsx
import React, { useState, useEffect } from "react";

interface MoveModalProps {
  onClose: () => void;
  onSubmit: (targetPath: string) => void;
  isOpen: boolean;
  selectionCount?: number;
}

const MOVE_PATH_KEY = "imageMoveTargetPath";

export function MoveModal({
  onClose,
  onSubmit,
  isOpen,
  selectionCount = 1,
}: MoveModalProps) {
  const [targetPath, setTargetPath] = useState("");

  // Load from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedPath = localStorage.getItem(MOVE_PATH_KEY);
      if (savedPath) {
        setTargetPath(savedPath);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(targetPath);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSubmit, targetPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(MOVE_PATH_KEY, targetPath);
    onSubmit(targetPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Move {selectionCount} {selectionCount === 1 ? "Image" : "Images"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Target Directory (under /public)
              </label>
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g., images/processed"
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/ImageUploader.tsx

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelected(acceptedFiles[0]);
      }
    },
    [onImageSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the image here...</p>
      ) : (
        <p>Drag & drop an image here, or click to select</p>
      )}
    </div>
  );
};


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/ResultsList.tsx

import { ImageAnalysisResult } from "@/types";
import React from "react";

interface ResultsListProps {
  results: ImageAnalysisResult[];
}

export const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      {results.length === 0 ? (
        <p className="text-gray-500">
          No results yet. Upload an image to begin.
        </p>
      ) : (
        <ul className="space-y-4">
          {results.map((result) => (
            <li key={result.id} className="bg-white p-4 rounded-lg shadow">
              <p className="font-medium">{result.filename}</p>
              <p className="text-gray-600">
                Red percentage:{" "}
                <span className="text-red-600 font-semibold">
                  {result.redPercentage}%
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/SorterModal.tsx

import { useState, useEffect } from "react";
import { format, addMinutes, addHours } from "date-fns";

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface SorterModalProps {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}

const SORT_OPTIONS_KEY = "imageSortOptions";
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getDefaultOptions(): SortOptions {
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  const later = addMinutes(now, 15);

  return {
    startDate: format(threeYearsAgo, "yyyy-MM-dd"),
    endDate: format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(later, "HH:mm"),
    weeks: [DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1]],
  };
}

const DEFAULT_OPTIONS = getDefaultOptions();

export function SorterModal({ onClose, onApply }: SorterModalProps) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_OPTIONS,
          ...parsed,
          weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
        };
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
        return DEFAULT_OPTIONS;
      }
    }
    return DEFAULT_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(options));
  }, [options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeekChange = (day: string) => {
    setOptions((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(day)
        ? prev.weeks.filter((d) => d !== day)
        : [...prev.weeks, day],
    }));
  };

  const handleNext15Minutes = () => {
    const now = new Date();
    const later = addMinutes(now, 15);
    const currentDay = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
      endDate: format(now, "yyyy-MM-dd"),
      weeks: [currentDay],
    }));
  };

  const handleNextHour = () => {
    const now = new Date();
    const later = addHours(now, 1);
    const currentDay = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
      endDate: format(now, "yyyy-MM-dd"),
      weeks: [currentDay],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(DEFAULT_OPTIONS));
    onApply(DEFAULT_OPTIONS);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sort Options</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={options.startDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={options.endDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleNext15Minutes}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Next 15 Min
                  </button>
                  <button
                    type="button"
                    onClick={handleNextHour}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Next 1 Hour
                  </button>
                </div>
              </div>
              <input
                type="time"
                name="startTime"
                value={options.startTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={options.endTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={options.weeks.includes(day)}
                      onChange={() => handleWeekChange(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
            <div className="space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Custom Sorting Image Viewer",
  description: "Custom Sorting Image Viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/deletion-progress/route.ts

import { NextResponse } from 'next/server';
import { deletionProgress } from '../delete-images/route';

export async function GET() {
  // If we're at 100% progress and status isn't explicitly set, ensure it's marked as completed
  if (deletionProgress.progress === 100 && deletionProgress.status !== 'completed') {
    deletionProgress.status = 'completed';
  }

  // If status is completed but progress isn't 100, fix the inconsistency
  if (deletionProgress.status === 'completed' && deletionProgress.progress !== 100) {
    deletionProgress.progress = 100;
  }

  return NextResponse.json({
    progress: deletionProgress.progress,
    error: deletionProgress.error,
    status: deletionProgress.status,
    matchedFiles: deletionProgress.matchedFiles,
    processedFiles: deletionProgress.processedFiles,
    totalFiles: deletionProgress.totalFiles,
    details: deletionProgress.details,
    isCompleted: deletionProgress.status === 'completed'
  });
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/sort/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDay } from 'date-fns';

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks?: string[];
}

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
}

// Helper function to convert day name to number (0-6, where 0 is Sunday)
function getDayNumber(dayName: string): number {
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName as keyof typeof days] ?? -1;
}

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime && (!options.weeks || options.weeks.length === 0)) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Time filtering
    if (options.startTime || options.endTime) {
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          return false;
        }
        
        return true;
      });
    }

    // Week day filtering
    if (options.weeks && Array.isArray(options.weeks) && options.weeks.length > 0) {
      filteredData = filteredData.filter(item => {
        const date = new Date(item.yyyy, item.mm - 1, item.dd);
        const dayNumber = getDay(date);
        return options.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
      });
    }

    console.log('Final filtered data length:', filteredData.length);
    return NextResponse.json(filteredData);

  } catch (error) {
    console.error('Sort API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/move/route.ts

// app/api/images/move/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getDay } from 'date-fns';

interface MoveRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
  targetPath: string;
  sortOptions?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    weeks?: string[];
  };
}

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
  fileDescription?: string;
  meta?: {
    value: string;
    type: string;
  };
}

// Helper function to convert day name to number (0-6, where 0 is Sunday)
function getDayNumber(dayName: string): number {
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName as keyof typeof days] ?? -1;
}

// Apply sorting filters to the data
function applySortOptions(data: ImageData[], sortOptions: MoveRequest['sortOptions']) {
  if (!sortOptions) return data;

  let filteredData = [...data];

  // Date filtering
  if (sortOptions.startDate || sortOptions.endDate) {
    filteredData = filteredData.filter(item => {
      const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
      
      if (sortOptions.startDate && itemDateString < sortOptions.startDate) {
        return false;
      }
      
      if (sortOptions.endDate && itemDateString > sortOptions.endDate) {
        return false;
      }
      
      return true;
    });
  }

  // Time filtering
  if (sortOptions.startTime || sortOptions.endTime) {
    filteredData = filteredData.filter(item => {
      const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
      
      if (sortOptions.startTime && itemTimeString < sortOptions.startTime) {
        return false;
      }
      
      if (sortOptions.endTime && itemTimeString > sortOptions.endTime) {
        return false;
      }
      
      return true;
    });
  }

  // Week day filtering
  if (sortOptions.weeks && Array.isArray(sortOptions.weeks) && sortOptions.weeks.length > 0) {
    filteredData = filteredData.filter(item => {
      const date = new Date(item.yyyy, item.mm - 1, item.dd);
      const dayNumber = getDay(date);
      return sortOptions.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
    });
  }

  return filteredData;
}

export async function POST(request: Request) {
  try {
    const body: MoveRequest = await request.json();
    console.log('Move request received:', body);
    
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, body.targetPath);
    
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });
    
    // Keep track of successful and failed moves
    const moveResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Move all files
    for (const image of body.images) {
      try {
        const currentPath = path.join(publicDir, 'images', image.fileName);
        const targetPath = path.join(targetDir, image.fileName);
        
        // Check if source file exists
        await fs.access(currentPath);
        
        // Check if target file already exists
        try {
          await fs.access(targetPath);
          moveResults.failed.push(`${image.fileName} (already exists in target directory)`);
          continue;
        } catch {
          // Target doesn't exist, we can proceed
        }
        
        // Perform the move
        await fs.rename(currentPath, targetPath);
        moveResults.success.push(image.fileName);
      } catch (error) {
        console.error(`Failed to move ${image.fileName}:`, error);
        moveResults.failed.push(image.fileName);
      }
    }
    
    if (moveResults.success.length === 0) {
      throw new Error('No files were successfully moved');
    }
    
    // Update data.json
    console.log('Updating data.json...');
    const dataPath = path.join(publicDir, 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    let imageData: ImageData[] = JSON.parse(dataContent);
    
    // Update the asset paths for successfully moved images
    let updatedCount = 0;
    imageData = imageData.map(item => {
      const matchingImage = body.images.find(img => img.assetPath === item.assetPath);
      if (matchingImage && moveResults.success.includes(matchingImage.fileName)) {
        updatedCount++;
        const relativePath = path.join(body.targetPath, item.fileName);
        return {
          ...item,
          assetPath: '/' + relativePath.replace(/\\/g, '/')
        };
      }
      return item;
    });

    if (updatedCount === 0) {
      throw new Error('Failed to update image data');
    }
    
    // Write the updated data back to data.json
    await fs.writeFile(dataPath, JSON.stringify(imageData, null, 2));
    
    // Apply sort options if they exist
    const sortedData = body.sortOptions ? applySortOptions(imageData, body.sortOptions) : imageData;
    
    // Return response with results
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: moveResults,
      newData: sortedData
    });

  } catch (error: any) {
    console.error('Move API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to move images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/delete/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    const deleteResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Process each image
    for (const image of body.images) {
      try {
        const imagePath = path.join(process.cwd(), 'public', 'images', image.fileName);
        console.log('Attempting to delete file at:', imagePath);
        
        // Check if file exists and delete it
        try {
          const stats = await fs.stat(imagePath);
          if (stats.isFile()) {
            await fs.unlink(imagePath);
            deleteResults.success.push(image.fileName);
          } else {
            deleteResults.failed.push(`${image.fileName} (not a file)`);
          }
        } catch (error: any) {
          console.error(`Error deleting ${image.fileName}:`, error);
          deleteResults.failed.push(image.fileName);
        }
      } catch (error) {
        console.error(`Error processing ${image.fileName}:`, error);
        deleteResults.failed.push(image.fileName);
      }
    }

    // Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(dataContent);
    
    // Filter out deleted images
    const successfullyDeletedPaths = new Set(
      body.images
        .filter(img => deleteResults.success.includes(img.fileName))
        .map(img => img.assetPath)
    );
    
    const updatedData = data.filter((item: any) => !successfullyDeletedPaths.has(item.assetPath));
    
    // Write updated data back to file
    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: deleteResults,
      remainingImages: updatedData
    });
    
  } catch (error: any) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidateTag } from 'next/cache';

// Enable caching but allow revalidation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Tag this response for cache invalidation
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=31536000',
        'tags': ['images-data']
      }
    });
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/delete-images/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Store deletion progress globally (in a real app, use a proper state management solution)
export let deletionProgress = {
  progress: 0,
  error: null as string | null,
  status: 'idle' as 'idle' | 'processing' | 'completed',
  matchedFiles: [] as string[],
  processedFiles: 0,
  totalFiles: 0,
  details: [] as string[]
};

export async function POST(request: Request) {
  try {
    const { percentage, folder } = await request.json();
    console.log('Received request:', { percentage, folder });

    // Validate input
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { message: 'Invalid percentage value' },
        { status: 400 }
      );
    }

    if (!folder || typeof folder !== 'string') {
      return NextResponse.json(
        { message: 'Invalid folder path' },
        { status: 400 }
      );
    }

    // Check if already processing
    if (deletionProgress.status === 'processing') {
      return NextResponse.json(
        { message: 'Deletion already in progress' },
        { status: 409 }
      );
    }

    // Reset progress
    deletionProgress = {
      progress: 0,
      error: null,
      status: 'processing',
      matchedFiles: [],
      processedFiles: 0,
      totalFiles: 0,
      details: []
    };

    // Start deletion process asynchronously
    handleDeletion(percentage, folder).catch(error => {
      console.error('Deletion process failed:', error);
      deletionProgress.error = error.message;
      deletionProgress.status = 'completed';
    });

    return NextResponse.json({ message: 'Deletion process started' });
  } catch (error) {
    console.error('Delete images error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeRedPercentage(buffer: Buffer): Promise<number> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  let redPixels = 0;
  const totalPixels = info.width * info.height;

  // Process raw pixel data (RGB format)
  for (let i = 0; i < data.length; i += 3) { // Sharp gives us RGB, not RGBA
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    // Use exact same criteria as frontend:
    // Consider a pixel "red" if red channel is significantly higher than others
    if (red > 150 && red > green * 1.5 && red > blue * 1.5) {
      redPixels++;
    }
  }

  // Match frontend's precision with toFixed(2)
  return Number(((redPixels / totalPixels) * 100).toFixed(2));
}

async function handleDeletion(maxPercentage: number, folderPath: string) {
  try {
    console.log('Starting deletion process for folder:', folderPath);
    console.log('Maximum red percentage threshold:', maxPercentage);

    // Convert relative path to absolute path if needed
    const absolutePath = folderPath.startsWith('/')
      ? folderPath
      : path.join(process.cwd(), folderPath);

    console.log('Absolute path:', absolutePath);

    // Get all image files in the directory
    const files = await fs.readdir(absolutePath);
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png)$/i.test(file)
    );

    console.log('Found image files:', imageFiles);
    deletionProgress.totalFiles = imageFiles.length;

    for (const file of imageFiles) {
      try {
        const filePath = path.join(absolutePath, file);
        console.log('Processing file:', filePath);

        const imageBuffer = await fs.readFile(filePath);
        const redPercentage = await analyzeRedPercentage(imageBuffer);

        const detail = `File ${file}: Red percentage = ${redPercentage}% (Threshold: ≤ ${maxPercentage}%)`;
        console.log(detail);
        deletionProgress.details.push(detail);

        // Delete if red percentage is less than or equal to the threshold
        if (redPercentage <= maxPercentage) {
          console.log(`File ${file} has red percentage below or equal to threshold, deleting...`);
          await fs.unlink(filePath);
          deletionProgress.matchedFiles.push(file);
          console.log(`File ${file} deleted successfully`);
        } else {
          console.log(`File ${file} has red percentage above threshold, keeping file`);
        }

        deletionProgress.processedFiles++;
        deletionProgress.progress = Math.round((deletionProgress.processedFiles / deletionProgress.totalFiles) * 100);
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        deletionProgress.details.push(`Error processing ${file}: ${err.message}`);
      }
    }

    console.log('Deletion process completed');
    console.log('Matched and deleted files:', deletionProgress.matchedFiles);

    deletionProgress.status = 'completed';
    deletionProgress.progress = 100;
  } catch (error) {
    console.error('Deletion process error:', error);
    deletionProgress.error = 'Failed to complete deletion process';
    deletionProgress.status = 'completed';
    deletionProgress.progress = 100;
    throw error;
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/revalidate/route.ts

// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST() {
  try {
    revalidateTag('images-data');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ revalidated: false, error: error.message }, { status: 500 });
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/page.tsx

"use client";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/services/imageService.ts

// app/services/imageService.ts
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface ImageToMove {
  assetPath: string;
  fileName: string;
}

export async function moveImages(
  images: ImageToMove[],
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean; data?: any[] }> {
  try {
    console.log('Sending bulk move request for:', { images, targetPath, sortOptions });
    
    const response = await fetch('/api/images/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        images,
        targetPath,
        sortOptions
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Move request failed:', result);
      throw new Error(result.error || 'Failed to move images');
    }

    return {
      success: true,
      data: result.newData
    };
  } catch (error) {
    console.error('Error in moveImages service:', error);
    throw error;
  }
}
export async function deleteImages(
  images: { assetPath: string; fileName: string }[]
): Promise<boolean> {
  try {
    console.log('Sending bulk delete request for:', images);
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Bulk delete request failed:', result);
      throw new Error(result.error || 'Failed to delete images');
    }

    console.log('Bulk delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImages service:', error);
    throw error;
  }
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/tsconfig.json

{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "lib": ["es2017", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "app/**/*",
    "scripts/**/*",
    ".next/types/**/*.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "jest.config.ts",
    "jest.setup.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/package.json

{
  "name": "custom-sorting-image-viewer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "next start",
    "lint": "next lint",
    "process-images": "ts-node scripts/process-images-cli.ts",
    "dev": "npm run process-images && next dev -p 3099",
    "prompt": "./scripts/consolidate-app-custom-sorting-image-viewer.sh ./app/ --exclude node_modules dist",
    "build": "npm run process-images && next build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "date-fns": "^4.1.0",
    "lucide-react": "^0.469.0",
    "next": "14.2.13",
    "react": "^18",
    "react-dom": "^18",
    "react-dropzone": "^14.3.5",
    "sharp": "^0.33.5",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^20.17.10",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.13",
    "install": "^0.13.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "npm": "^11.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;


