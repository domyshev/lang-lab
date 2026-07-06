import { configureStore } from '@reduxjs/toolkit';
import { fireEvent } from '@testing-library/react';
import { render, screen, within } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import type { ExerciseAttempt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { themesReducer } from '../../store/themesSlice';
import { ThemeDetailView } from '../ThemeDetailView';

const now = '2026-07-04T00:00:00.000Z';

describe('ThemeDetailView', () => {
  it('sorts cards by total target attempts and shows compact kind chips with recent stats tooltips', async () => {
    const { container } = render(
      <Provider store={createStore()}>
        <ThemeDetailView />
      </Provider>,
    );

    const items = getByDataTestPrefix(container, 'theme_detail__card_item__');
    expect(within(items[0]).getByText('impede')).toBeInTheDocument();
    expect(within(items[1]).getByText('worth it')).toBeInTheDocument();
    expect(within(items[2]).getByText('airport')).toBeInTheDocument();

    const phraseChip = within(items[1]).getByTestId(
      'theme_detail__card_kind_chip__card-worth-it',
    );
    expect(phraseChip.parentElement).toHaveStyle({ alignItems: 'center' });
    expect(phraseChip).toHaveStyle({ height: '30px' });
    expect(screen.getByTestId('theme_detail__cards_list__all-words')).toHaveStyle({
      overflowY: 'auto',
    });

    const statsChip = within(items[0]).getByTestId(
      'theme_detail__card_stats__card-impede__root',
    );

    fireEvent.mouseOver(statsChip, { clientX: 220, clientY: 120 });

    const tooltip = await screen.findByTestId(
      'theme_detail__card_stats__card-impede__recent_tooltip',
    );

    expect(within(tooltip).getByText('20 последних ответов')).toBeInTheDocument();
    expect(
      within(tooltip).getByTestId(
        'theme_detail__card_stats__card-impede__recent_tooltip_subject',
      ),
    ).toHaveTextContent('impede');
    expect(
      tooltip.querySelectorAll(
        '[data-test^="theme_detail__card_stats__card-impede__recent_result__"]',
      ),
    ).toHaveLength(20);
    expect(
      screen.getByTestId('theme_detail__card_stats__card-impede__tooltip_arrow'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'theme_detail__card_stats__card-impede__recent_results',
      ),
    ).toHaveStyle({ overflowY: 'auto' });

    fireEvent.mouseLeave(statsChip);
    fireEvent.mouseOver(
      within(items[1]).getByTestId('theme_detail__card_stats__card-worth-it__root'),
      { clientX: 240, clientY: 120 },
    );

    expect(
      await screen.findByTestId(
        'theme_detail__card_stats__card-worth-it__recent_tooltip',
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByTestId(
          'theme_detail__card_stats__card-impede__recent_tooltip',
        ),
      ).not.toBeInTheDocument(),
    );
  });
});

function getByDataTestPrefix(container: HTMLElement, prefix: string): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(`[data-test^="${prefix}"]`),
  );
}

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
      attempts: {
        attempts: createCardAttempts('card-impede', 21),
      },
    },
  });
}

function createCardAttempts(cardId: string, count: number): ExerciseAttempt[] {
  return Array.from({ length: count }, (_, index) => {
    const isCorrect = index % 2 === 0;
    const day = String(index + 1).padStart(2, '0');

    return {
      id: `attempt-${index + 1}`,
      exerciseSessionId: `session-${index + 1}`,
      exerciseType: 'missingLetters',
      themeId: 'all-words',
      targetLanguage: 'en',
      createdAt: `2026-07-${day}T10:00:00.000Z`,
      completedAt: `2026-07-${day}T10:00:00.000Z`,
      cardSnapshots: [],
      prompts: [
        {
          cardId,
          expectedAnswer: 'impede',
          prompt: 'ru: затруднять',
          translationHints: [{ language: 'ru', value: 'затруднять' }],
        },
      ],
      answers: {
        [cardId]: isCorrect ? 'impede' : 'impide',
      },
      correctness: {
        [cardId]: isCorrect,
      },
      hintsUsed: {
        [cardId]: 0,
      },
    };
  });
}
