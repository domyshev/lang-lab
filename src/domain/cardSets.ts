export const ALL_CARDS_CARD_SET_ID = 'all-cards';

export interface CardSet {
  id: string;
  name: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
