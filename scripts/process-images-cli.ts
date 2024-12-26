// scripts/process-images-cli.ts
import path from 'path';
import fs from 'fs';
import { processImagesDirectory, extractDateTimeFromFileName } from './processImages';

function main() {
  try {
    // Get the public directory path
    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');
    const dataJsonPath = path.join(publicDir, 'data.json');

    // Ensure the images directory exists
    if (!fs.existsSync(imagesDir)) {
      console.error('Images directory does not exist:', imagesDir);
      console.log('Creating images directory...');
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Process the images directory
    console.log('Processing images directory:', imagesDir);
    const { items, summary } = processImagesDirectory(imagesDir, publicDir);

    // Write the results to data.json
    fs.writeFileSync(dataJsonPath, JSON.stringify(items, null, 2));

    // Print summary
    console.log('\nProcessing Summary:');
    console.log('------------------');
    console.log('Total images processed:', summary.processedFiles.length);
    console.log('Successfully processed files:', summary.processedFiles.length);
    console.log('Unprocessed files:', summary.unprocessedFiles.length);
    
    if (summary.unprocessedFiles.length > 0) {
      console.log('\nUnprocessed files:');
      summary.unprocessedFiles.forEach(file => console.log(`- ${file}`));
    }

    console.log('\nData written to:', dataJsonPath);

  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

// Execute the script
main();