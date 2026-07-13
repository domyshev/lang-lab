import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
import { aiAssistantReducer } from '../store/aiAssistantSlice';

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
    playerProfile: {
      avatarSeed: 'test-player',
      displayName: 'Тест',
      isAnonymous: false,
    },
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
      aiAssistant: aiAssistantReducer,
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
        aiAssistant: aiAssistantReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          playerProfile: {
            avatarSeed: 'test-player',
            displayName: 'Тест',
            isAnonymous: false,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(2000);
      expect(store.getState().cardSets.cardSets).toHaveLength(20);
    });

    const seededCards = store.getState().cards.cards;
    const seededWords = seededCards.filter(
      (card) => !/\s/.test(card.translations.en?.trim() ?? ''),
    );
    const seededPhrases = seededCards.filter((card) =>
      /\s/.test(card.translations.en?.trim() ?? ''),
    );
    expect(seededWords).toHaveLength(1000);
    expect(
      new Set(
        seededWords.map((card) => card.translations.en?.toLocaleLowerCase()),
      ).size,
    ).toBe(1000);
    expect(seededPhrases).toHaveLength(1000);
    expect(
      store.getState().cardSets.cardSets.map((cardSet) => cardSet.name),
    ).toEqual(
      expect.arrayContaining(['Любовь', 'Семья', 'Глаголы действий']),
    );
    expect(
      store
        .getState()
        .cardSets.cardSets.every((cardSet) => cardSet.cardIds.length === 100),
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
  });

  it('pages card set library chips and centers modal selections when possible', async () => {
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
        {
          id: 'extra-set',
          name: 'Еще набор',
          cardIds: ['card-impede', 'card-meditation'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'last-set',
          name: 'Последний',
          cardIds: ['card-airport'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const chipsRegion = screen.getByTestId('card_set_library__chips');
    const previousButton = screen.getByRole('button', {
      name: 'Предыдущие наборы карточек',
    });
    const nextButton = screen.getByRole('button', {
      name: 'Следующие наборы карточек',
    });

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
    expect(
      within(chipsRegion)
        .getAllByRole('button')
        .map((button) => button.getAttribute('data-test')),
    ).toEqual([
      'card_set_library__chip_select__all-cards',
      'card_set_library__chip_select__word-set',
      'card_set_library__chip_select__phrase-set',
    ]);

    fireEvent.wheel(chipsRegion, { deltaY: 120 });

    expect(previousButton).toBeDisabled();

    fireEvent.wheel(chipsRegion, { deltaY: 360 });

    expect(previousButton).toBeEnabled();
    expect(
      within(chipsRegion)
        .getAllByRole('button')
        .map((button) => button.getAttribute('data-test')),
    ).toEqual([
      'card_set_library__chip_select__word-set',
      'card_set_library__chip_select__phrase-set',
      'card_set_library__chip_select__extra-set',
    ]);

    await user.click(screen.getByTestId('card_set_library__open_button'));
    await user.click(
      within(screen.getByTestId('card_set_library_dialog__root')).getByRole(
        'button',
        { name: 'Выбрать набор карточек: Еще набор' },
      ),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('card_set_library_dialog__root')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent(
      'Еще набор',
    );

    await waitFor(() => {
      expect(screen.getByTestId('card_set_library__carousel')).toHaveAttribute(
        'data-featured-start-index',
        '2',
      );
    });

    await waitFor(() => {
      expect(
        within(screen.getByTestId('card_set_library__chips'))
          .getAllByRole('button')
          .map((button) => button.getAttribute('data-test')),
      ).toEqual([
        'card_set_library__chip_select__phrase-set',
        'card_set_library__chip_select__extra-set',
        'card_set_library__chip_select__last-set',
      ]);
    });
    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent(
      'Еще набор',
    );
    expect(
      screen.getByRole('button', {
        name: 'Следующие наборы карточек',
      }),
    ).toBeDisabled();
  });

  it('starts in Russian and shows a simple game setup tab before starting', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByTestId('app__game_setup_section')).toHaveStyle({
      gap: '12px',
    });
    expect(screen.getByRole('tab', { name: 'Играть' })).toBeInTheDocument();
    expect(screen.getByText('Language Lab')).toBeInTheDocument();
    expect(screen.queryByText('Language Crossword Lab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Чат' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Карточки' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Статистика' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'AI помощник' })).not.toBeInTheDocument();
    expect(screen.getByTestId('app_shell__tab__help')).toBeInTheDocument();
    const setupPanel = screen.getByTestId('game_setup__panel');
    expect(setupPanel).toHaveStyle({
      maxWidth: '760px',
      width: '100%',
    });
    expect(
      within(setupPanel).queryByRole('heading', { name: 'Выберите набор карточек' }),
    ).not.toBeInTheDocument();
    expect(
      within(setupPanel).queryByRole('heading', { name: 'Выберите игру' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__panel')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__chips')).toHaveStyle({
      display: 'grid',
    });
    expect(screen.getByTestId('card_set_library__title')).toHaveTextContent(
      'Библиотека карточек',
    );
    expect(screen.getByTestId('card_set_library__placeholder')).toHaveTextContent(
      'Выберите набор карточек',
    );
    expect(screen.queryByTestId('game_setup__card_set_select')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__open_button')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__open_search_icon')).toBeInTheDocument();
    expect(screen.getByTestId('game_library__title')).toHaveTextContent(
      'Библиотека игр',
    );
    expect(screen.getByTestId('game_library__placeholder')).toHaveTextContent(
      'Выберите игру',
    );
    expect(screen.getByTestId('game_library__section')).toHaveStyle({
      gap: '12px',
    });
    expect(screen.getByTestId('exercise_picker__tiles')).toBeInTheDocument();
    expect(screen.queryByTestId('exercise_picker__title')).not.toBeInTheDocument();
    expect(
      screen
        .getByTestId('exercise_picker__tiles')
        .compareDocumentPosition(screen.getByTestId('card_set_library__panel')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId('exercise_picker__option_art__crossword')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__multipleChoice')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__missingLetters')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option_art__missingWord')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_picker__option__crossword')).toHaveStyle({
      height: '184px',
    });
    expect(screen.getByTestId('exercise_picker__tiles')).toHaveStyle({
      columnGap: '10px',
      rowGap: '10px',
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
    expect(screen.queryByTestId('game_ai_assistant__section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai_assistant__chat_accordion')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeDisabled();
    expect(screen.queryByTestId('game_setup__warning_alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('game_setup__start_warning_icon')).toHaveTextContent('!');
    expect(screen.getByTestId('game_setup__start_warning_icon')).toHaveStyle({
      animation: 'disabledExerciseTooltipBlink 860ms ease-in-out infinite',
    });
    await user.hover(screen.getByTestId('game_setup__start_warning_anchor'));
    await waitFor(() =>
      expect(screen.getAllByText('Выберите набор карточек').length).toBeGreaterThan(
        1,
      ),
    );
    await waitFor(() =>
      expect(screen.getAllByText('Выберите игру').length).toBeGreaterThan(1),
    );
    expect(screen.queryByTestId('game_setup__cannot_start_alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('game_setup__choose_game_alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Начать' })).not.toBeInTheDocument();
    expect(screen.queryByText('worth it')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Кроссворд' }));
    expect(screen.queryByTestId('exercise_picker__title')).not.toBeInTheDocument();
    expect(screen.getByTestId('game_library__selected_name')).toHaveTextContent(
      'Кроссворд',
    );
    expect(screen.getByRole('button', { name: 'Кроссворд' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens the card set library and filters sets by card text', async () => {
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

    await user.click(screen.getByTestId('card_set_library__open_button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_library_dialog__title')).toHaveTextContent(
      'Библиотека наборов карточек',
    );
    expect(screen.getByTestId('card_set_library_dialog__content')).toHaveStyle({
      height: 'min(72vh, 720px)',
      overflow: 'hidden',
    });
    expect(screen.getByTestId('card_set_library_dialog__search_area')).toHaveStyle({
      flexShrink: '0',
      paddingTop: '10px',
    });
    expect(screen.getByTestId('card_set_library_dialog__items')).toHaveStyle({
      overflowY: 'auto',
    });

    await user.type(screen.getByTestId('card_set_library_dialog__search_input'), 'worth');

    expect(screen.getByTestId('card_set_library_dialog__content')).toHaveStyle({
      height: 'min(72vh, 720px)',
    });
    expect(screen.getByTestId('card_set_library_dialog__item__phrase-set')).toBeInTheDocument();
    expect(screen.queryByTestId('card_set_library_dialog__item__word-set')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Выбрать набор карточек: Фразы/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent('Фразы');
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

  it('disables crossword when the selected card set cannot create intersections', async () => {
    const user = userEvent.setup();
    renderApp({
      cards: [
        {
          id: 'card-bcd',
          translations: { en: 'bcd', ru: 'бцд', es: 'bcd' },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'card-fgh',
          translations: { en: 'fgh', ru: 'фгх', es: 'fgh' },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'card-jkl',
          translations: { en: 'jkl', ru: 'йкл', es: 'jkl' },
          createdAt: now,
          updatedAt: now,
        },
      ],
      cardSets: [
        {
          id: 'disconnected-set',
          name: 'Разрозненные',
          cardIds: ['card-bcd', 'card-fgh', 'card-jkl'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await selectCardSetByName(user, /Разрозненные/);

    const crosswordTile = screen.getByRole('button', { name: 'Кроссворд' });
    expect(crosswordTile).toBeDisabled();
    expect(screen.getByTestId('exercise_picker__option__crossword')).toHaveStyle({
      filter: 'grayscale(1)',
    });

    await user.hover(screen.getByTestId('exercise_picker__option_tooltip_anchor__crossword'));

    expect(await screen.findByText(
      'невозможно построить кроссворд из данных этого набора',
    )).toBeInTheDocument();
    expect(
      await screen.findByTestId('exercise_picker__disabled_tooltip_icon__crossword'),
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

    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent('Фразы');
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
      'Набор карточек: All cards',
    );
    expect(
      getByDataTestPrefix('missing_letters_exercise__progress_chip__')[0],
    ).toHaveTextContent('0 пройдено / 4 всего');
  });

  it.each([
    {
      interfaceLanguage: 'en' as const,
      gamesTab: 'Play',
      title: 'AI Assistant',
      wandLabel: 'Open AI Assistant',
      chatTitle: 'Chat',
      historyTitle: 'Operation history',
      importTitle: 'Manual card import',
    },
    {
      interfaceLanguage: 'ru' as const,
      gamesTab: 'Играть',
      title: 'AI помощник',
      wandLabel: 'Открыть AI помощника',
      chatTitle: 'Чат',
      historyTitle: 'История операций',
      importTitle: 'Ручной импорт карточек',
    },
    {
      interfaceLanguage: 'es' as const,
      gamesTab: 'Jugar',
      title: 'Asistente IA',
      wandLabel: 'Abrir Asistente IA',
      chatTitle: 'Chat',
      historyTitle: 'Historial de operaciones',
      importTitle: 'Importacion manual de tarjetas',
    },
  ])('opens the dedicated chat tab from the library wands in $interfaceLanguage', async ({
    interfaceLanguage,
    gamesTab,
    title,
    wandLabel,
    chatTitle,
    historyTitle,
    importTitle,
  }) => {
    const user = userEvent.setup();
    renderApp({ app: { interfaceLanguage } });
    const scrollRoot = screen.getByTestId('app_shell__root');
    scrollRoot.scrollTop = 336.5;

    expect(screen.queryByRole('tab', { name: title })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: chatTitle })).toBeInTheDocument();
    expect(screen.queryByTestId('game_ai_assistant__section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai_assistant__chat_accordion')).not.toBeInTheDocument();

    const gameLibraryWand = screen.getByTestId('game_library__ai_assistant_button');
    const cardSetLibraryWand = screen.getByTestId('card_set_library__ai_assistant_button');
    expect(gameLibraryWand).toHaveAttribute('aria-label', wandLabel);
    expect(cardSetLibraryWand).toHaveAttribute('aria-label', wandLabel);

    scrollRoot.scrollTop = 336.5;
    await user.click(gameLibraryWand);

    expect(scrollRoot.scrollTop).toBe(0);
    expect(screen.getByRole('tab', { name: chatTitle })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('app__chat_section')).toBeInTheDocument();
    expect(screen.getByTestId('app__chat_section')).toHaveTextContent(chatTitle);
    expect(screen.queryByTestId('ai_assistant__chat_accordion')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai_assistant__collapse_chat_button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: historyTitle })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: historyTitle }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('DeepSeek V4 Flash')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: importTitle })).not.toBeInTheDocument();
    expect(screen.queryByText(/trial|триальн|prueba/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: gamesTab }));
    scrollRoot.scrollTop = 336.5;
    await user.click(screen.getByTestId('card_set_library__ai_assistant_button'));

    expect(scrollRoot.scrollTop).toBe(0);
    expect(screen.getByRole('tab', { name: chatTitle })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('app__chat_section')).toBeInTheDocument();
  });

  it('shows fixed help slides on the dedicated icon-only Help tab', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await user.click(screen.getByTestId('app_shell__tab__help'));

    expect(screen.queryByTestId('game_help__accordion')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Помощь' })).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(screen.queryByText(/лаборатория изучения языков/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('game_help__chat_slide')).toHaveTextContent(
      /чат AI-помощника/i,
    );
    expect(screen.getByTestId('game_help__chat_slide')).toHaveTextContent(
      /создавать наборы карточек/i,
    );
    expect(screen.getByTestId('game_help__chat_slide')).toHaveTextContent(
      /подбирать игры/i,
    );
    expect(store.getState().app.isGameHelpCollapsed).toBe(true);
    expect(screen.queryByTestId('game_help__coachmark_icon')).not.toBeInTheDocument();
  });

  it('opens the AI chat help slide when the first help slide was already acknowledged', async () => {
    const user = userEvent.setup();
    renderApp({ app: { isGameHelpCollapsed: true } });

    await user.click(screen.getByTestId('app_shell__tab__help'));
    expect(screen.queryByText(/лаборатория изучения языков/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('game_help__chat_slide')).toHaveTextContent(
      /чат AI-помощника/i,
    );
  });

  it('does not show the help coachmark again after it was already shown once', async () => {
    const user = userEvent.setup();
    const store = renderApp({
      app: {
        hasGameHelpCoachmarkBeenShown: true,
        isGameHelpCollapsed: false,
      } as Partial<ReturnType<typeof appReducer>>,
    });

    await user.click(screen.getByTestId('app_shell__tab__help'));
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(store.getState().app.isGameHelpCollapsed).toBe(true);
    expect(store.getState().app.hasGameHelpCoachmarkBeenShown).toBe(true);
    expect(screen.queryByTestId('game_help__coachmark_icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/помощь остается здесь/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('game_help__chat_slide')).toBeInTheDocument();
  });

  it('shows All cards as a fixed cards topic without an archive action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    const allCardsTopic = screen.getByRole('button', { name: /All cards/ });
    expect(allCardsTopic).toBeInTheDocument();
    expect(allCardsTopic).toHaveTextContent('6');
    expect(
      screen.queryByRole('button', { name: 'В архив: All cards' }),
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
    const store = renderApp();

    await startExercise(user, 'Пропущенные буквы');

    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();
    expect(screen.getByLabelText('Мысль персонажа')).toBeInTheDocument();
    const finishAction = screen.getByTestId('exercise_finish_action__root');
    expect(finishAction).toHaveStyle({
      alignItems: 'center',
      display: 'grid',
    });
    const thoughtBubble = screen.getByTestId('exercise_finish_action__thought_bubble');
    expect(thoughtBubble).toHaveTextContent(
      'Можно делать гиперзвуковые прыжки между карточками.',
    );
    expect(screen.getByTestId('exercise_finish_action__thought_icon')).toBeInTheDocument();
    expect(screen.getByTestId('exercise_finish_action__thought_icon_anchor')).toHaveStyle({
      animation: 'hypersonicJumpLampPulse 1100ms ease-in-out infinite',
      borderRadius: '999px',
    });
    await user.hover(screen.getByTestId('exercise_finish_action__thought_icon_anchor'));
    expect(
      await screen.findByText(/Гиперзвуковой прыжок переносит тебя/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise_finish_action__thought_icon_tooltip_arrow'),
    ).toHaveStyle({
      display: 'none',
    });
    await waitFor(() =>
      expect(store.getState().app.hasHypersonicJumpLampBeenShown).toBe(true),
    );
    expect(screen.getByTestId('exercise_finish_action__thought_icon_anchor')).toHaveStyle({
      animation: 'none',
    });
    expect(thoughtBubble).not.toContainElement(
      screen.getByTestId('app__finish_exercise_button'),
    );
    const finishButtonSlot = screen.getByTestId(
      'exercise_finish_action__finish_button_slot',
    );
    expect(finishButtonSlot).toContainElement(
      screen.getByTestId('app__finish_exercise_button'),
    );
    expect(finishButtonSlot).toHaveStyle({
      position: 'relative',
    });
    expect(
      screen.getByTestId('exercise_finish_action__finish_button_tip_anchor'),
    ).toHaveStyle({
      position: 'absolute',
    });
    await user.hover(
      screen.getByTestId('exercise_finish_action__finish_button_tip_anchor'),
    );
    expect(
      await screen.findByText(/Можно закончить игру в любой момент/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise_finish_action__finish_button_tip_tooltip_arrow'),
    ).toHaveStyle({
      display: 'none',
    });
    await waitFor(() =>
      expect(store.getState().app.hasFinishExerciseLampBeenShown).toBe(true),
    );
    expect(
      screen.getByTestId('exercise_finish_action__finish_button_tip_anchor'),
    ).toHaveStyle({
      animation: 'none',
    });
    expect(within(thoughtBubble).getByRole('combobox', { name: 'Прыжки' })).toBeInTheDocument();
    expect(screen.getByTestId('exercise_finish_action__jump_info_anchor')).toHaveStyle({
      display: 'none',
    });
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

  it('jumps between missing letters prompts and dims already answered words', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const firstPrompt = getVisibleMissingLettersPrompt();
    await answerMissingLettersWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    expect(getVisibleMissingLettersPrompt().answer).not.toBe(firstPrompt.answer);

    await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
    const answeredOption = screen.getByTestId(
      `exercise_finish_action__jump_option__${cardIdByAnswer(firstPrompt.answer)}__0`,
    );
    expect(answeredOption).toHaveStyle({ opacity: '0.52' });
    expect(answeredOption).toHaveTextContent(firstPrompt.ru);
    expect(answeredOption).not.toHaveTextContent(firstPrompt.answer);

    await user.click(answeredOption);

    expect(getVisibleMissingLettersPrompt().answer).toBe(firstPrompt.answer);
  });

  it('uses command or control arrows for missing letters jumps without submitting', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Пропущенные буквы');

    expect(
      screen.getByTestId('exercise_finish_action__hotkeys_anchor'),
    ).toHaveAccessibleName(/Cmd.*Ctrl.*стрелки/);
    expect(
      screen.getByTestId('exercise_finish_action__thought_bubble'),
    ).not.toContainElement(
      screen.getByTestId('exercise_finish_action__hotkeys_anchor'),
    );
    expect(
      screen.getByTestId('exercise_finish_action__hotkeys_key_symbol'),
    ).toHaveTextContent('⌘');
    expect(
      screen.getByTestId('exercise_finish_action__hotkeys_anchor'),
    ).toHaveStyle({ cursor: 'default' });
    expect(
      screen.getByTestId('exercise_finish_action__hotkeys_key'),
    ).toHaveStyle({ cursor: 'default' });

    const jumpOrder = await getMissingLettersJumpOrder(user);
    const currentPrompt = getVisibleMissingLettersPrompt();
    const currentKey = `${cardIdByAnswer(currentPrompt.answer)}__0`;
    const previousKey = getCircularJumpKey(jumpOrder, currentKey, -1);

    fireEvent.keyDown(window, { key: 'ArrowLeft', metaKey: true });

    await waitFor(() => {
      expect(getVisibleMissingLettersPrompt().answer).toBe(
        answerByPracticeKey(previousKey),
      );
    });
    expect(store.getState().attempts.attempts).toHaveLength(0);
  });

  it('continues from the latest selected missing letters jump', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const initialJumpOrder = await getMissingLettersJumpOrder(user);
    const firstJumpKey = initialJumpOrder[1];
    const expectedAfterFirstJumpKey = initialJumpOrder[2];
    if (!firstJumpKey || !expectedAfterFirstJumpKey) {
      throw new Error('Missing letters jump order needs at least three prompts.');
    }

    await selectMissingLettersJump(user, firstJumpKey);
    expect(getVisibleMissingLettersPrompt().answer).toBe(
      answerByPracticeKey(firstJumpKey),
    );
    await memorizeCurrentMissingLettersPrompt(user);

    expect(getVisibleMissingLettersPrompt().answer).toBe(
      answerByPracticeKey(expectedAfterFirstJumpKey),
    );

    const secondJumpKey = initialJumpOrder[3];
    const expectedAfterSecondJumpKey = initialJumpOrder[0];
    if (!secondJumpKey || !expectedAfterSecondJumpKey) {
      throw new Error('Missing letters jump order needs at least four prompts.');
    }

    await selectMissingLettersJump(user, secondJumpKey);
    expect(getVisibleMissingLettersPrompt().answer).toBe(
      answerByPracticeKey(secondJumpKey),
    );
    await memorizeCurrentMissingLettersPrompt(user);

    expect(getVisibleMissingLettersPrompt().answer).toBe(
      answerByPracticeKey(expectedAfterSecondJumpKey),
    );
  });

  it('uses the configured complementary language in missing letters jumps', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Настройки практики' }));
    await user.click(screen.getByRole('combobox', {
      name: 'Дополняющий язык для English',
    }));
    await user.click(screen.getByRole('option', { name: /Español/ }));
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );

    await startExercise(user, 'Пропущенные буквы');

    const currentPrompt = getVisibleMissingLettersPrompt();
    await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
    const currentOption = screen.getByTestId(
      `exercise_finish_action__jump_option__${cardIdByAnswer(currentPrompt.answer)}__0`,
    );

    expect(currentOption).toHaveTextContent(currentPrompt.es);
    expect(currentOption).not.toHaveTextContent(currentPrompt.answer);
    expect(currentOption).not.toHaveTextContent(currentPrompt.ru);
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

  it('keeps programmed repeats out of jumps and labels repeat progress', async () => {
    const user = userEvent.setup();
    renderApp({
      attempts: [
        createStoredAttempt({
          cardId: 'card-airport',
          completedAt: '2026-07-03T13:00:00.000Z',
          isCorrect: false,
        }),
      ],
    });

    await startExercise(user, 'Пропущенные буквы');

    const initialJumpOrder = await getMissingLettersJumpOrder(user);
    expect(
      initialJumpOrder.filter((practiceKey) =>
        practiceKey.startsWith('card-airport__'),
      ),
    ).toHaveLength(1);

    expect(getVisibleMissingLettersPrompt().answer).toBe('airport');
    await answerMissingLettersWrong(user);
    await user.click(screen.getByRole('button', { name: 'Неверно' }));

    expect(getVisibleMissingLettersPrompt().answer).not.toBe('airport');
    await memorizeCurrentMissingLettersPrompt(user);

    expect(getVisibleMissingLettersPrompt().answer).toBe('airport');
    expect(
      screen.getByTestId('missing_letters_exercise__repeat_chip__card-airport'),
    ).toHaveTextContent('повтор (1/1)');

    await answerMissingLettersWrong(user);
    await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
    const updatedJumpOptions = getByDataTestPrefix(
      'exercise_finish_action__jump_option__',
    );

    expect(
      updatedJumpOptions.filter((option) =>
        option
          .getAttribute('data-test')
          ?.includes('exercise_finish_action__jump_option__card-airport__'),
      ),
    ).toHaveLength(1);
    expect(updatedJumpOptions.map((option) => option.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('аэропорт (2)')]),
    );
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

  it('saves a missing letters memorize result as an incorrect partial answer', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Пропущенные буквы');

    const firstPrompt = getVisibleMissingLettersPrompt();
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();
    expect(getVisibleMissingLettersPrompt().answer).toBe(firstPrompt.answer);
    expect(store.getState().attempts.attempts).toHaveLength(1);
    expect(
      store.getState().attempts.attempts[0].correctness[firstPrompt.cardId],
    ).toBe(false);
    expect(
      store.getState().attempts.attempts[0].answers[firstPrompt.cardId],
    ).toContain('_');
    expect(
      store
        .getState()
        .stats.cardStats.find((stat) => stat.cardId === firstPrompt.cardId)
        ?.incorrect,
    ).toBe(1);
    expect(
      screen.getByLabelText('Статистика по слову: Верно 0, Неверно 1'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Запомнить!' }));

    expect(getVisibleMissingLettersPrompt().answer).not.toBe(firstPrompt.answer);
  });

  it('excludes cards marked as known from missing letters games', async () => {
    const user = userEvent.setup();
    renderApp({
      cards: [
        {
          id: 'card-airport',
          translations: {
            en: 'airport',
            ru: 'аэропорт',
            es: 'aeropuerto',
          },
          knownTargetLanguages: ['en'],
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
      ],
    });

    await startExercise(user, 'Пропущенные буквы');

    expect(getVisibleMissingLettersPrompt().cardId).toBe('card-vehicle');
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
    expect(screen.getByRole('combobox', { name: 'Прыжки' })).toHaveTextContent(
      prompt.ru,
    );
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
    expect(screen.queryByRole('button', { name: 'Закончить игру' })).not.toBeInTheDocument();
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
    expect(
      within(tooltip).getByTestId('coach_panel__assistant_tooltip_title'),
    ).toHaveTextContent('Веселый листочек');
    expect(
      within(tooltip).getByTestId('coach_panel__assistant_tooltip_motto'),
    ).toHaveStyle({ fontStyle: 'italic' });

    const profileButton = within(tooltip).getByRole('button', {
      name: 'Познакомиться поближе',
    });
    expect(profileButton).toHaveStyle({ cursor: 'pointer' });

    await user.click(
      profileButton,
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

  it('keeps the card set list as an internal scroll area on the Cards page', async () => {
    const user = userEvent.setup();
    renderApp({
      cardSets: Array.from({ length: 18 }, (_, index) => ({
        id: `card-set-${index}`,
        name: `Набор ${index + 1}`,
        cardIds: ['card-airport'],
        createdAt: now,
        updatedAt: now,
      })),
    });

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    expect(screen.getByTestId('app__cards_section')).toHaveStyle({
      height: 'calc(100vh - 118px)',
      overflow: 'hidden',
    });
    expect(screen.getByTestId('card_set_list__panel')).toHaveStyle({
      display: 'flex',
      maxHeight: 'calc(100vh - 118px)',
    });
    expect(screen.getByTestId('card_set_list__tiles')).toHaveStyle({
      overflowY: 'auto',
    });
    expect(screen.getByTestId('card_set_list__tile__all-cards')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__all-cards')).toHaveStyle({
      flexShrink: '0',
    });
    expect(screen.getByTestId('card_set_list__tile__card-set-17')).toBeInTheDocument();
  });

  it('closes an unanswered exercise without a finish confirmation dialog', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await user.click(screen.getByRole('button', { name: 'Закончить игру' }));

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
      within(toolbar).queryByRole('button', { name: 'Закончить игру' }),
    ).not.toBeInTheDocument();
    const exerciseHeader = getByDataTestPrefix('missing_letters_exercise__header__')[0];
    expect(
      within(exerciseHeader).getByRole('button', { name: 'Закончить игру' }),
    ).toBeInTheDocument();
    expect(
      within(exerciseHeader).getByTestId('exercise_finish_action__note'),
    ).toHaveTextContent(
      'Можно делать гиперзвуковые прыжки между карточками.',
    );
    expect(
      screen.queryByRole('button', { name: 'Выберите игру' }),
    ).not.toBeInTheDocument();

    await user.click(
      within(exerciseHeader).getByRole('button', { name: 'Закончить игру' }),
    );

    expect(
      screen.getByText('Результаты игры будут зачтены, а игра закончена.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Отвечено слов: 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Закончить игру' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('forgets an active exercise from the finish confirmation dialog', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    expect(store.getState().attempts.attempts).toHaveLength(1);
    expect(store.getState().stats.cardStats).toHaveLength(1);

    const exerciseHeader = getByDataTestPrefix('missing_letters_exercise__header__')[0];
    await user.click(
      within(exerciseHeader).getByRole('button', { name: 'Закончить игру' }),
    );

    const forgetButton = screen.getByRole('button', { name: 'Забыть и выйти' });
    expect(forgetButton).toHaveStyle({
      marginRight: 'auto',
    });

    await user.hover(forgetButton);
    expect(
      await screen.findByText(
        'Эта игра не будет включена в статистику, если нажать эту кнопку.',
      ),
    ).toBeInTheDocument();

    await user.click(forgetButton);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
    expect(store.getState().attempts.attempts).toHaveLength(0);
    expect(store.getState().stats.cardStats).toHaveLength(0);
  });

  it('confirms finish after a missing letters memorize result', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();

    const exerciseHeader = getByDataTestPrefix('missing_letters_exercise__header__')[0];
    await user.click(
      within(exerciseHeader).getByRole('button', { name: 'Закончить игру' }),
    );

    expect(screen.getByRole('dialog', { name: 'Закончить игру' })).toBeInTheDocument();
    expect(screen.getByText('Отвечено слов: 1')).toBeInTheDocument();
  });

  it('confirms finish after a missing word memorize result', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();

    const exerciseHeader = getByDataTestPrefix('missing_word_exercise__header__')[0];
    await user.click(
      within(exerciseHeader).getByRole('button', { name: 'Закончить игру' }),
    );

    expect(screen.getByRole('dialog', { name: 'Закончить игру' })).toBeInTheDocument();
    expect(screen.getByText('Отвечено слов: 1')).toBeInTheDocument();
  });

  it('returns to the game setup through the Game tab and confirms answered exercises', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Играть' }));

    expect(
      screen.getByText('Результаты игры будут зачтены, а игра закончена.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Играть' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole('heading', { name: 'Выберите набор карточек' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Выберите игру' })).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });

  it('confirms before navigating to another top tab when an exercise has saved work', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    expect(screen.getByRole('dialog', { name: 'Закончить игру' })).toBeInTheDocument();
    expect(screen.getByText('Отвечено слов: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Закончить игру' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Игра: Пропущенные буквы' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    await waitFor(() =>
      expect(getByDataTestPrefix('card_set_detail__panel__')[0]).toBeInTheDocument(),
    );
  });

  it('navigates away from an untouched missing word exercise without a finish dialog', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');
    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    expect(screen.queryByRole('dialog', { name: 'Закончить игру' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getByDataTestPrefix('card_set_detail__panel__')[0]).toBeInTheDocument(),
    );
  });

  it('opens the finish dialog when returning from expanded statistics to an active game', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенные буквы');
    await answerMissingLettersWrong(user);

    await user.click(screen.getByRole('tab', { name: 'Статистика' }));
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    const attemptCard = getByDataTestPrefix('history_view__attempt_card__')[0];
    await user.click(
      within(attemptCard).getByRole('button', {
        name: /Пропущенные буквы/,
      }),
    );
    expect(screen.getByText('Детали игры')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Играть' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__panel')).toBeVisible();
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
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    expect(screen.queryByTestId('target_stats__language')).not.toBeInTheDocument();
    expect(screen.queryByTestId('target_stats__title')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__panel')).toHaveStyle({
      background:
        'linear-gradient(135deg, rgba(255, 251, 226, 0.76) 0%, rgba(237, 244, 255, 0.64) 52%, rgba(245, 238, 255, 0.7) 100%)',
    });
    expect(screen.getByTestId('target_stats__football_background')).toBeInTheDocument();
    expect(screen.getByTestId('target_stats__football_ball')).toBeInTheDocument();
    expect(screen.getByTestId('target_stats__football_spain_ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('target_stats__total_exercises__label')).toHaveTextContent(
      'Всего пройдено игр',
    );
    expect(screen.getByTestId('target_stats__total_exercises__label')).not.toHaveTextContent(
      ':',
    );
    expect(screen.queryByTestId('target_stats__total_exercises__value_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__total_exercises__value')).toHaveTextContent('1');
    expect(screen.getByTestId('target_stats__total_exercises__value')).toHaveStyle({
      fontSize: '42px',
    });
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
    expect(screen.queryByTestId('target_stats__answered_formula__total_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__answered_formula__total_value')).toHaveTextContent('2');
    expect(screen.getByTestId('target_stats__answered_formula__total_value')).toHaveStyle({
      fontSize: '42px',
    });
    expect(screen.getByTestId('target_stats__answered_formula__equals_icon')).toBeInTheDocument();
    expect(screen.queryByTestId('target_stats__answered_formula__correct_chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('target_stats__answered_formula__incorrect_chip')).toHaveTextContent(
      '2 неверно',
    );
    await user.hover(screen.getByTestId('target_stats__answered_formula__total_value'));
    expect(
      await screen.findByText('всего отвечено карточек во всех играх'),
    ).toBeInTheDocument();
    await user.unhover(screen.getByTestId('target_stats__answered_formula__total_value'));
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

    expect(screen.getByText('Детали игры')).toBeInTheDocument();
    expect(screen.queryByText('Ваш ответ:')).not.toBeInTheDocument();
  });

  it('shows crossword word-level result formula without the correct answers block', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Кроссворд');
    expect(screen.getByRole('button', { name: 'Отправить кроссворд' })).toBeDisabled();
    await fillAllCrosswordCells(user, 'x');
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
    expect(screen.getByTestId('card_set_library__panel')).toBeInTheDocument();
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

  it('closes a crossword without confirmation when no full word is answered', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Кроссворд');
    await user.type(screen.getAllByLabelText(/Crossword cell/)[0], 'x');

    await user.click(screen.getByRole('button', { name: 'Закончить игру' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_library__panel')).toBeInTheDocument();
    expect(
      store
        .getState()
        .attempts.attempts.some((attempt) => attempt.exerciseType === 'crossword'),
    ).toBe(false);
  });

  it('does not show hypersonic jumps guidance in crossword exercises', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Кроссворд');

    const crosswordHeader = screen.getByTestId('crossword_exercise__header');
    const finishActionSlot = screen.getByTestId(
      'crossword_exercise__finish_action_slot',
    );
    expect(
      within(finishActionSlot).getByRole('button', {
        name: 'Закончить игру',
      }),
    ).toBeInTheDocument();
    expect(
      within(finishActionSlot).getByTestId(
        'exercise_finish_action__finish_button_tip_anchor',
      ),
    ).toBeInTheDocument();
    expect(
      within(crosswordHeader).queryByText(
        'Можно делать гиперзвуковые прыжки между карточками.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(crosswordHeader).queryByTestId('exercise_finish_action__thought_bubble'),
    ).not.toBeInTheDocument();
    expect(
      within(crosswordHeader).queryByRole('combobox', { name: 'Прыжки' }),
    ).not.toBeInTheDocument();
  });

  it('counts unanswered crossword words as mistakes after submitting a partial crossword', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Кроссворд');
    await fillCrosswordCellsUntilProgress(user, '1 пройдено');
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));
    await user.click(screen.getByRole('button', { name: 'Закончить игру' }));

    const crosswordAttempt = store
      .getState()
      .attempts.attempts.find((attempt) => attempt.exerciseType === 'crossword');
    const entryCount = crosswordAttempt?.crosswordSnapshot?.puzzle.entries.length ?? 0;
    expect(Object.keys(crosswordAttempt?.correctness ?? {})).toHaveLength(entryCount);
    expect(Object.values(crosswordAttempt?.correctness ?? {})).toContain(false);
    expect(
      entryCount,
    ).toBeGreaterThan(1);
    expect(
      Object.values(crosswordAttempt?.crosswordSnapshot?.cellValues ?? {}).some(
        (value) => Boolean(value),
      ),
    ).toBe(true);
    expect(crosswordAttempt?.isExerciseCompleted).not.toBe(true);
    expect(store.getState().stats.cardStats.filter(
      (stat) => stat.targetLanguage === crosswordAttempt?.targetLanguage,
    )).toHaveLength(entryCount);
  });

  it('saves completed crossword words when finishing the exercise manually', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Кроссворд');
    await fillAllCrosswordCells(user, 'x');
    await user.click(screen.getByRole('button', { name: 'Закончить игру' }));

    expect(screen.getByText(/Отвечено слов: [1-9]/)).toBeInTheDocument();
    expect(
      screen.getByText('Заполненные целиком слова попадут в статистику.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    const crosswordAttempt = store
      .getState()
      .attempts.attempts.find((attempt) => attempt.exerciseType === 'crossword');
    expect(Object.keys(crosswordAttempt?.correctness ?? {}).length).toBeGreaterThan(0);
    expect(crosswordAttempt?.isExerciseCompleted).not.toBe(true);
  });

  it('uses phrases for missing word practice', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    expect(screen.queryByText(/I need to remember/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/).length).toBeGreaterThan(0);
  });

  it('shows zebra hypersonic jumps for missing word phrases', async () => {
    const user = userEvent.setup();
    renderApp();

    await startExercise(user, 'Пропущенное слово');

    expect(screen.getByRole('combobox', { name: 'Прыжки' })).toBeInTheDocument();
    const currentSentence = getVisibleMissingWordSentence();

    await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
    const jumpOptions = getByDataTestPrefix('exercise_finish_action__jump_option__');

    expect(jumpOptions).toHaveLength(2);
    expect(jumpOptions[0]).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    expect(jumpOptions[1]).toHaveStyle({ backgroundColor: 'rgb(250, 246, 255)' });
    expect(jumpOptions.map((option) => option.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('оно того стоит'),
        expect.stringContaining('с нетерпением ждать'),
      ]),
    );

    const nextPracticeKey =
      currentSentence === 'It is worth it today.'
        ? 'card-look-forward__0'
        : 'card-worth-it__0';
    const expectedSentence =
      currentSentence === 'It is worth it today.'
        ? 'I look forward to tomorrow.'
        : 'It is worth it today.';

    await user.click(
      screen.getByTestId(`exercise_finish_action__jump_option__${nextPracticeKey}`),
    );

    expect(getVisibleMissingWordSentence()).toBe(expectedSentence);
  });

  it('continues missing word from the latest selected jump', async () => {
    const user = userEvent.setup();
    renderApp({ cards: createMissingWordJumpCards() });

    await startExercise(user, 'Пропущенное слово');

    const initialJumpOrder = await getMissingWordJumpOrder(user);
    const firstJumpKey = initialJumpOrder[1];
    const expectedAfterFirstJumpKey = initialJumpOrder[2];
    if (!firstJumpKey || !expectedAfterFirstJumpKey) {
      throw new Error('Missing word jump order needs at least three prompts.');
    }

    await selectMissingWordJump(user, firstJumpKey);
    expect(getVisibleMissingWordCardId()).toBe(cardIdFromPracticeKey(firstJumpKey));
    await answerMissingWordCorrectByAnswer(
      user,
      missingWordAnswerByCardId(cardIdFromPracticeKey(firstJumpKey)),
    );
    await user.click(screen.getByRole('button', { name: 'Правильно!' }));

    expect(getVisibleMissingWordCardId()).toBe(
      cardIdFromPracticeKey(expectedAfterFirstJumpKey),
    );

    const secondJumpKey = initialJumpOrder[3];
    const expectedAfterSecondJumpKey = initialJumpOrder[0];
    if (!secondJumpKey || !expectedAfterSecondJumpKey) {
      throw new Error('Missing word jump order needs at least four prompts.');
    }

    await selectMissingWordJump(user, secondJumpKey);
    expect(getVisibleMissingWordCardId()).toBe(cardIdFromPracticeKey(secondJumpKey));
    await answerMissingWordCorrectByAnswer(
      user,
      missingWordAnswerByCardId(cardIdFromPracticeKey(secondJumpKey)),
    );
    await user.click(screen.getByRole('button', { name: 'Правильно!' }));

    expect(getVisibleMissingWordCardId()).toBe(
      cardIdFromPracticeKey(expectedAfterSecondJumpKey),
    );
  });

  it('uses control arrows for missing word jumps without submitting', async () => {
    const user = userEvent.setup();
    const store = renderApp({ cards: createMissingWordJumpCards() });

    await startExercise(user, 'Пропущенное слово');

    const jumpOrder = await getMissingWordJumpOrder(user);
    const currentKey = `${getVisibleMissingWordCardId()}__0`;
    const nextKey = getCircularJumpKey(jumpOrder, currentKey, 1);

    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true });

    await waitFor(() => {
      expect(getVisibleMissingWordCardId()).toBe(cardIdFromPracticeKey(nextKey));
    });
    expect(store.getState().attempts.attempts).toHaveLength(0);
  });

  it('uses command arrows for multiple choice jumps without selecting an answer', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Вопрос с 3 вариантами');

    const jumpOrder = await getMultipleChoiceJumpOrder(user);
    const currentCardId = getVisibleMultipleChoiceCardId();
    const nextCardId = getCircularJumpKey(jumpOrder, currentCardId, 1);

    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true });

    await waitFor(() => {
      expect(getVisibleMultipleChoiceCardId()).toBe(nextCardId);
    });
    expect(store.getState().attempts.attempts).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Правильно!' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Неверно' })).not.toBeInTheDocument();
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

  it('saves a missing word memorize result as an incorrect partial answer', async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await startExercise(user, 'Пропущенное слово');

    const firstPromptText = getVisibleMissingWordSentence();
    const firstCardId = getVisibleMissingWordCardId();
    await user.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(screen.getByRole('button', { name: 'Запомнить!' })).toBeInTheDocument();
    expect(store.getState().attempts.attempts).toHaveLength(1);
    expect(store.getState().attempts.attempts[0].correctness[firstCardId]).toBe(false);
    expect(store.getState().attempts.attempts[0].answers[firstCardId]).toContain('_');
    expect(
      screen.getByLabelText('Статистика по фразе: Верно 0, Неверно 1'),
    ).toBeInTheDocument();
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
      screen.queryByText('Карточки для этой игры закончились.'),
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
      screen.queryByText('Карточки для этой игры закончились.'),
    ).not.toBeInTheDocument();
  });
});

function getVisibleMissingLettersPrompt(): {
  answer: string;
  cardId: string;
  es: string;
  prompt: RegExp;
  ru: string;
} {
  const prompts = [
    {
      answer: 'airport',
      cardId: 'card-airport',
      es: 'aeropuerto',
      prompt: /аэропорт/,
      ru: 'аэропорт',
    },
    {
      answer: 'vehicle',
      cardId: 'card-vehicle',
      es: 'vehiculo',
      prompt: /транспортное средство/,
      ru: 'транспортное средство',
    },
    {
      answer: 'impede',
      cardId: 'card-impede',
      es: 'impedir',
      prompt: /препятствовать/,
      ru: 'препятствовать',
    },
    {
      answer: 'meditation',
      cardId: 'card-meditation',
      es: 'meditacion',
      prompt: /медитация/,
      ru: 'медитация',
    },
  ];
  const visiblePrompt = prompts.find((item) =>
    item.prompt.test(
      screen.queryByTestId(`missing_letters_exercise__prompt__${item.cardId}`)
        ?.textContent ?? '',
    ),
  );

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
  await selectCardSetByName(user, /All cards/);
}

async function selectCardSetByName(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp,
) {
  const directCardSetButton = screen.queryByRole('button', { name });
  if (directCardSetButton) {
    await user.click(directCardSetButton);
    return;
  }

  await user.click(screen.getByTestId('card_set_library__open_button'));
  await user.click(await screen.findByRole('button', { name }));
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

async function memorizeCurrentMissingLettersPrompt(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
  await user.click(screen.getByRole('button', { name: 'Запомнить!' }));
}

async function getMissingLettersJumpOrder(
  user: ReturnType<typeof userEvent.setup>,
): Promise<string[]> {
  await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
  const practiceKeys = getByDataTestPrefix('exercise_finish_action__jump_option__')
    .map((option) =>
      option
        .getAttribute('data-test')
        ?.replace('exercise_finish_action__jump_option__', ''),
    )
    .filter((practiceKey): practiceKey is string => Boolean(practiceKey));

  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  );

  return practiceKeys;
}

async function selectMissingLettersJump(
  user: ReturnType<typeof userEvent.setup>,
  practiceKey: string,
) {
  await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
  await user.click(
    screen.getByTestId(`exercise_finish_action__jump_option__${practiceKey}`),
  );
}

async function getMissingWordJumpOrder(
  user: ReturnType<typeof userEvent.setup>,
): Promise<string[]> {
  await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
  const practiceKeys = getByDataTestPrefix('exercise_finish_action__jump_option__')
    .map((option) =>
      option
        .getAttribute('data-test')
        ?.replace('exercise_finish_action__jump_option__', ''),
    )
    .filter((practiceKey): practiceKey is string => Boolean(practiceKey));

  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  );

  return practiceKeys;
}

async function selectMissingWordJump(
  user: ReturnType<typeof userEvent.setup>,
  practiceKey: string,
) {
  await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
  await user.click(
    screen.getByTestId(`exercise_finish_action__jump_option__${practiceKey}`),
  );
}

function getVisibleMissingWordCardId(): string {
  const panel = getByDataTestPrefix('missing_word_exercise__panel__')[0];
  const dataTest = panel?.getAttribute('data-test');
  if (!dataTest) {
    throw new Error('Missing word panel is not visible.');
  }

  return dataTest.replace('missing_word_exercise__panel__', '');
}

function cardIdFromPracticeKey(practiceKey: string): string {
  return practiceKey.replace(/__\d+$/, '');
}

function getCircularJumpKey(
  jumpOrder: string[],
  currentValue: string,
  direction: 1 | -1,
): string {
  const currentIndex = jumpOrder.indexOf(currentValue);
  if (currentIndex < 0) {
    throw new Error(`Current jump value is not in jump order: ${currentValue}`);
  }

  const nextIndex =
    (currentIndex + direction + jumpOrder.length) % jumpOrder.length;
  const nextValue = jumpOrder[nextIndex];
  if (!nextValue) {
    throw new Error('Jump order does not contain a next value.');
  }

  return nextValue;
}

function answerByPracticeKey(practiceKey: string): string {
  const cardId = cardIdFromPracticeKey(practiceKey);
  const answersByCardId: Record<string, string> = {
    'card-airport': 'airport',
    'card-vehicle': 'vehicle',
    'card-impede': 'impede',
    'card-meditation': 'meditation',
  };
  const answer = answersByCardId[cardId];

  if (!answer) {
    throw new Error(`Unknown practice key: ${practiceKey}`);
  }

  return answer;
}

function createMissingWordJumpCards() {
  return [
    createPhraseCard({
      answer: 'call back',
      id: 'phrase-call-back',
      sentence: 'I will call back later.',
    }),
    createPhraseCard({
      answer: 'come over',
      id: 'phrase-come-over',
      sentence: 'Can you come over tonight?',
    }),
    createPhraseCard({
      answer: 'figure out',
      id: 'phrase-figure-out',
      sentence: 'We can figure out the plan.',
    }),
    createPhraseCard({
      answer: 'hang out',
      id: 'phrase-hang-out',
      sentence: 'They hang out after work.',
    }),
  ];
}

function createPhraseCard({
  answer,
  id,
  sentence,
}: {
  answer: string;
  id: string;
  sentence: string;
}) {
  return {
    id,
    translations: {
      en: answer,
      ru: `${answer} ru`,
      es: `${answer} es`,
    },
    examples: {
      en: [{ sentence, answer }],
    },
    createdAt: now,
    updatedAt: now,
  };
}

function missingWordAnswerByCardId(cardId: string): string {
  const answer = createMissingWordJumpCards().find((card) => card.id === cardId)
    ?.translations.en;
  if (!answer) {
    throw new Error(`Unknown missing word card id: ${cardId}`);
  }

  return answer;
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
  await answerMissingWordCorrectByAnswer(user, answer);
}

async function answerMissingWordCorrectByAnswer(
  user: ReturnType<typeof userEvent.setup>,
  answer: string,
) {
  const editableIndexes = getMissingWordEditableIndexes(answer);
  const inputs = screen.getAllByLabelText(/Missing word letter/);
  for (const [index, input] of inputs.entries()) {
    await user.type(input, answer[editableIndexes[index]]);
  }
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
}

async function fillAllCrosswordCells(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const cells = screen.getAllByLabelText(/Crossword cell/);
  for (const cell of cells) {
    await user.clear(cell);
    await user.type(cell, value);
  }
}

async function fillCrosswordCellsUntilProgress(
  user: ReturnType<typeof userEvent.setup>,
  progressText: string,
) {
  const cells = screen.getAllByLabelText(/Crossword cell/);
  for (const cell of cells) {
    await user.clear(cell);
    await user.type(cell, 'x');
    if (
      screen
        .getByTestId('crossword_exercise__progress_chip')
        .textContent?.includes(progressText)
    ) {
      return;
    }
  }

  throw new Error(`Could not reach crossword progress: ${progressText}`);
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

async function getMultipleChoiceJumpOrder(
  user: ReturnType<typeof userEvent.setup>,
): Promise<string[]> {
  await user.click(screen.getByRole('combobox', { name: 'Прыжки' }));
  const cardIds = getByDataTestPrefix('exercise_finish_action__jump_option__')
    .map((option) =>
      option
        .getAttribute('data-test')
        ?.replace('exercise_finish_action__jump_option__', ''),
    )
    .filter((cardId): cardId is string => Boolean(cardId));

  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  );

  return cardIds;
}

function getVisibleMultipleChoiceCardId(): string {
  const panel = getByDataTestPrefix('multiple_choice_exercise__panel__')[0];
  const dataTest = panel?.getAttribute('data-test');
  if (!dataTest) {
    throw new Error('Multiple choice panel is not visible.');
  }

  return dataTest.replace('multiple_choice_exercise__panel__', '');
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
