import { describe, expect, it } from 'vitest';
import { stripSessionOnlyPersistedState } from '../store';
import { appReducer } from '../appSlice';
import { aiAssistantReducer } from '../aiAssistantSlice';

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
