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

function extractDateTimeFromFileName(fileName: string): ImageData | null {
  console.log('Processing file:', fileName);
  
  // Format: Screenshot_20241204_170033.jpg (YYYYMMDD_HHMMSS)
  const match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    console.log('Matched filename pattern, groups:', match.slice(1));
    const [_, yyyy, mm, dd, hh, minute, ss] = match;
    
    // Convert all strings to numbers with parseInt
    const data = {
      fileName,
      fileFormat: path.extname(fileName).slice(1),
      yyyy: parseInt(yyyy, 10),
      mm: parseInt(mm, 10),
      dd: parseInt(dd, 10),
      hh: parseInt(hh, 10),
      minute: parseInt(minute, 10),
      ss: parseInt(ss, 10),
      assetPath: '',
      fileDescription: '',
      meta: {
        value: '',
        type: '',
      }
    };
    
    console.log('Extracted data:', data);
    return data;
  }

  console.log('No pattern matched for file:', fileName);
  return null;
}

function processImagesDirectory(dirPath: string, baseDir: string): ImageData[] {
  console.log('Processing directory:', dirPath);
  const items: ImageData[] = [];
  
  try {
    const files: string[] = fs.readdirSync(dirPath);
    console.log('Found files:', files);

    files.forEach((file: string) => {
      const fullPath: string = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log('Found subdirectory:', file);
        items.push(...processImagesDirectory(fullPath, baseDir));
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
          }
        }
      }
    });
  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }

  return items;
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

  const imageData: ImageData[] = processImagesDirectory(imagesDir, publicDir);
  console.log('Processed image data:', imageData);

  const outputPath = path.join(publicDir, 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
  console.log(`Written ${imageData.length} items to:`, outputPath);
}

main();