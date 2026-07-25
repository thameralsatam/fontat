export type SortOption = 'oldest_first' | 'newest_first' | 'alpha_az' | 'alpha_za';

export interface SortOptionItem {
  id: SortOption;
  labelAr: string;
  labelEn: string;
}

export class SortOptionList {
  static OPTIONS: SortOptionItem[] = [
    {
      id: 'oldest_first',
      labelAr: 'من الأقدم للأحدث',
      labelEn: 'Oldest to Newest'
    },
    {
      id: 'newest_first',
      labelAr: 'من الأحدث للأقدم',
      labelEn: 'Newest to Oldest'
    },
    {
      id: 'alpha_az',
      labelAr: 'أبجدي (A - Z)',
      labelEn: 'Alphabetical (A - Z)'
    },
    {
      id: 'alpha_za',
      labelAr: 'أبجدي (Z - A)',
      labelEn: 'Alphabetical (Z - A)'
    }
  ];
}

/**
 * Categorize first character into buckets:
 * 1 = English / Latin letter
 * 2 = Arabic letter
 * 3 = Number / Symbol / Special character
 */
function getCharBucket(char: string): number {
  if (!char) return 3;
  // English / Latin character
  if (/^[A-Za-z]$/.test(char)) return 1;
  // Arabic character
  if (/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]$/.test(char)) return 2;
  // Numbers, punctuation, emojis, and symbols
  return 3;
}

/**
 * Strips common font extensions and trims spaces
 */
export function cleanFontName(name: string): string {
  if (!name) return '';
  return name.replace(/\.(ttf|otf|woff2|woff)$/i, '').trim();
}

/**
 * Main font sorting function
 */
export function sortFonts<T extends { name: string; created_at?: string }>(
  fonts: T[],
  sortOption: SortOption
): T[] {
  const list = [...fonts];

  if (sortOption === 'oldest_first') {
    const indexed = list.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      const timeA = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
      const timeB = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.index - b.index; // preserve original order
    });
    return indexed.map(x => x.item);
  }

  if (sortOption === 'newest_first') {
    const indexed = list.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      const timeA = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
      const timeB = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.index - a.index; // reverse original order if dates equal/missing
    });
    return indexed.map(x => x.item);
  }

  if (sortOption === 'alpha_az') {
    return list.sort((a, b) => {
      const nameA = cleanFontName(a.name);
      const nameB = cleanFontName(b.name);

      const charA = nameA.charAt(0);
      const charB = nameB.charAt(0);

      const bucketA = getCharBucket(charA);
      const bucketB = getCharBucket(charB);

      if (bucketA !== bucketB) {
        return bucketA - bucketB; // English (1) -> Arabic (2) -> Symbols/Numbers (3)
      }

      if (bucketA === 1) {
        return nameA.localeCompare(nameB, 'en', { sensitivity: 'base', numeric: true });
      } else if (bucketA === 2) {
        return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base', numeric: true });
      } else {
        return nameA.localeCompare(nameB, undefined, { numeric: true });
      }
    });
  }

  if (sortOption === 'alpha_za') {
    return list.sort((a, b) => {
      const nameA = cleanFontName(a.name);
      const nameB = cleanFontName(b.name);

      const charA = nameA.charAt(0);
      const charB = nameB.charAt(0);

      const bucketA = getCharBucket(charA);
      const bucketB = getCharBucket(charB);

      if (bucketA !== bucketB) {
        return bucketA - bucketB; // English (1) -> Arabic (2) -> Symbols/Numbers (3)
      }

      if (bucketA === 1) {
        return nameB.localeCompare(nameA, 'en', { sensitivity: 'base', numeric: true });
      } else if (bucketA === 2) {
        return nameB.localeCompare(nameA, 'ar', { sensitivity: 'base', numeric: true });
      } else {
        return nameB.localeCompare(nameA, undefined, { numeric: true });
      }
    });
  }

  return list;
}
