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
  onlySameMonth?: boolean;
  aMonthBefore?: boolean;
  aMonthAfter?: boolean;
  includeAllYears?: boolean;
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
    if (!options.includeAllYears && (options.startDate || options.endDate)) {
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

    // Month filtering
    const allowedMonths: number[] = [];
    if (options.onlySameMonth || options.aMonthBefore || options.aMonthAfter) {
      // Use the endDate from the options for consistent filtering, not the current date.
      const referenceDate = options.endDate ? new Date(options.endDate) : new Date();
      const currentMonth = referenceDate.getMonth() + 1; // 1-12

      if (options.onlySameMonth) {
        allowedMonths.push(currentMonth);
      }
      if (options.aMonthBefore) {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        if (!allowedMonths.includes(prevMonth)) {
          allowedMonths.push(prevMonth);
        }
      }
      if (options.aMonthAfter) {
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        if (!allowedMonths.includes(nextMonth)) {
          allowedMonths.push(nextMonth);
        }
      }
    }

    if (allowedMonths.length > 0) {
      filteredData = filteredData.filter(item => allowedMonths.includes(item.mm));
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