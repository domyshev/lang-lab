import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { ALL_CARDS_CARD_SET_ID, CardSet } from '../../domain/cardSets';
import { LanguageCard } from '../../domain/cards';
import { PlannedAiOperation } from '../../domain/aiOperations';
import {
  applyAiOperation,
  revertAiOperation,
} from '../aiAssistantActions';
import {
  appendAiMessage,
  stageAiOperation,
} from '../aiAssistantSlice';
import { applyImportResult } from '../cardsSlice';
import { selectCardSet } from '../cardSetsSlice';
import { rootReducer } from '../store';

const beforeTime = '2026-07-11T10:00:00.000Z';
const operationTime = '2026-07-11T11:00:00.000Z';
const appliedAt = '2026-07-11T12:00:00.000Z';
const revertedAt = '2026-07-11T13:00:00.000Z';

const originalCard: LanguageCard = {
  id: 'card-existing',
  translations: { en: 'hello', ru: 'привет' },
  createdAt: beforeTime,
  updatedAt: beforeTime,
};

const updatedCard: LanguageCard = {
  ...originalCard,
  translations: { ...originalCard.translations, es: 'hola' },
  updatedAt: operationTime,
};

const createdCard: LanguageCard = {
  id: 'card-created',
  translations: { en: 'goodbye', ru: 'до свидания', es: 'adios' },
  createdAt: operationTime,
  updatedAt: operationTime,
};

const originalSet: CardSet = {
  id: 'set-existing',
  name: 'Basics',
  cardIds: ['card-existing'],
  createdAt: beforeTime,
  updatedAt: beforeTime,
};

const updatedSet: CardSet = {
  ...originalSet,
  name: 'Everyday basics',
  names: { en: 'Everyday basics', ru: 'Основы на каждый день' },
  cardIds: ['card-existing', 'card-created'],
  updatedAt: operationTime,
};

const createdSet: CardSet = {
  id: 'set-created',
  name: 'Farewells',
  names: { en: 'Farewells', ru: 'Прощания' },
  cardIds: ['card-created'],
  createdAt: operationTime,
  updatedAt: operationTime,
};

function createOperation(id = 'operation-1'): PlannedAiOperation {
  return {
    id,
    title: 'Expand everyday vocabulary',
    summary: 'Adds a farewell and completes hello.',
    userPrompt: 'Add useful everyday words.',
    modelId: 'deepseek/deepseek-v4-flash',
    createdAt: operationTime,
    createdCards: [{ ...createdCard, id: `${createdCard.id}-${id}` }],
    updatedCards: [{ before: originalCard, after: updatedCard }],
    createdCardSets: [
      {
        ...createdSet,
        id: `${createdSet.id}-${id}`,
        cardIds: [`${createdCard.id}-${id}`],
      },
    ],
    updatedCardSets: [
      {
        before: originalSet,
        after: {
          ...updatedSet,
          cardIds: ['card-existing', `${createdCard.id}-${id}`],
        },
      },
    ],
    duplicateProcessingHistory: [
      {
        id: `merge-${id}`,
        processedAt: operationTime,
        type: 'safeMerge',
        existingCardId: originalCard.id,
        incomingCard: { translations: { en: 'hello', es: 'hola' } },
        matchedBy: { language: 'en', value: 'hello' },
        addedFields: ['translations.es'],
      },
    ],
    pendingDuplicates: [
      {
        id: `pending-${id}`,
        detectedAt: operationTime,
        existingCardId: originalCard.id,
        incomingCard: { translations: { en: 'hello', ru: 'здравствуйте' } },
        matchedBy: { language: 'en', value: 'hello' },
        conflicts: ['translations.ru'],
        status: 'pending',
      },
    ],
    previewCounts: {
      createdCards: 1,
      updatedCards: 1,
      pendingDuplicates: 1,
      createdCardSets: 1,
      renamedCardSets: 1,
      membershipAdditions: 2,
      membershipRemovals: 0,
    },
  };
}

