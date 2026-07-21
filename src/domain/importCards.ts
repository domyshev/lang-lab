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

import { LanguageCard, LanguageExample } from './cards';
import { SupportedLanguage, isSupportedLanguage } from './languages';

type RawIncomingCard = {
  translations?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  examples?: Record<string, unknown>;
  tags?: unknown;
  difficulty?: unknown;
};

export interface NormalizedIncomingCard {
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  examples?: Partial<Record<SupportedLanguage, LanguageExample[]>>;
  tags?: string[];
  difficulty?: LanguageCard['difficulty'];
}

export interface DuplicateProcessingEntry {
  id: string;
  processedAt: string;
  type: 'safeMerge';
  existingCardId: string;
  incomingCard: NormalizedIncomingCard;
  matchedBy: {
    language: SupportedLanguage;
    value: string;
  };
  addedFields: string[];
}

export interface PendingDuplicate {
  id: string;
  detectedAt: string;
  existingCardId: string;
  incomingCard: NormalizedIncomingCard;
  matchedBy: {
    language: SupportedLanguage;
    value: string;
  };
  conflicts: string[];
  status: 'pending';
}

export interface ImportSummary {
  added: number;
  safeMerged: number;
  pendingDuplicates: number;
  invalid: number;
  skipped: number;
}

export interface ImportResult {
  cards: LanguageCard[];
  duplicateProcessingHistory: DuplicateProcessingEntry[];
  pendingDuplicates: PendingDuplicate[];
  invalidRecords: Array<{ index: number; reason: string }>;
  resolvedCardIds: Array<string | undefined>;
  summary: ImportSummary;
}

export function normalizeTranslationValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function importLanguageCards(input: {
  existingCards: LanguageCard[];
  pastedJson: string;
  now: string;
  idFactory?: (prefix: string) => string;
}): ImportResult {
  const cards = input.existingCards.map(cloneCard);
  const duplicateProcessingHistory: DuplicateProcessingEntry[] = [];
  const pendingDuplicates: PendingDuplicate[] = [];
  const invalidRecords: Array<{ index: number; reason: string }> = [];
  const resolvedCardIds: Array<string | undefined> = [];
  const idFactory = input.idFactory ?? createId;
  const summary: ImportSummary = {
    added: 0,
    safeMerged: 0,
    pendingDuplicates: 0,
    invalid: 0,
    skipped: 0,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.pastedJson);
  } catch {
    return {
      cards,
      duplicateProcessingHistory,
      pendingDuplicates,
      invalidRecords: [{ index: -1, reason: 'JSON is not valid.' }],
      resolvedCardIds,
      summary: { ...summary, invalid: 1 },
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      cards,
      duplicateProcessingHistory,
      pendingDuplicates,
      invalidRecords: [{ index: -1, reason: 'Root value must be an array.' }],
      resolvedCardIds,
      summary: { ...summary, invalid: 1 },
    };
  }

  parsed.forEach((raw, index) => {
    const validation = normalizeIncomingCard(raw);
    if (!validation.ok) {
      invalidRecords.push({ index, reason: validation.reason });
      resolvedCardIds.push(undefined);
      summary.invalid += 1;
      return;
    }

    const incoming = validation.card;
    const duplicate = findDuplicate(cards, incoming);
    if (!duplicate) {
      const cardId = idFactory('card');
      cards.push({
        id: cardId,
        translations: incoming.translations,
        definitions: incoming.definitions,
        examples: incoming.examples,
        tags: incoming.tags,
        difficulty: incoming.difficulty,
        createdAt: input.now,
        updatedAt: input.now,
      });
      resolvedCardIds.push(cardId);
      summary.added += 1;
      return;
    }

    resolvedCardIds.push(duplicate.card.id);

    const merge = safeMergeCard(duplicate.card, incoming, input.now);
    if (merge.addedFields.length > 0) {
      Object.assign(duplicate.card, merge.card);
      duplicateProcessingHistory.push({
        id: idFactory('merge'),
        processedAt: input.now,
        type: 'safeMerge',
        existingCardId: duplicate.card.id,
        incomingCard: incoming,
        matchedBy: duplicate.matchedBy,
        addedFields: merge.addedFields,
      });
      summary.safeMerged += 1;
    }

    if (merge.conflicts.length > 0) {
      pendingDuplicates.push({
        id: idFactory('pending'),
        detectedAt: input.now,
        existingCardId: duplicate.card.id,
        incomingCard: incoming,
        matchedBy: duplicate.matchedBy,
        conflicts: merge.conflicts,
        status: 'pending',
      });
      summary.pendingDuplicates += 1;
      return;
    }

    summary.skipped += merge.addedFields.length > 0 ? 0 : 1;
  });

  return {
    cards,
    duplicateProcessingHistory,
    pendingDuplicates,
    invalidRecords,
    resolvedCardIds,
    summary,
  };
}

function normalizeIncomingCard(
  raw: unknown,
): { ok: true; card: NormalizedIncomingCard } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'Record must be an object.' };
  }

  const record = raw as RawIncomingCard;
  const translations = normalizeLanguageStringMap(record.translations);
  if (Object.keys(translations).length < 2) {
    return {
      ok: false,
      reason:
        'Card must include translations for at least two supported languages.',
    };
  }

  const definitions = normalizeLanguageStringMap(record.definitions);

  return {
    ok: true,
    card: {
      translations,
      definitions: Object.keys(definitions).length > 0 ? definitions : undefined,
      examples: normalizeExamples(record.examples),
      tags: normalizeTags(record.tags),
      difficulty: normalizeDifficulty(record.difficulty),
    },
  };
}

