export const ALL_WORDS_THEME_ID = 'all-words';

export interface Theme {
  id: string;
  name: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
