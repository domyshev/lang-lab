import { combineReducers, configureStore } from '@reduxjs/toolkit';
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

const rootReducer = combineReducers({
  app: appReducer,
  cards: cardsReducer,
  cardSets: cardSetsReducer,
  attempts: attemptsReducer,
  stats: statsReducer,
});

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
