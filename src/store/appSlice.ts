import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AssistantId, defaultAssistantId } from '../domain/assistants';
import { SupportedLanguage } from '../domain/languages';
import {
  CorrectStreakCooldownKey,
  PracticeSettings,
  defaultPracticeSettings,
  getPracticeSettings,
} from '../domain/practiceOrdering';

export interface AppState {
  assistantId: AssistantId;
  interfaceLanguage: SupportedLanguage;
  practiceSettings?: PracticeSettings;
  targetLanguage: SupportedLanguage;
}

const initialState: AppState = {
  assistantId: defaultAssistantId,
  interfaceLanguage: 'ru',
  practiceSettings: defaultPracticeSettings,
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
    setCorrectStreakCooldownMonths(
      state,
      action: PayloadAction<{
        months: number;
        streak: CorrectStreakCooldownKey;
      }>,
    ) {
      const settings = getPracticeSettings(state.practiceSettings);
      settings.correctStreakCooldownMonths[action.payload.streak] =
        sanitizeMonths(action.payload.months);
      state.practiceSettings = settings;
    },
  },
});

export const {
  setAssistantId,
  setCorrectStreakCooldownMonths,
  setInterfaceLanguage,
  setTargetLanguage,
} = appSlice.actions;
export const appReducer = appSlice.reducer;

function sanitizeMonths(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}
