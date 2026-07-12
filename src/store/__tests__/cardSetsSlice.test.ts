import { describe, expect, it } from 'vitest';
import {
  archiveCardSet,
  cardSetsReducer,
  copyArchivedCardSet,
} from '../cardSetsSlice';

const now = '2026-07-12T10:00:00.000Z';

const activeSet = {
  id: 'set-love',
  name: 'Love',
  names: { en: 'Love', ru: 'Любовь' },
  cardIds: ['card-a', 'card-b'],
  createdAt: now,
  updatedAt: now,
};

describe('cardSetsSlice archive behavior', () => {
  it('archives a custom set and selects all cards if the archived set was selected', () => {
    const state = cardSetsReducer(
      { cardSets: [activeSet], selectedCardSetId: 'set-love' },
      archiveCardSet({
        cardSetId: 'set-love',
        archivedAt: '2026-07-12T12:00:00.000Z',
      }),
    );

    expect(state.cardSets[0]).toMatchObject({
      id: 'set-love',
      archivedAt: '2026-07-12T12:00:00.000Z',
    });
    expect(state.selectedCardSetId).toBe('all-cards');
  });

  it('copies an archived set into a new active set without restoring the source', () => {
    const archived = {
      ...activeSet,
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const state = cardSetsReducer(
      { cardSets: [archived], selectedCardSetId: 'all-cards' },
      copyArchivedCardSet({
        sourceCardSetId: 'set-love',
        newCardSetId: 'set-love-copy',
        now: '2026-07-12T13:00:00.000Z',
      }),
    );

    expect(state.cardSets[0]).toEqual(archived);
    expect(state.cardSets[1]).toEqual({
      id: 'set-love-copy',
      name: 'Love',
      names: { en: 'Love', ru: 'Любовь' },
      cardIds: ['card-a', 'card-b'],
      createdAt: '2026-07-12T13:00:00.000Z',
      updatedAt: '2026-07-12T13:00:00.000Z',
    });
    expect(state.selectedCardSetId).toBe('set-love-copy');
  });

  it('does not copy active or missing sets', () => {
    expect(
      cardSetsReducer(
        { cardSets: [activeSet], selectedCardSetId: 'all-cards' },
        copyArchivedCardSet({
          sourceCardSetId: 'set-love',
          newCardSetId: 'set-copy',
          now,
        }),
      ).cardSets,
    ).toEqual([activeSet]);
  });
});
