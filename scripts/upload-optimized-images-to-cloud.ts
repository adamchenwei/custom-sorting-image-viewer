import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const S3_BUCKET = 'custom-sorting-images-processed';
const S3_PREFIX = 'images_optimized';
const LOCAL_DIR = path.join(process.cwd(), 'public', 'images_optimized');
const DATA_JSON_PATH = path.join(process.cwd(), 'public', 'data.json');

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

function getS3Files(): Set<string> {
  console.log('Fetching S3 file list...');
  try {
    const result = execSync(
      `aws s3 ls s3://${S3_BUCKET}/${S3_PREFIX}/ --recursive | awk '{print $4}' | sed 's|${S3_PREFIX}/||'`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );
    const files = new Set(
      result.split('\n').filter(f => f.trim() && f.endsWith('.webp'))
    );
    console.log(`Found ${files.size} files in S3`);
    return files;
  } catch (error) {
    console.error('Error fetching S3 files:', error);
    return new Set();
  }
}

function getLocalFiles(): string[] {
  console.log('Scanning local directory...');
  const files = fs.readdirSync(LOCAL_DIR)
    .filter(f => f.endsWith('.webp'));
  console.log(`Found ${files.length} local .webp files`);
  return files;
}

function parseFilename(filename: string): ImageData {
  let match;

  // Pattern 1: Screenshot_2025-12-09_201623.webp (Screenshot_YYYY-MM-DD_HHMMSS)
  match = filename.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})\.webp/);
  if (match) return createEntry(match, filename);

  // Pattern 2: Screenshot_20241212_175645.webp (Screenshot_YYYYMMDD_HHMMSS)
  match = filename.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.webp/);
  if (match) return createEntry(match, filename);

  // Pattern 3: Screenshot_2025-02-23_102008_com.ubercab.driver.webp (with app name, dash format)
  match = filename.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})_.*\.webp/);
  if (match) return createEntry(match, filename);

  // Pattern 4: Screenshot_YYYYMMDD_HHMMSS_AppName.webp (with app name, no dash)
  match = filename.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_.*\.webp/);
  if (match) return createEntry(match, filename);

  // Pattern 5: 20240921_140340448.webp (YYYYMMDD_HHMMSSmmm - with milliseconds)
  match = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\d*\.webp/);
  if (match) return createEntry(match, filename);

  // Fallback - can't parse, use defaults
  console.log(`Could not parse timestamp from: ${filename}`);
  return {
    fileName: filename.replace('.webp', '.jpg'),
    fileFormat: 'jpg',
    yyyy: 2024,
    mm: 1,
    dd: 1,
    hh: 0,
    minute: 0,
    ss: 0,
    assetPath: `/images_optimized/${filename}`,
    fileDescription: '',
    meta: { value: 'timestamp', type: 'image' }
  };
}

function createEntry(match: RegExpMatchArray, filename: string): ImageData {
  return {
    fileName: filename.replace('.webp', '.jpg'),
    fileFormat: 'jpg',
    yyyy: parseInt(match[1]),
    mm: parseInt(match[2]),
    dd: parseInt(match[3]),
    hh: parseInt(match[4]),
    minute: parseInt(match[5]),
    ss: parseInt(match[6]),
    assetPath: `/images_optimized/${filename}`,
    fileDescription: '',
    meta: { value: 'timestamp', type: 'image' }
  };
}

function uploadToS3(files: string[]): void {
  if (files.length === 0) {
    console.log('No files to upload');
    return;
  }

  console.log(`\nUploading ${files.length} new files to S3...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = path.join(LOCAL_DIR, file);
    const s3Path = `s3://${S3_BUCKET}/${S3_PREFIX}/${file}`;

    try {
      execSync(`aws s3 cp "${localPath}" "${s3Path}" --content-type "image/webp"`, {
        stdio: 'pipe'
      });
      console.log(`[${i + 1}/${files.length}] Uploaded: ${file}`);
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error);
    }
  }
}

function updateDataJson(newFiles: string[]): void {
  console.log('\nUpdating data.json...');

  // Load existing data.json
  let existingData: ImageData[] = [];
  if (fs.existsSync(DATA_JSON_PATH)) {
    existingData = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf-8'));
  }

  // Create set of existing asset paths for quick lookup
  const existingPaths = new Set(existingData.map(item => item.assetPath));

  // Add new entries
  let addedCount = 0;
  for (const file of newFiles) {
    const assetPath = `/images_optimized/${file}`;
    if (!existingPaths.has(assetPath)) {
      const entry = parseFilename(file);
      existingData.push(entry);
      addedCount++;
    }
  }

  // Sort by date descending (newest first)
  existingData.sort((a, b) => {
    const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss);
    const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, b.minute, b.ss);
    return dateB.getTime() - dateA.getTime();
  });

  // Save updated data.json
  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(existingData, null, 2));
  console.log(`Added ${addedCount} new entries to data.json`);
  console.log(`Total entries in data.json: ${existingData.length}`);
}

async function main() {
  console.log('=== Upload Optimized Images to Cloud ===\n');

  // Step 1: Get S3 files
  const s3Files = getS3Files();

  // Step 2: Get local files
  const localFiles = getLocalFiles();

  // Step 3: Find new files (in local but not in S3)
  const newFiles = localFiles.filter(file => !s3Files.has(file));
  console.log(`\nNew files to upload: ${newFiles.length}`);

  if (newFiles.length === 0) {
    console.log('All local files are already in S3');
  } else {
    console.log('New files:', newFiles.slice(0, 10).join(', ') + (newFiles.length > 10 ? '...' : ''));

    // Step 4: Upload new files to S3
    uploadToS3(newFiles);
  }

  // Step 5: Update data.json with all local files
  updateDataJson(localFiles);

  console.log('\n=== Complete ===');
}

main().catch(console.error);
