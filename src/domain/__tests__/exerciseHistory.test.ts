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
