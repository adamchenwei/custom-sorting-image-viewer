/**
 * @file This script processes images from the `public/images` directory, extracts metadata,
 * and generates a `public/data.json` file that the application uses to display images.
 * It includes a multi-level caching mechanism to avoid reprocessing images unnecessarily.
 *
 * Caching and Processing Logic:
 *
 * 1. State Management (`image-processing-state.json`):
 *    - The script starts by reading `image-processing-state.json`, which stores the state from the last run.
 *    - This state includes `totalImagesProcessed` (the number of images found in the previous run) and a `forceUpdate` flag.
 *    - If `forceUpdate` is `true`, all caching checks are bypassed, and images are reprocessed.
 *
 * 2. First-Level Cache Check (Image Count):
 *    - The script performs a quick check by comparing the current number of files in `public/images`
 *      with `totalImagesProcessed` from the state file.
 *    - If the count is the same and `forceUpdate` is `false`, the script exits, assuming no changes have occurred.
 *
 * 3. Second-Level Cache Check (Optimized Image Count):
 *    - If the first check fails, the script compares the number of source images with the number of
 *      images in the `public/images_optimized` directory.
 *    - If the counts match and `forceUpdate` is `false`, the script exits. This is a secondary check
 *      to ensure that all source images have a corresponding optimized version.
 *
 * 4. Image Processing (`processImagesDirectory`):
 *    - If either of the cache checks indicates a change, the script proceeds to the main processing logic.
 *    - It loads `public/optimization-record.json`, which contains metadata about previously optimized images.
 *      This record is passed to the `processImagesDirectory` function to avoid re-optimizing images that
 *      have not changed.
 *    - The `processImagesDirectory` function is responsible for:
 *      - Optimizing new or modified images.
 *      - Extracting metadata (like date and time from filenames).
 *      - Returning a list of image data (`items`), a summary of the operation, and the updated optimization records.
 *
 * 5. Orphaned Record Detection:
 *    - After processing, the script checks for "orphaned" entries in the `optimization-record.json`.
 *    - An orphaned entry is a record for an image that no longer exists in the `public/images` directory.
 *    - If orphans are found, it logs them and suggests running a cleanup script.
 *
 * 6. Output Generation:
 *    - The script overwrites `public/data.json` with the new image data.
 *    - It also updates `public/optimization-record.json` with the latest optimization metadata.
 *
 * 7. State Update:
 *    - Finally, the script updates `image-processing-state.json` with the current image count and resets
 *      the `forceUpdate` flag to `false`, preparing it for the next run.
 */
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

    const initialRecordKeys = Object.keys(optimizationRecords);
    const currentImageFileNames = new Set(imageFiles.map(file => path.parse(file).name));
    const orphanedKeys = initialRecordKeys.filter(key => !currentImageFileNames.has(key));

    if (orphanedKeys.length > 0) {
      console.log('\nOrphaned entries found in optimization-record.json (original images may have been deleted):');
      orphanedKeys.forEach(key => console.log(`- ${key}`));
      console.log(`\nTo clean up, run: npm run image:clean-up-optimization-cache`);
    }

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