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
