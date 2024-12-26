// app/api/images/move/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getDay } from 'date-fns';

interface MoveRequest {
  assetPath: string;
  fileName: string;
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
    const currentPath = path.join(publicDir, 'images', body.fileName);
    const targetDir = path.join(publicDir, body.targetPath);
    const targetPath = path.join(targetDir, body.fileName);
    
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });
    
    // Move the file
    await fs.rename(currentPath, targetPath);
    
    // Update data.json
    console.log('Updating data.json...');
    const dataPath = path.join(publicDir, 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    let imageData: ImageData[] = JSON.parse(dataContent);
    
    // Find the moved image in the data
    const movedImageIndex = imageData.findIndex(item => item.assetPath === body.assetPath);
    
    if (movedImageIndex !== -1) {
      // Update the asset path for the moved image
      const relativePath = path.relative(publicDir, targetPath);
      imageData[movedImageIndex].assetPath = '/' + relativePath.replace(/\\/g, '/');
      
      // Write the updated data back to data.json
      await fs.writeFile(dataPath, JSON.stringify(imageData, null, 2));
      
      // Apply sort options if they exist
      const sortedData = body.sortOptions ? applySortOptions(imageData, body.sortOptions) : imageData;
      
      return NextResponse.json({ 
        success: true,
        message: 'Image moved successfully and data.json updated',
        newPath: targetPath,
        newData: sortedData
      });
    } else {
      throw new Error('Image not found in data.json');
    }
  } catch (error: any) {
    console.error('Move API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to move image',
        details: error.message
      },
      { status: 500 }
    );
  }
}