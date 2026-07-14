import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SERVER_API_KEY_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
  ServerDataGate,
} from '../ServerDataGate';
import { aiAssistantReducer } from '../../store/aiAssistantSlice';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';

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

    expect(screen.queryByTestId('protected-app')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Server connection required' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Server endpoint')).toBeInTheDocument();
    expect(screen.getByLabelText('API key')).toBeInTheDocument();
  });

  it('loads backend state after connecting and remembers only connection credentials locally', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const localWorldId = store.getState().app.worldId;
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

    await user.clear(screen.getByLabelText('Server endpoint'));
    await user.type(screen.getByLabelText('Server endpoint'), 'http://127.0.0.1:8090');
    await user.type(screen.getByLabelText('API key'), 'sqlite-test-key');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByTestId('protected-app')).toBeInTheDocument();
    expect(window.localStorage.getItem(SERVER_ENDPOINT_STORAGE_KEY)).toBe(
      'http://127.0.0.1:8090',
    );
    expect(window.localStorage.getItem(SERVER_API_KEY_STORAGE_KEY)).toBe(
      'sqlite-test-key',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8090/api/state',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'sqlite-test-key' }),
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
});
