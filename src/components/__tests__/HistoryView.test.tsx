import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { HistoryView } from '../HistoryView';
import type { ExerciseAttempt, MultipleChoicePrompt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';

describe('HistoryView', () => {
  it('shows a localized empty statistics message before any games are played', () => {
    renderHistoryView([]);

    expect(screen.getByTestId('history_view__empty_text')).toHaveTextContent(
      'вы еще не играли, поэтому статистика пустая',
    );
  });

  it('renders formula chips without a visible total label and shows word answers as cells', async () => {
    const user = userEvent.setup();
    const { container } = renderHistoryView();

    const attemptCards = getByDataTestPrefix(
      container,
      'history_view__attempt_card__',
    );
    const missingLettersCard = attemptCards.find((card) =>
      card.textContent?.includes('Пропущенные буквы'),
    );

    expect(missingLettersCard).toBeDefined();
    expect(
      within(missingLettersCard!).queryByText('Всего отвечено вопросов:'),
    ).not.toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText(
        'Всего отвечено вопросов: 2 = Верно 1 + Неверно 1',
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
    const correctAirportRow = screen.getByTestId(
      'history_view__detail_row__attempt-missing-1_card-airport',
    );
    expect(within(correctAirportRow).queryByText('Верно')).not.toBeInTheDocument();
    expect(
      within(
        within(missingLettersCard!).getByLabelText('Правильный ответ: airport'),
      ).getByText('a'),
    ).toHaveStyle({ color: 'rgb(32, 48, 21)' });
    await user.hover(
      within(missingLettersCard!).getByLabelText('Правильный ответ: airport'),
    );
    const airportTooltip = await screen.findByTestId(
      'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
    );
    expect(within(airportTooltip).getByText('10 последних ответов')).toBeInTheDocument();
    expect(
      within(airportTooltip).getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip_subject',
      ),
    ).toHaveTextContent('airport');
    expect(
      within(airportTooltip).getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__recent_result_chip__0',
      ),
    ).toHaveTextContent('правильно');
    expect(
      within(airportTooltip).getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__recent_result_date__0',
      ),
    ).toHaveTextContent(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(within(airportTooltip).queryByText(/^1\./)).not.toBeInTheDocument();
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips[tooltips.length - 1].closest('[data-popper-placement]')).toHaveAttribute(
      'data-popper-placement',
      expect.stringMatching(/^top/),
    );
    expect(
      screen.getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__tooltip_arrow',
      ),
    ).toBeInTheDocument();
    await user.unhover(
      within(missingLettersCard!).getByLabelText('Правильный ответ: airport'),
    );
    expect(
      within(missingLettersCard!).getByLabelText('Правильный ответ: vehicle'),
    ).toBeInTheDocument();
    expect(
      within(missingLettersCard!).getByLabelText('Неверный ответ: vehocle'),
    ).toBeInTheDocument();
    const vehicleRow = screen.getByTestId(
      'history_view__detail_row__attempt-missing-1_card-vehicle',
    );
    const incorrectVehicleCells = within(vehicleRow).getByTestId(
      'history_view__detail_answer__attempt-missing-1_card-vehicle__incorrect_cells__root',
    );
    const correctVehicleCells = within(vehicleRow).getByTestId(
      'history_view__detail_answer__attempt-missing-1_card-vehicle__correct_cells__root',
    );
    expect(
      incorrectVehicleCells.compareDocumentPosition(correctVehicleCells) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(vehicleRow).queryByTestId(
        'history_view__detail_result_chip__attempt-missing-1_card-vehicle',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(vehicleRow).getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-vehicle__incorrect_cells__cell__3',
      ),
    ).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    await user.hover(incorrectVehicleCells);
    const vehicleTooltip = await screen.findByTestId(
      'history_view__detail_answer__attempt-missing-1_card-vehicle__recent_tooltip',
    );
    expect(within(vehicleTooltip).getByText('10 последних ответов')).toBeInTheDocument();
    expect(
      within(vehicleTooltip).getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-vehicle__recent_result_chip__0',
      ),
    ).toHaveTextContent('неверно');
    await user.unhover(incorrectVehicleCells);
    await user.hover(correctVehicleCells);
    expect(
      await screen.findByTestId(
        'history_view__detail_answer__attempt-missing-1_card-vehicle__recent_tooltip',
      ),
    ).toBeInTheDocument();
  });

  it('renders multiple choice history as colored answer options', async () => {
    const user = userEvent.setup();
    const { container } = renderHistoryView();

    const attemptCards = getByDataTestPrefix(
      container,
      'history_view__attempt_card__',
    );
    const multipleChoiceCard = attemptCards.find((card) =>
      card.textContent?.includes('Вопрос с 3 вариантами'),
    );

    expect(multipleChoiceCard).toBeDefined();
    await user.click(
      within(multipleChoiceCard!).getByRole('button', {
        name: /Вопрос с 3 вариантами/,
      }),
    );

    const options = getByDataTestPrefix(
      multipleChoiceCard!,
      'history_view__detail_answer__attempt-choice-1_card-vehicle__multiple_choice_option__',
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
    expect(
      within(multipleChoiceCard!).queryByTestId(
        'history_view__detail_result_chip__attempt-choice-1_card-vehicle',
      ),
    ).not.toBeInTheDocument();
  });

  it('uses a full letter-cell width for phrase spaces in statistics details', async () => {
    const user = userEvent.setup();
    const phraseAttempt: ExerciseAttempt = {
      id: 'attempt-word-1',
      exerciseSessionId: 'session-word',
      exerciseType: 'missingWord',
      cardSetId: 'all-cards',
      targetLanguage: 'en',
      createdAt: '2026-07-05T12:00:00.000Z',
      completedAt: '2026-07-05T12:00:00.000Z',
      cardSnapshots: [],
      prompts: [
        {
          cardId: 'card-worth-it',
          prompt: 'ru: оно того стоит',
          expectedAnswer: 'worth it',
          translationHints: [{ language: 'ru', value: 'оно того стоит' }],
        },
      ],
      answers: { 'card-worth-it': 'worth it' },
      correctness: { 'card-worth-it': true },
      hintsUsed: { 'card-worth-it': 0 },
    };

    const { container } = renderHistoryView([phraseAttempt]);
    const attemptCards = getByDataTestPrefix(
      container,
      'history_view__attempt_card__',
    );
    const missingWordCard = attemptCards.find((card) =>
      card.textContent?.includes('Пропущенное слово'),
    );

    expect(missingWordCard).toBeDefined();
    await user.click(
      within(missingWordCard!).getByRole('button', {
        name: /Пропущенное слово/,
      }),
    );

    expect(
      screen.getByTestId(
        'history_view__detail_answer__attempt-word-1_card-worth-it__correct_cells__space__5',
      ),
    ).toHaveStyle({ width: '34px' });
  });

  it('marks completed games with a trophy tooltip', async () => {
    const user = userEvent.setup();
    const { container } = renderHistoryView();

    const attemptCards = getByDataTestPrefix(
      container,
      'history_view__attempt_card__',
    );
    const completedCard = attemptCards.find((card) =>
      card.textContent?.includes('Пропущенные буквы'),
    );

    expect(completedCard).toBeDefined();
    const trophy = within(completedCard!).getByTestId(
      'history_view__completed_trophy__session-missing',
    );
    expect(trophy).toBeInTheDocument();

    await user.hover(trophy);

    expect(
      await screen.findByText(/Игра пройдена 07\/05\/2026 \d{2}:00/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'history_view__completed_trophy__session-missing__tooltip_arrow',
      ),
    ).toBeInTheDocument();
  });

  it('keeps the recent answers tooltip fixed and interactive after opening at the cursor', async () => {
    renderHistoryView();

    const missingLettersCard = getByDataTestPrefix(
      document.body,
      'history_view__attempt_card__',
    ).find((card) => card.textContent?.includes('Пропущенные буквы'));

    expect(missingLettersCard).toBeDefined();
    fireEvent.click(
      within(missingLettersCard!).getByRole('button', {
        name: /Пропущенные буквы/,
      }),
    );

    const tooltipAnchor = screen.getByTestId(
      'history_view__detail_answer__attempt-missing-1_card-airport__tooltip_anchor',
    );

    fireEvent.mouseOver(tooltipAnchor, { clientX: 240, clientY: 180 });

    expect(
      await screen.findByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
      ),
    ).toBeInTheDocument();
    expect(tooltipAnchor).toHaveAttribute('data-anchor-x', '240');
    expect(tooltipAnchor).toHaveAttribute('data-anchor-y', '180');

    fireEvent.mouseMove(tooltipAnchor, { clientX: 320, clientY: 260 });

    expect(tooltipAnchor).toHaveAttribute('data-anchor-x', '240');
    expect(tooltipAnchor).toHaveAttribute('data-anchor-y', '180');

    fireEvent.mouseLeave(tooltipAnchor);
    fireEvent.mouseOver(screen.getByRole('tooltip'));

    expect(
      screen.getByTestId(
        'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
      ),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('tooltip'));

    await waitFor(() =>
      expect(
        screen.queryByTestId(
          'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
        ),
      ).not.toBeInTheDocument(),
    );
  });
});

