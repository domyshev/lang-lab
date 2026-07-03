import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AssistantId, defaultAssistantId } from '../domain/assistants';
import { SupportedLanguage } from '../domain/languages';

export interface AppState {
  assistantId: AssistantId;
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

const initialState: AppState = {
  assistantId: defaultAssistantId,
  interfaceLanguage: 'ru',
  targetLanguage: 'en',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAssistantId(state, action: PayloadAction<AssistantId>) {
      state.assistantId = action.payload;
    },
    setInterfaceLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.interfaceLanguage = action.payload;
    },
    setTargetLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.targetLanguage = action.payload;
    },
  },
});

export const { setAssistantId, setInterfaceLanguage, setTargetLanguage } =
  appSlice.actions;
export const appReducer = appSlice.reducer;
