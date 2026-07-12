import { describe, expect, it } from 'vitest';
import { AiLibraryProposal } from '../aiAssistantSchemas';
import {
  AppliedAiOperation,
  findAiRollbackConflict,
  planAiOperation,
} from '../aiOperations';
import { CardSet } from '../cardSets';
import { LanguageCard } from '../cards';

const now = '2026-07-11T18:00:00.000Z';
const modelId = 'deepseek/deepseek-v4-flash';

function card(overrides: Partial<LanguageCard> = {}): LanguageCard {
  return {
    id: 'card-airport',
    translations: { en: 'airport', ru: 'аэропорт' },
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides,
  };
}

function cardSet(overrides: Partial<CardSet> = {}): CardSet {
  return {
    id: 'set-travel',
    name: 'Travel',
    names: { en: 'Travel' },
    cardIds: ['card-old'],
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides,
  };
}

function plannerInput(proposal: AiLibraryProposal) {
  let nextId = 0;
  return {
    cards: [card(), card({ id: 'card-old', translations: { en: 'old', es: 'viejo' } })],
    cardSets: [cardSet()],
    proposal,
    modelId,
    now,
    userPrompt: 'Create Travel',
    idFactory: (prefix: string) => `${prefix}-${++nextId}`,
  };
}