function normalizeLanguageStringMap(
  value: unknown,
): Partial<Record<SupportedLanguage, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Partial<Record<SupportedLanguage, string>> = {};
  Object.entries(value).forEach(([key, rawValue]) => {
    if (!isSupportedLanguage(key) || typeof rawValue !== 'string') {
      return;
    }

    const trimmed = rawValue.trim();
    if (trimmed) {
      output[key] = trimmed;
    }
  });

  return output;
}

function normalizeTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tags = [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

  return tags.length > 0 ? tags : undefined;
}

function normalizeDifficulty(
  value: unknown,
): LanguageCard['difficulty'] | undefined {
  return value === 'easy' || value === 'medium' || value === 'hard'
    ? value
    : undefined;
}

function normalizeExamples(value: unknown): LanguageCard['examples'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const output: LanguageCard['examples'] = {};
  Object.entries(value).forEach(([key, rawExamples]) => {
    if (!isSupportedLanguage(key) || !Array.isArray(rawExamples)) {
      return;
    }

    const examples = rawExamples
      .filter((example): example is LanguageExample => {
        return (
          Boolean(example) &&
          typeof example === 'object' &&
          typeof (example as { sentence?: unknown }).sentence === 'string' &&
          typeof (example as { answer?: unknown }).answer === 'string'
        );
      })
      .map((example) => ({
        sentence: example.sentence.trim(),
        answer: example.answer.trim(),
      }))
      .filter((example) => example.sentence && example.answer);

    if (examples.length > 0) {
      output[key] = examples;
    }
  });

  return Object.keys(output).length > 0 ? output : undefined;
}

function findDuplicate(
  cards: LanguageCard[],
  incoming: NormalizedIncomingCard,
):
  | {
      card: LanguageCard;
      matchedBy: { language: SupportedLanguage; value: string };
    }
  | undefined {
  for (const card of cards) {
    const existingValues = Object.values(card.translations)
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeTranslationValue(value));

    for (const [language, incomingValue] of Object.entries(
      incoming.translations,
    )) {
      if (!incomingValue) {
        continue;
      }

      if (existingValues.includes(normalizeTranslationValue(incomingValue))) {
        return {
          card,
          matchedBy: {
            language: language as SupportedLanguage,
            value: incomingValue,
          },
        };
      }
    }
  }

  return undefined;
}

function safeMergeCard(
  existing: LanguageCard,
  incoming: NormalizedIncomingCard,
  now: string,
): { card: LanguageCard; addedFields: string[]; conflicts: string[] } {
  const card = cloneCard(existing);
  const addedFields: string[] = [];
  const conflicts: string[] = [];

  mergeLanguageMap(
    'translations',
    card.translations,
    incoming.translations,
    addedFields,
    conflicts,
  );

  if (incoming.definitions) {
    const definitions = card.definitions ?? {};
    mergeLanguageMap(
      'definitions',
      definitions,
      incoming.definitions,
      addedFields,
      conflicts,
    );
    card.definitions = definitions;
  }

  if (incoming.tags) {
    const tags = new Set(card.tags ?? []);
    incoming.tags.forEach((tag) => {
      if (!tags.has(tag)) {
        tags.add(tag);
        addedFields.push(`tags.${tag}`);
      }
    });
    card.tags = [...tags];
  }

  if (incoming.examples) {
    const examplesByLanguage = card.examples ?? {};
    Object.entries(incoming.examples).forEach(([language, incomingExamples]) => {
      const supportedLanguage = language as SupportedLanguage;
      const existingExamples = examplesByLanguage[supportedLanguage] ?? [];
      const existingKeys = new Set(
        existingExamples.map(
          (example) => `${example.sentence}\u0000${example.answer}`,
        ),
      );

      incomingExamples.forEach((example) => {
        const key = `${example.sentence}\u0000${example.answer}`;
        if (!existingKeys.has(key)) {
          examplesByLanguage[supportedLanguage] = [
            ...(examplesByLanguage[supportedLanguage] ?? []),
            example,
          ];
          existingKeys.add(key);
          addedFields.push(`examples.${supportedLanguage}`);
        }
      });
    });
    card.examples = examplesByLanguage;
  }

  if (incoming.difficulty && !card.difficulty) {
    card.difficulty = incoming.difficulty;
    addedFields.push('difficulty');
  } else if (
    incoming.difficulty &&
    card.difficulty &&
    incoming.difficulty !== card.difficulty
  ) {
    conflicts.push('difficulty');
  }

  if (addedFields.length > 0) {
    card.updatedAt = now;
  }

  return { card, addedFields, conflicts };
}

function mergeLanguageMap(
  fieldName: 'translations' | 'definitions',
  target: Partial<Record<SupportedLanguage, string>>,
  incoming: Partial<Record<SupportedLanguage, string>>,
  addedFields: string[],
  conflicts: string[],
): void {
  Object.entries(incoming).forEach(([language, value]) => {
    const supportedLanguage = language as SupportedLanguage;
    const existingValue = target[supportedLanguage];
    if (!existingValue) {
      target[supportedLanguage] = value;
      addedFields.push(`${fieldName}.${supportedLanguage}`);
      return;
    }

    if (normalizeTranslationValue(existingValue) !== normalizeTranslationValue(value)) {
      conflicts.push(`${fieldName}.${supportedLanguage}`);
    }
  });
}

function cloneCard(card: LanguageCard): LanguageCard {
  return {
    ...card,
    translations: { ...card.translations },
    definitions: card.definitions ? { ...card.definitions } : undefined,
    examples: card.examples
      ? Object.fromEntries(
          Object.entries(card.examples).map(([language, examples]) => [
            language,
            examples.map((example) => ({ ...example })),
          ]),
        )
      : undefined,
    tags: card.tags ? [...card.tags] : undefined,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
