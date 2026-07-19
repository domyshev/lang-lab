export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';
export const OPENROUTER_MODEL_STORAGE_KEY =
  'language-crossword-lab:openrouter-model:v1';
export const OPENROUTER_GPT_MODEL_ID = 'openai/gpt-5.5';
export const OPENROUTER_DEEPSEEK_MODEL_ID = 'deepseek/deepseek-v4-flash';

export interface OpenRouterModelOption {
  contextTokens?: number;
  costRating?: number;
  descriptions: Record<'en' | 'es' | 'ru' | 'uk', string>;
  id: string;
  inputPricePerMillion?: number;
  label: string;
  maxOutputTokens?: number;
  outputPricePerMillion?: number;
  speedRating?: number;
}

export type OpenRouterModelId = string;
export const DEFAULT_OPENROUTER_MODEL_ID: OpenRouterModelId =
  OPENROUTER_DEEPSEEK_MODEL_ID;

export const OPENROUTER_FALLBACK_MODELS: readonly OpenRouterModelOption[] = [
  {
    id: OPENROUTER_DEEPSEEK_MODEL_ID,
    label: 'DeepSeek V4 Flash',
    inputPricePerMillion: 0.098,
    outputPricePerMillion: 0.196,
    contextTokens: 1048576,
    speedRating: 6,
    costRating: 10,
    descriptions: {
      en: 'Lowest-cost default model with a very large context window; best for budget-sensitive card generation and background work.',
      es: 'Modelo predeterminado mas economico con una ventana de contexto muy grande; ideal para generar tarjetas con bajo coste y tareas en segundo plano.',
      ru: 'Самая экономичная модель по умолчанию с очень большим контекстом; подходит для бюджетной генерации карточек и фоновых задач.',
      uk: 'Найекономніша модель за замовчуванням з дуже великим контекстом; підходить для бюджетної генерації карток і фонових задач.',
    },
  },
];

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
  return storage.getItem(OPENROUTER_MODEL_STORAGE_KEY)?.trim() || DEFAULT_OPENROUTER_MODEL_ID;
}

export function saveOpenRouterModel(
  value: string,
  storage: Storage = window.localStorage,
) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    storage.removeItem(OPENROUTER_MODEL_STORAGE_KEY);
    return;
  }
  storage.setItem(OPENROUTER_MODEL_STORAGE_KEY, trimmedValue);
}

export function isOpenRouterModelId(value: unknown): value is OpenRouterModelId {
  return typeof value === 'string' && value.trim().length > 0;
}
