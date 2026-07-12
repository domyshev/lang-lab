import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import { CardSet } from '../cardSets';
import {
  aiReadToolDefinitions,
  executeAiReadTool,
  AiLibrarySnapshot,
} from '../aiLibraryTools';

const createdAt = '2026-07-11T09:00:00.000Z';

const cards: LanguageCard[] = [
  {
    id: 'known',
    translations: { en: 'Known word', es: 'Palabra conocida', ru: 'Знакомое слово' },
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: 'translation-match',
    translations: { en: 'Airport', es: 'Aeropuerto', ru: 'Аэропорт' },
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: 'definition-match',
    translations: { es: 'Terminal', ru: 'Терминал' },
    definitions: { en: 'An airport building for passengers.' },
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: 'example-match',
    translations: { es: 'Vuelo', ru: 'Рейс' },
    examples: {
      en: [
        {
          sentence: 'We arrived at the airport early.',
          answer: 'airport',
        },
      ],
    },
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: 'tag-match',
    translations: { es: 'Maleta', ru: 'Чемодан' },
    tags: ['airport', 'travel'],
    createdAt,
    updatedAt: createdAt,
  },
];

const cardSets: CardSet[] = [
  {
    id: 'travel',
    name: 'Travel',
    names: { en: 'Travel', es: 'Viajes', ru: 'Путешествия' },
    cardIds: ['known', 'translation-match', 'missing-from-set'],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: 'archive',
    name: 'Archive',
    names: { en: 'Old travel', es: 'Viajes antiguos' },
    cardIds: ['tag-match'],
    createdAt,
    updatedAt: createdAt,
    archivedAt: '2026-07-10T09:00:00.000Z',
  },
];

const snapshot: AiLibrarySnapshot = {
  cards,
  cardSets,
  interfaceLanguage: 'es',
};

function createBoundarySnapshot(): AiLibrarySnapshot {
  return {
    cards: Array.from({ length: 101 }, (_, index) => ({
      id: `boundary-${index}`,
      translations: { en: 'boundary' },
      createdAt,
      updatedAt: createdAt,
    })),
    cardSets: [],
    interfaceLanguage: 'en',
  };
}

describe('executeAiReadTool', () => {
  it('lists localized card sets with a stable page and a 50-item cap', () => {
    expect(
      executeAiReadTool('list_card_sets', { query: '  trav ', limit: 500 }, snapshot),
    ).toEqual({
      cursor: 0,
      items: [
        {
          archivedAt: undefined,
          cardCount: 2,
          id: 'travel',
          name: 'Viajes',
        },
      ],
      limit: 50,
      nextCursor: null,
      total: 1,
    });
  });

  it('lists only active card sets by default and can include archived sets explicitly', () => {
    expect(
      executeAiReadTool('list_card_sets', { query: 'viaj' }, snapshot),
    ).toMatchObject({
      items: [
        {
          archivedAt: undefined,
          id: 'travel',
          name: 'Viajes',
        },
      ],
      total: 1,
    });

    expect(
      executeAiReadTool(
        'list_card_sets',
        { query: 'viaj', archiveFilter: 'archived' },
        snapshot,
      ),
    ).toMatchObject({
      items: [
        {
          archivedAt: '2026-07-10T09:00:00.000Z',
          id: 'archive',
          name: 'Viajes antiguos',
        },
      ],
      total: 1,
    });

    expect(
      executeAiReadTool(
        'list_card_sets',
        { query: 'viaj', archiveFilter: 'all' },
        snapshot,
      ),
    ).toMatchObject({
      total: 2,
    });
  });

  it('returns a bounded page of complete cards for a card set', () => {
    expect(
      executeAiReadTool('get_card_set', { cardSetId: 'travel', cursor: 1, limit: 500 }, snapshot),
    ).toEqual({
      cardSet: {
        archivedAt: undefined,
        cardCount: 2,
        id: 'travel',
        name: 'Viajes',
      },
      cursor: 1,
      items: [cards[1]],
      limit: 100,
      nextCursor: null,
      total: 2,
    });
  });

  it('searches normalized translations, definitions, examples, and tags', () => {
    expect(
      executeAiReadTool('search_cards', { query: ' AIRPORT ', languages: ['en'] }, snapshot),
    ).toMatchObject({
      cursor: 0,
      items: [
        cards[1],
        cards[2],
        cards[3],
        cards[4],
      ],
      nextCursor: null,
      total: 4,
    });
  });

  it('treats an empty optional search card set id as an unscoped search', () => {
    expect(
      executeAiReadTool(
        'search_cards',
        { cardSetId: '', query: 'airport', languages: ['en'] },
        snapshot,
      ),
    ).toMatchObject({
      items: [cards[1], cards[2], cards[3], cards[4]],
      total: 4,
    });
  });

  it('deduplicates requested ids and makes unknown cards explicit', () => {
    expect(
      executeAiReadTool(
        'get_cards',
        { cardIds: ['known', 'missing', 'known'] },
        snapshot,
      ),
    ).toEqual({
      cards: [cards[0]],
      unknownCardIds: ['missing'],
    });
  });

  it('caps search results at 100 cards with stable pagination metadata', () => {
    const result = executeAiReadTool(
      'search_cards',
      { query: 'boundary', limit: 500 },
      createBoundarySnapshot(),
    );

    expect(result).toMatchObject({
      cursor: 0,
      limit: 100,
      nextCursor: 100,
      total: 101,
    });
    const items = (result as { items: LanguageCard[] }).items;
    expect(items).toHaveLength(100);
    expect(items[items.length - 1]?.id).toBe('boundary-99');
  });

  it('caps deduplicated card-id lookups at 100 cards', () => {
    const boundarySnapshot = createBoundarySnapshot();
    const result = executeAiReadTool(
      'get_cards',
      {
        cardIds: [
          ...boundarySnapshot.cards.map((card) => card.id),
          boundarySnapshot.cards[0].id,
        ],
      },
      boundarySnapshot,
    ) as { cards: LanguageCard[]; unknownCardIds: string[] };

    expect(result.cards).toHaveLength(100);
    expect(result.cards[result.cards.length - 1]?.id).toBe('boundary-99');
    expect(result.unknownCardIds).toEqual([]);
  });
});

describe('aiReadToolDefinitions', () => {
  it('declares all read tools with closed argument schemas', () => {
    expect(aiReadToolDefinitions.map((tool) => tool.function.name)).toEqual([
      'list_card_sets',
      'get_card_set',
      'search_cards',
      'get_cards',
    ]);
    expect(
      aiReadToolDefinitions.every(
        (tool) => tool.function.parameters.additionalProperties === false,
      ),
    ).toBe(true);
  });
});
