import fs from 'fs';
import path from 'path';

const destDir = 'public/telegram-images';
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const sizeMap = {
  12142: 'arabic-library.webp',
  61394: 'elgharib-main.webp',
  82780: 'elgharib-icons.webp',
  36548: 'elgharib-english.webp',
  56634: 'elgharib-font4u.webp',
  16520: 'quranic-fonts.webp'
};

const files = fs.readdirSync('.');
files.forEach(file => {
  if (file.toLowerCase().endsWith('.webp')) {
    const size = fs.statSync(file).size;
    const targetName = sizeMap[size];
    if (targetName) {
      const destPath = path.join(destDir, targetName);
      try {
        fs.copyFileSync(file, destPath);
        console.log(`Copied strictly by size: ${file} (${size} bytes) -> ${destPath}`);
      } catch (err) {
        console.error(`Failed to copy ${file}:`, err);
      }
    } else {
      console.log(`No size-based match for ${file} with size ${size}`);
    }
  }
});
