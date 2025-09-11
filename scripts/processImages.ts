// app/utils/processImages.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface OptimizationRecord {
  [key: string]: {
    originalFileSize: number;
    optimizedFileSize: number;
    originalFileExtension: string;
    optimizedFileExtension: string;
  };
}

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
  fileDescription: string;
  meta: {
    value: string;
    type: string;
  };
}

interface ProcessingSummary {
  processedFiles: string[];
  unprocessedFiles: string[];
}

export function extractDateTimeFromFileName(fileName: string): ImageData | null {
  console.log('Processing file:', fileName);
  
  // Format 1: Screenshot_20241204_170033.jpg (YYYYMMDD_HHMMSS)
  let match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  
  // Format 2: Screenshot_2024-12-19_205547_com.ubercab.driver.jpg (YYYY-MM-DD_HHMMSS_description)
  if (!match) {
    match = fileName.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})_(.+)\.jpg/);
  }

  // Format 3: Screenshot_2024-12-24_174935.jpg (YYYY-MM-DD_HHMMSS)
  if (!match) {
    match = fileName.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})\.jpg/);
  }

  // Format 4: 20240921_135601295.jpeg (YYYYMMDD_HHMMSSXXX)
  if (!match) {
    match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\d{3}\.(jpeg|jpg)$/);
  }

  // Format 5: Screenshot_20240318-082104_Uber Driver.jpg (YYYYMMDD-HHMMSS_description)
  if (!match) {
    match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})_(.+)\.(jpg|jpeg)/);
  }

  if (match) {
    const [_, yyyy, mm, dd, hh, minute, ss, description] = match;
    
    const data: ImageData = {
      fileName,
      fileFormat: path.extname(fileName).slice(1),
      yyyy: parseInt(yyyy, 10),
      mm: parseInt(mm, 10),
      dd: parseInt(dd, 10),
      hh: parseInt(hh, 10),
      minute: parseInt(minute, 10),
      ss: parseInt(ss, 10),
      assetPath: '',
      fileDescription: description ? description.replace(/_/g, ' ') : '',
      meta: {
        value: 'timestamp',
        type: 'image'
      }
    };
    
    return data;
  }

  return null;
}


export async function processImagesDirectory(
  dirPath: string,
  baseDir: string,
  optimizationRecords: OptimizationRecord
): Promise<{ items: ImageData[], summary: ProcessingSummary, updatedRecords: OptimizationRecord }> {
  const items: ImageData[] = [];
  const summary: ProcessingSummary = {
    processedFiles: [],
    unprocessedFiles: []
  };
  const updatedRecords = { ...optimizationRecords };

  try {
    const optimizedDir = path.join(baseDir, 'images_optimized');
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subDirResult = await processImagesDirectory(fullPath, baseDir, updatedRecords);
        items.push(...subDirResult.items);
        summary.processedFiles.push(...subDirResult.summary.processedFiles);
        summary.unprocessedFiles.push(...subDirResult.summary.unprocessedFiles);
        Object.assign(updatedRecords, subDirResult.updatedRecords);
      } else {
        const fileExt = path.extname(file).toLowerCase();
        const fileBaseName = path.parse(file).name;
        if (updatedRecords[fileBaseName]) {
          console.log(`Skipping ${file} as it is already in the optimization record.`);
          const imageData = extractDateTimeFromFileName(file);
          if (imageData) {
            const optimizedFileName = `${fileBaseName}.webp`;
            const optimizedFilePath = path.join(optimizedDir, optimizedFileName);
            const relativePath = path.relative(baseDir, optimizedFilePath);
            imageData.assetPath = '/' + relativePath.replace(/\\/g, '/');
            items.push(imageData);
            summary.processedFiles.push(file);
          }

        } else if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
          const imageData = extractDateTimeFromFileName(file);

          if (imageData) {
            const optimizedFileName = `${path.parse(file).name}.webp`;
            const optimizedFilePath = path.join(optimizedDir, optimizedFileName);

            try {
              await sharp(fullPath)
                .resize({ width: 1920, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(optimizedFilePath);

              const relativePath = path.relative(baseDir, optimizedFilePath);
              imageData.assetPath = '/' + relativePath.replace(/\\/g, '/');
              items.push(imageData);
              summary.processedFiles.push(file);

              const originalStats = fs.statSync(fullPath);
              const optimizedStats = fs.statSync(optimizedFilePath);

              updatedRecords[fileBaseName] = {
                originalFileSize: parseFloat((originalStats.size / 1024).toFixed(2)),
                optimizedFileSize: parseFloat((optimizedStats.size / 1024).toFixed(2)),
                originalFileExtension: path.extname(file).slice(1),
                optimizedFileExtension: 'webp',
              };
            } catch (error) {
              console.error(`Failed to process ${file}:`, error);
              summary.unprocessedFiles.push(file);
            }
          } else {
            summary.unprocessedFiles.push(file);
          }
        } else {
          summary.unprocessedFiles.push(file);
        }
      }
    }

    // Sort items by date and time, newest first
    items.sort((a, b) => {
      const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss);
      const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, a.minute, b.ss);
      return dateB.getTime() - dateA.getTime();
    });

  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }

  return { items, summary, updatedRecords };
}