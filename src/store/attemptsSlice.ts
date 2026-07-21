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
import { ExerciseAttempt } from '../domain/exercises';

export interface AttemptsState {
  attempts: ExerciseAttempt[];
}

const initialState: AttemptsState = {
  attempts: [],
};

const attemptsSlice = createSlice({
  name: 'attempts',
  initialState,
  reducers: {
    saveAttempt(state, action: PayloadAction<ExerciseAttempt>) {
      state.attempts.push(action.payload);
    },
    forgetExerciseSession(state, action: PayloadAction<string>) {
      state.attempts = state.attempts.filter(
        (attempt) => attempt.exerciseSessionId !== action.payload,
      );
    },
    replaceAttemptsState(state, action: PayloadAction<AttemptsState>) {
      state.attempts = action.payload.attempts.map((attempt) => ({
        ...attempt,
        answers: { ...attempt.answers },
        cardSnapshots: attempt.cardSnapshots.map((snapshot) => ({
          ...snapshot,
          definitions: snapshot.definitions
            ? { ...snapshot.definitions }
            : undefined,
          tags: snapshot.tags ? [...snapshot.tags] : undefined,
          translations: { ...snapshot.translations },
        })),
        correctness: { ...attempt.correctness },
        hintsUsed: { ...attempt.hintsUsed },
        prompts: attempt.prompts.map((prompt) => ({
          ...prompt,
          translationHints: prompt.translationHints.map((hint) => ({ ...hint })),
        })),
      }));
    },
  },
});

export const { forgetExerciseSession, replaceAttemptsState, saveAttempt } =
  attemptsSlice.actions;
export const attemptsReducer = attemptsSlice.reducer;
