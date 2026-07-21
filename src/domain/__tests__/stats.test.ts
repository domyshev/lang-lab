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
import { updateStatsFromAttempt } from '../stats';

const attempt: ExerciseAttempt = {
  id: 'attempt-1',
  exerciseType: 'crossword',
  cardSetId: 'card-set-1',
  targetLanguage: 'en',
  createdAt: '2026-07-03T00:00:00.000Z',
  completedAt: '2026-07-03T00:05:00.000Z',
  cardSnapshots: [],
  prompts: [],
  answers: { 'card-1': 'airport' },
  correctness: { 'card-1': true, 'card-2': false },
  hintsUsed: { 'card-1': 0, 'card-2': 1 },
};

describe('updateStatsFromAttempt', () => {
  it('updates card stats per card and target language', () => {
    const stats = updateStatsFromAttempt([], attempt);

    expect(stats).toEqual([
      expect.objectContaining({
        cardId: 'card-1',
        targetLanguage: 'en',
        attempts: 1,
        correct: 1,
        accuracy: 1,
      }),
      expect.objectContaining({
        cardId: 'card-2',
        targetLanguage: 'en',
        attempts: 1,
        incorrect: 1,
        hintsUsed: 1,
        accuracy: 0,
      }),
    ]);
  });
});
