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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SERVER_API_KEY_STORAGE_KEY,
  ServerDataGate,
  useServerSync,
} from '../ServerDataGate';
import { aiAssistantReducer } from '../../store/aiAssistantSlice';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { defaultPracticeSettings } from '../../domain/practiceOrdering';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function createTestStore() {
  return configureStore({
    reducer: {
      aiAssistant: aiAssistantReducer,
      app: appReducer,
      attempts: attemptsReducer,
      cardSets: cardSetsReducer,
      cards: cardsReducer,
      stats: statsReducer,
    },
  });
}

describe('ServerDataGate', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('blocks the app until a backend connection is configured and accepted', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ServerDataGate>
          <div data-test="protected-app">Language Lab app</div>
        </ServerDataGate>
      </Provider>,
    );

    expect(screen.getByTestId('protected-app')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Server connection required' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Server endpoint')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();
  });

  it('loads backend state automatically when a token is already saved', async () => {
    const store = createTestStore();
    const localWorldId = store.getState().app.worldId;
    window.localStorage.setItem(SERVER_API_KEY_STORAGE_KEY, 'existing-token');
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          revision: 7,
          user: {
            uid: 'user-server',
            registeredAtUtc: '2026-07-14T10:00:00.000Z',
            revision: 7,
          },
          state: {
            attempts: [],
            cards: [
              {
                createdAt: '2026-07-14T10:00:00.000Z',
                id: 'card-server',
                translations: { en: 'server' },
                updatedAt: '2026-07-14T10:00:00.000Z',
              },
            ],
            cardSets: [
              {
                cardIds: ['card-server'],
                createdAt: '2026-07-14T10:00:00.000Z',
                id: 'set-server',
                name: 'Server set',
                updatedAt: '2026-07-14T10:00:00.000Z',
              },
            ],
            settings: {
              complementaryLanguages: { en: ['ru'] },
              interfaceLanguage: 'ru',
              playerProfile: {
                displayName: 'Ilya',
                isAnonymous: false,
              },
              practiceSettings: {
                correctStreakCooldownMonths: {
                  fivePlus: 6,
                  four: 3,
                  three: 1.5,
                },
                newCardMixFrequencyPercent: 25,
                recentMistakeRepeatFrequencyPercent: 45,
              },
              selectedCardSetId: 'set-server',
              targetLanguage: 'en',
            },
            stats: [],
          },
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <Provider store={store}>
        <ServerDataGate>
          <div data-test="protected-app">Language Lab app</div>
        </ServerDataGate>
      </Provider>,
    );

    expect(await screen.findByTestId('protected-app')).toBeInTheDocument();
    expect(window.localStorage.getItem(SERVER_API_KEY_STORAGE_KEY)).toBe(
      'existing-token',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8090/api/state',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'existing-token' }),
        method: 'GET',
      }),
    );

    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(1);
    });
    expect(store.getState().app.interfaceLanguage).toBe('ru');
    expect(store.getState().app.worldId).toBe(localWorldId);
    expect(store.getState().cardSets.selectedCardSetId).toBe('set-server');
  });

  it('treats a valid server token without a profile as an anonymous loaded user', async () => {
    const store = createTestStore();
    window.localStorage.setItem(SERVER_API_KEY_STORAGE_KEY, 'legacy-token');
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          revision: 3,
          user: {
            uid: 'legacy-user',
            registeredAtUtc: '2026-07-14T10:00:00.000Z',
            revision: 3,
          },
          state: {
            attempts: [],
            cards: [
              {
                createdAt: '2026-07-14T10:00:00.000Z',
                id: 'card-legacy',
                translations: { en: 'legacy' },
                updatedAt: '2026-07-14T10:00:00.000Z',
              },
            ],
            cardSets: [],
            settings: {
              complementaryLanguages: { en: ['ru'] },
              interfaceLanguage: 'ru',
              practiceSettings: {
                correctStreakCooldownMonths: {
                  fivePlus: 6,
                  four: 3,
                  three: 1.5,
                },
                newCardMixFrequencyPercent: 25,
                recentMistakeRepeatFrequencyPercent: 45,
              },
              targetLanguage: 'en',
            },
            stats: [],
          },
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <Provider store={store}>
        <ServerDataGate>
          <div data-test="protected-app">Language Lab app</div>
        </ServerDataGate>
      </Provider>,
    );

    expect(await screen.findByTestId('protected-app')).toBeInTheDocument();
    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(1);
    });
    expect(store.getState().app.playerProfile).toMatchObject({
      isAnonymous: true,
    });
  });

  it('creates a backend user, saves the generated token, and exposes it to the app', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url).endsWith('/api/users')) {
        return new Response(
          JSON.stringify({
            apiKey: 'generated-token-123',
            revision: 0,
            user: {
              uid: 'user-new',
              registeredAtUtc: '2026-07-14T10:00:00.000Z',
              revision: 0,
            },
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 201 },
        );
      }
      return new Response(JSON.stringify({ revision: 1 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    function CreateUserButton() {
      const serverSync = useServerSync();
      return (
        <button
          type="button"
          onClick={() =>
            void serverSync.createUser({
              attempts: [],
              cards: [],
              cardSets: [],
              settings: {
                complementaryLanguages: {
                  en: ['ru'],
                  es: ['ru', 'en', 'uk'],
                  ru: ['en', 'es', 'uk'],
                  uk: ['ru', 'en', 'es'],
                },
                interfaceLanguage: 'en',
                playerProfile: {
                  displayName: 'New Player',
                  isAnonymous: false,
                },
                practiceSettings: {
                  ...defaultPracticeSettings,
                  correctStreakCooldownMonths: {
                    fivePlus: 2,
                    four: 1,
                    three: 0.5,
                  },
                  newCardMixFrequencyPercent: 25,
                  recentMistakeRepeatFrequencyPercent: 25,
                },
                targetLanguage: 'en',
              },
              stats: [],
            })
          }
        >
          Create user
        </button>
      );
    }

    render(
      <Provider store={store}>
        <ServerDataGate>
          <CreateUserButton />
        </ServerDataGate>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => {
      expect(window.localStorage.getItem(SERVER_API_KEY_STORAGE_KEY)).toBe(
        'generated-token-123',
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8090/api/users',
      expect.objectContaining({
        body: expect.stringContaining('New Player'),
        method: 'POST',
      }),
    );
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument();
  });
});
