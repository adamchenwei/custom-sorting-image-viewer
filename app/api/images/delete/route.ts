// app/api/images/delete/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  assetPath: string;
  fileName: string;
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    // 1. Delete the file from public/images
    const imagePath = path.join(process.cwd(), 'public', 'images', body.fileName);
    console.log('Attempting to delete file at:', imagePath);
    
    try {
      const stats = await fs.stat(imagePath);
      console.log('File exists:', stats.isFile());
      
      // Delete the actual image file
      await fs.unlink(imagePath);
      console.log('Successfully deleted image file');
    } catch (error: any) {
      console.error('Error during file deletion:', {
        error: error.message,
        code: error.code,
        path: imagePath
      });
      
      return NextResponse.json(
        { 
          error: 'Image file could not be deleted',
          details: error.message,
          path: imagePath
        },
        { status: 500 }
      );
    }

    // 2. Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    console.log('Updating data.json at:', dataPath);
    
    try {
      const dataContent = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(dataContent);
      
      console.log('Current data entries:', data.length);
      const updatedData = data.filter((item: any) => item.assetPath !== body.assetPath);
      console.log('Updated data entries:', updatedData.length);
      
      await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
      console.log('Successfully updated data.json');
      
      return NextResponse.json({ 
        success: true,
        message: 'Image and data entry successfully deleted',
        deletedFile: imagePath
      });
    } catch (error) {
      console.error('Error updating data.json:', error);
      return NextResponse.json(
        { error: 'Failed to update data.json' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}