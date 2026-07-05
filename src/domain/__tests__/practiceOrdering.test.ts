import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import { ExerciseAttempt } from '../exercises';
import {
  defaultPracticeSettings,
  orderCardsForMissingLettersPractice,
} from '../practiceOrdering';

const now = '2026-07-04T00:00:00.000Z';

const cards: LanguageCard[] = [
  createCard('card-new', 'airport'),
  createCard('card-warm', 'vehicle'),
  createCard('card-weak', 'impede'),
  createCard('card-cooling', 'meditation'),
];

describe('orderCardsForMissingLettersPractice', () => {
  it('prioritizes recent mistakes, then new cards, and hides fresh correct streaks', () => {
    const ordered = orderCardsForMissingLettersPractice({
      attempts: [
        createAttempt('card-warm', true, '2026-07-01T10:00:00.000Z'),
        createAttempt('card-weak', false, '2026-07-02T10:00:00.000Z'),
        createAttempt('card-weak', false, '2026-07-03T10:00:00.000Z'),
        createAttempt('card-cooling', true, '2026-06-29T10:00:00.000Z'),
        createAttempt('card-cooling', true, '2026-06-30T10:00:00.000Z'),
        createAttempt('card-cooling', true, '2026-07-01T10:00:00.000Z'),
        createAttempt('card-cooling', true, '2026-07-02T10:00:00.000Z'),
        createAttempt('card-cooling', true, '2026-07-03T10:00:00.000Z'),
      ],
      cards,
      now,
      seed: 42,
      settings: defaultPracticeSettings,
      targetLanguage: 'en',
    });

    expect(ordered.map((card) => card.id)).toEqual([
      'card-weak',
      'card-new',
      'card-warm',
    ]);
  });

  it('uses frequency settings to repeat weak cards without making them consecutive and mixes new cards early', () => {
    const ordered = orderCardsForMissingLettersPractice({
      attempts: [
        createAttempt('card-warm', true, '2026-07-01T10:00:00.000Z'),
        createAttempt('card-weak', false, '2026-07-02T10:00:00.000Z'),
        createAttempt('card-weak', false, '2026-07-03T10:00:00.000Z'),
      ],
      cards: [
        createCard('card-new-a', 'airport'),
        createCard('card-new-b', 'vehicle'),
        createCard('card-warm', 'therefore'),
        createCard('card-weak', 'impede'),
      ],
      now,
      seed: 8,
      settings: {
        ...defaultPracticeSettings,
        newCardMixFrequencyPercent: 50,
        recentMistakeRepeatFrequencyPercent: 25,
      },
      targetLanguage: 'en',
    });
    const ids = ordered.map((card) => card.id);

    expect(ids.filter((id) => id === 'card-weak')).toHaveLength(2);
    expect(ids[0]).toBe('card-weak');
    expect(ids.slice(1, 3).some((id) => id.startsWith('card-new'))).toBe(true);
    expect(hasConsecutiveDuplicate(ids)).toBe(false);
  });
});

function createCard(id: string, answer: string): LanguageCard {
  return {
    id,
    translations: {
      en: answer,
      ru: `${answer}-ru`,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function createAttempt(
  cardId: string,
  isCorrect: boolean,
  createdAt: string,
): ExerciseAttempt {
  return {
    id: `attempt-${cardId}-${createdAt}`,
    exerciseType: 'missingLetters',
    themeId: 'all-words',
    targetLanguage: 'en',
    createdAt,
    completedAt: createdAt,
    cardSnapshots: [],
    prompts: [],
    answers: { [cardId]: isCorrect ? 'ok' : 'wrong' },
    correctness: { [cardId]: isCorrect },
    hintsUsed: { [cardId]: 0 },
  };
}

function hasConsecutiveDuplicate(values: string[]): boolean {
  return values.some((value, index) => index > 0 && value === values[index - 1]);
}
