import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ALL_WORDS_THEME_ID, Theme } from '../domain/themes';

export interface ThemesState {
  themes: Theme[];
  selectedThemeId?: string;
}

const initialState: ThemesState = {
  themes: [],
  selectedThemeId: ALL_WORDS_THEME_ID,
};

const themesSlice = createSlice({
  name: 'themes',
  initialState,
  reducers: {
    addTheme(state, action: PayloadAction<Theme>) {
      state.themes.push(action.payload);
      state.selectedThemeId = action.payload.id;
    },
    selectTheme(state, action: PayloadAction<string>) {
      state.selectedThemeId = action.payload;
    },
    archiveTheme(
      state,
      action: PayloadAction<{ themeId: string; archivedAt: string }>,
    ) {
      if (action.payload.themeId === ALL_WORDS_THEME_ID) {
        return;
      }

      const theme = state.themes.find(
        (item) => item.id === action.payload.themeId,
      );
      if (!theme) {
        return;
      }

      theme.archivedAt = action.payload.archivedAt;
      if (state.selectedThemeId === theme.id) {
        state.selectedThemeId = ALL_WORDS_THEME_ID;
      }
    },
    addCardToTheme(
      state,
      action: PayloadAction<{ themeId: string; cardId: string; now: string }>,
    ) {
      const theme = state.themes.find(
        (item) => item.id === action.payload.themeId,
      );
      if (
        !theme ||
        theme.archivedAt ||
        theme.cardIds.includes(action.payload.cardId)
      ) {
        return;
      }
      theme.cardIds.push(action.payload.cardId);
      theme.updatedAt = action.payload.now;
    },
  },
});

export const { addTheme, archiveTheme, selectTheme, addCardToTheme } =
  themesSlice.actions;
export const themesReducer = themesSlice.reducer;
