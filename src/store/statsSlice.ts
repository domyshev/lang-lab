import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ExerciseAttempt } from '../domain/exercises';
import { CardStats, updateStatsFromAttempt } from '../domain/stats';

export interface StatsState {
  cardStats: CardStats[];
}

const initialState: StatsState = {
  cardStats: [],
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    recordAttemptStats(state, action: PayloadAction<ExerciseAttempt>) {
      state.cardStats = updateStatsFromAttempt(
        state.cardStats,
        action.payload,
      );
    },
    rebuildStatsFromAttempts(state, action: PayloadAction<ExerciseAttempt[]>) {
      state.cardStats = action.payload.reduce(
        (stats, attempt) => updateStatsFromAttempt(stats, attempt),
        [] as CardStats[],
      );
    },
    replaceStatsState(state, action: PayloadAction<StatsState>) {
      state.cardStats = action.payload.cardStats.map((stats) => ({ ...stats }));
    },
  },
});

export const { rebuildStatsFromAttempts, recordAttemptStats, replaceStatsState } =
  statsSlice.actions;
export const statsReducer = statsSlice.reducer;
