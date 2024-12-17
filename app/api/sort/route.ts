import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
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

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          console.log(`Item excluded by start date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          console.log(`Item excluded by end date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        return true;
      });
    }

    console.log('Data after date filtering:', filteredData.length);

    // Time filtering
    if (options.startTime || options.endTime) {
      console.log('Applying time filters:', { startTime: options.startTime, endTime: options.endTime });
      
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          console.log(`Item excluded by start time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          console.log(`Item excluded by end time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        return true;
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