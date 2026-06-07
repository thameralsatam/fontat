import fs from 'fs';
import path from 'path';

const mapping = {
  'Ø®Ø·ÙˆØ· Ø£Ø­Ù…Ø¯ Ø§Ù„ØºØ±ÙŠØ¨.webp': 'public/telegram-images/elgharib-main.webp',
  'Ø®Ø·ÙˆØ· Ø§Ù„ØºØ±ÙŠØ¨.webp': 'public/telegram-images/elgharib-font4u.webp',
  'Ø®Ø·ÙˆØ· Ù‚Ø±Ø¢Ù†.webp': 'public/telegram-images/quranic-fonts.webp',
  'Ø®Ø·ÙˆØ· Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø£Ø­Ù…Ø¯ Ø§Ù„ØºØ±ÙŠØ¨.webp': 'public/telegram-images/elgharib-english.webp',
  'Ø®Ø·ÙˆØ· Ø£ÙŠÙ‚ÙˆÙ†Ø§Øª Ø£Ø­Ù…Ø¯ Ø§Ù„ØºØ±ÙŠØ¨.webp': 'public/telegram-images/elgharib-icons.webp',
  'Ø§Ù„Ù…ÙƒØªØ¨Ø© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ù„Ù„Ø®Ø·ÙˆØ·.webp': 'public/telegram-images/arabic-library.webp'
};

const destDir = 'public/telegram-images';
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('--- STARTING BINARY COPY ---');
for (const [src, dest] of Object.entries(mapping)) {
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`Successfully copied ${src} -> ${dest} (Size: ${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`Error copying ${src} to ${dest}:`, err);
    }
  } else {
    console.warn(`Source file not found: ${src}`);
  }
}
console.log('--- COPY COMPLETED ---');
