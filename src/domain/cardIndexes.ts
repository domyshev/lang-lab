// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
