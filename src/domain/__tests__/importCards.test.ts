import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import { importLanguageCards, normalizeTranslationValue } from '../importCards';

const now = '2026-07-03T12:00:00.000Z';

function existingCard(overrides: Partial<LanguageCard> = {}): LanguageCard {
  return {
    id: 'card-existing',
    translations: {
      en: 'airport',
      ru: 'аэропорт',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('importLanguageCards', () => {
  it('normalizes translation values for duplicate matching', () => {
    expect(normalizeTranslationValue('  AirPort   Station ')).toBe(
      'airport station',
    );
  });

  it('adds valid new cards from pasted JSON', () => {
    const result = importLanguageCards({
      existingCards: [],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'ticket',
            ru: 'билет',
          },
          tags: ['travel'],
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.invalid).toBe(0);
    expect(result.cards[0].id).toMatch(/^card-/);
  });

  it('safe-merges missing fields and records history', () => {
    const result = importLanguageCards({
      existingCards: [existingCard()],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'Airport',
            es: 'aeropuerto',
          },
          definitions: {
            en: 'A place where airplanes take off and land.',
          },
          tags: ['travel'],
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].translations.es).toBe('aeropuerto');
    expect(result.cards[0].definitions?.en).toBe(
      'A place where airplanes take off and land.',
    );
    expect(result.cards[0].tags).toEqual(['travel']);
    expect(result.summary.safeMerged).toBe(1);
    expect(result.duplicateProcessingHistory[0].addedFields).toEqual([
      'translations.es',
      'definitions.en',
      'tags.travel',
    ]);
  });

  it('stores conflicting duplicates in pending duplicates', () => {
    const result = importLanguageCards({
      existingCards: [
        existingCard({
          definitions: {
            en: 'Existing definition.',
          },
        }),
      ],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'airport',
            ru: 'аэропорт',
            es: 'aeropuerto',
          },
          definitions: {
            en: 'Different definition.',
          },
          tags: ['travel'],
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].translations.es).toBe('aeropuerto');
    expect(result.cards[0].definitions?.en).toBe('Existing definition.');
    expect(result.cards[0].tags).toEqual(['travel']);
    expect(result.duplicateProcessingHistory[0].addedFields).toEqual([
      'translations.es',
      'tags.travel',
    ]);
    expect(result.summary.safeMerged).toBe(1);
    expect(result.pendingDuplicates).toHaveLength(1);
    expect(result.summary.pendingDuplicates).toBe(1);
  });

  it('reports invalid records without stopping the whole import', () => {
    const result = importLanguageCards({
      existingCards: [],
      pastedJson: JSON.stringify([
        { translations: { en: 'only one language' } },
        { translations: { en: 'train', ru: 'поезд' } },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.invalid).toBe(1);
  });

  it('aligns resolved ids for every incoming record', () => {
    const result = importLanguageCards({
      existingCards: [
        existingCard({ id: 'card-safe' }),
        existingCard({
          id: 'card-conflict',
          translations: { en: 'hotel', ru: 'отель' },
          definitions: { en: 'An existing definition.' },
        }),
        existingCard({
          id: 'card-skipped',
          translations: { en: 'train', ru: 'поезд' },
        }),
      ],
      pastedJson: JSON.stringify([
        { translations: { en: 'ticket', ru: 'билет' } },
        {
          translations: { en: 'airport', ru: 'аэропорт', es: 'aeropuerto' },
        },
        {
          translations: { en: 'hotel', ru: 'отель' },
          definitions: { en: 'A different definition.' },
        },
        { translations: { en: 'train', ru: 'поезд' } },
        { translations: { en: 'invalid' } },
      ]),
      now,
      idFactory: (prefix) => `${prefix}-fixed`,
    });

    expect(result.resolvedCardIds).toEqual([
      'card-fixed',
      'card-safe',
      'card-conflict',
      'card-skipped',
      undefined,
    ]);
    expect(result.duplicateProcessingHistory[0].id).toBe('merge-fixed');
    expect(result.pendingDuplicates[0].id).toBe('pending-fixed');
  });
});
