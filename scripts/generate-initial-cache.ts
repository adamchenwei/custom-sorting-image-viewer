// scripts/generate-initial-cache.ts
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
const optimizedDir = path.join(publicDir, 'images_optimized');
const recordFilePath = path.join(publicDir, 'optimization-record.json');

async function generateInitialCache() {
  console.log('Starting to generate initial optimization cache...');

  if (!fs.existsSync(imagesDir) || !fs.existsSync(optimizedDir)) {
    console.error('Source or optimized images directory does not exist.');
    return;
  }

  const records: OptimizationRecord = {};
  const originalFiles = fs.readdirSync(imagesDir);

  for (const fileName of originalFiles) {
    const fileBaseName = path.parse(fileName).name;
    const originalFileExt = path.parse(fileName).ext;

    const optimizedFileName = `${fileBaseName}.webp`;
    const optimizedFilePath = path.join(optimizedDir, optimizedFileName);

    if (fs.existsSync(optimizedFilePath)) {
      const originalFilePath = path.join(imagesDir, fileName);

      const originalStats = fs.statSync(originalFilePath);
      const optimizedStats = fs.statSync(optimizedFilePath);

      records[fileBaseName] = {
        originalFileSize: parseFloat((originalStats.size / 1024).toFixed(2)),
        optimizedFileSize: parseFloat((optimizedStats.size / 1024).toFixed(2)),
        originalFileExtension: originalFileExt.slice(1),
        optimizedFileExtension: 'webp',
      };
      console.log(`Generated record for ${fileBaseName}`)
    }
  }

  fs.writeFileSync(recordFilePath, JSON.stringify(records, null, 2));
  console.log(`
Initial optimization cache generated at ${recordFilePath}`);
  console.log(`Total records created: ${Object.keys(records).length}`);
}

generateInitialCache().catch(error => {
  console.error('Failed to generate initial cache:', error);
});
