export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';
export const OPENROUTER_MODEL_STORAGE_KEY =
  'language-crossword-lab:openrouter-model:v1';
export const OPENROUTER_GPT_MODEL_ID = 'openai/gpt-5.5';
export const OPENROUTER_DEEPSEEK_MODEL_ID = 'deepseek/deepseek-v4-flash';
export const OPENROUTER_AVAILABLE_MODELS = [
  { id: OPENROUTER_GPT_MODEL_ID, label: 'GPT-5.5' },
  { id: OPENROUTER_DEEPSEEK_MODEL_ID, label: 'DeepSeek V4 Flash' },
] as const;
export type OpenRouterModelId = (typeof OPENROUTER_AVAILABLE_MODELS)[number]['id'];
export const DEFAULT_OPENROUTER_MODEL_ID: OpenRouterModelId =
  OPENROUTER_DEEPSEEK_MODEL_ID;

export function loadOpenRouterKey(storage: Storage = window.localStorage): string {
  return storage.getItem(OPENROUTER_KEY_STORAGE_KEY)?.trim() ?? '';
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
}

export function removeOpenRouterKey(storage: Storage = window.localStorage) {
  storage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
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
