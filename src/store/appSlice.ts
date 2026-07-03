import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SupportedLanguage } from '../domain/languages';

export interface AppState {
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

const initialState: AppState = {
  interfaceLanguage: 'ru',
  targetLanguage: 'en',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInterfaceLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.interfaceLanguage = action.payload;
    },
    setTargetLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.targetLanguage = action.payload;
    },
  },
});

export const { setInterfaceLanguage, setTargetLanguage } = appSlice.actions;
export const appReducer = appSlice.reducer;
