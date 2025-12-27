import fs from 'fs';
import path from 'path';
import { processImagesDirectory, OptimizationRecord } from './processImages';

const publicDir = path.join(process.cwd(), 'public');
const imageDir = path.join(publicDir, 'images');
const optimizedDir = path.join(publicDir, 'images_optimized');
const cacheFilePath = path.join(process.cwd(), '.optimization-cache.json');

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

async function runOptimization() {
  console.log('Starting image optimization (without data.json update)...');

  if (!fs.existsSync(imageDir)) {
    console.error(`Source images directory not found at ${imageDir}`);
    console.log('Nothing to optimize.');
    process.exit(0);
  }

  if (!fs.existsSync(optimizedDir)) {
    console.log(`Creating optimized images directory at ${optimizedDir}`);
    fs.mkdirSync(optimizedDir, { recursive: true });
  }

  const optimizationRecords = loadOptimizationCache();

  const { items, summary, updatedRecords } = await processImagesDirectory(
    imageDir,
    publicDir,
    optimizationRecords,
    new Set() // Empty set - process all images
  );

  saveOptimizationCache(updatedRecords);

  console.log('\n--- Optimization Summary ---');
  console.log(`${summary.processedFiles.length} files optimized (including cached).`);
  console.log(`${summary.unprocessedFiles.length} files could not be processed.`);
  if (summary.unprocessedFiles.length > 0) {
    console.log('Unprocessed files:', summary.unprocessedFiles.join(', '));
  }
  console.log(`${items.length} optimized images ready in ${optimizedDir}`);
  console.log('Image optimization complete.');
  console.log('\nNote: data.json was NOT updated. Run "npm run upload-optimized-images-to-cloud-and-update-datajson" to sync to cloud and update data.json.');
}

runOptimization().catch(error => {
  console.error('An error occurred during image optimization:', error);
  process.exit(1);
});
