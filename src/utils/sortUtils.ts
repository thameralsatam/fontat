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
 * Strips common font extensions and trims spaces
 */
export function cleanFontName(name: string): string {
  if (!name) return '';
  return name.replace(/\.(ttf|otf|woff2|woff)$/i, '').trim();
}
