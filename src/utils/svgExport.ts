import * as opentype from 'opentype.js';

export interface GlyphExportData {
  char?: string;
  name?: string;
  unicode?: string;
  svgPath?: string;
  svgViewBox?: string;
}

/**
 * Extracts real SVG vector path data from font binary using opentype.js
 */
export async function getVectorPathFromFont(
  fontSource: Blob | ArrayBuffer | string,
  char?: string,
  unicode?: string
): Promise<{ svgPath: string; viewBox: string } | null> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fontSource instanceof ArrayBuffer) {
      arrayBuffer = fontSource;
    } else if (fontSource instanceof Blob) {
      arrayBuffer = await fontSource.arrayBuffer();
    } else if (typeof fontSource === 'string' && fontSource.trim().length > 0) {
      const response = await fetch(fontSource);
      if (!response.ok) return null;
      arrayBuffer = await response.arrayBuffer();
    } else {
      return null;
    }

    const otFont = opentype.parse(arrayBuffer);
    let glyph: opentype.Glyph | null = null;

    if (char) {
      glyph = otFont.charToGlyph(char);
    } else if (unicode) {
      const code = parseInt(unicode, 16);
      if (!isNaN(code)) {
        glyph = otFont.charToGlyph(String.fromCodePoint(code));
      }
    }

    if (!glyph) {
      return null;
    }

    const unitsPerEm = otFont.unitsPerEm || 1000;
    const ascender = otFont.ascender || 800;
    const descender = otFont.descender || -200;

    // Generate path with y = ascender so it flips correctly into SVG space [0, ascender - descender]
    const path = glyph.getPath(0, ascender, unitsPerEm);
    const svgPathData = path.toPathData(2);

    if (!svgPathData || svgPathData.trim() === '') {
      return null;
    }

    const bbox = glyph.getBoundingBox();
    const glyphWidth = glyph.advanceWidth || unitsPerEm;
    const fontHeight = ascender - descender;

    let xMin = 0;
    let yMin = 0;
    let xMax = glyphWidth;
    let yMax = fontHeight;

    if (bbox.x2 > bbox.x1 && bbox.y2 > bbox.y1) {
      const padX = (bbox.x2 - bbox.x1) * 0.08;
      const padY = (bbox.y2 - bbox.y1) * 0.08;
      xMin = bbox.x1 - padX;
      yMin = (ascender - bbox.y2) - padY;
      xMax = bbox.x2 + padX;
      yMax = (ascender - bbox.y1) + padY;
    }

    const width = Math.ceil(xMax - xMin) || 1000;
    const height = Math.ceil(yMax - yMin) || 1000;
    const viewBox = `${xMin.toFixed(1)} ${yMin.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`;

    return {
      svgPath: svgPathData,
      viewBox
    };
  } catch (err) {
    console.error('Error parsing vector path with opentype.js:', err);
    return null;
  }
}

export async function downloadGlyphAsSvg(
  glyph: GlyphExportData,
  fontName: string,
  fontSource?: Blob | ArrayBuffer | string | null
): Promise<boolean> {
  let finalPath = glyph.svgPath;
  let finalViewBox = glyph.svgViewBox;

  // If no pre-calculated vector path is available, parse the font source to extract true vector path
  if (!finalPath && fontSource) {
    const vectorData = await getVectorPathFromFont(fontSource, glyph.char, glyph.unicode);
    if (vectorData) {
      finalPath = vectorData.svgPath;
      finalViewBox = vectorData.viewBox;
    }
  }

  if (!finalPath) {
    return false;
  }

  const viewBox = finalViewBox || '0 0 1000 1000';
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="500" height="500">
  <path d="${finalPath}" fill="#000000" />
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeCharName = glyph.name || (glyph.unicode ? `U_${glyph.unicode}` : 'glyph');
  const safeFontName = (fontName || 'font').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.download = `${safeFontName}_${safeCharName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
