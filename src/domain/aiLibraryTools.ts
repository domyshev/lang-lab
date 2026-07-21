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

import { z } from 'zod';
import { getCardAnswer, LanguageCard, LanguageExample } from './cards';
import { ALL_CARDS_CARD_SET_ID, CardSet, getCardSetName } from './cardSets';
import { createRecentResultsByCardId, RecentCardResult } from './cardResultHistory';
import { ExerciseAttempt, ExerciseType } from './exercises';
import { ExerciseHistorySummary, summarizeExerciseHistory } from './exerciseHistory';
import { t } from './i18n';
import { SupportedLanguage, supportedLanguages } from './languages';
import { CardStats } from './stats';

const DEFAULT_PAGE_LIMIT = 20;
const CARD_SET_PAGE_LIMIT = 50;
const CARD_PAGE_LIMIT = 100;
const GAME_PAGE_LIMIT = 50;
const RECENT_ANSWER_LIMIT = 20;

const listCardSetsArgumentsSchema = z
  .object({
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().optional(),
    query: z.string().optional(),
    archiveFilter: z.enum(['active', 'archived', 'all']).optional(),
  })
  .strict();

const getCardSetArgumentsSchema = z
  .object({
    cardSetId: z.string().trim().min(1),
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().optional(),
  })
  .strict();

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const searchCardsArgumentsSchema = z
  .object({
    cardSetId: optionalNonEmptyString,
    cursor: z.number().int().nonnegative().optional(),
    languages: z.array(z.enum(supportedLanguages)).optional(),
    limit: z.number().int().positive().optional(),
    query: z.string().trim().min(1),
  })
  .strict();

const getCardsArgumentsSchema = z
  .object({
    cardIds: z.array(z.string().trim().min(1)),
  })
  .strict();

const exerciseTypes = [
  'crossword',
  'multipleChoice',
  'missingLetters',
  'missingWord',
] as const satisfies readonly ExerciseType[];

const exerciseTypeSchema = z.enum(exerciseTypes);

const targetLanguageArgument = z.enum(supportedLanguages).optional();

const getLearningOverviewArgumentsSchema = z
  .object({
    targetLanguage: targetLanguageArgument,
    recentLimit: z.number().int().positive().optional(),
  })
  .strict();

const listRecentGamesArgumentsSchema = z
  .object({
    cardSetId: optionalNonEmptyString,
    cursor: z.number().int().nonnegative().optional(),
    exerciseType: exerciseTypeSchema.optional(),
    limit: z.number().int().positive().optional(),
    targetLanguage: targetLanguageArgument,
  })
  .strict();

const getCardLearningStatsArgumentsSchema = z
  .object({
    cardIds: z.array(z.string().trim().min(1)),
    recentLimit: z.number().int().positive().optional(),
    targetLanguage: targetLanguageArgument,
  })
  .strict();

const getCardSetLearningStatsArgumentsSchema = z
  .object({
    cardSetId: z.string().trim().min(1),
    limit: z.number().int().positive().optional(),
    targetLanguage: targetLanguageArgument,
  })
  .strict();

export type AiReadToolName =
  | 'list_card_sets'
  | 'get_card_set'
  | 'search_cards'
  | 'get_cards'
  | 'get_learning_overview'
  | 'list_recent_games'
  | 'get_card_learning_stats'
  | 'get_card_set_learning_stats';

export interface AiLibrarySnapshot {
  attempts: ExerciseAttempt[];
  cards: LanguageCard[];
  cardStats: CardStats[];
  cardSets: CardSet[];
  interfaceLanguage: SupportedLanguage;
}

interface CardSetSummary {
  archivedAt?: string;
  cardCount: number;
  id: string;
  name: string;
}

interface Page<T> {
  cursor: number;
  items: T[];
  limit: number;
  nextCursor: number | null;
  total: number;
}

type CardLearningStat = ReturnType<typeof toCardLearningStat>;

