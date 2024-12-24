// scripts/processImages.ts
const fs = require('fs');
const path = require('path');

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

function extractDateTimeFromFileName(fileName: string): ImageData | null {
  console.log('Processing file:', fileName);
  
  // Format 1: Screenshot_20241204_170033.jpg (YYYYMMDD_HHMMSS)
  let match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  
  // Format 2: Screenshot_2024-12-19_205547_com.ubercab.driver.jpg (YYYY-MM-DD_HHMMSS_description)
  if (!match) {
    match = fileName.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})_(.+)\.jpg/);
  }

  // Format 3: 20240921_135601295.jpeg (YYYYMMDD_HHMMSSXXX)
  if (!match) {
    match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\d{3}\.(jpeg|jpg)$/);
  }

  if (match) {
    console.log('Matched filename pattern, groups:', match.slice(1));
    const [_, yyyy, mm, dd, hh, minute, ss, description] = match;
    
    // Convert all strings to numbers with parseInt
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
    
    console.log('Extracted data:', data);
    return data;
  }

  console.log('No pattern matched for file:', fileName);
  return null;
}

function processImagesDirectory(dirPath: string, baseDir: string): { items: ImageData[], summary: ProcessingSummary } {
  console.log('Processing directory:', dirPath);
  const items: ImageData[] = [];
  const summary: ProcessingSummary = {
    processedFiles: [],
    unprocessedFiles: []
  };
  
  try {
    const files: string[] = fs.readdirSync(dirPath);
    console.log('Found files:', files);

    files.forEach((file: string) => {
      const fullPath: string = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log('Found subdirectory:', file);
        const subDirResult = processImagesDirectory(fullPath, baseDir);
        items.push(...subDirResult.items);
        summary.processedFiles.push(...subDirResult.summary.processedFiles);
        summary.unprocessedFiles.push(...subDirResult.summary.unprocessedFiles);
      } else {
        const fileExt: string = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg'].includes(fileExt)) {
          console.log('Processing image file:', file);
          const imageData = extractDateTimeFromFileName(file);
          
          if (imageData) {
            const relativePath: string = path.relative(baseDir, fullPath);
            imageData.assetPath = '/' + relativePath.replace(/\\/g, '/');
            console.log('Added image data:', imageData);
            items.push(imageData);
            summary.processedFiles.push(file);
          } else {
            summary.unprocessedFiles.push(file);
          }
        } else {
          // Non-jpg files are considered unprocessed
          summary.unprocessedFiles.push(file);
        }
      }
    });

    // Sort items by date and time, newest first
    items.sort((a, b) => {
      const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss);
      const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, b.minute, b.ss);
      return dateB.getTime() - dateA.getTime();
    });

  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }

  return { items, summary };
}

function printSummary(summary: ProcessingSummary, totalFiles: number): void {
  console.log('\n=== Processing Summary ===');
  console.log(`Total files found: ${totalFiles}`);
  console.log(`Successfully processed: ${summary.processedFiles.length} files`);
  console.log(`Failed to process: ${summary.unprocessedFiles.length} files\n`);

  if (summary.unprocessedFiles.length > 0) {
    console.log('Failed to process the following files:');
    summary.unprocessedFiles.forEach(file => console.log(`  • ${file}`));
  }
  console.log('\n=========================');
}

function main() {
  console.log('Starting image processing...');
  const publicDir: string = path.join(process.cwd(), 'public');
  const imagesDir: string = path.join(publicDir, 'images');
  
  console.log('Public directory:', publicDir);
  console.log('Images directory:', imagesDir);
  
  if (!fs.existsSync(imagesDir)) {
    console.log('Images directory does not exist, creating it...');
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const { items: imageData, summary } = processImagesDirectory(imagesDir, publicDir);
  console.log('Processed image data:', imageData);

  const outputPath = path.join(publicDir, 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
  console.log(`Written ${imageData.length} items to:`, outputPath);

  // Print processing summary
  const totalFiles = summary.processedFiles.length + summary.unprocessedFiles.length;
  printSummary(summary, totalFiles);
}

main();