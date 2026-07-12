import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ALL_CARDS_CARD_SET_ID, CardSet } from '../domain/cardSets';
import { applyAiOperation, commitAiRollback } from './aiAssistantActions';

export interface CardSetsState {
  cardSets: CardSet[];
  selectedCardSetId?: string;
}

const initialState: CardSetsState = {
  cardSets: [],
  selectedCardSetId: ALL_CARDS_CARD_SET_ID,
};

const cardSetsSlice = createSlice({
  name: 'cardSets',
  initialState,
  reducers: {
    seedDefaultCardSets(state, action: PayloadAction<CardSet[]>) {
      if (state.cardSets.length > 0) {
        return;
      }

      state.cardSets = action.payload.map((cardSet) => ({
        ...cardSet,
        cardIds: [...cardSet.cardIds],
      }));
    },
    mergeCardSetMetadata(state, action: PayloadAction<CardSet[]>) {
      const metadataById = new Map(
        action.payload.map((cardSet) => [cardSet.id, cardSet]),
      );

      state.cardSets.forEach((cardSet) => {
        const metadata = metadataById.get(cardSet.id);
        if (!metadata) {
          return;
        }

        cardSet.name = metadata.name;
        cardSet.names = metadata.names ? { ...metadata.names } : undefined;
      });
    },
    addCardSet(state, action: PayloadAction<CardSet>) {
      state.cardSets.push(action.payload);
      state.selectedCardSetId = action.payload.id;
    },
    selectCardSet(state, action: PayloadAction<string>) {
      state.selectedCardSetId = action.payload;
    },
    archiveCardSet(
      state,
      action: PayloadAction<{ cardSetId: string; archivedAt: string }>,
    ) {
      if (action.payload.cardSetId === ALL_CARDS_CARD_SET_ID) {
        return;
      }

      const cardSet = state.cardSets.find(
        (item) => item.id === action.payload.cardSetId,
      );
      if (!cardSet) {
        return;
      }

      cardSet.archivedAt = action.payload.archivedAt;
      if (state.selectedCardSetId === cardSet.id) {
        state.selectedCardSetId = ALL_CARDS_CARD_SET_ID;
      }
    },
    copyArchivedCardSet(
      state,
      action: PayloadAction<{
        sourceCardSetId: string;
        newCardSetId: string;
        now: string;
      }>,
    ) {
      const source = state.cardSets.find(
        (item) => item.id === action.payload.sourceCardSetId,
      );
      if (!source?.archivedAt || source.id === ALL_CARDS_CARD_SET_ID) {
        return;
      }

      const copy: CardSet = {
        id: action.payload.newCardSetId,
        name: source.name,
        ...(source.names ? { names: { ...source.names } } : {}),
        cardIds: [...source.cardIds],
        createdAt: action.payload.now,
        updatedAt: action.payload.now,
      };
      state.cardSets.push(copy);
      state.selectedCardSetId = copy.id;
    },
    addCardToCardSet(
      state,
      action: PayloadAction<{ cardSetId: string; cardId: string; now: string }>,
    ) {
      const cardSet = state.cardSets.find(
        (item) => item.id === action.payload.cardSetId,
      );
      if (
        !cardSet ||
        cardSet.archivedAt ||
        cardSet.cardIds.includes(action.payload.cardId)
      ) {
        return;
      }
      cardSet.cardIds.push(action.payload.cardId);
      cardSet.updatedAt = action.payload.now;
    },
    setCardSetCards(
      state,
      action: PayloadAction<{ cardSetId: string; cardIds: string[]; now: string }>,
    ) {
      const cardSet = state.cardSets.find(
        (item) => item.id === action.payload.cardSetId,
      );
      if (!cardSet || cardSet.archivedAt) {
        return;
      }

      cardSet.cardIds = Array.from(new Set(action.payload.cardIds));
      cardSet.updatedAt = action.payload.now;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyAiOperation, (state, action) => {
        const { operation } = action.payload;
        const updatesById = new Map(
          operation.updatedCardSets.map(({ after }) => [after.id, after]),
        );
        state.cardSets = state.cardSets.map(
          (cardSet) => updatesById.get(cardSet.id) ?? cardSet,
        );
        state.cardSets.push(...operation.createdCardSets);
      })
      .addCase(commitAiRollback, (state, action) => {
        const { operation } = action.payload;
        const createdIds = new Set(operation.createdCardSets.map(({ id }) => id));
        const beforeById = new Map(
          operation.updatedCardSets.map(({ before }) => [before.id, before]),
        );

        state.cardSets = state.cardSets
          .filter(({ id }) => !createdIds.has(id))
          .map((cardSet) => beforeById.get(cardSet.id) ?? cardSet);
        if (
          state.selectedCardSetId &&
          createdIds.has(state.selectedCardSetId)
        ) {
          state.selectedCardSetId = ALL_CARDS_CARD_SET_ID;
        }
      });
  },
});

export const {
  addCardSet,
  archiveCardSet,
  copyArchivedCardSet,
  selectCardSet,
  addCardToCardSet,
  mergeCardSetMetadata,
  seedDefaultCardSets,
  setCardSetCards,
} =
  cardSetsSlice.actions;
export const cardSetsReducer = cardSetsSlice.reducer;
