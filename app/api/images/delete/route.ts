import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';

interface OptimizationRecord {
  [key: string]: {
    sourcePath: string;
    optimizedPath: string;
    lastModified: number;
  };
}

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

    const optimizationRecordPath = path.join(process.cwd(), 'public', 'optimization-record.json');
    const optimizationRecords: OptimizationRecord = JSON.parse(await fs.readFile(optimizationRecordPath, 'utf-8'));

    for (const image of body.images) {
      const fileBaseName = path.parse(image.fileName).name;
      const originalImagePath = path.join(process.cwd(), 'public', 'images', image.fileName);
      const optimizedImagePath = path.join(process.cwd(), 'public', 'images_optimized', `${fileBaseName}.webp`);

      let deletedSuccessfully = false;

      try {
        // Delete original image
        if (fsSync.existsSync(originalImagePath)) {
          await fs.unlink(originalImagePath);
          console.log(`Deleted original image: ${originalImagePath}`);
        }
        deletedSuccessfully = true;
      } catch {
        console.warn(`Could not delete original image (may have already been deleted): ${originalImagePath}`);
        // If original is gone, we can still proceed to delete optimized and records
        deletedSuccessfully = true;
      }

      try {
        // Delete optimized image
        if (fsSync.existsSync(optimizedImagePath)) {
          await fs.unlink(optimizedImagePath);
          console.log(`Deleted optimized image: ${optimizedImagePath}`);
        }
      } catch {
        console.warn(`Could not delete optimized image: ${optimizedImagePath}`);
      }

      if (deletedSuccessfully) {
        // Remove from optimization record
        if (optimizationRecords[fileBaseName]) {
          delete optimizationRecords[fileBaseName];
          console.log(`Removed ${fileBaseName} from optimization record.`);
        }
        deleteResults.success.push(image.fileName);
      } else {
        deleteResults.failed.push(image.fileName);
      }
    }

    // Write updated optimization records back to file
    await fs.writeFile(optimizationRecordPath, JSON.stringify(optimizationRecords, null, 2));

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
    
    const updatedData = data.filter((item: { assetPath: string }) => !successfullyDeletedPaths.has(item.assetPath));
    
    // Write updated data back to file
    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: deleteResults,
      remainingImages: updatedData
    });
    
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete images',
        details: String(error)
      },
      { status: 500 }
    );
  }
}