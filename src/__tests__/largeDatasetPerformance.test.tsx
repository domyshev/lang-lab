import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { appReducer } from '../store/appSlice';
import { attemptsReducer } from '../store/attemptsSlice';
import { cardsReducer } from '../store/cardsSlice';
import { cardSetsReducer } from '../store/cardSetsSlice';
import { statsReducer } from '../store/statsSlice';

describe('large local datasets', () => {
  it('keeps all-cards card detail rendering virtualized', async () => {
    const user = userEvent.setup();
    const { container } = renderLargeApp(2000);

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    expect(
      screen.getByTestId('card_set_detail__virtualized_cards_list__all-cards'),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-test^="card_set_detail__card_item__"]')
        .length,
    ).toBeLessThan(80);
  });

  it('keeps the game start button usable for all cards', async () => {
    const user = userEvent.setup();
    renderLargeApp(2000);

    await user.click(
      screen.getByRole('button', { name: 'Набор карточек: All cards' }),
    );
    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));

    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });
});

function renderLargeApp(cardCount: number) {
  const now = '2026-07-08T00:00:00.000Z';
  const store = configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        assistantId: 'studyTroll' as const,
        complementaryLanguages: { en: 'ru', ru: 'en', es: 'en' } as const,
        interfaceLanguage: 'ru' as const,
        playerProfile: {
          avatarSeed: 'test-player',
          displayName: 'Тест',
          isAnonymous: false,
        },
        targetLanguage: 'en' as const,
      },
      cards: {
        cards: Array.from({ length: cardCount }, (_, index) => ({
          id: `large-card-${index}`,
          translations: {
            en: `word${String(index).padStart(4, '0')}`,
            ru: `слово${String(index).padStart(4, '0')}`,
            es: `palabra${String(index).padStart(4, '0')}`,
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

  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
