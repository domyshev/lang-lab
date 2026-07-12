import { z } from 'zod';
import { LanguageCard, LanguageExample } from './cards';
import { ALL_CARDS_CARD_SET_ID, CardSet, getCardSetName } from './cardSets';
import { t } from './i18n';
import { SupportedLanguage, supportedLanguages } from './languages';

const DEFAULT_PAGE_LIMIT = 20;
const CARD_SET_PAGE_LIMIT = 50;
const CARD_PAGE_LIMIT = 100;

const listCardSetsArgumentsSchema = z
  .object({
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().optional(),
    query: z.string().optional(),
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

export type AiReadToolName =
  | 'list_card_sets'
  | 'get_card_set'
  | 'search_cards'
  | 'get_cards';

export interface AiLibrarySnapshot {
  cards: LanguageCard[];
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
  }
}

function listCardSets(
  arguments_: z.infer<typeof listCardSetsArgumentsSchema>,
  snapshot: AiLibrarySnapshot,
): Page<CardSetSummary> {
  const query = normalizeSearchValue(arguments_.query ?? '');
  const cardCounts = createCardCounts(snapshot.cardSets, snapshot.cards);
  const allCards = {
    cardCount: snapshot.cards.length,
    id: ALL_CARDS_CARD_SET_ID,
    name: t(snapshot.interfaceLanguage, 'allCards'),
  };
  const cardSets = [
    ...(normalizeSearchValue(allCards.name).includes(query) ? [allCards] : []),
    ...snapshot.cardSets
      .filter((cardSet) => cardSetNameMatchesQuery(cardSet, query))
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