export const aiReadToolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'list_card_sets' as const,
      description: 'List card sets with localized names and pagination.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {
          cursor: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 1, maximum: CARD_SET_PAGE_LIMIT },
          query: { type: 'string' },
          archiveFilter: {
            type: 'string',
            enum: ['active', 'archived', 'all'],
            description:
              'active lists active sets plus All cards, archived lists archived sets only, all lists both.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_card_set' as const,
      description: 'Get a card set and a bounded page of its complete cards.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        required: ['cardSetId'],
        properties: {
          cardSetId: { type: 'string' },
          cursor: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 1, maximum: CARD_PAGE_LIMIT },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_cards' as const,
      description:
        'Search card translations, definitions, examples, and tags with pagination.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        required: ['query'],
        properties: {
          cardSetId: { type: 'string' },
          cursor: { type: 'integer', minimum: 0 },
          languages: {
            type: 'array',
            items: { type: 'string', enum: supportedLanguages },
          },
          limit: { type: 'integer', minimum: 1, maximum: CARD_PAGE_LIMIT },
          query: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_cards' as const,
      description: 'Get complete cards by id and report ids that are not in the library.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        required: ['cardIds'],
        properties: {
          cardIds: {
            type: 'array',
            items: { type: 'string' },
            maxItems: CARD_PAGE_LIMIT,
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_learning_overview' as const,
      description:
        'Get aggregate learning progress and recent games for one target language.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {
          targetLanguage: { type: 'string', enum: supportedLanguages },
          recentLimit: { type: 'integer', minimum: 1, maximum: GAME_PAGE_LIMIT },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_recent_games' as const,
      description:
        'List recent played games with answered card ids and correctness, with filters.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {
          cardSetId: { type: 'string' },
          cursor: { type: 'integer', minimum: 0 },
          exerciseType: {
            type: 'string',
            enum: ['crossword', 'multipleChoice', 'missingLetters', 'missingWord'],
          },
          limit: { type: 'integer', minimum: 1, maximum: GAME_PAGE_LIMIT },
          targetLanguage: { type: 'string', enum: supportedLanguages },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_card_learning_stats' as const,
      description:
        'Get per-card learning stats, stability, and recent answer history.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        required: ['cardIds'],
        properties: {
          cardIds: {
            type: 'array',
            items: { type: 'string' },
            maxItems: CARD_PAGE_LIMIT,
          },
          recentLimit: { type: 'integer', minimum: 1, maximum: RECENT_ANSWER_LIMIT },
          targetLanguage: { type: 'string', enum: supportedLanguages },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_card_set_learning_stats' as const,
      description:
        'Get learning progress for cards in one card set, ranked by weak cards first.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        required: ['cardSetId'],
        properties: {
          cardSetId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: CARD_PAGE_LIMIT },
          targetLanguage: { type: 'string', enum: supportedLanguages },
        },
      },
    },
  },
] as const;

export function executeAiReadTool(
  name: AiReadToolName,
  rawArguments: unknown,
  snapshot: AiLibrarySnapshot,
): unknown {
  switch (name) {
    case 'list_card_sets':
      return listCardSets(listCardSetsArgumentsSchema.parse(rawArguments), snapshot);
    case 'get_card_set':
      return getCardSet(getCardSetArgumentsSchema.parse(rawArguments), snapshot);
    case 'search_cards':
      return searchCards(searchCardsArgumentsSchema.parse(rawArguments), snapshot);
    case 'get_cards':
      return getCards(getCardsArgumentsSchema.parse(rawArguments), snapshot);
    case 'get_learning_overview':
      return getLearningOverview(
        getLearningOverviewArgumentsSchema.parse(rawArguments),
        snapshot,
      );
    case 'list_recent_games':
      return listRecentGames(listRecentGamesArgumentsSchema.parse(rawArguments), snapshot);
    case 'get_card_learning_stats':
      return getCardLearningStats(
        getCardLearningStatsArgumentsSchema.parse(rawArguments),
        snapshot,
      );
    case 'get_card_set_learning_stats':
      return getCardSetLearningStats(
        getCardSetLearningStatsArgumentsSchema.parse(rawArguments),
        snapshot,
      );
  }
}

function listCardSets(
  arguments_: z.infer<typeof listCardSetsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
): Page<CardSetSummary> {
  const query = normalizeSearchValue(arguments_.query ?? '');
  const archiveFilter = arguments_.archiveFilter ?? 'active';
  const includeAllCards = archiveFilter === 'active';
  const cardCounts = createCardCounts(snapshot.cardSets, snapshot.cards);
  const allCards = {
    cardCount: snapshot.cards.length,
    id: ALL_CARDS_CARD_SET_ID,
    name: t(snapshot.interfaceLanguage, 'allCards'),
  };
  const cardSets = [
    ...(includeAllCards && normalizeSearchValue(allCards.name).includes(query)
      ? [allCards]
      : []),
    ...snapshot.cardSets
      .filter((cardSet) => {
        if (archiveFilter === 'active' && cardSet.archivedAt) return false;
        if (archiveFilter === 'archived' && !cardSet.archivedAt) return false;
        return cardSetNameMatchesQuery(cardSet, query);
      })
      .map((cardSet) =>
        toCardSetSummary(cardSet, snapshot.interfaceLanguage, cardCounts),
      ),
  ];

  return paginate(
    cardSets,
    arguments_.cursor ?? 0,
    clampLimit(arguments_.limit, CARD_SET_PAGE_LIMIT),
  );
}

