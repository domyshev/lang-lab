import { describe, expect, it } from 'vitest';
import {
  getCardAnswer,
  getDefinitionHint,
  getTranslationHints,
  isCardEligibleForTarget,
  isPhraseValue,
  orderTranslationHints,
} from '../cards';

const card = {
  id: 'card-1',
  translations: {
    ru: 'аэропорт',
    en: 'airport',
    es: 'aeropuerto',
  },
  definitions: {
    en: 'A place where airplanes take off and land.',
    ru: 'Место, где самолёты взлетают и садятся.',
  },
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
} as const;

describe('language cards', () => {
  it('uses the target language translation as answer', () => {
    expect(getCardAnswer(card, 'en')).toBe('airport');
  });

  it('uses only non-target translations as translation hints', () => {
    expect(getTranslationHints(card, 'en')).toEqual([
      { language: 'ru', value: 'аэропорт' },
      { language: 'es', value: 'aeropuerto' },
    ]);
  });

  it('orders translation hints by multiple companion languages', () => {
    expect(
      orderTranslationHints(getTranslationHints(card, 'en'), ['es', 'ru']),
    ).toEqual([
      { language: 'es', value: 'aeropuerto' },
      { language: 'ru', value: 'аэропорт' },
    ]);
  });

  it('uses only the target-language definition as definition hint', () => {
    expect(getDefinitionHint(card, 'en')).toBe(
      'A place where airplanes take off and land.',
    );
  });

  it('marks phrases by whitespace', () => {
    expect(isPhraseValue('airport')).toBe(false);
    expect(isPhraseValue('train station')).toBe(true);
  });

  it('requires target translation and at least one non-target prompt', () => {
    expect(isCardEligibleForTarget(card, 'en')).toBe(true);
    expect(
      isCardEligibleForTarget(
        {
          ...card,
          translations: { en: 'airport' },
          definitions: undefined,
        },
        'en',
      ),
    ).toBe(false);
  });
});
