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

  it('creates missing letters prompt while preserving spaces', () => {
    const prompt = createMissingLettersPrompt({
      card: {
        ...baseCard,
        translations: { en: 'train station', ru: 'вокзал' },
      },
      targetLanguage: 'en',
    });

    expect(prompt.expectedAnswer).toBe('train station');
    expect(prompt.maskedAnswer).toContain(' ');
    expect(prompt.maskedAnswer).toMatch(/_/);
  });

  it('creates missing word prompt from examples', () => {
    const prompt = createMissingWordPrompt({
      card: baseCard,
      targetLanguage: 'en',
    });

    expect(prompt?.sentenceWithGap).toBe('The _____ is busy today.');
    expect(prompt?.expectedAnswer).toBe('airport');
  });
});
