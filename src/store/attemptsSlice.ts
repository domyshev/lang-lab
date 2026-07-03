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
  },
});

export const { saveAttempt } = attemptsSlice.actions;
export const attemptsReducer = attemptsSlice.reducer;
