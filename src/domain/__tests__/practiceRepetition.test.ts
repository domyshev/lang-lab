import { describe, expect, it } from 'vitest';
import { ExerciseAttempt } from '../exercises';
import {
  aggregateRepeatedPracticeAnswers,
  getRepeatedPracticeCount,
} from '../practiceRepetition';

describe('practiceRepetition', () => {
  it('repeats cards according to the latest incorrect streak', () => {
    expect(
      getRepeatedPracticeCount({
        attempts: [createAttempt('card-1', false, '2026-07-01T10:00:00.000Z')],
        cardId: 'card-1',
        targetLanguage: 'en',
      }),
    ).toBe(2);

    expect(
      getRepeatedPracticeCount({
        attempts: [
          createAttempt('card-1', false, '2026-07-01T10:00:00.000Z'),
          createAttempt('card-1', false, '2026-07-02T10:00:00.000Z'),
        ],
        cardId: 'card-1',
        targetLanguage: 'en',
      }),
    ).toBe(4);

    expect(
      getRepeatedPracticeCount({
        attempts: [
          createAttempt('card-1', false, '2026-07-01T10:00:00.000Z'),
          createAttempt('card-1', true, '2026-07-02T10:00:00.000Z'),
        ],
        cardId: 'card-1',
        targetLanguage: 'en',
      }),
    ).toBe(1);
  });

  it('aggregates a repeated run as one result and treats a tie as failed', () => {
    expect(
      aggregateRepeatedPracticeAnswers({
        expectedAnswer: 'airport',
        answers: ['airport', 'airport', 'airxort', 'airport'],
      }),
    ).toEqual({ answer: 'airport', isCorrect: true });

    expect(
      aggregateRepeatedPracticeAnswers({
        expectedAnswer: 'airport',
        answers: ['airxort', 'airport'],
      }),
    ).toEqual({ answer: 'airxort', isCorrect: false });
  });
});

function createAttempt(
  cardId: string,
  isCorrect: boolean,
  completedAt: string,
): ExerciseAttempt {
  return {
    id: `attempt-${cardId}-${completedAt}`,
    exerciseType: 'missingLetters',
    themeId: 'all-words',
    targetLanguage: 'en',
    createdAt: completedAt,
    completedAt,
    cardSnapshots: [],
    prompts: [],
    answers: { [cardId]: isCorrect ? 'ok' : 'wrong' },
    correctness: { [cardId]: isCorrect },
    hintsUsed: { [cardId]: 0 },
  };
}
