import fs from 'fs';
import path from 'path';

function checkHeader(filePath) {
  if (!fs.existsSync(filePath)) {
    return 'does not exist';
  }
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  return `Header: ${riff} ... ${webp} (hex: ${buffer.toString('hex')})`;
}

console.log('--- ROOT DIRECTORY WEBP HEADERS ---');
const rootFiles = fs.readdirSync('.');
rootFiles.forEach(file => {
  if (file.endsWith('.webp') || file.includes('.webp')) {
    console.log(`${file}: ${checkHeader(file)}`);
  }
});

console.log('--- PUBLIC/TELEGRAM-IMAGES WEBP HEADERS ---');
const destDir = 'public/telegram-images';
if (fs.existsSync(destDir)) {
  const destFiles = fs.readdirSync(destDir);
  destFiles.forEach(file => {
    if (file.endsWith('.webp')) {
      console.log(`${file}: ${checkHeader(path.join(destDir, file))}`);
    }
  });
}
