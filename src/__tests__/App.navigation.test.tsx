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
  attempts = [],
}: {
  attempts?: ExerciseAttempt[];
} = {}) {
  const store = configureStore({
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

    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
  });

  it('starts in Russian and shows a simple game setup tab before starting', () => {
    renderApp();

    expect(screen.getByRole('tab', { name: 'Игра' })).toBeInTheDocument();
    expect(screen.getByText('Language Lab')).toBeInTheDocument();
    expect(screen.queryByText('Language Crossword Lab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Карточки' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Статистика' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Импорт' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
    expect(screen.queryByText('worth it')).not.toBeInTheDocument();
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
    expect(screen.getAllByTestId('theme-card-item')).toHaveLength(6);
    expect(
      screen.getAllByLabelText('Статистика по слову: Верно 0, Неверно 0').length,
    ).toBeGreaterThan(0);
  });

  it('keeps missing letters on the answered word and shows the correct answer result', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();
    expect(screen.getByLabelText('Мысль персонажа')).toBeInTheDocument();
    const firstPrompt = getVisibleMissingLettersPrompt();

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
      screen.queryByText(/Точность: .*Слабые карточки/),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Следующий' }),
    ).not.toBeInTheDocument();
    expect(missingLetterInputs[0]).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    const nextPrompt = getVisibleMissingLettersPrompt();
    expect(nextPrompt.answer).not.toBe(firstPrompt.answer);
    expect(screen.getAllByLabelText(/Missing letter/)[0]).not.toBeDisabled();
  });

  it('does not repeat missing letters cards until the topic has more coverage', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    const answered = new Set<string>();
    for (let index = 0; index < 3; index += 1) {
      const prompt = getVisibleMissingLettersPrompt();
      answered.add(prompt.answer);
      await answerMissingLettersWrong(user);
      await user.click(screen.getByRole('button', { name: 'Неверно' }));
    }

    expect(answered.size).toBe(3);
  });

  it('keeps a correct missing letters result visible until the next button is clicked', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrect(user, prompt.answer);

    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(prompt.answer);
  });

  it('repeats a recently missed missing letters card and saves the burst as one result', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    expect(getVisibleMissingLettersPrompt().answer).toBe('airport');
    await answerMissingLettersCorrect(user, 'airport');
    expect(store.getState().attempts.attempts).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Правильно!' }));
    expect(getVisibleMissingLettersPrompt().answer).toBe('airport');

    await answerMissingLettersCorrect(user, 'airport');
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

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    const prompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersCorrect(user, prompt.answer);

    expect(
      screen.getByText('Ура! Похоже, ты начал запоминать это слово.'),
    ).toBeInTheDocument();
  });

  it('shows assistant character settings in the header', () => {
    renderApp();

    expect(screen.getByLabelText('Персонаж')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Моховой Смотритель: Замечает упрямые ошибки/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Forest Tutor')).not.toBeInTheDocument();
  });

  it('finishes an active exercise through a styled confirmation dialog', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    await answerMissingLettersWrong(user);

    const toolbar = screen.getByTestId('exercise-toolbar');
    expect(within(toolbar).getByLabelText('Мысль персонажа')).toBeInTheDocument();
    expect(
      within(toolbar).getByRole('button', { name: 'Закончить упражнение' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Выберите упражнение' }),
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

    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
  });

  it('returns to the main game screen through the logo and confirms an active exercise close', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Language Lab' }));

    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Language Lab' }));
    expect(
      screen.getByText('Результаты упражнения будут зачтены, а упражнение закончено.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
  });

  it('shows localized result formulas in statistics', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    await answerMissingLettersWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Статистика' }));

    expect(screen.getByRole('heading', { name: 'Результаты' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Всего пройдено упражнений: 1'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByLabelText('Всего отвечено вопросов: 2 = 0 + 2').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Верно: 0').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Неверно: 2').length).toBeGreaterThan(0);

    const attemptCards = screen.getAllByTestId('history-attempt-card');
    expect(attemptCards).toHaveLength(1);
    expect(attemptCards[0]).toHaveTextContent('Пропущенные буквы');
    expect(
      within(attemptCards[0]).getByLabelText(
        'Всего отвечено вопросов: 2 = 0 + 2',
      ),
    ).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Пропущенное слово' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    expect(screen.queryByText(/I need to remember/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/).length).toBeGreaterThan(0);
  });

  it('does not repeat missing word cards inside the same exercise session', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенное слово' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    const firstPromptText = getVisibleMissingWordSentence();
    await answerMissingWordWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    expect(getVisibleMissingWordSentence()).not.toBe(firstPromptText);
  });

  it('shows word statistics after a multiple choice answer', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Вопрос с 3 вариантами' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    await user.click(screen.getAllByTestId('multiple-choice-option')[0]);

    expect(screen.getByText('Статистика по слову')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Статистика по слову: Верно \d, Неверно \d/),
    ).toBeInTheDocument();
  });

  it('generates a new multiple choice triple after each answered card', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Вопрос с 3 вариантами' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    const firstTriple = getMultipleChoiceOptionText();
    await user.click(screen.getAllByTestId('multiple-choice-option')[0]);
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
  return screen
    .getAllByTestId('multiple-choice-option')
    .map((option) => option.textContent ?? '');
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
