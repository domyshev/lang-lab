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
    seedDefaultCards(state, action: PayloadAction<LanguageCard[]>) {
      if (state.cards.length > 0) {
        return;
      }

      state.cards = action.payload.map((card) => ({
        ...card,
        translations: { ...card.translations },
        definitions: card.definitions ? { ...card.definitions } : undefined,
        examples: card.examples
          ? Object.fromEntries(
              Object.entries(card.examples).map(([language, examples]) => [
                language,
                examples.map((example) => ({ ...example })),
              ]),
            )
          : undefined,
        tags: card.tags ? [...card.tags] : undefined,
      }));
      state.duplicateProcessingHistory = [];
      state.pendingDuplicates = [];
    },
    applyImportResult(state, action: PayloadAction<ImportResult>) {
      state.cards = action.payload.cards;
      state.duplicateProcessingHistory.push(
        ...action.payload.duplicateProcessingHistory,
      );
      state.pendingDuplicates.push(...action.payload.pendingDuplicates);
    },
  },
});

export const { applyImportResult, seedDefaultCards } = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
