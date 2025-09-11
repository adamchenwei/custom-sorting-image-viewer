// scripts/clean-optimization-cache.ts
import fs from 'fs';
import path from 'path';

interface OptimizationRecord {
  [key: string]: {
    originalFileSize: number;
    optimizedFileSize: number;
    originalFileExtension: string;
    optimizedFileExtension: string;
  };
}

const publicDir = path.join(process.cwd(), 'public');
const imagesDir = path.join(publicDir, 'images');
const recordFilePath = path.join(publicDir, 'optimization-record.json');

async function cleanOptimizationCache() {
  console.log('Starting to clean up optimization cache...');

  if (!fs.existsSync(recordFilePath)) {
    console.error('Optimization record file not found. Nothing to clean.');
    return;
  }

  const optimizationRecords: OptimizationRecord = JSON.parse(fs.readFileSync(recordFilePath, 'utf8'));
  const originalFiles = fs.readdirSync(imagesDir);
  const currentImageFileNames = new Set(originalFiles.map(file => path.parse(file).name));

  const cleanedRecords: OptimizationRecord = {};
  const orphanedKeys: string[] = [];

  for (const key in optimizationRecords) {
    if (currentImageFileNames.has(key)) {
      cleanedRecords[key] = optimizationRecords[key];
    } else {
      orphanedKeys.push(key);
    }
  }

  if (orphanedKeys.length > 0) {
    fs.writeFileSync(recordFilePath, JSON.stringify(cleanedRecords, null, 2));
    console.log('\nRemoved the following orphaned entries from the cache:');
    orphanedKeys.forEach(key => console.log(`- ${key}`));
    console.log(`\nTotal entries removed: ${orphanedKeys.length}`);
    console.log(`Optimization cache has been cleaned up.`);
  } else {
    console.log('No orphaned entries found. The cache is already clean.');
  }
}

cleanOptimizationCache().catch(error => {
  console.error('Failed to clean up optimization cache:', error);
});
