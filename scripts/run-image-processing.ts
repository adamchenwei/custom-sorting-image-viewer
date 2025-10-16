import fs from 'fs';
import path from 'path';
import { processImagesDirectory, OptimizationRecord, ImageData } from './processImages';

const publicDir = path.join(process.cwd(), 'public');
const imageDir = path.join(publicDir, 'images');
const optimizedDir = path.join(publicDir, 'images_optimized');
const dataFilePath = path.join(publicDir, 'data.json');
const cacheFilePath = path.join(process.cwd(), '.optimization-cache.json');

function loadExistingData(filePath: string): any[] {
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileData);
  }
  return [];
}

function loadOptimizationCache(): OptimizationRecord {
  if (fs.existsSync(cacheFilePath)) {
    console.log('Loading optimization cache...');
    const cacheData = fs.readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(cacheData) as OptimizationRecord;
  }
  console.log('No optimization cache found, starting fresh.');
  return {};
}

function saveOptimizationCache(records: OptimizationRecord) {
  console.log('Saving optimization cache...');
  fs.writeFileSync(cacheFilePath, JSON.stringify(records, null, 2));
  console.log(`Cache saved to ${cacheFilePath}`);
}

async function runProcessing() {
  console.log('Starting image processing...');
  if (!fs.existsSync(imageDir)) {
    console.error(`Source images directory not found at ${imageDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(optimizedDir)) {
    console.log(`Creating optimized images directory at ${optimizedDir}`);
    fs.mkdirSync(optimizedDir, { recursive: true });
  }

  const optimizationRecords = loadOptimizationCache();
  const existingItems = loadExistingData(dataFilePath) as ImageData[];
  const existingFileNames = new Set(existingItems.map(item => path.parse(item.fileName).name));

  const { items: newItems, summary, updatedRecords } = await processImagesDirectory(
    imageDir,
    publicDir,
    optimizationRecords,
    existingFileNames
  );

  const allItems = [...existingItems, ...newItems];

  // Sort data by date, most recent first
  allItems.sort((a, b) => {
    const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss).getTime();
    const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, b.minute, b.ss).getTime();
    return dateB - dateA;
  });

  fs.writeFileSync(dataFilePath, JSON.stringify(allItems, null, 2));
  saveOptimizationCache(updatedRecords);

  console.log('\n--- Processing Summary ---');
  console.log(`${summary.processedFiles.length} files processed (including cached).`);
  console.log(`${summary.unprocessedFiles.length} files could not be processed.`);
  if (summary.unprocessedFiles.length > 0) {
    console.log('Unprocessed files:', summary.unprocessedFiles.join(', '));
  }
  console.log(`Successfully updated ${dataFilePath} with ${allItems.length} entries.`);
  console.log('Image processing complete.');
}

runProcessing().catch(error => {
  console.error('An error occurred during image processing:', error);
  process.exit(1);
});
