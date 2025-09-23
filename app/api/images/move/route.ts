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

  } catch (error: unknown) {
    console.error('Move API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to move images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}