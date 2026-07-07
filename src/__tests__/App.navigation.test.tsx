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
import { cardSetsReducer, selectCardSet } from '../store/cardSetsSlice';

const now = '2026-07-03T12:00:00.000Z';

function renderApp({
  app = {},
  attempts = [],
  cards,
  selectedCardSetId,
  cardSets,
}: {
  app?: Partial<ReturnType<typeof appReducer>>;
  attempts?: ExerciseAttempt[];
  cards?: ReturnType<typeof cardsReducer>['cards'];
  selectedCardSetId?: string;
  cardSets?: ReturnType<typeof cardSetsReducer>['cardSets'];
} = {}) {
  const appState = {
    ...appReducer(undefined, { type: 'test/init' }),
    ...app,
  };
  const cardSetsState = {
    ...cardSetsReducer(undefined, { type: 'test/init' }),
    ...(cardSets ? { cardSets } : {}),
    ...(selectedCardSetId !== undefined ? { selectedCardSetId } : {}),
  };
  const appCards = cards ?? [
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
      app: appState,
      cards: {
        cards: appCards,
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      attempts: {
        attempts,
      },
      cardSets: cardSetsState,
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
        cardSets: cardSetsReducer,
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(141);
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
      within(setupPanel).queryByRole('heading', { name: 'Выберите набор карточек' }),
    ).not.toBeInTheDocument();
    expect(
      within(setupPanel).queryByRole('heading', { name: 'Выберите игру' }),
    ).not.toBeInTheDocument();
    expect(
      within(setupPanel).getByLabelText('Набор карточек'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('game_setup__card_set_label')).toHaveTextContent(
      'Набор карточек',
    );
    expect(
      screen.getByTestId('game_setup__card_set_control').querySelector('legend'),
    ).toHaveTextContent('Набор карточек');
    expect(screen.getByTestId('game_setup__card_set_placeholder')).toHaveTextContent(
      'Выберите набор',
    );
    expect(screen.getByTestId('game_setup__card_set_select')).not.toHaveTextContent(
      'Все карточки',
    );
    expect(screen.getByTestId('exercise_picker__tiles')).toBeInTheDocument();
    expect(
      screen
        .getByTestId('exercise_picker__tiles')
        .compareDocumentPosition(screen.getByTestId('game_setup__card_set_section')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId('exercise_picker__option_art__crossword')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__multipleChoice')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__missingLetters')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__missingWord')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option__crossword')).toHaveStyle({
      height: '184px',
    });
    expect(screen.getByTestId('exercise_picker__option_label__crossword')).toHaveTextContent(
      'Кроссворд',
    );
    expect(screen.getByRole('button', { name: 'Кроссворд' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Вопрос с 3 вариантами' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Пропущенное слово' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByTestId('exercise_picker__option_label__crossword')).toHaveStyle({
      borderRadius: '999px',
    });
    const tileBackgrounds = [
      screen.getByTestId('exercise_picker__option__crossword'),
      screen.getByTestId('exercise_picker__option__multipleChoice'),
      screen.getByTestId('exercise_picker__option__missingLetters'),
      screen.getByTestId('exercise_picker__option__missingWord'),
    ].map((tile) => getComputedStyle(tile).backgroundImage);
    expect(new Set(tileBackgrounds).size).toBe(4);
    expect(tileBackgrounds.every((background) => background.includes('linear-gradient'))).toBe(true);
    expect(screen.getByTestId('exercise_picker__option_label__crossword')).toHaveStyle({
      background: 'linear-gradient(135deg, #fffdf4 0%, #fff0c8 100%)',
    });
    expect(tileBackgrounds).not.toContain(
      getComputedStyle(screen.getByTestId('exercise_picker__option_label__crossword'))
        .backgroundImage,
    );
    expect(screen.getByTestId('game_setup__card_set_select')).toHaveStyle({
      height: '44px',
    });
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
    const setupWarning = screen.getByTestId('game_setup__warning_alert');
    expect(setupWarning).toHaveClass('MuiAlert-colorWarning');
    expect(setupWarning).toContainElement(
      screen.getByTestId('game_setup__warning_message__card_set'),
    );
    expect(setupWarning).toContainElement(
      screen.getByTestId('game_setup__warning_message__exercise'),
    );
    expect(screen.getByTestId('game_setup__warning_message__card_set')).toHaveTextContent(
      'Выберите набор карточек',
    );
    expect(screen.getByTestId('game_setup__warning_message__exercise')).toHaveTextContent(
      'Выберите игру',
    );
    expect(screen.queryByTestId('game_setup__cannot_start_alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('game_setup__choose_game_alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Начать' })).not.toBeInTheDocument();
    expect(screen.queryByText('worth it')).not.toBeInTheDocument();
  });

  it('disables missing letters on the setup screen when the selected card set has no single-word cards', async () => {
    const user = userEvent.setup();
    renderApp({
      cardSets: [
        {
          id: 'phrase-set',
          name: 'Фразы',
          cardIds: ['card-worth-it', 'card-look-forward'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Фразы/);

    const missingLettersTile = screen.getByRole('button', { name: 'Пропущенные буквы' });
    expect(missingLettersTile).toBeDisabled();
    const missingLettersTileVisual = screen.getByTestId('exercise_picker__option__missingLetters');
    expect(missingLettersTileVisual).toHaveStyle({
      filter: 'grayscale(1)',
    });
    expect(missingLettersTileVisual.getAttribute('style')).not.toContain('#f5ff69');
    expect(missingLettersTileVisual.getAttribute('style')).toContain('#f2f3ee');
    expect(screen.getByTestId('exercise_picker__option_art__missingLetters')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_label__missingLetters')).toHaveTextContent(
      'Пропущенные буквы',
    );
    expect(
      screen.queryByTestId('game_setup__missing_letters_needs_words_alert'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(
      'Для игры с пропущенными буквами в наборе должны быть карточки со словами',
    )).not.toBeInTheDocument();

    await user.hover(screen.getByTestId('exercise_picker__option_tooltip_anchor__missingLetters'));

    expect(await screen.findByText(
      'Для игры с пропущенными буквами в наборе должны быть карточки со словами',
    )).toBeInTheDocument();
    expect(
      await screen.findByTestId('exercise_picker__disabled_tooltip_icon__missingLetters'),
    ).toBeInTheDocument();
  });

  it('disables missing word on the setup screen when the selected card set has no phrase cards', async () => {
    const user = userEvent.setup();
    renderApp({
      cardSets: [
        {
          id: 'word-set',
          name: 'Слова',
          cardIds: ['card-airport', 'card-vehicle'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Слова/);

    const missingWordTile = screen.getByRole('button', { name: 'Пропущенное слово' });
    expect(missingWordTile).toBeDisabled();
    expect(screen.queryByTestId('game_setup__missing_word_needs_phrases_alert')).not.toBeInTheDocument();
    expect(screen.queryByText(
      'Для игры с пропущенным словом в наборе должны быть карточки с фразами',
    )).not.toBeInTheDocument();

    await user.hover(screen.getByTestId('exercise_picker__option_tooltip_anchor__missingWord'));

    expect(await screen.findByText(
      'Для игры с пропущенным словом в наборе должны быть карточки с фразами',
    )).toBeInTheDocument();
    expect(
      await screen.findByTestId('exercise_picker__disabled_tooltip_icon__missingWord'),
    ).toBeInTheDocument();
  });

  it('reactively disables missing letters when the card set selector changes to phrase-only cards', async () => {
    const user = userEvent.setup();
    renderApp({
      cardSets: [
        {
          id: 'word-set',
          name: 'Слова',
          cardIds: ['card-airport', 'card-vehicle'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'phrase-set',
          name: 'Фразы',
          cardIds: ['card-worth-it', 'card-look-forward'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Слова/);

    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).not.toBeDisabled();
    expect(screen.queryByTestId('game_setup__missing_letters_needs_words_alert')).not.toBeInTheDocument();

    await selectCardSetByName(user, /Фразы/);

    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toBeDisabled();
    const disabledMissingLettersTile = screen.getByTestId('exercise_picker__option__missingLetters');
    expect(disabledMissingLettersTile).toHaveStyle({
      filter: 'grayscale(1)',
    });
    expect(disabledMissingLettersTile.getAttribute('style')).not.toContain('#f5ff69');
    expect(disabledMissingLettersTile.getAttribute('style')).toContain('#f2f3ee');
    expect(
      screen.queryByTestId('game_setup__missing_letters_needs_words_alert'),
    ).not.toBeInTheDocument();

    await selectCardSetByName(user, /Слова/);

    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).not.toBeDisabled();
    expect(screen.queryByTestId('game_setup__missing_letters_needs_words_alert')).not.toBeInTheDocument();
  });

  it('reactively disables an already selected missing letters tile after switching to phrase-only cards', async () => {
    const user = userEvent.setup();
    renderApp({
      cardSets: [
        {
          id: 'word-set',
          name: 'Слова',
          cardIds: ['card-airport', 'card-vehicle'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'phrase-set',
          name: 'Фразы',
          cardIds: ['card-worth-it', 'card-look-forward'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Слова/);
    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));

    expect(screen.getByRole('button', { name: 'Играть' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await selectCardSetByName(user, /Фразы/);

    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
    expect(
      screen.queryByTestId('game_setup__missing_letters_needs_words_alert'),
    ).not.toBeInTheDocument();
  });

  it('keeps missing letters disabled according to the card set selector even if the global card set changes', async () => {
    const user = userEvent.setup();
    const store = renderApp({
      cardSets: [
        {
          id: 'word-set',
          name: 'Слова',
          cardIds: ['card-airport', 'card-vehicle'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'phrase-set',
          name: 'Фразы',
          cardIds: ['card-worth-it', 'card-look-forward'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Фразы/);
    store.dispatch(selectCardSet('word-set'));

    expect(screen.getByTestId('game_setup__card_set_select')).toHaveTextContent('Фразы (2)');
    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toBeDisabled();
    expect(screen.getByTestId('exercise_picker__option__missingLetters')).toHaveStyle({
      filter: 'grayscale(1)',
    });
    expect(
      screen.queryByTestId('game_setup__missing_letters_needs_words_alert'),
    ).not.toBeInTheDocument();
  });

  it('starts an exercise only after a card set is selected and shows the card set chip', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();

    await selectAllCardsCardSet(user);
    await user.click(screen.getByRole('button', { name: 'Играть' }));

    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();
    expect(getByDataTestPrefix('missing_letters_exercise__metadata_row__')[0]).toContainElement(
      getByDataTestPrefix('missing_letters_exercise__card_set_chip__')[0],
    );
    expect(getByDataTestPrefix('missing_letters_exercise__metadata_row__')[0]).toContainElement(
      getByDataTestPrefix('missing_letters_exercise__progress_chip__')[0],
    );
    expect(getByDataTestPrefix('missing_letters_exercise__card_set_chip__')[0]).toHaveTextContent(
      'Набор карточек: Все карточки',
    );
    expect(
      getByDataTestPrefix('missing_letters_exercise__progress_chip__')[0],
    ).toHaveTextContent('0 пройдено / 4 всего');
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
      screen.getByText(/Вы игрок, создающий свою игру/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/не снимайте с себя эту ответственность/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/"мертвый" тренажер/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/"тупой" тренажер/),
    ).not.toBeInTheDocument();

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

  it('shows All cards as a fixed cards topic without an archive action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    const allCardsTopic = screen.getByRole('button', { name: /Все карточки/ });
    expect(allCardsTopic).toBeInTheDocument();
    expect(allCardsTopic).toHaveTextContent('6');
    expect(
      screen.queryByRole('button', { name: 'В архив: Все карточки' }),
    ).not.toBeInTheDocument();

    await user.click(allCardsTopic);
    expect(screen.getByText('1 набор')).toBeInTheDocument();
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
    expect(getByDataTestPrefix('card_set_detail__card_item__')).toHaveLength(6);
    expect(
      screen.getAllByLabelText('Статистика по слову: Верно 0, Неверно 0').length,
    ).toBeGreaterThan(0);
  });

  it('keeps missing letters on the answered word and shows the correct answer result', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();
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

  it('advances missing letters after a memorize result without saving an answer', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const firstPrompt = getVisibleMissingLettersPrompt();
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(firstPrompt.answer);

    await user.click(screen.getByRole('button', { name: 'Запомнить!' }));

    expect(getVisibleMissingLettersPrompt().answer).not.toBe(firstPrompt.answer);
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

  it('shows a completed game summary after the last missing letters prompt', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const answered = new Set<string>();
    for (let index = 0; index < 4; index += 1) {
      answered.add(getVisibleMissingLettersPrompt().answer);
      await answerMissingLettersWrong(user);
      await user.click(screen.getByRole('button', { name: 'Неверно' }));
    }

    expect(answered.size).toBe(4);
    expect(screen.getByTestId('exercise_complete__panel')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_complete__trophy')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Результаты: Верно 0, Неверно 4'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Статистика по слову')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Закончить упражнение' })).not.toBeInTheDocument();
    const exitButton = screen.getByRole('button', { name: 'Выйти' });
    expect(exitButton).toBeInTheDocument();
    expect(exitButton).toHaveFocus();

    const completedMarker = store
      .getState()
      .attempts.attempts.find(
        (attempt) =>
          (attempt as ExerciseAttempt & { isExerciseCompleted?: boolean })
            .isExerciseCompleted,
      );
    expect(completedMarker).toMatchObject({
      exerciseSessionId: expect.any(String),
      exerciseType: 'missingLetters',
      isExerciseCompleted: true,
      cardSetId: 'all-cards',
    });
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

  it('creates a card set and edits its card list from the card set detail view', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByTestId('card_set_list__create_form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('card_set_detail__selection_mode_banner'),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Новый набор карточек'), 'Дорога');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByRole('button', { name: 'Добавить карточки' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Добавить в набор' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить карточки' }));

    await user.click(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-airport'),
    );
    await user.click(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-impede'),
    );

    const saveCardsInSetButton = screen.getByRole('button', {
      name: 'Сохранить карточки',
    });
    expect(saveCardsInSetButton).toBeEnabled();
    expect(saveCardsInSetButton).toHaveClass('MuiButton-outlined');
    await user.click(saveCardsInSetButton);

    const createdCardSet = store
      .getState()
      .cardSets.cardSets.find((cardSet) => cardSet.name === 'Дорога');
    expect(createdCardSet?.cardIds).toEqual(
      expect.arrayContaining(['card-airport', 'card-impede']),
    );
    expect(screen.getByRole('button', { name: 'Редактировать карточки' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Редактировать карточки' }));
    await user.click(screen.getByTestId('card_set_detail__card_select_checkbox__card-airport'));
    await user.click(screen.getByTestId('card_set_detail__card_select_checkbox__card-vehicle'));
    await user.click(screen.getByRole('button', { name: 'Сохранить карточки' }));

    expect(
      store
        .getState()
        .cardSets.cardSets.find((cardSet) => cardSet.name === 'Дорога')?.cardIds,
    ).toEqual(['card-vehicle', 'card-impede']);
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
    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Игра' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(screen.queryByRole('heading', { name: 'Выберите набор карточек' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Выберите игру' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Набор карточек')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('returns to the main game screen through the logo without a dialog for an unanswered exercise', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Language Lab' }));

    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();

    await startExercise(user, 'Пропущенные буквы');
    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();

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
    expect(screen.getByTestId('target_stats__total_exercises__label')).toHaveTextContent(
      'Всего пройдено игр',
    );
    expect(screen.getByTestId('target_stats__total_exercises__label')).not.toHaveTextContent(
      ':',
    );
    expect(screen.getByTestId('target_stats__total_exercises__value_chip')).toHaveTextContent(
      '1 пройдено',
    );
    expect(screen.getByTestId('target_stats__total_exercises__value_group')).toHaveStyle({
      justifyContent: 'center',
    });
    expect(
      screen.getByTestId('target_stats__answered_formula__label_line__0'),
    ).toHaveTextContent('Всего отвечено');
    expect(
      screen.getByTestId('target_stats__answered_formula__label_line__1'),
    ).toHaveTextContent('карточек');
    expect(screen.getByTestId('target_stats__answered_formula__label')).not.toHaveTextContent(
      ':',
    );
    expect(screen.getByTestId('target_stats__answered_formula__total_chip')).toHaveTextContent(
      '2 отвечено',
    );
    expect(screen.getByTestId('target_stats__answered_formula__equals_icon')).toBeInTheDocument();
    expect(screen.queryByTestId('target_stats__answered_formula__correct_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__answered_formula__incorrect_chip')).toHaveTextContent(
      '2 неверно',
    );
    await user.hover(screen.getByTestId('target_stats__answered_formula__total_chip'));
    expect(
      await screen.findByText('всего отвечено карточек во всех упражнениях'),
    ).toBeInTheDocument();
    await user.unhover(screen.getByTestId('target_stats__answered_formula__total_chip'));
    await user.hover(screen.getByTestId('target_stats__answered_formula__incorrect_chip'));
    expect(
      await screen.findByText('количество карточек отвеченных неверно'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('target_stats__metrics')).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    });
    expect(screen.getByTestId('target_stats__answered_formula__value_group')).toHaveStyle({
      justifyContent: 'center',
    });
    expect(screen.getByTestId('target_stats__answered_formula__root')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    });
    expect(screen.getByTestId('target_stats__answered_formula__body')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '100%',
      textAlign: 'center',
      width: 'fit-content',
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

  it('shows crossword word-level result formula without the correct answers block', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Кроссворд');
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));

    expect(
      getByDataTestPrefix('attempt_summary__expected_answers_label__'),
    ).toHaveLength(0);
    expect(
      getByDataTestPrefix('attempt_summary__crossword_formula__')[0],
    ).toBeInTheDocument();
    expect(
      getByDataTestPrefix('attempt_summary__crossword_formula__')[0],
    ).toHaveTextContent(/отвечено/);
    expect(
      getByDataTestPrefix('attempt_summary__crossword_formula__')[0],
    ).toHaveTextContent(/неверно/);
    expect(screen.getByRole('button', { name: 'Пройдено!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Пройдено!' }));

    expect(screen.queryByRole('heading', { name: 'Выберите набор карточек' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Набор карточек')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
    expect(
      store
        .getState()
        .attempts.attempts.some(
          (attempt) =>
            attempt.exerciseType === 'crossword' && attempt.isExerciseCompleted,
        ),
    ).toBe(true);
  });

  it('uses phrases for missing word practice', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    expect(screen.queryByText(/I need to remember/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/).length).toBeGreaterThan(0);
  });

  it('shows a localized setup warning when missing letters has only phrase cards', async () => {
    const user = userEvent.setup();
    renderApp({
      cards: [
        {
          id: 'card-phrase-only',
          translations: {
            en: 'worth it',
            ru: 'оно того стоит',
            es: 'vale la pena',
          },
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await selectAllCardsCardSet(user);

    expect(screen.getByRole('button', { name: 'Пропущенные буквы' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
    expect(
      screen.queryByTestId('game_setup__missing_letters_needs_words_alert'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(
      'Для игры с пропущенными буквами в наборе должны быть карточки со словами',
    )).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Missing letters practice needs single-word cards/),
    ).not.toBeInTheDocument();
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

  it('advances missing word after memorize and correct results', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    const firstPromptText = getVisibleMissingWordSentence();
    await user.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Запомнить!' }));
    expect(getVisibleMissingWordSentence()).not.toBe(firstPromptText);

    const secondPromptText = getVisibleMissingWordSentence();
    await answerMissingWordCorrect(user, secondPromptText);
    expect(
      screen.queryByRole('button', { name: 'Отправить' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Правильно!' }));
    expect(screen.getByTestId('exercise_complete__panel')).toBeInTheDocument();
    expect(screen.queryByText('Статистика по фразе')).not.toBeInTheDocument();
  });

  it('shows a completed game summary when available missing word prompts are exhausted by cooldowns', async () => {
    const user = userEvent.setup();
    renderApp({
      attempts: [
        createStoredAttempt({
          cardId: 'card-look-forward',
          completedAt: '2026-07-01T10:00:00.000Z',
          isCorrect: true,
        }),
        createStoredAttempt({
          cardId: 'card-look-forward',
          completedAt: '2026-07-02T10:00:00.000Z',
          isCorrect: true,
        }),
        createStoredAttempt({
          cardId: 'card-look-forward',
          completedAt: '2026-07-03T10:00:00.000Z',
          isCorrect: true,
        }),
      ],
    });

    await startExercise(user, 'Пропущенное слово');
    await answerMissingWordWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    expect(screen.getByTestId('exercise_complete__panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выйти' })).toHaveFocus();
    expect(
      screen.queryByText('Карточки для этого упражнения закончились.'),
    ).not.toBeInTheDocument();
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

  it('shows a completed game summary after the last multiple choice prompt', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Вопрос с 3 вариантами');

    const answered = new Set<string>();
    for (let index = 0; index < 6; index += 1) {
      const prompt = screen.getByTestId(/^multiple_choice_exercise__prompt__/);
      answered.add(prompt.textContent ?? '');
      await user.click(getByDataTestPrefix('multiple_choice_exercise__option__')[0]);
      await user.click(
        screen.queryByRole('button', { name: 'Правильно!' }) ??
          screen.getByRole('button', { name: 'Неверно' }),
      );
    }

    expect(answered.size).toBe(6);
    expect(screen.getByTestId('exercise_complete__panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выйти' })).toHaveFocus();
    expect(
      screen.queryByText('Карточки для этого упражнения закончились.'),
    ).not.toBeInTheDocument();
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

function cardIdByAnswer(answer: string): string {
  const idsByAnswer: Record<string, string> = {
    airport: 'card-airport',
    vehicle: 'card-vehicle',
    impede: 'card-impede',
    meditation: 'card-meditation',
  };
  const cardId = idsByAnswer[answer];

  if (!cardId) {
    throw new Error(`Unknown test answer: ${answer}`);
  }

  return cardId;
}

async function selectAllCardsCardSet(user: ReturnType<typeof userEvent.setup>) {
  await selectCardSetByName(user, /Все карточки/);
}

async function selectCardSetByName(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp,
) {
  await user.click(screen.getByRole('combobox', { name: 'Набор карточек' }));
  await user.click(await screen.findByRole('option', { name }));
}

async function startExercise(
  user: ReturnType<typeof userEvent.setup>,
  exerciseName: string,
) {
  await user.click(screen.getByRole('button', { name: exerciseName }));
  await selectAllCardsCardSet(user);
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

async function answerMissingWordCorrect(
  user: ReturnType<typeof userEvent.setup>,
  sentence: string,
) {
  const answer = sentence === 'It is worth it today.' ? 'worth it' : 'look forward';
  const editableIndexes = getMissingWordEditableIndexes(answer);
  const inputs = screen.getAllByLabelText(/Missing word letter/);
  for (const [index, input] of inputs.entries()) {
    await user.type(input, answer[editableIndexes[index]]);
  }
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
}

function getMissingWordEditableIndexes(answer: string): number[] {
  const editableIndexes: number[] = [];
  let indexInWord = 0;

  answer.split('').forEach((character, index) => {
    if (character.trim() === '') {
      indexInWord = 0;
      return;
    }

    if (indexInWord % 2 === 1) {
      editableIndexes.push(index);
    }

    indexInWord += 1;
  });

  return editableIndexes;
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
    cardSetId: 'all-cards',
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
