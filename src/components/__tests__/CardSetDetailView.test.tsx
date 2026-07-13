import { configureStore } from '@reduxjs/toolkit';
import { fireEvent } from '@testing-library/react';
import { render, screen, within } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExerciseAttempt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { CardSetDetailView } from '../CardSetDetailView';

const now = '2026-07-04T00:00:00.000Z';

describe('CardSetDetailView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sorts cards by total target attempts and shows compact kind chips with recent stats tooltips', async () => {
    const { container } = render(
      <Provider store={createStore()}>
        <CardSetDetailView />
      </Provider>,
    );

    const items = getByDataTestPrefix(container, 'card_set_detail__card_item__');
    expect(within(items[0]).getByText('impede')).toBeInTheDocument();
    expect(within(items[1]).getByText('worth it')).toBeInTheDocument();
    expect(within(items[2]).getByText('airport')).toBeInTheDocument();

    const phraseChip = within(items[1]).getByTestId(
      'card_set_detail__card_kind_chip__card-worth-it',
    );
    expect(phraseChip.parentElement).toHaveStyle({ alignItems: 'center' });
    expect(phraseChip).toHaveStyle({ height: '30px' });
    expect(screen.getByTestId('card_set_detail__cards_list__all-cards')).toHaveStyle({
      overflowY: 'auto',
    });

    const statsChip = within(items[0]).getByTestId(
      'card_set_detail__card_stats__card-impede__root',
    );

    fireEvent.mouseOver(statsChip, { clientX: 220, clientY: 120 });

    const tooltip = await screen.findByTestId(
      'card_set_detail__card_stats__card-impede__recent_tooltip',
    );

    expect(within(tooltip).getByText('20 последних ответов')).toBeInTheDocument();
    expect(
      within(tooltip).getByTestId(
        'card_set_detail__card_stats__card-impede__recent_tooltip_subject',
      ),
    ).toHaveTextContent('impede');
    expect(
      tooltip.querySelectorAll(
        '[data-test^="card_set_detail__card_stats__card-impede__recent_result__"]',
      ),
    ).toHaveLength(20);
    expect(
      screen.getByTestId('card_set_detail__card_stats__card-impede__tooltip_arrow'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'card_set_detail__card_stats__card-impede__recent_results',
      ),
    ).toHaveStyle({ overflowY: 'auto' });
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-popper-placement',
      expect.stringContaining('right'),
    );

    fireEvent.mouseLeave(statsChip);
    fireEvent.mouseOver(
      within(items[1]).getByTestId('card_set_detail__card_stats__card-worth-it__root'),
      { clientX: 240, clientY: 120 },
    );

    expect(
      screen.queryByTestId(
        'card_set_detail__card_stats__card-impede__recent_tooltip',
      ),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByTestId(
        'card_set_detail__card_stats__card-worth-it__recent_tooltip',
      ),
    ).toBeInTheDocument();
  });

  it('keeps the card stats tooltip open while the pointer moves from the chip into the tooltip', async () => {
    const { container } = render(
      <Provider store={createStore()}>
        <CardSetDetailView />
      </Provider>,
    );

    const items = getByDataTestPrefix(container, 'card_set_detail__card_item__');
    const statsChip = within(items[0]).getByTestId(
      'card_set_detail__card_stats__card-impede__root',
    );
    const tooltipAnchor = within(items[0]).getByTestId(
      'card_set_detail__card_stats__card-impede__tooltip_anchor',
    );

    fireEvent.mouseOver(statsChip, { clientX: 220, clientY: 120 });

    const tooltip = await screen.findByTestId(
      'card_set_detail__card_stats__card-impede__recent_tooltip',
    );

    expect(tooltipAnchor).toHaveAttribute('data-anchor-x', '220');
    expect(tooltipAnchor).toHaveAttribute('data-anchor-y', '120');
    expect(
      screen.queryByTestId(
        'card_set_detail__card_stats__card-impede__tooltip_arrow__hover_bridge',
      ),
    ).not.toBeInTheDocument();

    fireEvent.mouseMove(statsChip, { clientX: 260, clientY: 122 });

    expect(tooltipAnchor).toHaveAttribute('data-anchor-x', '220');
    expect(tooltipAnchor).toHaveAttribute('data-anchor-y', '120');
    expect(
      screen.queryByTestId(
        'card_set_detail__card_stats__card-impede__tooltip_arrow__hover_bridge',
      ),
    ).not.toBeInTheDocument();

    fireEvent.mouseLeave(tooltipAnchor, { clientX: 264, clientY: 122 });
    expect(tooltip).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'card_set_detail__card_stats__card-impede__tooltip_arrow__hover_bridge',
      ),
    ).toHaveStyle({
      left: '216px',
      width: '118px',
    });

    fireEvent.mouseEnter(tooltip, { clientX: 302, clientY: 122 });
    fireEvent.mouseMove(tooltip, { clientX: 316, clientY: 148 });
    expect(tooltip).toBeInTheDocument();

    fireEvent.mouseLeave(tooltip, { clientX: 340, clientY: 190 });
    await waitFor(() =>
      expect(
        screen.queryByTestId(
          'card_set_detail__card_stats__card-impede__recent_tooltip',
        ),
      ).not.toBeInTheDocument(),
    );
  });

  it('edits a custom card set with checkboxes, filters by search, and shows non-target translations', async () => {
    const user = userEvent.setup();
    const store = createStore({
      selectedCardSetId: 'card-set-road',
      cardSets: [
        {
          id: 'card-set-road',
          name: 'Road',
          cardIds: ['card-airport', 'card-worth-it'],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    render(
      <Provider store={store}>
        <CardSetDetailView />
      </Provider>,
    );

    expect(screen.queryByTestId('card_set_detail__add_card_form__card-set-road')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_detail__card_count_chip__card-set-road')).toHaveStyle({
      borderColor: '#6f4bd8',
      color: '#5e3fc0',
    });
    expect(screen.getByTestId('card_set_detail__card_language_note__card-airport')).toHaveTextContent(
      'ru: аэропорт / es: aeropuerto',
    );

    await user.type(screen.getByRole('textbox', { name: 'Поиск карточек' }), 'оно');

    expect(screen.queryByText('airport')).not.toBeInTheDocument();
    expect(screen.getByText('worth it')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Очистить поиск карточек' }));
    expect(screen.getByRole('textbox', { name: 'Поиск карточек' })).toHaveValue('');
    expect(screen.getByText('airport')).toBeInTheDocument();
    expect(screen.getByText('worth it')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Редактировать карточки' }));

    expect(screen.getByText('impede')).toBeInTheDocument();
    expect(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-airport'),
    ).toBeChecked();
    expect(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-impede'),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Сохранить карточки' })).toBeDisabled();

    await user.click(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-airport'),
    );
    await user.click(
      screen.getByTestId('card_set_detail__card_select_checkbox__card-impede'),
    );

    expect(screen.getByRole('button', { name: 'Сохранить карточки' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Сохранить карточки' }));

    expect(
      store
        .getState()
        .cardSets.cardSets.find((cardSet) => cardSet.id === 'card-set-road')
        ?.cardIds,
    ).toEqual(['card-worth-it', 'card-impede']);
    expect(screen.queryByText('airport')).not.toBeInTheDocument();
    expect(screen.getByText('impede')).toBeInTheDocument();
  });

  it('toggles the known marker for the current target language', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <CardSetDetailView />
      </Provider>,
    );

    const airportKnownButton = screen.getByTestId(
      'card_set_detail__known_button__card-airport',
    );

    expect(airportKnownButton).toHaveAttribute('aria-pressed', 'false');

    await user.hover(airportKnownButton);
    expect(
      await screen.findByText(
        'Такие карточки не будут участвовать в играх. Снять признак можно в разделе Карточки.',
      ),
    ).toBeInTheDocument();

    await user.click(airportKnownButton);

    expect(
      store
        .getState()
        .cards.cards.find((card) => card.id === 'card-airport')
        ?.knownTargetLanguages,
    ).toEqual(['en']);
    expect(airportKnownButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(airportKnownButton);

    expect(
      store
        .getState()
        .cards.cards.find((card) => card.id === 'card-airport')
        ?.knownTargetLanguages,
    ).toEqual([]);
    expect(airportKnownButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('offers to add cards for an empty custom card set and wraps long phrase cards', () => {
    const { unmount } = render(
      <Provider
        store={createStore({
          selectedCardSetId: 'card-set-empty',
          cardSets: [
            {
              id: 'card-set-empty',
              name: 'Empty',
              cardIds: [],
              createdAt: now,
              updatedAt: now,
            },
          ],
        })}
      >
        <CardSetDetailView />
      </Provider>,
    );

    expect(screen.getByRole('button', { name: 'Добавить карточки' })).toBeInTheDocument();
    unmount();

    render(
      <Provider
        store={createStore({
          selectedCardSetId: 'card-set-long',
          cardSets: [
            {
              id: 'card-set-long',
              name: 'Long phrases',
              cardIds: ['card-long-phrase'],
              createdAt: now,
              updatedAt: now,
            },
          ],
        })}
      >
        <CardSetDetailView />
      </Provider>,
    );

    expect(
      screen.getByTestId('card_set_detail__card_header__card-long-phrase'),
    ).toHaveStyle({ flexWrap: 'wrap' });
    expect(
      screen.getByTestId('card_set_detail__card_text_block__card-long-phrase'),
    ).toHaveStyle({ minWidth: '0' });
    expect(
      screen.getByTestId('card_set_detail__card_answer__card-long-phrase'),
    ).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
  });

  it('virtualizes a large all-cards list instead of mounting every row', async () => {
    const store = createStoreWithLargeCardList(2000);
    const { container } = render(
      <Provider store={store}>
        <CardSetDetailView />
      </Provider>,
    );

    expect(
      screen.getByTestId('card_set_detail__virtualized_cards_list__all-cards'),
    ).toBeInTheDocument();
    expect(await screen.findByText('word 0000')).toBeInTheDocument();
    expect(
      getByDataTestPrefix(container, 'card_set_detail__card_item__').length,
    ).toBeLessThan(80);
  });

  it('opens archived card sets read-only and can create an active copy', async () => {
    const user = userEvent.setup();
    const store = createStore({
      selectedCardSetId: 'card-set-archived',
      cardSets: [
        {
          id: 'card-set-archived',
          name: 'Archived love',
          cardIds: ['card-airport', 'card-worth-it'],
          createdAt: now,
          updatedAt: now,
          archivedAt: '2026-07-04T12:00:00.000Z',
        },
      ],
    });

    render(
      <Provider store={store}>
        <CardSetDetailView />
      </Provider>,
    );

    expect(
      screen.getByTestId('card_set_detail__archived_chip__card-set-archived'),
    ).toHaveTextContent('Заархивировано');
    expect(
      screen.queryByRole('button', { name: 'Редактировать карточки' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('airport')).toBeInTheDocument();
    expect(screen.getByText('worth it')).toBeInTheDocument();

    vi.stubGlobal('crypto', { randomUUID: undefined });
    await user.click(screen.getByRole('button', { name: 'Создать активную копию' }));

    const copied = store
      .getState()
      .cardSets.cardSets.find(
        (cardSet) =>
          cardSet.id !== 'card-set-archived' && cardSet.name === 'Archived love',
      );
    expect(copied?.archivedAt).toBeUndefined();
    expect(copied?.cardIds).toEqual(['card-airport', 'card-worth-it']);
  });
});

function getByDataTestPrefix(container: HTMLElement, prefix: string): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(`[data-test^="${prefix}"]`),
  );
}

function createStore({
  selectedCardSetId,
  cardSets = [],
}: {
  selectedCardSetId?: string;
  cardSets?: Array<{
    id: string;
    name: string;
    cardIds: string[];
    createdAt: string;
    updatedAt: string;
    archivedAt?: string;
  }>;
} = {}) {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      cards: {
        cards: [
          {
            id: 'card-airport',
            translations: { en: 'airport', ru: 'аэропорт', es: 'aeropuerto' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-worth-it',
            translations: {
              en: 'worth it',
              ru: 'оно того стоит',
              es: 'vale la pena',
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-impede',
            translations: { en: 'impede', ru: 'затруднять', es: 'impedir' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'card-long-phrase',
            translations: {
              en: 'I seem to not get you out of my head',
              ru: 'кажется, я не могу выбросить тебя из головы',
              es: 'parece que no puedo sacarte de mi cabeza',
            },
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
      cardSets: {
        cardSets,
        selectedCardSetId,
      },
    },
  });
}

function createStoreWithLargeCardList(count: number) {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        assistantId: 'studyTroll' as const,
        complementaryLanguages: { en: 'ru', ru: 'en', es: 'en' } as const,
        interfaceLanguage: 'ru' as const,
        targetLanguage: 'en' as const,
      },
      cards: {
        cards: Array.from({ length: count }, (_, index) => ({
          id: `large-card-${index}`,
          translations: {
            en: `word ${String(index).padStart(4, '0')}`,
            ru: `слово ${String(index).padStart(4, '0')}`,
            es: `palabra ${String(index).padStart(4, '0')}`,
          },
          createdAt: now,
          updatedAt: now,
        })),
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      attempts: { attempts: [] },
      stats: { cardStats: [] },
      cardSets: {
        cardSets: [],
        selectedCardSetId: 'all-cards',
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
      cardSetId: 'all-cards',
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
