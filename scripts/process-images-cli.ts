// scripts/process-images-cli.ts
import path from 'path';
import fs from 'fs';
import { processImagesDirectory, OptimizationRecord } from './processImages';

interface ProcessingState {
  totalImagesProcessed: number;
  forceUpdate: boolean;
}

async function main() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');
    const dataJsonPath = path.join(publicDir, 'data.json');
    const optimizationRecordPath = path.join(publicDir, 'optimization-record.json');
    const stateFilePath = path.join(process.cwd(), 'image-processing-state.json');

    if (!fs.existsSync(imagesDir)) {
      console.log('Creating images directory as it does not exist...');
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    let state: ProcessingState = { totalImagesProcessed: 0, forceUpdate: false };
    if (fs.existsSync(stateFilePath)) {
      state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    } else {
        console.log('State file not found, creating one.');
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(file =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    const currentImageCount = imageFiles.length;

    if (currentImageCount === state.totalImagesProcessed && !state.forceUpdate) {
      console.log(`Skipping image processing: Image count (${currentImageCount}) is unchanged and forceUpdate is false.`);
      return;
    }

    let optimizationRecords: OptimizationRecord = {};
    if (fs.existsSync(optimizationRecordPath)) {
      optimizationRecords = JSON.parse(fs.readFileSync(optimizationRecordPath, 'utf8'));
    } else {
      console.log('Optimization record not found, creating a new one.');
    }

    const optimizedDir = path.join(publicDir, 'images_optimized');
    const optimizedImageCount = fs.existsSync(optimizedDir) ? fs.readdirSync(optimizedDir).length : 0;

    if (currentImageCount === optimizedImageCount && !state.forceUpdate) {
      console.log(`Skipping image processing: Image count (${currentImageCount}) matches optimized image count (${optimizedImageCount}) and forceUpdate is false.`);
      return;
    }

    console.log('Starting image processing...');
    const { items, summary, updatedRecords } = await processImagesDirectory(imagesDir, publicDir, optimizationRecords);

    fs.writeFileSync(optimizationRecordPath, JSON.stringify(updatedRecords, null, 2));
    console.log('Optimization records updated.');

    fs.writeFileSync(dataJsonPath, JSON.stringify(items, null, 2));

    const writtenData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));

    console.log('\nProcessing Summary:');
    console.log('------------------');
    console.log('Total images processed:', summary.processedFiles.length);
    console.log('Successfully processed files:', summary.processedFiles.length);
    console.log('Unprocessed files:', summary.unprocessedFiles.length);
    console.log('Items written to data.json:', writtenData.length);

    if (writtenData.length !== summary.processedFiles.length) {
      console.warn('\nWARNING: Mismatch between processed files and data.json entries!');
    } else {
      console.log('\nValidation: ✓ Number of processed files matches data.json entries');
    }

    if (summary.unprocessedFiles.length > 0) {
      console.log('\nUnprocessed files:');
      summary.unprocessedFiles.forEach(file => console.log(`- ${file}`));
    }

    console.log('\nData written to:', dataJsonPath);

    // Update state file
    const newState: ProcessingState = { totalImagesProcessed: currentImageCount, forceUpdate: false };
    fs.writeFileSync(stateFilePath, JSON.stringify(newState, null, 2));
    console.log('Image processing state updated.');

  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

// Execute the script
main();