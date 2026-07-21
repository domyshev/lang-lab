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
import { buildCoachComment } from '../coach';
import { CardStats } from '../stats';

describe('buildCoachComment', () => {
  it('reports repeated weak cards in a strict style', () => {
    const stats: CardStats[] = [
      {
        cardId: 'card-1',
        targetLanguage: 'en',
        attempts: 4,
        correct: 1,
        incorrect: 3,
        hintsUsed: 2,
        accuracy: 0.25,
        recentMistakes: 2,
        lastPracticedAt: '2026-07-03T00:00:00.000Z',
        stability: 'weak',
      },
    ];

    const comment = buildCoachComment({
      interfaceLanguage: 'en',
      targetLanguage: 'en',
      cardStats: stats,
      correctCount: 2,
      totalCount: 4,
    });

    expect(comment).toContain('Accuracy: 50%');
    expect(comment).toContain('Weak cards: 1');
  });
});
