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

import { ALL_CARDS_CARD_SET_ID } from '../domain/cardSets';
import { getPracticeSettings } from '../domain/practiceOrdering';
import type { ServerStatePayload } from '../services/serverSyncClient';
import {
  replaceBackendAppSettings,
  type BackendAppSettings,
} from './appSlice';
import { replaceAttemptsState } from './attemptsSlice';
import { replaceCardSetsState } from './cardSetsSlice';
import { replaceCardsState } from './cardsSlice';
import { replaceStatsState } from './statsSlice';
import type { AppDispatch, RootState } from './store';

export function applyServerState(
  dispatch: AppDispatch,
  payload: ServerStatePayload,
) {
  dispatch(
    replaceBackendAppSettings({
      assistantId: payload.settings.assistantId,
      complementaryLanguages: payload.settings.complementaryLanguages,
      interfaceLanguage: payload.settings.interfaceLanguage,
      openRouterApiKey: payload.settings.openRouterApiKey,
      playerProfile: payload.settings.playerProfile,
      practiceSettings: payload.settings.practiceSettings,
      targetLanguage: payload.settings.targetLanguage,
      worldId: payload.settings.worldId,
    }),
  );
  dispatch(
    replaceCardsState({
      cards: payload.cards,
      duplicateProcessingHistory: [],
      pendingDuplicates: [],
    }),
  );
  dispatch(
    replaceCardSetsState({
      cardSets: payload.cardSets,
      selectedCardSetId:
        payload.settings.selectedCardSetId ?? ALL_CARDS_CARD_SET_ID,
    }),
  );
  dispatch(replaceAttemptsState({ attempts: payload.attempts }));
  dispatch(replaceStatsState({ cardStats: payload.stats }));
}

export function selectServerState(state: RootState): ServerStatePayload {
  return {
    attempts: state.attempts.attempts,
    cards: state.cards.cards,
    cardSets: state.cardSets.cardSets,
    settings: {
      ...selectBackendSettings(state),
      selectedCardSetId: state.cardSets.selectedCardSetId,
    },
    stats: state.stats.cardStats,
  };
}

function selectBackendSettings(state: RootState): BackendAppSettings {
  return {
    assistantId: state.app.assistantId,
    complementaryLanguages: state.app.complementaryLanguages,
    interfaceLanguage: state.app.interfaceLanguage,
    openRouterApiKey: state.app.openRouterApiKey,
    playerProfile: state.app.playerProfile
      ? {
          displayName: state.app.playerProfile.displayName,
          isAnonymous: state.app.playerProfile.isAnonymous,
        }
      : undefined,
    practiceSettings: getPracticeSettings(state.app.practiceSettings),
    targetLanguage: state.app.targetLanguage,
    worldId: state.app.worldId,
  };
}

export function stableServerStateString(state: ServerStatePayload): string {
  return stableStringify(state);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
