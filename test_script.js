import fs from 'fs';
import * as opentype from 'opentype.js';

const fontPath = 'node_modules/opentype.js/test/fonts/Roboto-Black.ttf'; // Just a fallback or whatever
if(fs.existsSync(fontPath)) {
   const font = opentype.loadSync(fontPath);
   const numGlyphs = font.numGlyphs;
   console.log("Num Glyphs:", numGlyphs);
   
   const glyph = font.glyphs.get(20); 
   console.log("Path:", glyph.getPath(0, 30, 30).toPathData(2));
} else {
   console.log("No font");
}
