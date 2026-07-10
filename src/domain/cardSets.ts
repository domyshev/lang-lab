import { SupportedLanguage } from './languages';

export const ALL_CARDS_CARD_SET_ID = 'all-cards';

export interface CardSet {
  id: string;
  name: string;
  names?: Partial<Record<SupportedLanguage, string>>;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export function getCardSetName(
  cardSet: Pick<CardSet, 'name' | 'names'>,
  language: SupportedLanguage,
): string {
  return cardSet.names?.[language]?.trim() || cardSet.name;
}
