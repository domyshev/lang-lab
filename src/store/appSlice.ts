import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AssistantId, defaultAssistantId } from '../domain/assistants';
import {
  SupportedLanguage,
  isSupportedLanguage,
  supportedLanguages,
} from '../domain/languages';
import {
  CorrectStreakCooldownKey,
  PracticeSettings,
  defaultPracticeSettings,
  getPracticeSettings,
} from '../domain/practiceOrdering';
import { WorldId, defaultWorldId, resolveWorldId } from '../domain/worlds';

export interface AppState {
  assistantId: AssistantId;
  complementaryLanguages: ComplementaryLanguages;
  hasFinishExerciseLampBeenShown?: boolean;
  hasAgentsIntroCoachmarkBeenShown?: boolean;
  hasGameHelpCoachmarkBeenShown?: boolean;
  hasHypersonicJumpLampBeenShown?: boolean;
  interfaceLanguage: SupportedLanguage;
  isGameHelpCollapsed?: boolean;
  playerProfile?: PlayerProfile;
  practiceSettings?: PracticeSettings;
  targetLanguage: SupportedLanguage;
  worldId?: WorldId;
}

export interface PlayerProfile {
  avatarSeed: string;
  displayName?: string;
  isAnonymous: boolean;
}

export type ComplementaryLanguages = Record<
  SupportedLanguage,
  SupportedLanguage
>;

export const defaultComplementaryLanguages: ComplementaryLanguages = {
  en: 'ru',
  es: 'ru',
  ru: 'en',
  uk: 'ru',
};

const initialState: AppState = {
  assistantId: defaultAssistantId,
  complementaryLanguages: defaultComplementaryLanguages,
  hasFinishExerciseLampBeenShown: false,
  hasAgentsIntroCoachmarkBeenShown: false,
  hasGameHelpCoachmarkBeenShown: false,
  hasHypersonicJumpLampBeenShown: false,
  interfaceLanguage: 'ru',
  isGameHelpCollapsed: false,
  practiceSettings: defaultPracticeSettings,
  targetLanguage: 'en',
  worldId: defaultWorldId,
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
    markFinishExerciseLampShown(state) {
      state.hasFinishExerciseLampBeenShown = true;
    },
    markAgentsIntroCoachmarkShown(state) {
      state.hasAgentsIntroCoachmarkBeenShown = true;
    },
    markHypersonicJumpLampShown(state) {
      state.hasHypersonicJumpLampBeenShown = true;
    },
    setAssistantId(state, action: PayloadAction<AssistantId>) {
      state.assistantId = action.payload;
    },
    setPlayerProfile(state, action: PayloadAction<PlayerProfile>) {
      state.playerProfile = {
        ...action.payload,
        displayName: action.payload.displayName?.trim() || undefined,
      };
    },
    setComplementaryLanguageForTarget(
      state,
      action: PayloadAction<{
        complementaryLanguage: SupportedLanguage;
        targetLanguage: SupportedLanguage;
      }>,
    ) {
      const { complementaryLanguage, targetLanguage } = action.payload;
      if (complementaryLanguage === targetLanguage) {
        return;
      }

      state.complementaryLanguages = {
        ...getComplementaryLanguages(state.complementaryLanguages),
        [targetLanguage]: complementaryLanguage,
      };
    },
    setInterfaceLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.interfaceLanguage = action.payload;
    },
    setTargetLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.targetLanguage = action.payload;
    },
    setWorldId(state, action: PayloadAction<WorldId>) {
      state.worldId = resolveWorldId(action.payload);
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
  markAgentsIntroCoachmarkShown,
  markFinishExerciseLampShown,
  markGameHelpCoachmarkShown,
  markHypersonicJumpLampShown,
  setAssistantId,
  setComplementaryLanguageForTarget,
  setCorrectStreakCooldownMonths,
  setInterfaceLanguage,
  setNewCardMixFrequencyPercent,
  setPlayerProfile,
  setRecentMistakeRepeatFrequencyPercent,
  setTargetLanguage,
  setWorldId,
} = appSlice.actions;
export const appReducer = appSlice.reducer;

export function getComplementaryLanguages(
  value?: Partial<Record<SupportedLanguage, SupportedLanguage>>,
): ComplementaryLanguages {
  const resolved: ComplementaryLanguages = {
    ...defaultComplementaryLanguages,
  };

  supportedLanguages.forEach((targetLanguage) => {
    const complementaryLanguage = value?.[targetLanguage];
    if (
      typeof complementaryLanguage === 'string' &&
      isSupportedLanguage(complementaryLanguage) &&
      complementaryLanguage !== targetLanguage
    ) {
      resolved[targetLanguage] = complementaryLanguage;
    }
  });

  return resolved;
}

export function getComplementaryLanguageForTarget(
  value: Partial<Record<SupportedLanguage, SupportedLanguage>> | undefined,
  targetLanguage: SupportedLanguage,
): SupportedLanguage {
  return getComplementaryLanguages(value)[targetLanguage];
}

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
