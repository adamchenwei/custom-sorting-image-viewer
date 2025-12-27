import fs from 'fs';
import path from 'path';

function deleteFolderRecursive(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
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

console.log(`Deleting folder: ${folderPath}`);
deleteFolderRecursive(folderPath);
console.log('Folder deleted successfully.');
