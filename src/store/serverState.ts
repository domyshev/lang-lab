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
      complementaryLanguages: payload.settings.complementaryLanguages,
      interfaceLanguage: payload.settings.interfaceLanguage,
      playerProfile: payload.settings.playerProfile,
      practiceSettings: payload.settings.practiceSettings,
      targetLanguage: payload.settings.targetLanguage,
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
    complementaryLanguages: state.app.complementaryLanguages,
    interfaceLanguage: state.app.interfaceLanguage,
    playerProfile: state.app.playerProfile
      ? {
          displayName: state.app.playerProfile.displayName,
          isAnonymous: state.app.playerProfile.isAnonymous,
        }
      : undefined,
    practiceSettings: getPracticeSettings(state.app.practiceSettings),
    targetLanguage: state.app.targetLanguage,
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
