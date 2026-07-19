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
  disableAdditionalHints?: boolean;
  hasFinishExerciseLampBeenShown?: boolean;
  hasAgentsIntroCoachmarkBeenShown?: boolean;
  hasGameHelpCoachmarkBeenShown?: boolean;
  hasHypersonicJumpLampBeenShown?: boolean;
  interfaceLanguage: SupportedLanguage;
  isGameHelpCollapsed?: boolean;
  openRouterApiKey?: string;
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
  SupportedLanguage[]
>;

export const defaultComplementaryLanguages: ComplementaryLanguages = {
  en: ['ru', 'es', 'uk'],
  es: ['ru', 'en', 'uk'],
  ru: ['en', 'es', 'uk'],
  uk: ['ru', 'en', 'es'],
};

export const initialAppState: AppState = {
  assistantId: defaultAssistantId,
  complementaryLanguages: defaultComplementaryLanguages,
  disableAdditionalHints: false,
  hasFinishExerciseLampBeenShown: false,
  hasAgentsIntroCoachmarkBeenShown: false,
  hasGameHelpCoachmarkBeenShown: false,
  hasHypersonicJumpLampBeenShown: false,
  interfaceLanguage: 'en',
  isGameHelpCollapsed: false,
  openRouterApiKey: undefined,
  practiceSettings: defaultPracticeSettings,
  targetLanguage: 'en',
  worldId: defaultWorldId,
};

export interface BackendAppSettings {
  assistantId?: string;
  complementaryLanguages: ComplementaryLanguages;
  interfaceLanguage: SupportedLanguage;
  openRouterApiKey?: string;
  playerProfile?: Pick<PlayerProfile, 'displayName' | 'isAnonymous'>;
  practiceSettings: PracticeSettings;
  targetLanguage: SupportedLanguage;
  worldId?: string;
}

const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
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
        [targetLanguage]: [complementaryLanguage],
      };
    },
    setComplementaryLanguagesForTarget(
      state,
      action: PayloadAction<{
        complementaryLanguages: SupportedLanguage[];
        targetLanguage: SupportedLanguage;
      }>,
    ) {
      const { complementaryLanguages, targetLanguage } = action.payload;
      const nextComplementaryLanguages = sanitizeComplementaryLanguages(
        complementaryLanguages,
        {
          targetLanguage,
        },
        { fallbackToDefault: false },
      );

      if (nextComplementaryLanguages.length === 0) {
        return;
      }

      state.complementaryLanguages = {
        ...getComplementaryLanguages(state.complementaryLanguages, {
          targetLanguage: state.targetLanguage,
        }),
        [targetLanguage]: nextComplementaryLanguages,
      };
    },
    setInterfaceLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.interfaceLanguage = action.payload;
      state.complementaryLanguages = getComplementaryLanguages(
        state.complementaryLanguages,
        {
          targetLanguage: state.targetLanguage,
        },
      );
    },
    setTargetLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.targetLanguage = action.payload;
      state.complementaryLanguages = getComplementaryLanguages(
        state.complementaryLanguages,
        {
          targetLanguage: state.targetLanguage,
        },
      );
    },
    setDisableAdditionalHints(state, action: PayloadAction<boolean>) {
      state.disableAdditionalHints = action.payload;
    },
    setOpenRouterApiKey(state, action: PayloadAction<string | undefined>) {
      state.openRouterApiKey = action.payload || undefined;
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
    replaceBackendAppSettings(state, action: PayloadAction<BackendAppSettings>) {
      state.complementaryLanguages = getComplementaryLanguages(
        action.payload.complementaryLanguages,
        {
          targetLanguage: action.payload.targetLanguage,
        },
      );
      state.interfaceLanguage = action.payload.interfaceLanguage;
      state.practiceSettings = getPracticeSettings(
        action.payload.practiceSettings,
      );
      state.targetLanguage = action.payload.targetLanguage;
      state.worldId = resolveWorldId(action.payload.worldId);
      if (action.payload.assistantId) {
        state.assistantId = action.payload.assistantId as AssistantId;
      }
      state.openRouterApiKey =
        action.payload.openRouterApiKey?.trim() || undefined;
      const playerProfile = action.payload.playerProfile ?? {
        displayName: undefined,
        isAnonymous: true,
      };
      state.playerProfile = {
        avatarSeed:
          state.playerProfile?.avatarSeed ||
          playerProfile.displayName ||
          'server-player',
        displayName: playerProfile.displayName?.trim() || undefined,
        isAnonymous: playerProfile.isAnonymous,
      };
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
  setComplementaryLanguagesForTarget,
  setCorrectStreakCooldownMonths,
  setDisableAdditionalHints,
  setInterfaceLanguage,
  setNewCardMixFrequencyPercent,
  setOpenRouterApiKey,
  setPlayerProfile,
  setRecentMistakeRepeatFrequencyPercent,
  setTargetLanguage,
  setWorldId,
  replaceBackendAppSettings,
} = appSlice.actions;
export const appReducer = appSlice.reducer;

export function getComplementaryLanguages(
  value?:
    | Partial<Record<SupportedLanguage, SupportedLanguage | SupportedLanguage[]>>
    | ComplementaryLanguages,
  exclusions?: {
    interfaceLanguage?: SupportedLanguage;
    targetLanguage?: SupportedLanguage;
  },
): ComplementaryLanguages {
  const resolved: ComplementaryLanguages = {
    en: [...defaultComplementaryLanguages.en],
    es: [...defaultComplementaryLanguages.es],
    ru: [...defaultComplementaryLanguages.ru],
    uk: [...defaultComplementaryLanguages.uk],
  };

  supportedLanguages.forEach((targetLanguage) => {
    resolved[targetLanguage] = sanitizeComplementaryLanguages(
      value?.[targetLanguage] ?? resolved[targetLanguage],
      {
        targetLanguage,
      },
    );
  });

  return resolved;
}

export function getComplementaryLanguageForTarget(
  value:
    | Partial<Record<SupportedLanguage, SupportedLanguage | SupportedLanguage[]>>
    | undefined,
  targetLanguage: SupportedLanguage,
): SupportedLanguage {
  return getComplementaryLanguages(value)[targetLanguage][0];
}

export function getComplementaryLanguagesForTarget(
  value:
    | Partial<Record<SupportedLanguage, SupportedLanguage | SupportedLanguage[]>>
    | undefined,
  targetLanguage: SupportedLanguage,
  _interfaceLanguage?: SupportedLanguage,
): SupportedLanguage[] {
  return getComplementaryLanguages(value, {
    targetLanguage,
  })[targetLanguage];
}

function sanitizeComplementaryLanguages(
  value: SupportedLanguage | SupportedLanguage[] | undefined,
  exclusions: {
    targetLanguage: SupportedLanguage;
  },
  options: {
    fallbackToDefault?: boolean;
  } = {},
): SupportedLanguage[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set<SupportedLanguage>();

  const sanitized = values
    .filter((language): language is SupportedLanguage =>
      typeof language === 'string' && isSupportedLanguage(language),
    )
    .filter((language) => language !== exclusions.targetLanguage)
    .filter((language) => {
      if (seen.has(language)) {
        return false;
      }
      seen.add(language);
      return true;
    });

  if (sanitized.length > 0 || options.fallbackToDefault === false) {
    return sanitized;
  }

  return [...defaultComplementaryLanguages[exclusions.targetLanguage]];
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
