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
