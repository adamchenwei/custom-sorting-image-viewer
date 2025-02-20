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