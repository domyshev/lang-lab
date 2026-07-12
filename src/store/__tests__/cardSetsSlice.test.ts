import { describe, expect, it } from 'vitest';
import { PlannedAiOperation } from '../../domain/aiOperations';
import { applyAiOperation } from '../aiAssistantActions';
import {
  addCardSet,
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

function archiveOperation(): PlannedAiOperation {
  return {
    id: 'archive-love',
    title: 'Archive Love',
    summary: 'Archives the Love set.',
    userPrompt: 'Archive Love.',
    modelId: 'deepseek/deepseek-v4-flash',
    createdAt: now,
    createdCards: [],
    updatedCards: [],
    createdCardSets: [],
    updatedCardSets: [
      {
        before: activeSet,
        after: { ...activeSet, archivedAt: '2026-07-12T12:00:00.000Z' },
      },
    ],
    duplicateProcessingHistory: [],
    pendingDuplicates: [],
    previewCounts: {
      createdCards: 0,
      updatedCards: 0,
      pendingDuplicates: 0,
      createdCardSets: 0,
      archivedCardSets: 1,
      renamedCardSets: 0,
      membershipAdditions: 0,
      membershipRemovals: 0,
    },
  };
}

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

  it('selects all cards when an AI operation archives the selected set', () => {
    const state = cardSetsReducer(
      { cardSets: [activeSet], selectedCardSetId: 'set-love' },
      applyAiOperation({
        operation: archiveOperation(),
        appliedAt: '2026-07-12T12:00:00.000Z',
      }),
    );

    expect(state.cardSets[0].archivedAt).toBe('2026-07-12T12:00:00.000Z');
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

  it('rejects duplicate active names but allows an archived name to be reused', () => {
    const duplicate = { ...activeSet, id: 'set-love-duplicate' };
    const rejectedState = cardSetsReducer(
      { cardSets: [activeSet], selectedCardSetId: 'all-cards' },
      addCardSet(duplicate),
    );
    expect(rejectedState.cardSets).toEqual([activeSet]);
    expect(rejectedState.selectedCardSetId).toBe('all-cards');

    const archived = {
      ...activeSet,
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const allowedState = cardSetsReducer(
      { cardSets: [archived], selectedCardSetId: 'all-cards' },
      addCardSet(duplicate),
    );
    expect(allowedState.cardSets).toEqual([archived, duplicate]);
    expect(allowedState.selectedCardSetId).toBe('set-love-duplicate');
  });

  it('rejects archived copies that conflict with an active name', () => {
    const archived = {
      ...activeSet,
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const active = { ...activeSet, id: 'set-active-love' };
    const state = cardSetsReducer(
      { cardSets: [archived, active], selectedCardSetId: 'all-cards' },
      copyArchivedCardSet({
        sourceCardSetId: 'set-love',
        newCardSetId: 'set-love-copy',
        now: '2026-07-12T13:00:00.000Z',
      }),
    );

    expect(state.cardSets).toEqual([archived, active]);
    expect(state.selectedCardSetId).toBe('all-cards');
  });

  it.each(['set-love', 'set-existing', 'all-cards'])(
    'rejects an archived copy with an existing id (%s)',
    (newCardSetId) => {
      const archived = {
        ...activeSet,
        archivedAt: '2026-07-12T12:00:00.000Z',
      };
      const existing = {
        ...activeSet,
        id: 'set-existing',
        name: 'Family',
        names: { en: 'Family', ru: 'Семья' },
      };
      const state = cardSetsReducer(
        { cardSets: [archived, existing], selectedCardSetId: 'all-cards' },
        copyArchivedCardSet({
          sourceCardSetId: 'set-love',
          newCardSetId,
          now: '2026-07-12T13:00:00.000Z',
        }),
      );

      expect(state.cardSets).toEqual([archived, existing]);
      expect(state.selectedCardSetId).toBe('all-cards');
    },
  );
});
