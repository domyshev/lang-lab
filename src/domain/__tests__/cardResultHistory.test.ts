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