describe('planAiOperation', () => {
  it('plans exact created card and set snapshots with preview metadata', () => {
    const result = planAiOperation(
      plannerInput({
        title: 'Rail travel',
        summary: 'Create a train card and set.',
        cards: [
          {
            clientRef: 'train',
            translations: { en: 'train', es: 'tren' },
            tags: ['travel'],
          },
        ],
        cardSetChanges: [
          {
            type: 'create',
            clientRef: 'rail-set',
            names: { ru: 'Поезда', es: 'Trenes' },
            cardRefs: ['train'],
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.operation).toMatchObject({
      id: 'ai-operation-1',
      title: 'Rail travel',
      summary: 'Create a train card and set.',
      userPrompt: 'Create Travel',
      modelId,
      createdAt: now,
      previewCounts: {
        createdCards: 1,
        updatedCards: 0,
        pendingDuplicates: 0,
        createdCardSets: 1,
        archivedCardSets: 0,
        renamedCardSets: 0,
        membershipAdditions: 1,
        membershipRemovals: 0,
      },
    });
    expect(result.operation.createdCards).toEqual([
      {
        id: 'card-2',
        translations: { en: 'train', es: 'tren' },
        tags: ['travel'],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(result.operation.createdCardSets).toEqual([
      {
        id: 'card-set-3',
        name: 'Поезда',
        names: { ru: 'Поезда', es: 'Trenes' },
        cardIds: ['card-2'],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(result.operation.updatedCards).toEqual([]);
    expect(result.operation.updatedCardSets).toEqual([]);
    expect(result.operation.duplicateProcessingHistory).toEqual([]);
    expect(result.operation.pendingDuplicates).toEqual([]);
  });

  it('plans safe card completion, localized rename, and membership changes', () => {
    const result = planAiOperation(
      plannerInput({
        title: 'Complete travel',
        summary: 'Complete and organize travel cards.',
        cards: [
          {
            clientRef: 'airport-ref',
            translations: { en: 'Airport', es: 'aeropuerto' },
          },
        ],
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'set-travel',
            names: { ru: 'Путешествия', es: 'Viajes' },
            addCardRefs: ['airport-ref'],
            removeCardIds: ['card-old'],
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.operation.createdCards).toEqual([]);
    expect(result.operation.updatedCards).toEqual([
      {
        before: card(),
        after: card({
          translations: { en: 'airport', ru: 'аэропорт', es: 'aeropuerto' },
          updatedAt: now,
        }),
      },
    ]);
    expect(result.operation.duplicateProcessingHistory).toHaveLength(1);
    expect(result.operation.duplicateProcessingHistory[0]).toMatchObject({
      id: 'merge-2',
      existingCardId: 'card-airport',
      addedFields: ['translations.es'],
    });
    expect(result.operation.updatedCardSets).toEqual([
      {
        before: cardSet(),
        after: cardSet({
          name: 'Travel',
          names: { en: 'Travel', ru: 'Путешествия', es: 'Viajes' },
          cardIds: ['card-airport'],
          updatedAt: now,
        }),
      },
    ]);
    expect(result.operation.previewCounts).toEqual({
      createdCards: 0,
      updatedCards: 1,
      pendingDuplicates: 0,
      createdCardSets: 0,
      archivedCardSets: 0,
      renamedCardSets: 1,
      membershipAdditions: 1,
      membershipRemovals: 1,
    });
  });

  it('plans card-set archival through an update operation', () => {
    const result = planAiOperation(
      plannerInput({
        title: 'Archive Travel',
        summary: 'Archive the old travel set.',
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'set-travel',
            archive: true,
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operation.updatedCardSets).toEqual([
      {
        before: cardSet(),
        after: cardSet({
          archivedAt: now,
          updatedAt: now,
        }),
      },
    ]);
    expect(result.operation.previewCounts).toMatchObject({
      archivedCardSets: 1,
      membershipAdditions: 0,
      membershipRemovals: 0,
    });
  });

  it('rejects attempts to archive all-cards or already archived sets', () => {
    expect(
      planAiOperation(
        plannerInput({
          title: 'Archive all',
          summary: 'Invalid archive.',
          cardSetChanges: [
            { type: 'update', cardSetId: 'all-cards', archive: true },
          ],
        }),
      ),
    ).toEqual({
      ok: false,
      errors: ['The all-cards set cannot be updated.'],
    });

    const input = plannerInput({
      title: 'Archive again',
      summary: 'Invalid archive.',
      cardSetChanges: [
        { type: 'update', cardSetId: 'set-travel', archive: true },
      ],
    });
    input.cardSets = [cardSet({ archivedAt: now })];

    expect(planAiOperation(input)).toEqual({
      ok: false,
      errors: ['Card set set-travel is already archived.'],
    });
  });

  it.each([
    {
      name: 'create',
      proposal: {
        title: 'Duplicate travel',
        summary: 'Invalid duplicate.',
        cardSetChanges: [
          {
            type: 'create' as const,
            clientRef: 'duplicate-travel',
            names: { en: 'Travel' },
            cardRefs: [],
          },
        ],
      },
    },
    {
      name: 'rename',
      proposal: {
        title: 'Rename duplicate',
        summary: 'Invalid duplicate.',
        cardSetChanges: [
          {
            type: 'update' as const,
            cardSetId: 'set-holidays',
            names: { en: 'Travel' },
          },
        ],
      },
    },
  ])('rejects an AI $name that duplicates an active card set name', ({ proposal }) => {
    const input = plannerInput(proposal);
    input.cardSets = [
      cardSet(),
      cardSet({
        id: 'set-holidays',
        name: 'Holidays',
        names: { en: 'Holidays' },
      }),
    ];

    expect(planAiOperation(input)).toEqual({
      ok: false,
      errors: ['Card set name conflicts with active card set: Travel.'],
    });
  });

  it('allows card-only AI operations when legacy active set names are already duplicated', () => {
    const input = plannerInput({
      title: 'Add love card',
      summary: 'Create a card without changing sets.',
      cards: [
        {
          clientRef: 'heart',
          translations: { en: 'heart', ru: 'сердце', es: 'corazon' },
        },
      ],
    });
    input.cardSets = [
      cardSet(),
      cardSet({
        id: 'set-travel-copy',
        name: 'Travel',
        names: { en: 'Travel' },
        cardIds: [],
      }),
    ];

    const result = planAiOperation(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operation.createdCards).toHaveLength(1);
    expect(result.operation.createdCardSets).toEqual([]);
    expect(result.operation.updatedCardSets).toEqual([]);
  });

  it.each([
    {
      name: 'create',
      proposal: {
        title: 'Reuse archived travel',
        summary: 'Create a new active set.',
        cardSetChanges: [
          {
            type: 'create' as const,
            clientRef: 'new-travel',
            names: { en: 'Travel' },
            cardRefs: [],
          },
        ],
      },
    },
    {
      name: 'rename',
      proposal: {
        title: 'Reuse archived travel',
        summary: 'Rename an active set.',
        cardSetChanges: [
          {
            type: 'update' as const,
            cardSetId: 'set-holidays',
            names: { en: 'Travel' },
          },
        ],
      },
    },
  ])('allows an AI $name that only matches an archived card set', ({ proposal }) => {
    const input = plannerInput(proposal);
    input.cardSets = [
      cardSet({ archivedAt: now }),
      cardSet({
        id: 'set-holidays',
        name: 'Holidays',
        names: { en: 'Holidays' },
      }),
    ];

    expect(planAiOperation(input).ok).toBe(true);
  });

  it('rejects every AI update to an already archived card set', () => {
    const input = plannerInput({
      title: 'Rename archived travel',
      summary: 'Invalid archived update.',
      cardSetChanges: [
        {
          type: 'update',
          cardSetId: 'set-travel',
          names: { en: 'Trips' },
        },
      ],
    });
    input.cardSets = [cardSet({ archivedAt: now })];

    expect(planAiOperation(input)).toEqual({
      ok: false,
      errors: ['Card set set-travel is already archived.'],
    });
  });

  it('records conflicting duplicate metadata while resolving its set ref', () => {
    const existing = card({
      definitions: { en: 'Existing definition.' },
    });
    const input = plannerInput({
      title: 'Conflict',
      summary: 'Record a duplicate conflict.',
      cards: [
        {
          clientRef: 'airport-ref',
          translations: { en: 'airport', ru: 'аэропорт' },
          definitions: { en: 'Different definition.' },
        },
      ],
      cardSetChanges: [
        {
          type: 'create',
          clientRef: 'conflicts',
          names: { es: 'Conflictos' },
          cardRefs: ['airport-ref'],
        },
      ],
    });
    input.cards[0] = existing;

    const result = planAiOperation(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operation.pendingDuplicates).toEqual([
      expect.objectContaining({
        id: 'pending-2',
        existingCardId: 'card-airport',
        conflicts: ['definitions.en'],
        status: 'pending',
      }),
    ]);
    expect(result.operation.createdCardSets[0]).toMatchObject({
      name: 'Conflictos',
      cardIds: ['card-airport'],
    });
    expect(result.operation.previewCounts.pendingDuplicates).toBe(1);
  });

  it('rejects an exact duplicate when duplicate processing produces no library change', () => {
    const result = planAiOperation(
      plannerInput({
        title: 'Duplicate airport',
        summary: 'Try to add the existing airport card again.',
        cards: [
          {
            clientRef: 'airport-copy',
            translations: { en: 'airport', ru: 'аэропорт' },
          },
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: ['An operation must contain at least one change.'],
    });
  });

  it('keeps an exact duplicate proposal valid when it adds membership to a set', () => {
    const result = planAiOperation(
      plannerInput({
        title: 'Organize airport',
        summary: 'Add the existing airport card to Travel.',
        cards: [
          {
            clientRef: 'airport-copy',
            translations: { en: 'airport', ru: 'аэропорт' },
          },
        ],
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'set-travel',
            addCardRefs: ['airport-copy'],
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operation.createdCards).toEqual([]);
    expect(result.operation.updatedCards).toEqual([]);
    expect(result.operation.updatedCardSets[0].after.cardIds).toEqual([
      'card-old',
      'card-airport',
    ]);
  });

  it.each([
    {
      name: 'unknown card reference',
      proposal: {
        title: 'Unknown ref',
        summary: 'Unknown ref',
        cardSetChanges: [
          {
            type: 'create',
            clientRef: 'set',
            names: { en: 'Set' },
            cardRefs: ['missing-card'],
          },
        ],
      },
      error: 'Unknown card reference: missing-card.',
    },
    {
      name: 'unknown card set',
      proposal: {
        title: 'Unknown set',
        summary: 'Unknown set',
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'missing-set',
            names: { en: 'Missing' },
          },
        ],
      },
      error: 'Unknown card set: missing-set.',
    },
    {
      name: 'unknown membership removal',
      proposal: {
        title: 'Unknown removal',
        summary: 'Unknown removal',
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'set-travel',
            removeCardIds: ['card-airport'],
          },
        ],
      },
      error: 'Card card-airport is not a member of card set set-travel.',
    },
    {
      name: 'all-cards update',
      proposal: {
        title: 'All cards',
        summary: 'All cards',
        cardSetChanges: [
          { type: 'update', cardSetId: 'all-cards', names: { en: 'No' } },
        ],
      },
      error: 'The all-cards set cannot be updated.',
    },
    {
      name: 'duplicate refs',
      proposal: {
        title: 'Duplicates',
        summary: 'Duplicates',
        cards: [
          { clientRef: 'same', translations: { en: 'one', es: 'uno' } },
          { clientRef: 'same', translations: { en: 'two', es: 'dos' } },
        ],
      },
      error: 'Client references must be unique.',
    },
    {
      name: 'empty operation',
      proposal: { title: 'Empty', summary: 'Empty' },
      error: 'An operation must contain at least one change.',
    },
  ])('rejects $name without returning partial patches', ({ proposal, error }) => {
    const result = planAiOperation(
      plannerInput(proposal as AiLibraryProposal),
    );

    expect(result).toEqual({ ok: false, errors: expect.arrayContaining([error]) });
  });

  it.each([
    [{ es: 'Viajes' }, 'Viajes'],
    [{ ru: 'Путешествия', es: 'Viajes' }, 'Путешествия'],
    [{ en: 'Journeys', ru: 'Путешествия', es: 'Viajes' }, 'Journeys'],
  ])('derives a created set canonical name by en, ru, es priority', (names, expected) => {
    const result = planAiOperation(
      plannerInput({
        title: 'Names',
        summary: 'Test names.',
        cardSetChanges: [
          { type: 'create', clientRef: 'set', names, cardRefs: [] },
        ],
      }),
    );

    expect(result.ok && result.operation.createdCardSets[0].name).toBe(expected);
  });

  it('derives an updated canonical name after merging localized names', () => {
    const input = plannerInput({
      title: 'Names',
      summary: 'Update names.',
      cardSetChanges: [
        {
          type: 'update',
          cardSetId: 'set-travel',
          names: { es: 'Viajes' },
        },
      ],
    });
    input.cardSets[0] = cardSet({ name: 'Legacy', names: { ru: 'Путешествия' } });

    const result = planAiOperation(input);

    expect(result.ok && result.operation.updatedCardSets[0].after).toMatchObject({
      name: 'Путешествия',
      names: { ru: 'Путешествия', es: 'Viajes' },
    });
  });

  it('retains the old canonical name when no localized set name exists', () => {
    const input = plannerInput({
      title: 'Membership',
      summary: 'Update membership only.',
      cardSetChanges: [
        {
          type: 'update',
          cardSetId: 'set-travel',
          addCardRefs: ['card-airport'],
        },
      ],
    });
    input.cardSets[0] = cardSet({ name: 'Legacy', names: undefined });

    const result = planAiOperation(input);

    expect(result.ok && result.operation.updatedCardSets[0]).toEqual({
      before: {
        id: 'set-travel',
        name: 'Legacy',
        cardIds: ['card-old'],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
      },
      after: {
        id: 'set-travel',
        name: 'Legacy',
        cardIds: ['card-old', 'card-airport'],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: now,
      },
    });
    if (!result.ok) return;
    expect(result.operation.updatedCardSets[0].before).not.toHaveProperty('names');
    expect(result.operation.updatedCardSets[0].after).not.toHaveProperty('names');
  });

  it.each([
    [
      { en: '   ', ru: '  Путешествия  ', es: ' Viajes ' },
      'Путешествия',
    ],
    [{ en: ' ', ru: '\t', es: '  ' }, 'Legacy'],
  ])(
    'ignores blank legacy localized names without rewriting stored values',
    (names, expectedCanonicalName) => {
      const input = plannerInput({
        title: 'Membership',
        summary: 'Update membership only.',
        cardSetChanges: [
          {
            type: 'update',
            cardSetId: 'set-travel',
            addCardRefs: ['card-airport'],
          },
        ],
      });
      input.cardSets[0] = cardSet({ name: 'Legacy', names });

      const result = planAiOperation(input);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.operation.updatedCardSets[0].after.name).toBe(
        expectedCanonicalName,
      );
      expect(result.operation.updatedCardSets[0].after.names).toEqual(names);
    },
  );
});

describe('findAiRollbackConflict', () => {
  function appliedOperation(): AppliedAiOperation {
    const result = planAiOperation(
      plannerInput({
        title: 'Update airport',
        summary: 'Complete airport and create a set.',
        cards: [
          {
            clientRef: 'airport',
            translations: { en: 'airport', es: 'aeropuerto' },
          },
        ],
        cardSetChanges: [
          {
            type: 'create',
            clientRef: 'new-set',
            names: { en: 'Airport' },
            cardRefs: ['airport'],
          },
        ],
      }),
    );
    if (!result.ok) throw new Error(result.errors.join(', '));
    return { ...result.operation, appliedAt: now, status: 'applied' };
  }

  it('allows rollback when every affected entity matches its after snapshot', () => {
    const operation = appliedOperation();

    expect(
      findAiRollbackConflict({
        operation,
        cards: [operation.updatedCards[0].after],
        cardSets: operation.createdCardSets,
        laterOperations: [],
      }),
    ).toBeNull();
  });

  it('reports a changed entity and names a later touching operation', () => {
    const operation = appliedOperation();
    const laterOperation: AppliedAiOperation = {
      ...operation,
      id: 'ai-operation-later',
      title: 'Later airport edit',
      createdAt: '2026-07-11T19:00:00.000Z',
      appliedAt: '2026-07-11T19:01:00.000Z',
      createdCards: [],
      createdCardSets: [],
      updatedCardSets: [],
    };

    expect(
      findAiRollbackConflict({
        operation,
        cards: [
          {
            ...operation.updatedCards[0].after,
            difficulty: 'hard',
          },
        ],
        cardSets: operation.createdCardSets,
        laterOperations: [laterOperation],
      }),
    ).toEqual({
      entityType: 'card',
      entityId: 'card-airport',
      laterOperation: {
        id: 'ai-operation-later',
        title: 'Later airport edit',
      },
    });
  });

  it('reports a removed operation-created entity without a later operation', () => {
    const operation = appliedOperation();

    expect(
      findAiRollbackConflict({
        operation,
        cards: [operation.updatedCards[0].after],
        cardSets: [],
        laterOperations: [],
      }),
    ).toEqual({
      entityType: 'cardSet',
      entityId: operation.createdCardSets[0].id,
    });
  });
});
