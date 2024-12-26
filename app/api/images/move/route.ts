import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface MoveRequest {
  assetPath: string;
  fileName: string;
  targetPath: string;
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
    const dataPath = path.join(publicDir, 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(dataContent);
    
    const updatedData = data.map((item: any) => {
      if (item.assetPath === body.assetPath) {
        return {
          ...item,
          assetPath: `/${body.targetPath}/${body.fileName}`.replace(/\\/g, '/')
        };
      }
      return item;
    });
    
    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Image moved successfully',
      newPath: targetPath
    });
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