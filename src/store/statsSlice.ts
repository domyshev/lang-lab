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
