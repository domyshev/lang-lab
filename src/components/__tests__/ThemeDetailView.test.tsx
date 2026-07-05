import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { themesReducer } from '../../store/themesSlice';
import { ThemeDetailView } from '../ThemeDetailView';

const now = '2026-07-04T00:00:00.000Z';

describe('ThemeDetailView', () => {
  it('sorts cards by total target attempts and centers the kind chip', () => {
    render(
      <Provider store={createStore()}>
        <ThemeDetailView />
      </Provider>,
    );

    const items = screen.getAllByTestId('theme-card-item');
    expect(within(items[0]).getByText('impede')).toBeInTheDocument();
    expect(within(items[1]).getByText('worth it')).toBeInTheDocument();
    expect(within(items[2]).getByText('airport')).toBeInTheDocument();

    const phraseChip = within(items[1]).getByTestId('card-kind-chip');
    expect(phraseChip.parentElement).toHaveStyle({ alignItems: 'center' });
  });
});

function createStore() {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      themes: themesReducer,
    },
    preloadedState: {
      cards: {
        cards: [
          {
            id: 'card-airport',
            translations: { en: 'airport', ru: 'аэропорт' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-worth-it',
            translations: { en: 'worth it', ru: 'оно того стоит' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-impede',
            translations: { en: 'impede', ru: 'затруднять' },
            createdAt: now,
            updatedAt: now,
          },
        ],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      stats: {
        cardStats: [
          {
            cardId: 'card-worth-it',
            targetLanguage: 'en' as const,
            attempts: 2,
            correct: 1,
            incorrect: 1,
            hintsUsed: 0,
            accuracy: 0.5,
            recentMistakes: 1,
            lastPracticedAt: now,
            stability: 'unstable' as const,
          },
          {
            cardId: 'card-impede',
            targetLanguage: 'en' as const,
            attempts: 6,
            correct: 2,
            incorrect: 4,
            hintsUsed: 0,
            accuracy: 0.33,
            recentMistakes: 2,
            lastPracticedAt: now,
            stability: 'weak' as const,
          },
        ],
      },
    },
  });
}
