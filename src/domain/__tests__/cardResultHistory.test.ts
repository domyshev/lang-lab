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
import { createRecentResultsByCardId } from '../cardResultHistory';
import type { ExerciseAttempt } from '../exercises';

describe('createRecentResultsByCardId', () => {
  it('keeps newest target-language results per card', () => {
    const attempts: ExerciseAttempt[] = [
      makeAttempt('old', 'en', 'card-a', false, '2026-07-01T10:00:00.000Z'),
      makeAttempt('new', 'en', 'card-a', true, '2026-07-02T10:00:00.000Z'),
      makeAttempt(
        'other-language',
        'es',
        'card-a',
        false,
        '2026-07-03T10:00:00.000Z',
      ),
    ];

    const results = createRecentResultsByCardId({
      attempts,
      limit: 2,
      targetLanguage: 'en',
    });

    expect(results.get('card-a')).toEqual([
      { isCorrect: true, occurredAt: '2026-07-02T10:00:00.000Z' },
      { isCorrect: false, occurredAt: '2026-07-01T10:00:00.000Z' },
    ]);
  });
});

function makeAttempt(
  id: string,
  targetLanguage: 'en' | 'es',
  cardId: string,
  isCorrect: boolean,
  completedAt: string,
): ExerciseAttempt {
  return {
    id,
    exerciseType: 'missingLetters',
    cardSetId: 'all-cards',
    targetLanguage,
    createdAt: completedAt,
    completedAt,
    cardSnapshots: [],
    prompts: [],
    answers: { [cardId]: 'answer' },
    correctness: { [cardId]: isCorrect },
    hintsUsed: { [cardId]: 0 },
  };
}
