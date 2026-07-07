import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ALL_CARDS_CARD_SET_ID, CardSet } from '../domain/cardSets';

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
});

export const {
  addCardSet,
  archiveCardSet,
  selectCardSet,
  addCardToCardSet,
  seedDefaultCardSets,
  setCardSetCards,
} =
  cardSetsSlice.actions;
export const cardSetsReducer = cardSetsSlice.reducer;
