import { SupportedLanguage, supportedLanguages } from './languages';

export interface LanguageExample {
  sentence: string;
  answer: string;
}

export interface LanguageCard {
  id: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  examples?: Partial<Record<SupportedLanguage, LanguageExample[]>>;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface TranslationHint {
  language: SupportedLanguage;
  value: string;
}

export interface CardSnapshot {
  id: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  tags?: string[];
  difficulty?: LanguageCard['difficulty'];
}

export function getCardAnswer(
  card: Pick<LanguageCard, 'translations'>,
  targetLanguage: SupportedLanguage,
): string | undefined {
  return card.translations[targetLanguage];
}

export function getTranslationHints(
  card: Pick<LanguageCard, 'translations'>,
  targetLanguage: SupportedLanguage,
): TranslationHint[] {
  return supportedLanguages
    .filter((language) => language !== targetLanguage)
    .flatMap((language) => {
      const value = card.translations[language];
      return value ? [{ language, value }] : [];
    });
}

export function getDefinitionHint(
  card: Pick<LanguageCard, 'definitions'>,
  targetLanguage: SupportedLanguage,
): string | undefined {
  return card.definitions?.[targetLanguage];
}

export function isPhraseValue(value: string): boolean {
  return /\s/.test(value.trim());
}

export function isCardEligibleForTarget(
  card: Pick<LanguageCard, 'translations' | 'definitions'>,
  targetLanguage: SupportedLanguage,
): boolean {
  const answer = getCardAnswer(card, targetLanguage);
  if (!answer) {
    return false;
  }

  return (
    getTranslationHints(card, targetLanguage).length > 0 ||
    Boolean(getDefinitionHint(card, targetLanguage))
  );
}

export function createCardSnapshot(card: LanguageCard): CardSnapshot {
  return {
    id: card.id,
    translations: { ...card.translations },
    definitions: card.definitions ? { ...card.definitions } : undefined,
    tags: card.tags ? [...card.tags] : undefined,
    difficulty: card.difficulty,
  };
}
