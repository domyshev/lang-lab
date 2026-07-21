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

import { describe, expect, it } from 'vitest';
import {
  createCardById,
  createCardStatsByTarget,
  getCardsByIds,
} from '../cardIndexes';
import type { LanguageCard } from '../cards';
import type { CardStats } from '../stats';

describe('cardIndexes', () => {
  it('resolves card ids in requested order without repeated array scans', () => {
    const cards: LanguageCard[] = [
      {
        id: 'one',
        translations: { en: 'one' },
        createdAt: 'now',
        updatedAt: 'now',
      },
      {
        id: 'two',
        translations: { en: 'two' },
        createdAt: 'now',
        updatedAt: 'now',
      },
    ];

    const cardById = createCardById(cards);

    expect(getCardsByIds(cardById, ['two', 'missing', 'one']).map((card) => card.id))
      .toEqual(['two', 'one']);
  });

  it('indexes stats for one target language by card id', () => {
    const stats: CardStats[] = [
      {
        cardId: 'one',
        targetLanguage: 'en',
        attempts: 2,
        accuracy: 0.5,
        correct: 1,
        hintsUsed: 0,
        incorrect: 1,
        lastPracticedAt: 'now',
        recentMistakes: 1,
        stability: 'weak',
      },
      {
        cardId: 'one',
        targetLanguage: 'es',
        attempts: 9,
        accuracy: 1,
        correct: 9,
        hintsUsed: 0,
        incorrect: 0,
        lastPracticedAt: 'now',
        recentMistakes: 0,
        stability: 'strong',
      },
    ];

    expect(createCardStatsByTarget(stats, 'en').get('one')?.attempts).toBe(2);
  });
});
