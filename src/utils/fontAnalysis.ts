import * as opentype from 'opentype.js';

export interface AnalyzedGlyph {
  char: string;
  index: number;
  unicode?: string;
  unicodes: number[];
  name: string;
  isMapped: boolean;
  isLigature: boolean;
  svgPath?: string;
  svgViewBox?: string;
}

export interface AnalyzedAxis {
  tag: string;
  name: string;
  minValue: number;
  defaultValue: number;
  maxValue: number;
}

export interface FontAnalysis {
  names: Record<string, { en: string }>;
  axes: AnalyzedAxis[];
  features: string[];
  glyphs: AnalyzedGlyph[];
  numGlyphs: number;
  mappedCount: number;
  codepoints: number[];
  otFont: opentype.Font;
}

const pickNames = (font: opentype.Font): Record<string, { en: string }> => {
  const raw: any = font.names || {};
  const table = raw.windows || raw.unicode || raw.macintosh || raw;
  const out: Record<string, { en: string }> = {};
  for (const [key, value] of Object.entries<any>(table)) {
    const text = value && typeof value === 'object' ? (value.en ?? Object.values(value)[0]) : value;
    if (typeof text === 'string' && text.trim()) out[key] = { en: text };
  }
  return out;
};

const glyphPath = (font: opentype.Font, g: opentype.Glyph) => {
  const upm = font.unitsPerEm || 1000;
  const asc = font.ascender || 800;
  const path = g.getPath(0, asc, upm);
  const data = path.toPathData(2);
  if (!data || !data.trim()) return null;
  const b = g.getBoundingBox();
  const padX = (b.x2 - b.x1) * 0.08;
  const padY = (b.y2 - b.y1) * 0.08;
  const w = b.x2 - b.x1 + padX * 2 || 1000;
  const h = b.y2 - b.y1 + padY * 2 || 1000;
  const viewBox = `${(b.x1 - padX).toFixed(1)} ${(asc - b.y2 - padY).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  return { data, viewBox };
};

/** Parses a font file entirely in the browser (no server). Glyph outlines are computed lazily on first access. */
export const analyzeFont = (buffer: ArrayBuffer): FontAnalysis => {
  const font = opentype.parse(buffer.slice(0));
  const count = font.glyphs.length;

  const features = new Set<string>();
  for (const table of [font.tables.gsub, font.tables.gpos] as any[]) {
    (table?.features || []).forEach((f: any) => f?.tag && features.add(f.tag));
  }

  const axes: AnalyzedAxis[] = ((font.tables as any).fvar?.axes || []).map((a: any) => ({
    tag: a.tag,
    name: (a.name && (a.name.en || Object.values(a.name)[0])) || a.tag,
    minValue: a.minValue,
    defaultValue: a.defaultValue,
    maxValue: a.maxValue,
  }));

  const glyphs: AnalyzedGlyph[] = [];
  const codepoints = new Set<number>();
  for (let i = 0; i < count; i++) {
    const g = font.glyphs.get(i);
    const unicodes: number[] = (g.unicodes && g.unicodes.length ? g.unicodes : g.unicode !== undefined ? [g.unicode] : []).filter(
      (u: number) => Number.isFinite(u) && u > 0,
    );
    unicodes.forEach((u) => codepoints.add(u));
    const code = unicodes[0];
    const entry: AnalyzedGlyph = {
      char: code !== undefined ? String.fromCodePoint(code) : '',
      index: i,
      unicode: code !== undefined ? code.toString(16).toUpperCase().padStart(4, '0') : undefined,
      unicodes,
      name: g.name || `glyph${i}`,
      isMapped: code !== undefined,
      isLigature: code === undefined && /(_|\.liga|lig)/i.test(g.name || ''),
    };
    let cache: ReturnType<typeof glyphPath> | undefined;
    const load = () => {
      if (cache === undefined) {
        try {
          cache = glyphPath(font, g);
        } catch {
          cache = null;
        }
      }
      return cache;
    };
    Object.defineProperty(entry, 'svgPath', { enumerable: true, get: () => load()?.data });
    Object.defineProperty(entry, 'svgViewBox', { enumerable: true, get: () => load()?.viewBox });
    glyphs.push(entry);
  }

  // mapped glyphs first (by code point), then the rest by index
  glyphs.sort((a, b) => {
    if (a.isMapped !== b.isMapped) return a.isMapped ? -1 : 1;
    return a.isMapped ? a.unicodes[0] - b.unicodes[0] : a.index - b.index;
  });

  return {
    names: pickNames(font),
    axes,
    features: [...features],
    glyphs,
    numGlyphs: count,
    mappedCount: glyphs.filter((g) => g.isMapped).length,
    codepoints: [...codepoints].sort((a, b) => a - b),
    otFont: font,
  };
};
