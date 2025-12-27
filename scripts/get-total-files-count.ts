import fs from 'fs';
import path from 'path';

function countFiles(dir: string): number {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  return dirents.reduce((count, dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      return count + countFiles(res);
    } else {
      return count + 1;
    }
  }, 0);
}

const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Please provide a folder path.');
  process.exit(1);
}

if (!fs.existsSync(folderPath)) {
  console.error(`Folder not found: ${folderPath}`);
  process.exit(1);
}

const fileCount = countFiles(folderPath);
console.log(`Total number of files in ${folderPath}: ${fileCount}`);
