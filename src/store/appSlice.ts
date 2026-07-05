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
  hasGameHelpCoachmarkBeenShown?: boolean;
  interfaceLanguage: SupportedLanguage;
  isGameHelpCollapsed?: boolean;
  practiceSettings?: PracticeSettings;
  targetLanguage: SupportedLanguage;
}

const initialState: AppState = {
  assistantId: defaultAssistantId,
  hasGameHelpCoachmarkBeenShown: false,
  interfaceLanguage: 'ru',
  isGameHelpCollapsed: false,
  practiceSettings: defaultPracticeSettings,
  targetLanguage: 'en',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    acknowledgeGameHelp(state) {
      state.isGameHelpCollapsed = true;
    },
    markGameHelpCoachmarkShown(state) {
      state.hasGameHelpCoachmarkBeenShown = true;
    },
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
    setNewCardMixFrequencyPercent(state, action: PayloadAction<number>) {
      const settings = getPracticeSettings(state.practiceSettings);
      settings.newCardMixFrequencyPercent = sanitizePercent(action.payload);
      state.practiceSettings = settings;
    },
    setRecentMistakeRepeatFrequencyPercent(
      state,
      action: PayloadAction<number>,
    ) {
      const settings = getPracticeSettings(state.practiceSettings);
      settings.recentMistakeRepeatFrequencyPercent = sanitizePercent(
        action.payload,
      );
      state.practiceSettings = settings;
    },
  },
});

export const {
  acknowledgeGameHelp,
  markGameHelpCoachmarkShown,
  setAssistantId,
  setCorrectStreakCooldownMonths,
  setInterfaceLanguage,
  setNewCardMixFrequencyPercent,
  setRecentMistakeRepeatFrequencyPercent,
  setTargetLanguage,
} = appSlice.actions;
export const appReducer = appSlice.reducer;

function sanitizeMonths(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}