function getCardSet(
  arguments_: z.infer<typeof getCardSetArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
):
  | (Page<LanguageCard> & { cardSet: CardSetSummary })
  | { cardSetId: string; error: 'card_set_not_found' } {
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const cardSet = findCardSet(arguments_.cardSetId, snapshot);
  if (!cardSet) {
    return { error: 'card_set_not_found', cardSetId: arguments_.cardSetId };
  }

  const cards = cardSet.cardIds
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is LanguageCard => Boolean(card))
    .map(serializeCard);
  const page = paginate(
    cards,
    arguments_.cursor ?? 0,
    clampLimit(arguments_.limit, CARD_PAGE_LIMIT),
  );

  return {
    cardSet: cardSet.summary,
    ...page,
  };
}

function searchCards(
  arguments_: z.infer<typeof searchCardsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
): Page<LanguageCard> | { cardSetId: string; error: 'card_set_not_found' } {
  const cardSet = arguments_.cardSetId
    ? findCardSet(arguments_.cardSetId, snapshot)
    : undefined;
  if (arguments_.cardSetId && !cardSet) {
    return { error: 'card_set_not_found', cardSetId: arguments_.cardSetId };
  }

  const allowedCardIds = cardSet ? new Set(cardSet.cardIds) : undefined;
  const query = normalizeSearchValue(arguments_.query);
  const languages = arguments_.languages ?? supportedLanguages;
  const cards = snapshot.cards
    .filter(
      (card) =>
        (!allowedCardIds || allowedCardIds.has(card.id)) &&
        cardMatchesQuery(card, query, languages),
    )
    .map(serializeCard);

  return paginate(
    cards,
    arguments_.cursor ?? 0,
    clampLimit(arguments_.limit, CARD_PAGE_LIMIT),
  );
}

function getCards(
  arguments_: z.infer<typeof getCardsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
): { cards: LanguageCard[]; unknownCardIds: string[] } {
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const cardIds = [...new Set(arguments_.cardIds)].slice(0, CARD_PAGE_LIMIT);
  const cards: LanguageCard[] = [];
  const unknownCardIds: string[] = [];

  cardIds.forEach((cardId) => {
    const card = cardsById.get(cardId);
    if (card) {
      cards.push(serializeCard(card));
    } else {
      unknownCardIds.push(cardId);
    }
  });

  return { cards, unknownCardIds };
}

function getLearningOverview(
  arguments_: z.infer<typeof getLearningOverviewArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
) {
  const targetLanguage = arguments_.targetLanguage ?? snapshot.interfaceLanguage;
  const games = getFilteredGameSummaries(snapshot, { targetLanguage });
  const stats = snapshot.cardStats.filter(
    (stat) => stat.targetLanguage === targetLanguage,
  );
  const recentLimit = clampLimit(arguments_.recentLimit, GAME_PAGE_LIMIT);

  return {
    targetLanguage,
    totals: createGameTotals(games, stats),
    recentGames: games.slice(0, recentLimit).map(toRecentGameSummary),
  };
}

function listRecentGames(
  arguments_: z.infer<typeof listRecentGamesArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
): Page<ReturnType<typeof toRecentGameDetails>> {
  const games = getFilteredGameSummaries(snapshot, arguments_);
  return paginate(
    games.map((game) => toRecentGameDetails(game)),
    arguments_.cursor ?? 0,
    clampLimit(arguments_.limit, GAME_PAGE_LIMIT),
  );
}

function getCardLearningStats(
  arguments_: z.infer<typeof getCardLearningStatsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
) {
  const targetLanguage = arguments_.targetLanguage ?? snapshot.interfaceLanguage;
  const recentLimit = clampLimit(arguments_.recentLimit, RECENT_ANSWER_LIMIT);
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const statsByCardId = createStatsByCardId(snapshot.cardStats, targetLanguage);
  const recentByCardId = createRecentResultsByCardId({
    attempts: snapshot.attempts,
    limit: recentLimit,
    targetLanguage,
  });
  const cardIds = [...new Set(arguments_.cardIds)].slice(0, CARD_PAGE_LIMIT);
  const cards: CardLearningStat[] = [];
  const unknownCardIds: string[] = [];

  cardIds.forEach((cardId) => {
    const card = cardsById.get(cardId);
    if (!card) {
      unknownCardIds.push(cardId);
      return;
    }
    cards.push(
      toCardLearningStat({
        card,
        recentAnswers: recentByCardId.get(cardId) ?? [],
        stat: statsByCardId.get(cardId),
        targetLanguage,
      }),
    );
  });

  return { cards, unknownCardIds };
}

