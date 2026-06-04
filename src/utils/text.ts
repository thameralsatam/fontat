export const truncateMiddle = (text: string, startChars: number = 8, endChars: number = 6): string => {
  if (!text) return text;
  if (text.length <= startChars + endChars) return text;
  return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`;
};

export const truncateEmail = (email: string | undefined): string => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return truncateMiddle(email, 4, 4);
  if (name.length <= 4) return email;
  return `${name.substring(0, 4)}...@${domain}`;
};

export const formatFontName = (name: string): string => {
  if (!name) return '';
  const base = name.replace(/\.(ttf|otf|woff2|woff)$/i, '');
  return truncateMiddle(base, 10, 8);
};
