import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import {
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from '../exercises';

const baseCard: LanguageCard = {
  id: 'card-1',
  translations: {
    en: 'airport',
    ru: 'аэропорт',
    es: 'aeropuerto',
  },
  definitions: {
    en: 'A place where airplanes take off and land.',
  },
  examples: {
    en: [{ sentence: 'The airport is busy today.', answer: 'airport' }],
  },
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
};

describe('exercise generators', () => {
  it('filters cards by target language eligibility', () => {
    const cards = [
      baseCard,
      { ...baseCard, id: 'card-2', translations: { ru: 'поезд', es: 'tren' } },
    ];

    expect(getEligibleCardsForTarget(cards, 'en').map((card) => card.id)).toEqual([
      'card-1',
    ]);
  });

  it('creates a multiple choice prompt with three options', () => {
    const prompt = createMultipleChoicePrompt({
      card: baseCard,
      distractorCards: [
        { ...baseCard, id: 'card-2', translations: { en: 'ticket', ru: 'билет' } },
        { ...baseCard, id: 'card-3', translations: { en: 'train', ru: 'поезд' } },
      ],
      targetLanguage: 'en',
    });

    expect(prompt.expectedAnswer).toBe('airport');
    expect(prompt.options).toHaveLength(3);
    expect(prompt.options).toContain('airport');
  });

  it('creates missing letters prompt only for single words', () => {
    const prompt = createMissingLettersPrompt({
      card: baseCard,
      targetLanguage: 'en',
    });
    const phrasePrompt = createMissingLettersPrompt({
      card: {
        ...baseCard,
        translations: { en: 'train station', ru: 'вокзал' },
      },
      targetLanguage: 'en',
    });

    expect(prompt?.expectedAnswer).toBe('airport');
    expect(prompt?.maskedAnswer).toMatch(/_/);
    expect(phrasePrompt).toBeUndefined();
  });

  it('creates missing word prompt from phrase examples', () => {
    const wordPrompt = createMissingWordPrompt({
      card: baseCard,
      targetLanguage: 'en',
    });
    const phrasePrompt = createMissingWordPrompt({
      card: {
        ...baseCard,
        id: 'phrase-card',
        translations: {
          en: 'worth it',
          ru: 'оно того стоит',
        },
        examples: {
          en: [{ sentence: 'It is worth it today.', answer: 'worth it' }],
        },
      },
      targetLanguage: 'en',
    });

    expect(wordPrompt).toBeUndefined();
    expect(phrasePrompt?.sentenceWithGap).toBe('It is _____ today.');
    expect(phrasePrompt?.expectedAnswer).toBe('worth it');
  });

  it('creates a standalone missing word gap for phrase cards without examples', () => {
    const prompt = createMissingWordPrompt({
      card: {
        ...baseCard,
        id: 'fallback-phrase-card',
        translations: {
          en: 'look forward',
          ru: 'с нетерпением ждать',
          es: 'esperar con ganas',
        },
        examples: undefined,
      },
      targetLanguage: 'en',
    });

    expect(prompt?.sentenceWithGap).toBe('_____');
    expect(prompt?.expectedAnswer).toBe('look forward');
  });
});