function renderHistoryView(customAttempts?: ExerciseAttempt[]) {
  const now = '2026-07-05T10:00:00.000Z';
  const multipleChoicePrompt: MultipleChoicePrompt = {
    cardId: 'card-vehicle',
    prompt: 'ru: транспорт',
    expectedAnswer: 'vehicle',
    options: ['airport', 'vehicle', 'impede'],
    translationHints: [{ language: 'ru', value: 'транспорт' }],
  };
  const attempts: ExerciseAttempt[] = customAttempts ?? [
    {
      id: 'attempt-missing-1',
      exerciseSessionId: 'session-missing',
      exerciseType: 'missingLetters',
      cardSetId: 'all-cards',
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
      id: 'attempt-missing-completed',
      exerciseSessionId: 'session-missing',
      exerciseType: 'missingLetters',
      cardSetId: 'all-cards',
      targetLanguage: 'en',
      createdAt: now,
      completedAt: now,
      cardSnapshots: [],
      prompts: [],
      answers: {},
      correctness: {},
      hintsUsed: {},
      isExerciseCompleted: true,
    } as ExerciseAttempt & { isExerciseCompleted: true },
    {
      id: 'attempt-choice-1',
      exerciseSessionId: 'session-choice',
      exerciseType: 'multipleChoice',
      cardSetId: 'all-cards',
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
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      attempts: {
        attempts,
      },
    },
  });

  const result = render(
    <Provider store={store}>
      <HistoryView />
    </Provider>,
  );

  return { store, ...result };
}

function getByDataTestPrefix(container: HTMLElement, prefix: string): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(`[data-test^="${prefix}"]`),
  );
}
