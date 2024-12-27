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