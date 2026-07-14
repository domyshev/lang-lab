import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { CardSetListView } from '../CardSetListView';

const now = '2026-07-12T10:00:00.000Z';

function renderList({ worldId = 'football' }: { worldId?: 'football' | 'forest' } = {}) {
  const store = configureStore({
    reducer: {
      app: appReducer,
      cards: cardsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        interfaceLanguage: 'en' as const,
        targetLanguage: 'en' as const,
        worldId,
      },
      cards: {
        cards: [
          { id: 'card-a', translations: { en: 'love', ru: 'любовь' }, createdAt: now, updatedAt: now },
          {
            id: 'card-known',
            translations: { en: 'cherish', ru: 'лелеять' },
            knownTargetLanguages: ['en' as const],
            createdAt: now,
            updatedAt: now,
          },
        ],
        pendingDuplicates: [],
        duplicateProcessingHistory: [],
      },
      cardSets: {
        selectedCardSetId: 'all-cards',
        cardSets: [
          {
            id: 'set-love',
            name: 'Love',
            names: { en: 'Love', ru: 'Любовь' },
            cardIds: ['card-a', 'card-known'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'set-old-love',
            name: 'Old Love',
            names: { en: 'Love archive', ru: 'Старая любовь' },
            cardIds: ['card-a', 'card-known'],
            createdAt: now,
            updatedAt: now,
            archivedAt: '2026-07-12T11:00:00.000Z',
          },
          {
            id: 'set-family',
            name: 'Family',
            names: { en: 'Family', ru: 'Семья', es: 'Familia' },
            cardIds: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    },
  });

  render(
    <Provider store={store}>
      <CardSetListView />
    </Provider>,
  );
  return store;
}

describe('CardSetListView archive browsing', () => {
  it('filters active and archived card sets and searches localized names', async () => {
    const user = userEvent.setup();
    renderList();

    expect(screen.getByTestId('card_set_list__tile__all-cards')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-love')).toBeInTheDocument();
    expect(screen.queryByTestId('card_set_list__tile__set-old-love')).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search card sets' }), 'сем');
    expect(screen.queryByTestId('card_set_list__tile__all-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card_set_list__tile__set-love')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-family')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear card set search' }));
    expect(screen.getByRole('textbox', { name: 'Search card sets' })).toHaveValue('');
    expect(screen.getByTestId('card_set_list__tile__all-cards')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-love')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-family')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Archived' }));

    expect(screen.queryByTestId('card_set_list__tile__all-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card_set_list__tile__set-love')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-old-love')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('card_set_list__tile__set-old-love')).queryByLabelText(/В архив/),
    ).not.toBeInTheDocument();
  });

  it('excludes cards marked as known for the target language from card set tile counts', () => {
    renderList();

    expect(
      screen.getByTestId('card_set_list__tile_card_count__all-cards'),
    ).toHaveTextContent('1 card');
    expect(
      screen.getByTestId('card_set_list__tile_card_count__set-love'),
    ).toHaveTextContent('1 card');
    expect(
      screen.getByTestId('card_set_list__tile_card_count__set-family'),
    ).toHaveTextContent('0 cards');
  });

  it('uses the forest green palette for the add button and keeps the selected card-set frame', () => {
    renderList({ worldId: 'forest' });

    expect(screen.getByTestId('card_set_list__add_button')).toHaveStyle({
      background: 'linear-gradient(180deg, #ffffff 0%, #e9ffd1 22%, #9ed54c 58%, #67a13f 100%)',
      borderTopColor: 'rgba(255, 255, 255, 0.92)',
      color: '#183813',
    });
    expect(screen.getByTestId('card_set_list__tile__all-cards')).toHaveStyle({
      borderColor: '#a989df',
    });
  });

  it('creates an active copy from an archived card set', async () => {
    const user = userEvent.setup();
    const store = renderList();

    await user.click(screen.getByRole('checkbox', { name: 'Archived' }));
    await user.click(screen.getByRole('button', { name: 'Create active copy: Love archive' }));

    const cardSetState = store.getState().cardSets;
    const copied = cardSetState.cardSets.find(
      (cardSet) => cardSet.id === cardSetState.selectedCardSetId,
    );
    expect(copied?.id).not.toBe('set-old-love');
    expect(copied?.id).not.toBe('set-love');
    expect(copied).toMatchObject({
      name: 'Old Love',
      cardIds: ['card-a', 'card-known'],
    });
    expect(copied).not.toHaveProperty('archivedAt');
  });
});
