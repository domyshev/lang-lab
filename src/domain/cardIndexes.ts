import { LanguageCard } from './cards';
import { SupportedLanguage } from './languages';
import { CardStats } from './stats';

export function createCardById(cards: LanguageCard[]): Map<string, LanguageCard> {
  return new Map(cards.map((card) => [card.id, card]));
}

export function getCardsByIds(
  cardById: Map<string, LanguageCard>,
  cardIds: string[],
): LanguageCard[] {
  return cardIds
    .map((cardId) => cardById.get(cardId))
    .filter((card): card is LanguageCard => Boolean(card));
}

export function createCardStatsByTarget(
  cardStats: CardStats[],
  targetLanguage: SupportedLanguage,
): Map<string, CardStats> {
  return new Map(
    cardStats
      .filter((stat) => stat.targetLanguage === targetLanguage)
      .map((stat) => [stat.cardId, stat]),
  );
}
