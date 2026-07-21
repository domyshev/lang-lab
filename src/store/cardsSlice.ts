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

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { LanguageCard } from '../domain/cards';
import { SupportedLanguage } from '../domain/languages';
import {
  DuplicateProcessingEntry,
  ImportResult,
  PendingDuplicate,
} from '../domain/importCards';
import { applyAiOperation, commitAiRollback } from './aiAssistantActions';

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
        knownTargetLanguages: card.knownTargetLanguages
          ? [...card.knownTargetLanguages]
          : undefined,
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
    setCardKnown(
      state,
      action: PayloadAction<{
        cardId: string;
        isKnown: boolean;
        now: string;
        targetLanguage: SupportedLanguage;
      }>,
    ) {
      const card = state.cards.find(({ id }) => id === action.payload.cardId);
      if (!card) {
        return;
      }

      const languages = new Set(card.knownTargetLanguages ?? []);
      if (action.payload.isKnown) {
        languages.add(action.payload.targetLanguage);
      } else {
        languages.delete(action.payload.targetLanguage);
      }

      card.knownTargetLanguages = [...languages];
      card.updatedAt = action.payload.now;
    },
    replaceCardsState(state, action: PayloadAction<CardsState>) {
      state.cards = action.payload.cards.map((card) => ({
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
        knownTargetLanguages: card.knownTargetLanguages
          ? [...card.knownTargetLanguages]
          : undefined,
      }));
      state.duplicateProcessingHistory =
        action.payload.duplicateProcessingHistory.map((entry) => ({ ...entry }));
      state.pendingDuplicates = action.payload.pendingDuplicates.map((entry) => ({
        ...entry,
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyAiOperation, (state, action) => {
        const { operation } = action.payload;
        const updatesById = new Map(
          operation.updatedCards.map(({ after }) => [after.id, after]),
        );
        state.cards = state.cards.map(
          (card) => updatesById.get(card.id) ?? card,
        );
        state.cards.push(...operation.createdCards);
        state.duplicateProcessingHistory.push(
          ...operation.duplicateProcessingHistory,
        );
        state.pendingDuplicates.push(...operation.pendingDuplicates);
      })
      .addCase(commitAiRollback, (state, action) => {
        const { operation } = action.payload;
        const createdIds = new Set(operation.createdCards.map(({ id }) => id));
        const beforeById = new Map(
          operation.updatedCards.map(({ before }) => [before.id, before]),
        );
        const mergeIds = new Set(
          operation.duplicateProcessingHistory.map(({ id }) => id),
        );
        const pendingIds = new Set(
          operation.pendingDuplicates.map(({ id }) => id),
        );

        state.cards = state.cards
          .filter(({ id }) => !createdIds.has(id))
          .map((card) => beforeById.get(card.id) ?? card);
        state.duplicateProcessingHistory =
          state.duplicateProcessingHistory.filter(({ id }) => !mergeIds.has(id));
        state.pendingDuplicates = state.pendingDuplicates.filter(
          ({ id }) => !pendingIds.has(id),
        );
      });
  },
});

export const { applyImportResult, replaceCardsState, seedDefaultCards, setCardKnown } =
  cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
