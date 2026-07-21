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
import { getCoachProgressMessage } from '../coachProgress';

describe('getCoachProgressMessage', () => {
  it('recognizes the first correct answer for a card', () => {
    const attempt = createAttempt('attempt-1', true, '2026-07-05T10:00:00.000Z');

    expect(
      getCoachProgressMessage({
        attempt,
        attempts: [attempt],
        interfaceLanguage: 'ru',
      }),
    ).toEqual({
      text: 'Ура! Похоже, ты начал запоминать это слово.',
      tooltip:
        'Это первый сохраненный ответ по этой карточке для текущего языка-цели.',
    });
  });

  it('reports a consecutive correct streak', () => {
    const first = createAttempt('attempt-1', true, '2026-07-05T10:00:00.000Z');
    const second = createAttempt('attempt-2', true, '2026-07-05T10:05:00.000Z');

    expect(
      getCoachProgressMessage({
        attempt: second,
        attempts: [first, second],
        interfaceLanguage: 'ru',
      }),
    ).toEqual({
      text: 'Это 2-й правильный ответ подряд по этой карточке.',
      tooltip:
        'Серия считается по последним сохраненным ответам этой карточки для текущего языка-цели.',
    });
  });
});

function createAttempt(
  id: string,
  isCorrect: boolean,
  createdAt: string,
): ExerciseAttempt {
  return {
    id,
    exerciseType: 'missingLetters',
    cardSetId: 'all-cards',
    targetLanguage: 'en',
    createdAt,
    completedAt: createdAt,
    cardSnapshots: [],
    prompts: [
      {
        cardId: 'card-airport',
        prompt: 'ru: аэропорт',
        expectedAnswer: 'airport',
        translationHints: [{ language: 'ru', value: 'аэропорт' }],
      },
    ],
    answers: { 'card-airport': isCorrect ? 'airport' : 'wrong' },
    correctness: { 'card-airport': isCorrect },
    hintsUsed: { 'card-airport': 0 },
  };
}
