import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { HistoryView } from '../HistoryView';
import type { ExerciseAttempt, MultipleChoicePrompt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { themesReducer } from '../../store/themesSlice';

describe('HistoryView', () => {
  it('renders formula chips without a visible total label and shows word answers as cells', async () => {
    const user = userEvent.setup();
    renderHistoryView();

    const attemptCards = screen.getAllByTestId('history-attempt-card');
    const missingLettersCard = attemptCards.find((card) =>
      card.textContent?.includes('Пропущенные буквы'),
    );

    expect(missingLettersCard).toBeDefined();
    expect(
      within(missingLettersCard!).queryByText('Всего отвечено вопросов:'),
    ).not.toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText(
        'Всего отвечено вопросов: 2 = 1 + 1',
      ),
    ).toBeInTheDocument();

    await user.click(
      within(missingLettersCard!).getByRole('button', {
        name: /Пропущенные буквы/,
      }),
    );

    expect(within(missingLettersCard!).queryByText('Ваш ответ:')).not.toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText('Правильный ответ: airport'),
    ).toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText('Правильный ответ: vehicle'),
    ).toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText('Неверный ответ: vehocle'),
    ).toBeInTheDocument();
  });

  it('renders multiple choice history as colored answer options', async () => {
    const user = userEvent.setup();
    renderHistoryView();

    const attemptCards = screen.getAllByTestId('history-attempt-card');
    const multipleChoiceCard = attemptCards.find((card) =>
      card.textContent?.includes('Вопрос с 3 вариантами'),
    );

    expect(multipleChoiceCard).toBeDefined();
    await user.click(
      within(multipleChoiceCard!).getByRole('button', {
        name: /Вопрос с 3 вариантами/,
      }),
    );

    const options = within(multipleChoiceCard!).getAllByTestId(
      'history-multiple-choice-option',
    );
    expect(options).toHaveLength(3);
    expect(within(options[0]).getByText('airport')).toBeInTheDocument();
    expect(options[0]).toHaveStyle({
      backgroundColor: 'rgb(253, 235, 238)',
    });
    expect(within(options[1]).getByText('vehicle')).toBeInTheDocument();
    expect(options[1]).toHaveStyle({
      backgroundColor: 'rgb(235, 247, 225)',
    });
  });
});

function renderHistoryView() {
  const now = '2026-07-05T10:00:00.000Z';
  const multipleChoicePrompt: MultipleChoicePrompt = {
    cardId: 'card-vehicle',
    prompt: 'ru: транспорт',
    expectedAnswer: 'vehicle',
    options: ['airport', 'vehicle', 'impede'],
    translationHints: [{ language: 'ru', value: 'транспорт' }],
  };
  const attempts: ExerciseAttempt[] = [
    {
      id: 'attempt-missing-1',
      exerciseSessionId: 'session-missing',
      exerciseType: 'missingLetters',
      themeId: 'all-words',
      targetLanguage: 'en',
      createdAt: now,
      completedAt: now,
      cardSnapshots: [],
      prompts: [
        {
          cardId: 'card-airport',
          prompt: 'ru: аэропорт',
          expectedAnswer: 'airport',
          translationHints: [{ language: 'ru', value: 'аэропорт' }],
        },
        {
          cardId: 'card-vehicle',
          prompt: 'ru: транспорт',
          expectedAnswer: 'vehicle',
          translationHints: [{ language: 'ru', value: 'транспорт' }],
        },
      ],
      answers: {
        'card-airport': 'airport',
        'card-vehicle': 'vehocle',
      },
      correctness: {
        'card-airport': true,
        'card-vehicle': false,
      },
      hintsUsed: { 'card-airport': 0, 'card-vehicle': 0 },
    },
    {
      id: 'attempt-choice-1',
      exerciseSessionId: 'session-choice',
      exerciseType: 'multipleChoice',
      themeId: 'all-words',
      targetLanguage: 'en',
      createdAt: '2026-07-05T11:00:00.000Z',
      completedAt: '2026-07-05T11:00:00.000Z',
      cardSnapshots: [],
      prompts: [multipleChoicePrompt],
      answers: { 'card-vehicle': 'airport' },
      correctness: { 'card-vehicle': false },
      hintsUsed: { 'card-vehicle': 0 },
    },
  ];
  const store = configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      themes: themesReducer,
    },
    preloadedState: {
      attempts: {
        attempts,
      },
    },
  });

  render(
    <Provider store={store}>
      <HistoryView />
    </Provider>,
  );

  return store;
}
