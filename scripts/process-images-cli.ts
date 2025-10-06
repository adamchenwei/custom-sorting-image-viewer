/**
 * @file This script generates `public/data.json` by scanning the `public/images_optimized` directory.
 * It treats the optimized directory as the source of truth, ensuring that the JSON data
 * always reflects the complete set of available webp images.
 */
import path from 'path';
import fs from 'fs';

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
  meta: { value: string; type: string };
}

/**
 * Parses a filename to extract date and time information.
 * Supports two formats:
 * 1. Screenshot_YYYY-MM-DD_HHMMSS.webp
 * 2. YYYYMMDD_HHMMSS.webp
 * @param fileName The name of the file to parse.
 * @returns An object with date/time components, or null if parsing fails.
 */
function parseDateTimeFromFileName(fileName: string): Omit<ImageData, 'assetPath' | 'fileDescription' | 'meta' | 'fileFormat'> | null {
  const screenshotRegex = /Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2}).*\.webp/;
  const simpleRegex = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2}).*\.webp/;
  const anotherFormatRegex = /Screenshot_(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2}).*\.webp/;

  let match = fileName.match(screenshotRegex);
  if (match) {
    const [, yyyy, mm, dd, hh, minute, ss] = match.map(Number);
    return { fileName, yyyy, mm, dd, hh, minute, ss };
  }

  match = fileName.match(simpleRegex);
  if (match) {
    const [, yyyy, mm, dd, hh, minute, ss] = match.map(Number);
    return { fileName, yyyy, mm, dd, hh, minute, ss };
  }

  match = fileName.match(anotherFormatRegex);
  if (match) {
    const [, yyyy, mm, dd, hh, minute, ss] = match.map(Number);
    return { fileName, yyyy, mm, dd, hh, minute, ss };
  }

  return null;
}

async function main() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const optimizedDir = path.join(publicDir, 'images_optimized');
    const dataJsonPath = path.join(publicDir, 'data.json');

    if (!fs.existsSync(optimizedDir)) {
      console.error(`Error: Optimized images directory not found at ${optimizedDir}`);
      process.exit(1);
    }

    console.log(`Scanning for images in: ${optimizedDir}`);
    const optimizedFiles = fs.readdirSync(optimizedDir).filter(file =>
      file.toLowerCase().endsWith('.webp')
    );

    console.log(`Found ${optimizedFiles.length} .webp images.`);

    const items: ImageData[] = [];
    for (const file of optimizedFiles) {
      const parsedData = parseDateTimeFromFileName(file);
      if (parsedData) {
        items.push({
          ...parsedData,
          fileFormat: 'webp',
          assetPath: `/images_optimized/${file}`,
          fileDescription: '',
          meta: { value: 'timestamp', type: 'image' },
        });
      } else {
        console.warn(`- Could not parse date/time from filename: ${file}`);
      }
    }

    // Sort data by date, most recent first
    items.sort((a, b) => {
      const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss).getTime();
      const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, b.minute, b.ss).getTime();
      return dateB - dateA;
    });

    fs.writeFileSync(dataJsonPath, JSON.stringify(items, null, 2));

    console.log(`
Successfully generated data.json with ${items.length} entries.`);
    console.log(`Data written to: ${dataJsonPath}`);

  } catch (error) {
    console.error('Error generating data.json:', error);
    process.exit(1);
  }
}

// Execute the script
main();