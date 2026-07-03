import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { LanguageCard } from '../domain/cards';
import {
  DuplicateProcessingEntry,
  ImportResult,
  PendingDuplicate,
} from '../domain/importCards';

export interface CardsState {
  cards: LanguageCard[];
  duplicateProcessingHistory: DuplicateProcessingEntry[];
  pendingDuplicates: PendingDuplicate[];
}

const initialState: CardsState = {
  cards: [],
  duplicateProcessingHistory: [],
  pendingDuplicates: [],
};

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    applyImportResult(state, action: PayloadAction<ImportResult>) {
      state.cards = action.payload.cards;
      state.duplicateProcessingHistory.push(
        ...action.payload.duplicateProcessingHistory,
      );
      state.pendingDuplicates.push(...action.payload.pendingDuplicates);
    },
  },
});

export const { applyImportResult } = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
