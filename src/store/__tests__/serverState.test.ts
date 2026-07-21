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
