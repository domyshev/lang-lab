import { describe, expect, it } from 'vitest';
import {
  defaultVocabularyCards,
  defaultVocabularyCardSets,
} from '../defaultVocabulary';

describe('defaultVocabulary', () => {
  it('ships Ukrainian translations and card-set names for the built-in library', () => {
    expect(defaultVocabularyCards).toHaveLength(2000);
    expect(defaultVocabularyCards.every((card) => card.translations.uk)).toBe(
      true,
    );
    expect(defaultVocabularyCardSets.every((cardSet) => cardSet.names?.uk)).toBe(
      true,
    );
  });
});
