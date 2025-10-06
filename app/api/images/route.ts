import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Enable caching but allow revalidation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}