// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { appReducer } from '../store/appSlice';
import type { ComplementaryLanguages } from '../store/appSlice';
import { attemptsReducer } from '../store/attemptsSlice';
import { cardsReducer } from '../store/cardsSlice';
import { cardSetsReducer } from '../store/cardSetsSlice';
import { statsReducer } from '../store/statsSlice';
import { aiAssistantReducer } from '../store/aiAssistantSlice';
import { executeAiReadTool } from '../domain/aiLibraryTools';

describe('large local datasets', () => {
  it('searches 10,000 cards through the bounded AI read tool', () => {
    const now = '2026-07-08T00:00:00.000Z';
    const cards = Array.from({ length: 10_000 }, (_, index) => ({
      id: `search-card-${String(index).padStart(5, '0')}`,
      translations: {
        en: `benchmark word ${String(index).padStart(5, '0')}`,
        ru: `тестовое слово ${String(index).padStart(5, '0')}`,
      },
      createdAt: now,
      updatedAt: now,
    }));

    const startedAt = performance.now();
    const result = executeAiReadTool(
      'search_cards',
      { cursor: 200, limit: 1_000, query: 'benchmark word' },
      { attempts: [], cards, cardSets: [], cardStats: [], interfaceLanguage: 'en' },
    );
    const elapsedMs = performance.now() - startedAt;

    expect(result).toMatchObject({
      cursor: 200,
      limit: 100,
      nextCursor: 300,
      total: 10_000,
    });
    expect((result as { items: typeof cards }).items).toHaveLength(100);
    expect((result as { items: typeof cards }).items[0]?.id).toBe(
      'search-card-00200',
    );
    const resultItems = (result as { items: typeof cards }).items;
    expect(resultItems[resultItems.length - 1]?.id).toBe('search-card-00299');
    expect(elapsedMs).toBeLessThan(1_000);
  });

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

  it('keeps the game start button usable with a large dataset', async () => {
    const user = userEvent.setup();
    renderLargeApp(2000);

    await user.click(
      screen.getByTestId('card_set_library__chip_select__large-test-set'),
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
      aiAssistant: aiAssistantReducer,
    },
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        assistantId: 'studyTroll' as const,
        complementaryLanguages: {
          en: ['ru'],
          ru: ['en'],
          es: ['en'],
          uk: ['ru'],
        } satisfies ComplementaryLanguages,
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
        cardSets: [
          {
            id: 'large-test-set',
            name: 'Large Test Set',
            cardIds: Array.from({ length: cardCount }, (_, i) => `large-card-${i}`),
            createdAt: now,
            updatedAt: now,
          },
        ],
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
