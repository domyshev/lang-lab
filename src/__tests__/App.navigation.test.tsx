import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import type { ExerciseAttempt } from '../domain/exercises';
import { appReducer } from '../store/appSlice';
import { attemptsReducer } from '../store/attemptsSlice';
import { cardsReducer } from '../store/cardsSlice';
import { statsReducer } from '../store/statsSlice';
import { themesReducer } from '../store/themesSlice';

const now = '2026-07-03T12:00:00.000Z';

function renderApp({
  app = {},
  attempts = [],
}: {
  app?: Partial<ReturnType<typeof appReducer>>;
  attempts?: ExerciseAttempt[];
} = {}) {
  const appState = {
    ...appReducer(undefined, { type: 'test/init' }),
    ...app,
  };

  const store = configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      themes: themesReducer,
    },
    preloadedState: {
      app: appState,
      cards: {
        cards: [
          {
            id: 'card-worth-it',
            translations: {
              en: 'worth it',
              ru: 'оно того стоит',
              es: 'vale la pena',
            },
            examples: {
              en: [{ sentence: 'It is worth it today.', answer: 'worth it' }],
            },
            difficulty: 'easy' as const,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-look-forward',
            translations: {
              en: 'look forward',
              ru: 'с нетерпением ждать',
              es: 'esperar con ganas',
            },
            examples: {
              en: [
                {
                  sentence: 'I look forward to tomorrow.',
                  answer: 'look forward',
                },
              ],
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-airport',
            translations: {
              en: 'airport',
              ru: 'аэропорт',
              es: 'aeropuerto',
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-vehicle',
            translations: {
              en: 'vehicle',
              ru: 'транспортное средство',
              es: 'vehiculo',
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-impede',
            translations: {
              en: 'impede',
              ru: 'препятствовать',
              es: 'impedir',
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-meditation',
            translations: {
              en: 'meditation',
              ru: 'медитация',
              es: 'meditacion',
            },
            createdAt: now,
            updatedAt: now,
          },
        ],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      attempts: {
        attempts,
      },
    },
  });

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  return store;
}

describe('App navigation', () => {
  it('loads bundled vocabulary cards into an empty browser store', async () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
        attempts: attemptsReducer,
        cards: cardsReducer,
        stats: statsReducer,
        themes: themesReducer,
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(138);
    });

    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
  });

  it('starts in Russian and shows a simple game setup tab before starting', () => {
    renderApp();

    expect(screen.getByRole('tab', { name: 'Игра' })).toBeInTheDocument();
    expect(screen.getByText('Language Lab')).toBeInTheDocument();
    expect(screen.queryByText('Language Crossword Lab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Карточки' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Статистика' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Агенты LLM' })).toBeInTheDocument();
    const setupPanel = screen.getByTestId('game_setup__panel');
    expect(
      within(setupPanel).getByRole('heading', { name: 'Выберите тему' }),
    ).toBeInTheDocument();
    expect(
      within(setupPanel).getByRole('heading', { name: 'Выберите игру' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('game_setup__theme_label')).not.toBeInTheDocument();
    expect(screen.getByTestId('game_setup__theme_select')).not.toHaveTextContent(
      'Все слова',
    );
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Начать' })).not.toBeInTheDocument();
    expect(screen.queryByText('worth it')).not.toBeInTheDocument();
  });

  it('starts an exercise only after a theme is selected and shows the theme chip', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();

    await selectAllWordsTheme(user);
    await user.click(screen.getByRole('button', { name: 'Играть' }));

    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();
    expect(getByDataTestPrefix('missing_letters_exercise__theme_chip__')[0]).toHaveTextContent(
      'Все слова',
    );
  });

  it('describes agent features and keeps import controls on the agents tab', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Агенты LLM' }));

    expect(screen.queryByRole('tab', { name: 'Импорт' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Агенты LLM' })).toBeInTheDocument();
    expect(screen.getByTestId('agents_view__open_router_intro')).toHaveTextContent(
      'Пользователь может добавить свой ключ Open Router, чтобы запускать агентские функции через свои лимиты.',
    );
    expect(screen.getByRole('link', { name: 'Open Router' })).toHaveAttribute(
      'href',
      'https://openrouter.ai/',
    );
    expect(screen.getByText(/триальный ключ Open Router/i)).toBeInTheDocument();
    expect(screen.getByText(/анализировать статистику/i)).toBeInTheDocument();
    expect(screen.getByText(/создавать и добавлять словарный запас/i)).toBeInTheDocument();
    expect(
      screen.getByText(/агент не испортит ваши наработки/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ручной импорт карточек' })).toBeInTheDocument();
    expect(screen.queryByText('Вставить JSON')).not.toBeInTheDocument();
  });

  it('collapses game help after the player acknowledges it and points back to the accordion', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    expect(screen.getByRole('button', { name: /Помощь/ })).toBeInTheDocument();
    expect(
      screen.getByText(/лаборатория изучения языков/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/вы игрок, создающий свою игру/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/не снимайте с себя эту ответственность/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Понятно!' }));

    expect(screen.getByRole('button', { name: /Помощь/ })).toBeInTheDocument();
    expect(screen.queryByText(/лаборатория изучения языков/i)).not.toBeInTheDocument();
    expect(store.getState().app.isGameHelpCollapsed).toBe(true);
    expect(store.getState().app.hasGameHelpCoachmarkBeenShown).toBe(true);
    expect(screen.getByTestId('game_help__coachmark_icon')).toBeInTheDocument();
    expect(
      screen.getByTestId('game_help__coachmark_item__return'),
    ).toHaveTextContent(/всегда можно вернуться/i);
    expect(
      screen.getByTestId('game_help__coachmark_item__smart'),
    ).toHaveTextContent(/помощь умная/i);
    expect(
      screen.queryByTestId('game_help__coachmark_body'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Хорошо' }));
    expect(screen.queryByText(/всегда можно вернуться/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Помощь/ }));
    expect(
      screen.getByText(/лаборатория изучения языков/i),
    ).toBeInTheDocument();
  });

  it('keeps game help collapsed when the collapsed flag is already stored', async () => {
    const user = userEvent.setup();
    renderApp({ app: { isGameHelpCollapsed: true } });

    expect(screen.getByRole('button', { name: /Помощь/ })).toBeInTheDocument();
    expect(screen.queryByText(/лаборатория изучения языков/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Помощь/ }));
    expect(
      screen.getByText(/лаборатория изучения языков/i),
    ).toBeInTheDocument();
  });

  it('does not show the help coachmark again after it was already shown once', async () => {
    const user = userEvent.setup();
    const store = renderApp({
      app: {
        hasGameHelpCoachmarkBeenShown: true,
        isGameHelpCollapsed: false,
      } as Partial<ReturnType<typeof appReducer>>,
    });

    await user.click(screen.getByRole('button', { name: 'Понятно!' }));

    expect(store.getState().app.isGameHelpCollapsed).toBe(true);
    expect(store.getState().app.hasGameHelpCoachmarkBeenShown).toBe(true);
    expect(screen.queryByTestId('game_help__coachmark_icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/помощь остается здесь/i)).not.toBeInTheDocument();
  });

  it('shows All words as a fixed cards topic without an archive action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    const allWordsTopic = screen.getByRole('button', { name: /Все слова/ });
    expect(allWordsTopic).toBeInTheDocument();
    expect(allWordsTopic).toHaveTextContent('6');
    expect(
      screen.queryByRole('button', { name: 'В архив: Все слова' }),
    ).not.toBeInTheDocument();

    await user.click(allWordsTopic);
    expect(screen.getByText('1 тема')).toBeInTheDocument();
    expect(screen.getAllByText('6 карточек').length).toBeGreaterThan(0);
    expect(screen.getByText('Целевой ответ: 🇬🇧 Английский')).toBeInTheDocument();
    expect(screen.queryByText('1 topics')).not.toBeInTheDocument();
    expect(screen.queryByText('5 cards')).not.toBeInTheDocument();
    expect(screen.queryByText('Target answer: 🇬🇧 English')).not.toBeInTheDocument();
    expect(screen.getByText('worth it')).toBeInTheDocument();
    expect(screen.getByText('look forward')).toBeInTheDocument();
    expect(screen.getByText('airport')).toBeInTheDocument();
    expect(screen.getByText('vehicle')).toBeInTheDocument();
    expect(screen.getByText('impede')).toBeInTheDocument();
    expect(screen.getByText('meditation')).toBeInTheDocument();
    expect(screen.queryByText('easy')).not.toBeInTheDocument();
    expect(screen.getAllByText('Фраза').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Слово').length).toBeGreaterThan(0);
    expect(getByDataTestPrefix('theme_detail__card_item__')).toHaveLength(6);
    expect(
      screen.getAllByLabelText('Статистика по слову: Верно 0, Неверно 0').length,
    ).toBeGreaterThan(0);
  });

  it('keeps missing letters on the answered word and shows the correct answer result', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();
    expect(screen.getByLabelText('Мысль персонажа')).toBeInTheDocument();
    const firstPrompt = getVisibleMissingLettersPrompt();
    expect(
      screen.getByLabelText('Статистика по слову: Верно 0, Неверно 0'),
    ).toBeInTheDocument();

    const missingLetterInputs = await answerMissingLettersWrong(user);

    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Правильный ответ: ${firstPrompt.answer}`),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
    expect(screen.getByText('Статистика по слову')).toBeInTheDocument();
    expect(screen.queryByText(/direct/)).not.toBeInTheDocument();
    expect(screen.queryByText(/weighted/)).not.toBeInTheDocument();
    expect(screen.queryByText('missingLetters')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Статистика по слову: Верно 0, Неверно 1'),
    ).toBeInTheDocument();
    expect(
      getByDataTestPrefix('attempt_summary__incorrect_answer_cells__'),
    ).toHaveLength(0);
    expect(
      screen.queryByText(/Точность: .*Слабые карточки/),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Следующий' }),
    ).not.toBeInTheDocument();
    expect(missingLetterInputs[0]).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    const nextPrompt = getVisibleMissingLettersPrompt();
    expect(nextPrompt.answer).not.toBe(firstPrompt.answer);
    expect(
      screen.getByLabelText('Статистика по слову: Верно 0, Неверно 0'),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing letter/)[0]).not.toBeDisabled();
  });

  it('mixes repeated missing letters cards with other prompts', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const answered = new Set<string>();
    for (let index = 0; index < 3; index += 1) {
      const prompt = getVisibleMissingLettersPrompt();
      answered.add(prompt.answer);
      await answerMissingLettersWrong(user);
      await user.click(screen.getByRole('button', { name: 'Неверно' }));
    }

    expect(answered.size).toBeGreaterThanOrEqual(2);
  });

  it('keeps a correct missing letters result visible until the next button is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrect(user, prompt.answer);

    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(prompt.answer);
  });

  it('keeps a correct missing letters result visible when submitted with Enter from the last cell', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrectWithEnter(user, prompt.answer);

    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(prompt.answer);
  });

  it('prioritizes a recently missed missing letters card without repeating it immediately', async () => {
    const user = userEvent.setup();
    const store = renderApp({
      attempts: [
        createStoredAttempt({
          cardId: 'card-airport',
          completedAt: '2026-07-03T13:00:00.000Z',
          isCorrect: false,
        }),
      ],
    });

    await startExercise(user, 'Пропущенные буквы');

    expect(getVisibleMissingLettersPrompt().answer).toBe('airport');
    expect(
      screen.getByLabelText('Статистика по слову: Верно 0, Неверно 1'),
    ).toBeInTheDocument();
    await answerMissingLettersCorrect(user, 'airport');
    expect(
      screen.getByLabelText('Статистика по слову: Верно 1, Неверно 1'),
    ).toBeInTheDocument();
    expect(store.getState().attempts.attempts).toHaveLength(2);
    expect(
      store.getState().attempts.attempts[1].correctness['card-airport'],
    ).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Правильно!' }));
    expect(getVisibleMissingLettersPrompt().answer).not.toBe('airport');
  });

  it('shows a progress-aware coach message after a correct answer', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrect(user, prompt.answer);

    expect(
      screen.getByText('Ура! Похоже, ты начал запоминать это слово.'),
    ).toBeInTheDocument();
  });

  it('keeps a correct missing letters result visible when the answer starts a cooldown streak', async () => {
    const user = userEvent.setup();
    renderApp({
      attempts: ['card-airport', 'card-vehicle', 'card-impede', 'card-meditation'].flatMap(
        (cardId) => [
          createStoredAttempt({
            cardId,
            completedAt: '2026-07-01T10:00:00.000Z',
            isCorrect: true,
          }),
          createStoredAttempt({
            cardId,
            completedAt: '2026-07-02T10:00:00.000Z',
            isCorrect: true,
          }),
        ],
      ),
    });

    await startExercise(user, 'Пропущенные буквы');

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrect(user, prompt.answer);

    expect(
      screen.getByText('Это 3-й правильный ответ подряд по этой карточке.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(prompt.answer);
  });

  it('shows assistant character settings in the header', () => {
    renderApp();

    expect(screen.getByLabelText('Персонаж')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Веселый листочек: Замечает упрямые ошибки/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Forest Tutor')).not.toBeInTheDocument();
  });

  it('opens a character profile from the game assistant tooltip', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await user.hover(
      screen.getByTestId('coach_panel__assistant_sticker_wrapper__studyTroll'),
    );

    const tooltip = await screen.findByTestId('coach_panel__assistant_tooltip');
    expect(tooltip).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    expect(
      within(tooltip).getByTestId('coach_panel__assistant_tooltip_title'),
    ).toHaveTextContent('Веселый листочек');
    expect(
      within(tooltip).getByTestId('coach_panel__assistant_tooltip_motto'),
    ).toHaveStyle({ fontStyle: 'italic' });

    await user.click(
      within(tooltip).getByRole('link', { name: 'Познакомиться поближе' }),
    );

    expect(
      screen.getByTestId('assistant_profile__page__studyTroll'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Веселый листочек' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('assistant_profile__motto__studyTroll')).toHaveStyle({
      fontStyle: 'italic',
    });
    expect(
      screen.getByRole('heading', { name: 'Супер-способности' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('assistant_profile__sticker__studyTroll')).toBeInTheDocument();
  });

  it('asks for a theme before selecting cards and then adds selected cards to the created theme', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByTestId('theme_list__create_form')).toBeInTheDocument();
    expect(
      screen.getByTestId('theme_detail__selection_mode_banner'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByTestId('theme_detail__card_select_checkbox__card-airport'),
    );

    expect(
      screen.getByTestId('theme_detail__card_select_checkbox__card-airport'),
    ).not.toBeChecked();
    expect(
      screen.getByTestId('theme_detail__card_selection_warning__card-airport'),
    ).toHaveTextContent(
      'нужно сначала придумать название для темы и нажать "Создать" а потом продолжить выбор слов',
    );
    expect(screen.getByRole('button', { name: 'Добавить в тему' })).toBeDisabled();

    await user.type(screen.getByLabelText('Новая тема'), 'Дорога');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    await user.click(
      screen.getByTestId('theme_detail__card_select_checkbox__card-airport'),
    );
    await user.click(
      screen.getByTestId('theme_detail__card_select_checkbox__card-impede'),
    );

    const addToThemeButton = screen.getByRole('button', {
      name: 'Добавить в тему',
    });
    expect(addToThemeButton).toBeEnabled();
    expect(addToThemeButton).toHaveClass('MuiButton-outlined');
    await user.click(addToThemeButton);

    const createdTheme = store
      .getState()
      .themes.themes.find((theme) => theme.name === 'Дорога');
    expect(createdTheme?.cardIds).toEqual(
      expect.arrayContaining(['card-airport', 'card-impede']),
    );
    expect(
      screen.getByTestId('theme_detail__card_select_checkbox__card-airport'),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Добавить в тему' })).toBeDisabled();

    await user.click(
      screen.getByTestId('theme_detail__card_select_checkbox__card-vehicle'),
    );
    await user.click(screen.getByRole('button', { name: 'Добавить в тему' }));

    expect(
      store
        .getState()
        .themes.themes.find((theme) => theme.name === 'Дорога')?.cardIds,
    ).toEqual(expect.arrayContaining(['card-airport', 'card-impede', 'card-vehicle']));
  });

  it('closes an unanswered exercise without a finish confirmation dialog', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await user.click(screen.getByRole('button', { name: 'Закончить упражнение' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('finishes an active exercise through a styled confirmation dialog', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    const toolbar = screen.getByTestId('app__exercise_toolbar');
    expect(within(toolbar).getByLabelText('Мысль персонажа')).toBeInTheDocument();
    expect(
      within(toolbar).getByRole('button', { name: 'Закончить упражнение' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Выберите игру' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(toolbar).getByRole('button', { name: 'Закончить упражнение' }),
    );

    expect(
      screen.getByText('Результаты упражнения будут зачтены, а упражнение закончено.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Отвечено слов: 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Закончить упражнение' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('returns to the game setup through the Game tab and confirms answered exercises', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Игра' }));

    expect(
      screen.getByText('Результаты упражнения будут зачтены, а упражнение закончено.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Игра' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(screen.getByRole('heading', { name: 'Выберите тему' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Выберите игру' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('returns to the main game screen through the logo without a dialog for an unanswered exercise', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Language Lab' }));

    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();

    await startExercise(user, 'Пропущенные буквы');
    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Language Lab' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('shows localized result formulas in statistics', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    await answerMissingLettersWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Статистика' }));

    expect(screen.getByRole('heading', { name: 'Результаты' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Всего пройдено упражнений: 1'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('target_stats__total_exercises__value_chip')).toHaveTextContent(
      '1 пройдено',
    );
    expect(
      screen.getByTestId('target_stats__answered_formula__label_line__0'),
    ).toHaveTextContent('Всего отвечено');
    expect(
      screen.getByTestId('target_stats__answered_formula__label_line__1'),
    ).toHaveTextContent('вопросов:');
    expect(screen.getByTestId('target_stats__answered_formula__total_chip')).toHaveTextContent(
      '2 отвечено',
    );
    expect(screen.getByTestId('target_stats__answered_formula__equals_icon')).toBeInTheDocument();
    expect(screen.queryByTestId('target_stats__answered_formula__correct_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__answered_formula__incorrect_chip')).toHaveTextContent(
      '2 неверно',
    );
    expect(screen.getByTestId('target_stats__metrics')).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
    });

    expect(screen.getByTestId('app__statistics_section')).toHaveStyle({
      overflow: 'hidden',
    });
    expect(screen.getByTestId('history_view__root')).toHaveStyle({
      overflowY: 'auto',
    });

    const attemptCards = getByDataTestPrefix('history_view__attempt_card__');
    expect(attemptCards).toHaveLength(1);
    expect(attemptCards[0]).toHaveTextContent('Пропущенные буквы');
    expect(
      within(attemptCards[0]).getByTestId(
        /^history_view__attempt_formula__.*__total_chip$/,
      ),
    ).toHaveTextContent('2 отвечено');
    expect(
      within(attemptCards[0]).queryByText('Всего отвечено вопросов: 2'),
    ).not.toBeInTheDocument();

    await user.click(
      within(attemptCards[0]).getByRole('button', {
        name: /Пропущенные буквы/,
      }),
    );

    expect(screen.getByText('Детали упражнения')).toBeInTheDocument();
    expect(screen.queryByText('Ваш ответ:')).not.toBeInTheDocument();
  });

  it('uses phrases for missing word practice', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    expect(screen.queryByText(/I need to remember/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/).length).toBeGreaterThan(0);
  });

  it('does not repeat missing word cards inside the same exercise session', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    const firstPromptText = getVisibleMissingWordSentence();
    expect(
      screen.getByLabelText('Статистика по фразе: Верно 0, Неверно 0'),
    ).toBeInTheDocument();
    await answerMissingWordWrong(user);

    expect(screen.getByText('Статистика по фразе')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Статистика по фразе: Верно 0, Неверно 1'),
    ).toBeInTheDocument();
    expect(
      getByDataTestPrefix('attempt_summary__incorrect_answer_cells__'),
    ).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    expect(getVisibleMissingWordSentence()).not.toBe(firstPromptText);
    expect(
      screen.getByLabelText('Статистика по фразе: Верно 0, Неверно 0'),
    ).toBeInTheDocument();
  });

  it('shows word statistics after a multiple choice answer', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Вопрос с 3 вариантами');
    await user.click(getByDataTestPrefix('multiple_choice_exercise__option__')[0]);

    expect(screen.getByText('Статистика по слову')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Статистика по слову: Верно \d, Неверно \d/),
    ).toBeInTheDocument();
  });

  it('generates a new multiple choice triple after each answered card', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Вопрос с 3 вариантами');

    const firstTriple = getMultipleChoiceOptionText();
    await user.click(getByDataTestPrefix('multiple_choice_exercise__option__')[0]);
    await user.click(
      screen.queryByRole('button', { name: 'Правильно!' }) ??
        screen.getByRole('button', { name: 'Неверно' }),
    );

    expect(getMultipleChoiceOptionText()).not.toEqual(firstTriple);
  });
});

function getVisibleMissingLettersPrompt(): { answer: string; prompt: RegExp } {
  const prompts = [
    { answer: 'airport', prompt: /аэропорт/ },
    { answer: 'vehicle', prompt: /транспортное средство/ },
    { answer: 'impede', prompt: /препятствовать/ },
    { answer: 'meditation', prompt: /медитация/ },
  ];
  const visiblePrompt = prompts.find((item) => screen.queryByText(item.prompt));

  if (!visiblePrompt) {
    throw new Error('Missing letters prompt is not visible.');
  }

  return visiblePrompt;
}

async function selectAllWordsTheme(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Выберите тему' }));
  await user.click(await screen.findByRole('option', { name: /Все слова/ }));
}

async function startExercise(
  user: ReturnType<typeof userEvent.setup>,
  exerciseName: string,
) {
  await user.click(screen.getByRole('button', { name: exerciseName }));
  await selectAllWordsTheme(user);
  await user.click(screen.getByRole('button', { name: 'Играть' }));
}

async function answerMissingLettersWrong(
  user: ReturnType<typeof userEvent.setup>,
) {
  const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
  for (const input of missingLetterInputs) {
    await user.clear(input);
    await user.type(input, 'x');
  }
  await user.click(screen.getByRole('button', { name: 'Отправить' }));

  return missingLetterInputs;
}

async function answerMissingLettersCorrect(
  user: ReturnType<typeof userEvent.setup>,
  answer: string,
) {
  const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
  for (const input of missingLetterInputs) {
    const label = input.getAttribute('aria-label') ?? '';
    const characterIndex = Number(label.replace(/\D/g, '')) - 1;
    await user.type(input, answer[characterIndex]);
  }
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
}

async function answerMissingLettersCorrectWithEnter(
  user: ReturnType<typeof userEvent.setup>,
  answer: string,
) {
  const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
  for (const [inputIndex, input] of missingLetterInputs.entries()) {
    const label = input.getAttribute('aria-label') ?? '';
    const characterIndex = Number(label.replace(/\D/g, '')) - 1;
    const suffix = inputIndex === missingLetterInputs.length - 1 ? '{enter}' : '';
    await user.type(input, `${answer[characterIndex]}${suffix}`);
  }
}

function getVisibleMissingWordSentence(): string {
  if (screen.queryByText('It is')) {
    return 'It is worth it today.';
  }

  if (screen.queryByText('I')) {
    return 'I look forward to tomorrow.';
  }

  throw new Error('Missing word sentence is not visible.');
}

async function answerMissingWordWrong(user: ReturnType<typeof userEvent.setup>) {
  const inputs = screen.getAllByLabelText(/Missing word letter/);
  for (const input of inputs) {
    await user.type(input, 'x');
  }
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
}

function getMultipleChoiceOptionText(): string[] {
  return getByDataTestPrefix('multiple_choice_exercise__option__')
    .map((option) => option.textContent ?? '');
}

function getByDataTestPrefix(prefix: string): HTMLElement[] {
  return Array.from(
    document.body.querySelectorAll<HTMLElement>(`[data-test^="${prefix}"]`),
  );
}

function createStoredAttempt({
  cardId,
  completedAt,
  isCorrect,
}: {
  cardId: string;
  completedAt: string;
  isCorrect: boolean;
}): ExerciseAttempt {
  return {
    id: `attempt-${cardId}-${completedAt}`,
    exerciseType: 'missingLetters',
    themeId: 'all-words',
    targetLanguage: 'en',
    createdAt: completedAt,
    completedAt,
    cardSnapshots: [],
    prompts: [],
    answers: { [cardId]: isCorrect ? 'ok' : 'wrong' },
    correctness: { [cardId]: isCorrect },
    hintsUsed: { [cardId]: 0 },
  };
}
