const truncateMiddle = (text: string, startChars: number = 8, endChars: number = 6): string => {
  if (!text) return text;
  if (text.length <= startChars + endChars) return text;
  return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`;
};

export const formatFontName = (name: string): string => {
  if (!name) return '';
  const base = name.replace(/\.(ttf|otf|woff2|woff)$/i, '');
  return truncateMiddle(base, 10, 8);
};

// Escapes a value so it can be placed safely inside a double-quoted CSS string
// (e.g. font-family names or url("...") built from user-supplied data).
export const cssString = (value: string): string =>
  String(value ?? '').replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]/g, ' ');

// Public font URL: readable name + short code (first 8 hex chars of the id), e.g. "cairo-regular-3f9a8c21".
export const fontSlug = (font: { id: string; name: string }): string => {
  const base = formatFontNameForSlug(font.name);
  return `${base ? base + '-' : ''}${font.id.slice(0, 8)}`;
};

const formatFontNameForSlug = (name: string): string =>
  String(name ?? '')
    .replace(/\.(ttf|otf|woff2|woff)$/i, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Returns the 8-char code at the end of a public font URL param, or null for old-style (name-only) links. */
export const fontCodeFromParam = (param: string): string | null => {
  const m = /(?:^|-)([0-9a-f]{8})$/.exec(param);
  return m ? m[1] : null;
};
