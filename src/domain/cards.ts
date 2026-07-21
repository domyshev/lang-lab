// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
  knownTargetLanguages?: SupportedLanguage[];
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

export function orderTranslationHints(
  hints: TranslationHint[],
  complementaryLanguages: SupportedLanguage | SupportedLanguage[],
): TranslationHint[] {
  const preferredLanguages = Array.isArray(complementaryLanguages)
    ? complementaryLanguages
    : [complementaryLanguages];

  return [
    ...preferredLanguages.flatMap((language) =>
      hints.filter((hint) => hint.language === language),
    ),
    ...hints.filter((hint) => !preferredLanguages.includes(hint.language)),
  ];
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

export function isCardKnownForTarget(
  card: Pick<LanguageCard, 'knownTargetLanguages'>,
  targetLanguage: SupportedLanguage,
): boolean {
  return card.knownTargetLanguages?.includes(targetLanguage) ?? false;
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