function createCardOnlyOperation(id: string): PlannedAiOperation {
  const operation = createOperation(id);
  return {
    ...operation,
    title: `Create card ${id}`,
    summary: 'Creates one card for membership dependency tests.',
    updatedCards: [],
    createdCardSets: [],
    updatedCardSets: [],
    duplicateProcessingHistory: [],
    pendingDuplicates: [],
    previewCounts: {
      createdCards: 1,
      updatedCards: 0,
      pendingDuplicates: 0,
      createdCardSets: 0,
      renamedCardSets: 0,
      membershipAdditions: 0,
      membershipRemovals: 0,
    },
  };
}

function createTestStore() {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      app: rootReducer(undefined, { type: 'test/init' }).app,
      cards: {
        cards: [originalCard],
        duplicateProcessingHistory: [
          {
            ...createOperation('unrelated').duplicateProcessingHistory[0],
            id: 'merge-unrelated',
          },
        ],
        pendingDuplicates: [
          {
            ...createOperation('unrelated').pendingDuplicates[0],
            id: 'pending-unrelated',
          },
        ],
      },
      cardSets: {
        cardSets: [originalSet],
        selectedCardSetId: ALL_CARDS_CARD_SET_ID,
      },
      attempts: { attempts: [] },
      stats: { cardStats: [] },
      aiAssistant: rootReducer(undefined, { type: 'test/init' }).aiAssistant,
    },
  });
}

function stageAndApply(
  store: ReturnType<typeof createTestStore>,
  operation: PlannedAiOperation,
  timestamp = appliedAt,
) {
  store.dispatch(stageAiOperation(operation));
  store.dispatch(applyAiOperation({ operation, appliedAt: timestamp }));
}