function getCardSetLearningStats(
  arguments_: z.infer<typeof getCardSetLearningStatsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
) {
  const cardSet = findCardSet(arguments_.cardSetId, snapshot);
  if (!cardSet) {
    return { error: 'card_set_not_found', cardSetId: arguments_.cardSetId };
  }

  const targetLanguage = arguments_.targetLanguage ?? snapshot.interfaceLanguage;
  const cardsById = new Map(snapshot.cards.map((card) => [card.id, card]));
  const statsByCardId = createStatsByCardId(snapshot.cardStats, targetLanguage);
  const cards = cardSet.cardIds
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is LanguageCard => Boolean(card))
    .map((card) =>
      toCardLearningStat({
        card,
        recentAnswers: [],
        stat: statsByCardId.get(card.id),
        targetLanguage,
      }),
    )
    .sort(compareCardLearningStats)
    .slice(0, clampLimit(arguments_.limit, CARD_PAGE_LIMIT));
  const practicedStats = cardSet.cardIds
    .map((cardId) => statsByCardId.get(cardId))
    .filter((stat): stat is CardStats => Boolean(stat));

  return {
    cardSet: cardSet.summary,
    targetLanguage,
    totals: {
      attempts: practicedStats.reduce((sum, stat) => sum + stat.attempts, 0),
      cardsInSet: cardSet.summary.cardCount,
      correct: practicedStats.reduce((sum, stat) => sum + stat.correct, 0),
      incorrect: practicedStats.reduce((sum, stat) => sum + stat.incorrect, 0),
      practicedCards: practicedStats.length,
      weakCards: practicedStats.filter((stat) => stat.stability === 'weak').length,
    },
    cards,
  };
}

function getFilteredGameSummaries(
  snapshot: AiLibrarySnapshot,
  filters: {
    cardSetId?: string;
    exerciseType?: ExerciseType;
    targetLanguage?: SupportedLanguage;
  },
): ExerciseHistorySummary[] {
  return summarizeExerciseHistory(snapshot.attempts).filter((game) => {
    if (filters.targetLanguage && game.targetLanguage !== filters.targetLanguage) {
      return false;
    }
    if (filters.cardSetId && game.cardSetId !== filters.cardSetId) {
      return false;
    }
    if (filters.exerciseType && game.exerciseType !== filters.exerciseType) {
      return false;
    }
    return true;
  });
}

function createGameTotals(
  games: ExerciseHistorySummary[],
  stats: CardStats[],
) {
  return {
    answeredCards: games.reduce((sum, game) => sum + game.total, 0),
    completedGames: games.filter((game) => game.isExerciseCompleted).length,
    correct: games.reduce((sum, game) => sum + game.correct, 0),
    games: games.length,
    incorrect: games.reduce((sum, game) => sum + game.incorrect, 0),
    weakCards: stats.filter((stat) => stat.stability === 'weak').length,
  };
}

function toRecentGameSummary(game: ExerciseHistorySummary) {
  return {
    cardSetId: game.cardSetId,
    completedAt: game.completedAt,
    correct: game.correct,
    createdAt: game.createdAt,
    exerciseCompletedAt: game.exerciseCompletedAt,
    exerciseType: game.exerciseType,
    id: game.id,
    incorrect: game.incorrect,
    isExerciseCompleted: game.isExerciseCompleted,
    targetLanguage: game.targetLanguage,
    total: game.total,
  };
}

function toRecentGameDetails(game: ExerciseHistorySummary) {
  return {
    ...toRecentGameSummary(game),
    answeredCards: game.attempts.flatMap((attempt) =>
      Object.entries(attempt.correctness).map(([cardId, isCorrect]) => ({
        cardId,
        isCorrect: Boolean(isCorrect),
      })),
    ),
  };
}

function createStatsByCardId(
  cardStats: CardStats[],
  targetLanguage: SupportedLanguage,
): Map<string, CardStats> {
  return new Map(
    cardStats
      .filter((stat) => stat.targetLanguage === targetLanguage)
      .map((stat) => [stat.cardId, stat]),
  );
}

