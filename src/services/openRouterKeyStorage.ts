export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';
export const OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY =
  'language-crossword-lab:openrouter-trial-key-disabled:v1';
export const OPENROUTER_MODEL_STORAGE_KEY =
  'language-crossword-lab:openrouter-model:v1';
export const OPENROUTER_TRIAL_KEY =
  '***API_KEY_REMOVED***';
export const OPENROUTER_AVAILABLE_MODELS = [
  { id: 'openai/gpt-5.5', label: 'GPT-5.5' },
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
] as const;
export type OpenRouterModelId = (typeof OPENROUTER_AVAILABLE_MODELS)[number]['id'];
export const DEFAULT_OPENROUTER_MODEL_ID: OpenRouterModelId = 'openai/gpt-5.5';

export function loadOpenRouterKey(storage: Storage = window.localStorage): string {
  const storedKey = storage.getItem(OPENROUTER_KEY_STORAGE_KEY)?.trim();
  if (storedKey) {
    return storedKey;
  }
  if (storage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY) === 'true') {
    return '';
  }
  return OPENROUTER_TRIAL_KEY;
}

export function saveOpenRouterKey(
  value: string,
  storage: Storage = window.localStorage,
) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    removeOpenRouterKey(storage);
    return;
  }

  storage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmedValue);
  storage.removeItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY);
}

export function removeOpenRouterKey(storage: Storage = window.localStorage) {
  storage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
  storage.setItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY, 'true');
}

export function restoreOpenRouterTrialKey(storage: Storage = window.localStorage) {
  storage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
  storage.removeItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY);
}

export function loadOpenRouterModel(
  storage: Storage = window.localStorage,
): OpenRouterModelId {
  const storedModel = storage.getItem(OPENROUTER_MODEL_STORAGE_KEY)?.trim();
  return isOpenRouterModelId(storedModel) ? storedModel : DEFAULT_OPENROUTER_MODEL_ID;
}

export function saveOpenRouterModel(
  value: string,
  storage: Storage = window.localStorage,
) {
  if (!isOpenRouterModelId(value)) {
    storage.removeItem(OPENROUTER_MODEL_STORAGE_KEY);
    return;
  }
  storage.setItem(OPENROUTER_MODEL_STORAGE_KEY, value);
}

export function isOpenRouterModelId(value: unknown): value is OpenRouterModelId {
  return OPENROUTER_AVAILABLE_MODELS.some(({ id }) => id === value);
}

export function isOpenRouterTrialKey(value: string): boolean {
  return value.trim() === OPENROUTER_TRIAL_KEY;
}