describe('AI assistant store transactions', () => {
  it('applies every operation-owned change atomically with the explicit timestamp', () => {
    const store = createTestStore();
    const operation = createOperation();

    stageAndApply(store, operation);

    const state = store.getState();
    expect(state.cards.cards).toEqual([
      updatedCard,
      { ...createdCard, id: 'card-created-operation-1' },
    ]);
    expect(state.cardSets.cardSets).toEqual([
      {
        ...updatedSet,
        cardIds: ['card-existing', 'card-created-operation-1'],
      },
      {
        ...createdSet,
        id: 'set-created-operation-1',
        cardIds: ['card-created-operation-1'],
      },
    ]);
    expect(state.cards.duplicateProcessingHistory.map(({ id }) => id)).toEqual([
      'merge-unrelated',
      'merge-operation-1',
    ]);
    expect(state.cards.pendingDuplicates.map(({ id }) => id)).toEqual([
      'pending-unrelated',
      'pending-operation-1',
    ]);
    expect(state.aiAssistant.stagedOperation).toBeUndefined();
    expect(state.aiAssistant.operationError).toBeUndefined();
    expect(state.aiAssistant.operations).toEqual([
      { ...operation, appliedAt, status: 'applied' },
    ]);
  });

  it('rolls back exact owned records once and restores all snapshots', () => {
    const store = createTestStore();
    const operation = createOperation();
    stageAndApply(store, operation);

    store.dispatch(revertAiOperation({ operationId: operation.id, revertedAt }));

    const rolledBack = store.getState();
    expect(rolledBack.cards.cards).toEqual([originalCard]);
    expect(rolledBack.cardSets.cardSets).toEqual([originalSet]);
    expect(rolledBack.cards.duplicateProcessingHistory.map(({ id }) => id)).toEqual([
      'merge-unrelated',
    ]);
    expect(rolledBack.cards.pendingDuplicates.map(({ id }) => id)).toEqual([
      'pending-unrelated',
    ]);
    expect(rolledBack.aiAssistant.operations[0]).toEqual({
      ...operation,
      appliedAt,
      status: 'reverted',
      revertedAt,
    });

    const libraryAfterFirstRollback = {
      cards: rolledBack.cards,
      cardSets: rolledBack.cardSets,
    };
    store.dispatch(
      revertAiOperation({
        operationId: operation.id,
        revertedAt: '2026-07-11T14:00:00.000Z',
      }),
    );

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryAfterFirstRollback);
    expect(store.getState().aiAssistant.operations[0].revertedAt).toBe(revertedAt);
    expect(store.getState().aiAssistant.operationError).toBeTruthy();
  });

  it('rejects a stale apply without changing any library slice', () => {
    const store = createTestStore();
    const operation = createOperation();
    store.dispatch(stageAiOperation(operation));
    store.dispatch(
      applyImportResult({
        cards: [{ ...originalCard, translations: { en: 'hi', ru: 'привет' } }],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
        invalidRecords: [],
        resolvedCardIds: [],
        summary: {
          added: 0,
          safeMerged: 0,
          skipped: 0,
          pendingDuplicates: 0,
          invalid: 0,
        },
      }),
    );
    const libraryBeforeApply = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    };

    store.dispatch(applyAiOperation({ operation, appliedAt }));

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryBeforeApply);
    expect(store.getState().aiAssistant.operations).toEqual([]);
    expect(store.getState().aiAssistant.stagedOperation?.id).toBe(operation.id);
    expect(store.getState().aiAssistant.operationError).toBeTruthy();
  });

  it('rejects a collision-free apply when its operation id is already in history', () => {
    const store = createTestStore();
    const firstOperation = createOperation();
    stageAndApply(store, firstOperation);
    const secondOperation: PlannedAiOperation = {
      ...createOperation(firstOperation.id),
      title: 'Add a separate travel collection',
      summary: 'Uses unique entity and duplicate metadata ids.',
      createdCards: [{ ...createdCard, id: 'card-created-second' }],
      updatedCards: [],
      createdCardSets: [
        {
          ...createdSet,
          id: 'set-created-second',
          cardIds: ['card-created-second'],
        },
      ],
      updatedCardSets: [],
      duplicateProcessingHistory: [
        {
          ...createOperation('second').duplicateProcessingHistory[0],
          id: 'merge-second',
        },
      ],
      pendingDuplicates: [
        {
          ...createOperation('second').pendingDuplicates[0],
          id: 'pending-second',
        },
      ],
    };
    store.dispatch(stageAiOperation(secondOperation));
    const beforeSecondApply = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
      operations: store.getState().aiAssistant.operations,
    };

    store.dispatch(
      applyAiOperation({
        operation: secondOperation,
        appliedAt: '2026-07-11T12:30:00.000Z',
      }),
    );

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
      operations: store.getState().aiAssistant.operations,
    }).toEqual(beforeSecondApply);
    expect(store.getState().aiAssistant.operationError).toBe(
      'An AI operation with this id already exists.',
    );
    expect(store.getState().aiAssistant.stagedOperation).toEqual(secondOperation);
  });

  it('rejects rollback after an intervening entity edit', () => {
    const store = createTestStore();
    const operation = createOperation();
    stageAndApply(store, operation);
    store.dispatch(
      applyImportResult({
        cards: store.getState().cards.cards.map((card) =>
          card.id === originalCard.id
            ? { ...card, translations: { ...card.translations, es: 'buenas' } }
            : card,
        ),
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
        invalidRecords: [],
        resolvedCardIds: [],
        summary: {
          added: 0,
          safeMerged: 0,
          skipped: 0,
          pendingDuplicates: 0,
          invalid: 0,
        },
      }),
    );
    const libraryBeforeRollback = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    };

    store.dispatch(revertAiOperation({ operationId: operation.id, revertedAt }));

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryBeforeRollback);
    expect(store.getState().aiAssistant.operations[0].status).toBe('applied');
    expect(store.getState().aiAssistant.operationError).toBeTruthy();
  });

  it('rejects rollback when a later applied operation references its created card', () => {
    const store = createTestStore();
    const operationA = createCardOnlyOperation('operation-a');
    const createdCardId = operationA.createdCards[0].id;
    stageAndApply(store, operationA);

    const operationB: PlannedAiOperation = {
      ...createOperation('operation-b'),
      title: 'Use the created card elsewhere',
      summary: 'Creates an external set that depends on operation A.',
      createdCards: [],
      updatedCards: [],
      createdCardSets: [
        {
          ...createdSet,
          id: 'set-external',
          cardIds: [createdCardId],
        },
      ],
      updatedCardSets: [],
      duplicateProcessingHistory: [],
      pendingDuplicates: [],
    };
    stageAndApply(store, operationB, '2026-07-11T12:30:00.000Z');
    const libraryBeforeRollback = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    };

    store.dispatch(revertAiOperation({ operationId: operationA.id, revertedAt }));

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryBeforeRollback);
    expect(
      store.getState().aiAssistant.operations.find(({ id }) => id === operationA.id)
        ?.status,
    ).toBe('applied');
    expect(store.getState().aiAssistant.operationError).toContain(createdCardId);
  });

  it('rejects a staged membership update after its referenced card is rolled back', () => {
    const store = createTestStore();
    const operationA = createCardOnlyOperation('operation-a');
    const createdCardId = operationA.createdCards[0].id;
    stageAndApply(store, operationA);

    const operationB: PlannedAiOperation = {
      ...createOperation('operation-b'),
      title: 'Stage dependent membership',
      summary: 'Adds the operation A card to an existing set.',
      createdCards: [],
      updatedCards: [],
      createdCardSets: [],
      updatedCardSets: [
        {
          before: originalSet,
          after: {
            ...originalSet,
            cardIds: [...originalSet.cardIds, createdCardId],
            updatedAt: operationTime,
          },
        },
      ],
      duplicateProcessingHistory: [],
      pendingDuplicates: [],
    };
    store.dispatch(stageAiOperation(operationB));
    store.dispatch(revertAiOperation({ operationId: operationA.id, revertedAt }));
    const libraryBeforeApply = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    };

    store.dispatch(applyAiOperation({ operation: operationB, appliedAt }));

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryBeforeApply);
    expect(store.getState().aiAssistant.stagedOperation).toEqual(operationB);
    expect(store.getState().aiAssistant.operationError).toContain(createdCardId);
  });

  it('rejects an operation whose created set references a missing card', () => {
    const store = createTestStore();
    const operation: PlannedAiOperation = {
      ...createOperation('missing-membership'),
      createdCards: [],
      updatedCards: [],
      createdCardSets: [
        {
          ...createdSet,
          id: 'set-with-missing-card',
          cardIds: ['card-missing'],
        },
      ],
      updatedCardSets: [],
      duplicateProcessingHistory: [],
      pendingDuplicates: [],
    };
    store.dispatch(stageAiOperation(operation));
    const libraryBeforeApply = {
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    };

    store.dispatch(applyAiOperation({ operation, appliedAt }));

    expect({
      cards: store.getState().cards,
      cardSets: store.getState().cardSets,
    }).toEqual(libraryBeforeApply);
    expect(store.getState().aiAssistant.operations).toEqual([]);
    expect(store.getState().aiAssistant.operationError).toContain('card-missing');
  });

  it('falls back to all cards when rollback removes the selected created set', () => {
    const store = createTestStore();
    const operation = createOperation();
    stageAndApply(store, operation);
    store.dispatch(selectCardSet('set-created-operation-1'));

    store.dispatch(revertAiOperation({ operationId: operation.id, revertedAt }));

    expect(store.getState().cardSets.selectedCardSetId).toBe(
      ALL_CARDS_CARD_SET_ID,
    );
  });

  it('retains only 100 chat messages while leaving operation history uncapped', () => {
    const store = createTestStore();

    for (let index = 0; index < 105; index += 1) {
      store.dispatch(
        appendAiMessage({
          id: `message-${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${index}`,
          createdAt: operationTime,
        }),
      );
      const operation = {
        ...createOperation(`history-${index}`),
        createdCards: [],
        updatedCards: [],
        createdCardSets: [],
        updatedCardSets: [],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      };
      stageAndApply(store, operation, `${appliedAt}-${index}`);
    }

    expect(store.getState().aiAssistant.messages).toHaveLength(100);
    expect(store.getState().aiAssistant.messages[0].id).toBe('message-5');
    expect(store.getState().aiAssistant.messages[99].id).toBe('message-104');
    expect(store.getState().aiAssistant.operations).toHaveLength(105);
  });
});
