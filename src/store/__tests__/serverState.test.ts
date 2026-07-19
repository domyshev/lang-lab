import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { defaultComplementaryLanguages } from '../appSlice';
import { applyServerState } from '../serverState';
import { rootReducer } from '../store';
import { defaultPracticeSettings } from '../../domain/practiceOrdering';
import type { ServerStatePayload } from '../../services/serverSyncClient';

describe('server state bridge', () => {
  it('restores backend-owned world and assistant settings on refresh', () => {
    const store = configureStore({ reducer: rootReducer });
    const payload: ServerStatePayload = {
      attempts: [],
      cards: [],
      cardSets: [],
      settings: {
        assistantId: 'greenPower',
        complementaryLanguages: defaultComplementaryLanguages,
        interfaceLanguage: 'ru',
        openRouterApiKey: 'sk-or-server-user',
        practiceSettings: defaultPracticeSettings,
        targetLanguage: 'es',
        worldId: 'starTrek',
      },
      stats: [],
    };

    applyServerState(store.dispatch, payload);

    expect(store.getState().app.assistantId).toBe('greenPower');
    expect(store.getState().app.worldId).toBe('starTrek');
    expect(store.getState().app.openRouterApiKey).toBe('sk-or-server-user');
    expect(store.getState().app.interfaceLanguage).toBe('ru');
    expect(store.getState().app.targetLanguage).toBe('es');
  });
});
