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

import { describe, expect, it } from 'vitest';
import { stripSessionOnlyPersistedState } from '../store';
import { appReducer } from '../appSlice';
import { aiAssistantReducer } from '../aiAssistantSlice';
import { defaultPracticeSettings } from '../../domain/practiceOrdering';

describe('store persistence helpers', () => {
  it('does not persist the agents intro coachmark dismissal flag', () => {
    const persistedState = stripSessionOnlyPersistedState({
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        hasAgentsIntroCoachmarkBeenShown: true,
        hasGameHelpCoachmarkBeenShown: true,
      },
      cards: { cards: [], duplicateProcessingHistory: [], pendingDuplicates: [] },
      cardSets: { cardSets: [], selectedCardSetId: 'all-cards' },
      attempts: { attempts: [] },
      stats: { cardStats: [] },
      aiAssistant: aiAssistantReducer(undefined, { type: 'test/init' }),
    });

    expect(persistedState.app.hasAgentsIntroCoachmarkBeenShown).toBe(false);
    expect(persistedState.app.hasGameHelpCoachmarkBeenShown).toBe(false);
  });

  it('does not persist backend-owned library, statistics, or user settings', () => {
    const persistedState = stripSessionOnlyPersistedState({
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        assistantId: 'studyTroll',
        interfaceLanguage: 'ru',
        playerProfile: {
          avatarSeed: 'server-owned-avatar',
          displayName: 'Server User',
          isAnonymous: false,
        },
        practiceSettings: {
          ...defaultPracticeSettings,
          correctStreakCooldownMonths: {
            fivePlus: 10,
            four: 8,
            three: 6,
          },
          newCardMixFrequencyPercent: 5,
          recentMistakeRepeatFrequencyPercent: 90,
        },
        targetLanguage: 'es',
        worldId: 'starTrek',
      },
      cards: {
        cards: [
          {
            createdAt: '2026-07-14T10:00:00.000Z',
            id: 'card-server-owned',
            translations: { en: 'server-owned' },
            updatedAt: '2026-07-14T10:00:00.000Z',
          },
        ],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      cardSets: {
        cardSets: [
          {
            cardIds: ['card-server-owned'],
            createdAt: '2026-07-14T10:00:00.000Z',
            id: 'set-server-owned',
            name: 'Server owned',
            updatedAt: '2026-07-14T10:00:00.000Z',
          },
        ],
        selectedCardSetId: 'set-server-owned',
      },
      attempts: {
        attempts: [
          {
            answers: {},
            cardSetId: 'set-server-owned',
            cardSnapshots: [],
            correctness: {},
            createdAt: '2026-07-14T10:00:00.000Z',
            exerciseType: 'multipleChoice',
            hintsUsed: {},
            id: 'attempt-server-owned',
            prompts: [],
            targetLanguage: 'en',
          },
        ],
      },
      stats: {
        cardStats: [
          {
            accuracy: 1,
            attempts: 1,
            cardId: 'card-server-owned',
            correct: 1,
            hintsUsed: 0,
            incorrect: 0,
            lastPracticedAt: '2026-07-14T10:00:00.000Z',
            recentMistakes: 0,
            stability: 'new',
            targetLanguage: 'en',
          },
        ],
      },
      aiAssistant: {
        ...aiAssistantReducer(undefined, { type: 'test/init' }),
        messages: [
          {
            content: 'server-owned chat',
            createdAt: '2026-07-14T10:00:00.000Z',
            id: 'message-1',
            role: 'user',
          },
        ],
      },
    });

    expect(persistedState.app.assistantId).toBe('studyTroll');
    expect(persistedState.app.worldId).toBe('starTrek');
    expect(persistedState.app.interfaceLanguage).toBe('en');
    expect(persistedState.app.targetLanguage).toBe('en');
    expect(persistedState.app.playerProfile).toBeUndefined();
    expect(persistedState.cards.cards).toEqual([]);
    expect(persistedState.cardSets.cardSets).toEqual([]);
    expect(persistedState.cardSets.selectedCardSetId).toBe('all-cards');
    expect(persistedState.attempts.attempts).toEqual([]);
    expect(persistedState.stats.cardStats).toEqual([]);
    expect(persistedState.aiAssistant.messages).toEqual([]);
  });
});
