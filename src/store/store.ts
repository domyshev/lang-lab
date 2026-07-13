import {
  AnyAction,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  createTransform,
  persistReducer,
  persistStore,
} from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { AppState, appReducer } from './appSlice';
import { attemptsReducer } from './attemptsSlice';
import { cardsReducer } from './cardsSlice';
import { statsReducer } from './statsSlice';
import { cardSetsReducer } from './cardSetsSlice';
import { findAiRollbackConflict } from '../domain/aiOperations';
import {
  applyAiOperation,
  commitAiRollback,
  rejectAiOperation,
  revertAiOperation,
} from './aiAssistantActions';
import { aiAssistantReducer } from './aiAssistantSlice';

const combinedReducer = combineReducers({
  app: appReducer,
  cards: cardsReducer,
  cardSets: cardSetsReducer,
  attempts: attemptsReducer,
  stats: statsReducer,
  aiAssistant: aiAssistantReducer,
});

type CombinedState = ReturnType<typeof combinedReducer>;

export function rootReducer(
  state: CombinedState | undefined,
  action: AnyAction,
): CombinedState {
  if (!state) {
    return combinedReducer(undefined, action);
  }

  if (applyAiOperation.match(action)) {
    const error = findApplyError(state, action.payload.operation);
    return error
      ? combinedReducer(state, rejectAiOperation(error))
      : combinedReducer(state, action);
  }

  if (revertAiOperation.match(action)) {
    const operationIndex = state.aiAssistant.operations.findIndex(
      ({ id }) => id === action.payload.operationId,
    );
    const operation = state.aiAssistant.operations[operationIndex];
    if (!operation) {
      return combinedReducer(
        state,
        rejectAiOperation('The requested AI operation was not found.'),
      );
    }
    if (operation.status === 'reverted') {
      return combinedReducer(
        state,
        rejectAiOperation('This AI operation has already been reverted.'),
      );
    }

    const conflict = findAiRollbackConflict({
      operation,
      cards: state.cards.cards,
      cardSets: state.cardSets.cardSets,
      laterOperations: state.aiAssistant.operations
        .slice(0, operationIndex)
        .filter(({ status }) => status === 'applied'),
    });
    if (conflict) {
      const laterOperation = conflict.laterOperation
        ? ` A later operation (${conflict.laterOperation.title}) also changed it.`
        : '';
      return combinedReducer(
        state,
        rejectAiOperation(
          `Cannot revert because ${conflict.entityType} ${conflict.entityId} has changed.${laterOperation}`,
        ),
      );
    }

    return combinedReducer(
      state,
      commitAiRollback({
        operation,
        revertedAt: action.payload.revertedAt,
      }),
    );
  }

  return combinedReducer(state, action);
}

function findApplyError(
  state: CombinedState,
  operation: Parameters<typeof applyAiOperation>[0]['operation'],
): string | undefined {
  if (state.aiAssistant.stagedOperation?.id !== operation.id) {
    return 'The staged AI operation is no longer current.';
  }
  if (state.aiAssistant.operations.some(({ id }) => id === operation.id)) {
    return 'An AI operation with this id already exists.';
  }

  const cardsById = new Map(state.cards.cards.map((card) => [card.id, card]));
  const setsById = new Map(
    state.cardSets.cardSets.map((cardSet) => [cardSet.id, cardSet]),
  );
  if (
    operation.createdCards.some(({ id }) => cardsById.has(id)) ||
    operation.createdCardSets.some(({ id }) => setsById.has(id)) ||
    operation.updatedCards.some(
      ({ before }) => !entitiesEqual(cardsById.get(before.id), before),
    ) ||
    operation.updatedCardSets.some(
      ({ before }) => !entitiesEqual(setsById.get(before.id), before),
    )
  ) {
    return 'The library changed after this AI operation was staged.';
  }

  const availableCardIds = new Set([
    ...cardsById.keys(),
    ...operation.createdCards.map(({ id }) => id),
  ]);
  const missingMembershipCardIds = [
    ...new Set(
      [
        ...operation.createdCardSets,
        ...operation.updatedCardSets.map(({ after }) => after),
      ].flatMap((cardSet) =>
        cardSet.cardIds.filter((cardId) => !availableCardIds.has(cardId)),
      ),
    ),
  ];
  if (missingMembershipCardIds.length > 0) {
    return `The AI operation references missing cards: ${missingMembershipCardIds.join(', ')}.`;
  }

  const mergeIds = new Set(
    state.cards.duplicateProcessingHistory.map(({ id }) => id),
  );
  const pendingIds = new Set(state.cards.pendingDuplicates.map(({ id }) => id));
  if (
    operation.duplicateProcessingHistory.some(({ id }) => mergeIds.has(id)) ||
    operation.pendingDuplicates.some(({ id }) => pendingIds.has(id))
  ) {
    return 'The AI operation record ids are no longer available.';
  }

  return undefined;
}

function entitiesEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function stripSessionOnlyAppStateForPersist(appState: AppState): AppState {
  return {
    ...appState,
    hasAgentsIntroCoachmarkBeenShown: false,
  };
}

export function stripSessionOnlyPersistedState(state: RootState): RootState {
  return {
    ...state,
    app: stripSessionOnlyAppStateForPersist(state.app),
  };
}

const sessionOnlyAppStateTransform = createTransform<AppState, AppState, RootState>(
  (inboundState) => stripSessionOnlyAppStateForPersist(inboundState),
  (outboundState) => stripSessionOnlyAppStateForPersist(outboundState),
  { whitelist: ['app'] },
);

const persistConfig: PersistConfig<RootState> = {
  key: 'language-crossword-lab:v1',
  version: 1,
  storage,
  transforms: [sessionOnlyAppStateTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