function toCardLearningStat({
  card,
  recentAnswers,
  stat,
  targetLanguage,
}: {
  card: LanguageCard;
  recentAnswers: RecentCardResult[];
  stat: CardStats | undefined;
  targetLanguage: SupportedLanguage;
}) {
  return {
    accuracy: stat?.accuracy ?? 0,
    answer: getCardAnswer(card, targetLanguage),
    attempts: stat?.attempts ?? 0,
    cardId: card.id,
    correct: stat?.correct ?? 0,
    incorrect: stat?.incorrect ?? 0,
    lastPracticedAt: stat?.lastPracticedAt,
    recentAnswers,
    recentMistakes: stat?.recentMistakes ?? 0,
    stability: stat?.stability ?? 'new',
    targetLanguage,
    translations: { ...card.translations },
  };
}

function compareCardLearningStats(
  left: CardLearningStat,
  right: CardLearningStat,
): number {
  const leftWeakScore = learningWeaknessScore(left);
  const rightWeakScore = learningWeaknessScore(right);
  if (leftWeakScore !== rightWeakScore) {
    return rightWeakScore - leftWeakScore;
  }
  return left.cardId.localeCompare(right.cardId);
}

function learningWeaknessScore(stat: CardLearningStat): number {
  return (
    stat.incorrect * 100 +
    stat.recentMistakes * 50 +
    (1 - stat.accuracy) * 10 +
    (stat.attempts === 0 ? 1 : 0)
  );
}

function findCardSet(
  cardSetId: string,
  snapshot: AiLibrarySnapshot,
): { cardIds: string[]; summary: CardSetSummary } | undefined {
  if (cardSetId === ALL_CARDS_CARD_SET_ID) {
    return {
      cardIds: snapshot.cards.map((card) => card.id),
      summary: {
        cardCount: snapshot.cards.length,
        id: ALL_CARDS_CARD_SET_ID,
        name: t(snapshot.interfaceLanguage, 'allCards'),
      },
    };
  }

  const cardSet = snapshot.cardSets.find((candidate) => candidate.id === cardSetId);
  if (!cardSet) {
    return undefined;
  }

  return {
    cardIds: cardSet.cardIds,
    summary: toCardSetSummary(
      cardSet,
      snapshot.interfaceLanguage,
      createCardCounts(snapshot.cardSets, snapshot.cards),
    ),
  };
}

function toCardSetSummary(
  cardSet: CardSet,
  interfaceLanguage: SupportedLanguage,
  cardCounts: Map<string, number>,
): CardSetSummary {
  return {
    archivedAt: cardSet.archivedAt,
    cardCount: cardCounts.get(cardSet.id) ?? 0,
    id: cardSet.id,
    name: getCardSetName(cardSet, interfaceLanguage),
  };
}

function createCardCounts(cardSets: CardSet[], cards: LanguageCard[]): Map<string, number> {
  const knownCardIds = new Set(cards.map((card) => card.id));
  return new Map(
    cardSets.map((cardSet) => [
      cardSet.id,
      new Set(cardSet.cardIds.filter((cardId) => knownCardIds.has(cardId))).size,
    ]),
  );
}

function cardSetNameMatchesQuery(cardSet: CardSet, query: string): boolean {
  return [cardSet.name, ...Object.values(cardSet.names ?? {})].some((name) =>
    normalizeSearchValue(name).includes(query),
  );
}

function cardMatchesQuery(
  card: LanguageCard,
  query: string,
  languages: readonly SupportedLanguage[],
): boolean {
  const localizedValues = languages.flatMap((language) => [
    card.translations[language],
    card.definitions?.[language],
    ...(card.examples?.[language]?.flatMap(exampleValues) ?? []),
  ]);
  const values = [...localizedValues, ...(card.tags ?? [])];
  return values.some(
    (value) => typeof value === 'string' && normalizeSearchValue(value).includes(query),
  );
}

function exampleValues(example: LanguageExample): string[] {
  return [example.answer, example.sentence];
}

function paginate<T>(items: T[], cursor: number, limit: number): Page<T> {
  const pageItems = items.slice(cursor, cursor + limit);
  const nextCursor = cursor + pageItems.length;
  return {
    cursor,
    items: pageItems,
    limit,
    nextCursor: nextCursor < items.length ? nextCursor : null,
    total: items.length,
  };
}

function clampLimit(value: number | undefined, maximum: number): number {
  return Math.min(Math.max(value ?? DEFAULT_PAGE_LIMIT, 1), maximum);
}

function normalizeSearchValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function serializeCard(card: LanguageCard): LanguageCard {
  return {
    ...card,
    definitions: card.definitions ? { ...card.definitions } : undefined,
    examples: card.examples
      ? Object.fromEntries(
          Object.entries(card.examples).map(([language, examples]) => [
            language,
            examples?.map((example) => ({ ...example })),
          ]),
        )
      : undefined,
    tags: card.tags ? [...card.tags] : undefined,
    translations: { ...card.translations },
  };
}
