import defaultVocabularySeed from '../../data/default-vocabulary-seed.json';
import { CardSet } from './cardSets';
import { LanguageCard } from './cards';

export const defaultVocabularyCards =
  defaultVocabularySeed.cards as LanguageCard[];
export const defaultVocabularyCardSets =
  defaultVocabularySeed.cardSets as CardSet[];
