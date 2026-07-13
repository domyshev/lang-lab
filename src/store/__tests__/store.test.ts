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
    expect(persistedState.app.hasGameHelpCoachmarkBeenShown).toBe(true);
  });
});
