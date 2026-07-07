import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { appReducer } from './appSlice';
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

const persistConfig = {
  key: 'language-crossword-lab:v1',
  version: 1,
  storage,
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
