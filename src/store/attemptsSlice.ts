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
