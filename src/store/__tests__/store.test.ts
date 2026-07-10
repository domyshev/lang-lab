import { describe, expect, it } from 'vitest';
import { stripSessionOnlyPersistedState } from '../store';
import { appReducer } from '../appSlice';

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
    });

    expect(persistedState.app.hasAgentsIntroCoachmarkBeenShown).toBe(false);
    expect(persistedState.app.hasGameHelpCoachmarkBeenShown).toBe(true);
  });
});
