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
