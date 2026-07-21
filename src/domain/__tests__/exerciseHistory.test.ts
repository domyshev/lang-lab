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
import { ExerciseAttempt } from '../exercises';
import { summarizeExerciseHistory } from '../exerciseHistory';

describe('exercise history summaries', () => {
  it('groups legacy attempts from the same exercise run when they are close together', () => {
    const attempts = [
      attempt({
        id: 'first',
        createdAt: '2026-07-04T09:00:00.000Z',
        correctness: { airport: false },
      }),
      attempt({
        id: 'second',
        createdAt: '2026-07-04T09:01:00.000Z',
        correctness: { vehicle: true },
      }),
      attempt({
        id: 'later',
        createdAt: '2026-07-04T10:30:00.000Z',
        correctness: { impede: false },
      }),
    ];

    const summaries = summarizeExerciseHistory(attempts);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({
      id: 'legacy-later',
      total: 1,
      correct: 0,
      incorrect: 1,
    });
    expect(summaries[1]).toMatchObject({
      id: 'legacy-first',
      total: 2,
      correct: 1,
      incorrect: 1,
    });
  });
});

function attempt(
  overrides: Pick<ExerciseAttempt, 'id' | 'createdAt' | 'correctness'>,
): ExerciseAttempt {
  return {
    exerciseType: 'missingLetters',
    cardSetId: 'all-cards',
    targetLanguage: 'en',
    completedAt: overrides.createdAt,
    cardSnapshots: [],
    prompts: [],
    answers: {},
    hintsUsed: {},
    ...overrides,
  };
}
