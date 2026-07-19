export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';
export const OPENROUTER_MODEL_STORAGE_KEY =
  'language-crossword-lab:openrouter-model:v1';
export const OPENROUTER_GPT_MODEL_ID = 'openai/gpt-5.5';
export const OPENROUTER_DEEPSEEK_MODEL_ID = 'deepseek/deepseek-v4-flash';

export interface OpenRouterModelOption {
  contextTokens?: number;
  costRating?: number;
  description: string;
  id: string;
  inputPricePerMillion?: number;
  label: string;
  maxOutputTokens?: number;
  outputPricePerMillion?: number;
  speedRating?: number;
}

export const OPENROUTER_AVAILABLE_MODELS = [
  {
    id: 'deepseek/deepseek-chat-v3.1',
    label: 'DeepSeek V3.1',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 0.95,
    contextTokens: 163840,
    maxOutputTokens: 32768,
    speedRating: 7,
    costRating: 8,
    description:
      'Balanced DeepSeek chat model for structured card edits and learning-stat summaries.',
  },
  {
    id: OPENROUTER_DEEPSEEK_MODEL_ID,
    label: 'DeepSeek V4 Flash',
    inputPricePerMillion: 0.098,
    outputPricePerMillion: 0.196,
    contextTokens: 1048576,
    speedRating: 6,
    costRating: 10,
    description:
      'Lowest-cost default model with a very large context window; best for budget-sensitive card generation and background work.',
  },
  {
    id: 'deepseek/deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    inputPricePerMillion: 0.435,
    outputPricePerMillion: 0.87,
    contextTokens: 1048576,
    maxOutputTokens: 384000,
    speedRating: 6,
    costRating: 8,
    description:
      'Higher-capacity DeepSeek model for deeper analysis and large responses when latency is less important.',
  },
  {
    id: 'z-ai/glm-4.5',
    label: 'GLM 4.5',
    inputPricePerMillion: 0.6,
    outputPricePerMillion: 2.2,
    contextTokens: 131072,
    maxOutputTokens: 98304,
    speedRating: 6,
    costRating: 5,
    description:
      'General Chinese model with tool support; useful as a secondary comparison model.',
  },
  {
    id: OPENROUTER_GPT_MODEL_ID,
    label: 'GPT-5.5',
    speedRating: undefined,
    costRating: undefined,
    description:
      'Existing ChatGPT option kept unchanged; check OpenRouter for live availability, price, and limits.',
  },
  {
    id: 'moonshotai/kimi-k2',
    label: 'Kimi K2',
    inputPricePerMillion: 0.57,
    outputPricePerMillion: 2.3,
    contextTokens: 131072,
    maxOutputTokens: 100352,
    speedRating: 6,
    costRating: 5,
    description:
      'Moonshot model with long-output tool workflows; better as a comparison than a default here.',
  },
  {
    id: 'qwen/qwen3.6-35b-a3b',
    label: 'Qwen3.6 35B A3B',
    inputPricePerMillion: 0.14,
    outputPricePerMillion: 1,
    contextTokens: 262144,
    maxOutputTokens: 262144,
    speedRating: 9,
    costRating: 8,
    description:
      'Fast interactive candidate for card CRUD and topic-set generation with enough context for most libraries.',
  },
  {
    id: 'qwen/qwen3.6-flash',
    label: 'Qwen3.6 Flash',
    inputPricePerMillion: 0.1875,
    outputPricePerMillion: 1.125,
    contextTokens: 1000000,
    maxOutputTokens: 65536,
    speedRating: 8,
    costRating: 8,
    description:
      'Fast Qwen option with a 1M context window; good for responsive card generation and larger prompts.',
  },
  {
    id: 'qwen/qwen3.7-max',
    label: 'Qwen3.7 Max',
    inputPricePerMillion: 1.475,
    outputPricePerMillion: 4.425,
    contextTokens: 1000000,
    maxOutputTokens: 65536,
    speedRating: 6,
    costRating: 3,
    description:
      'Premium Qwen option for quality checks and nuanced language work when cost is secondary.',
  },
  {
    id: 'qwen/qwen3.7-plus',
    label: 'Qwen3.7 Plus',
    inputPricePerMillion: 0.32,
    outputPricePerMillion: 1.28,
    contextTokens: 1000000,
    maxOutputTokens: 65536,
    speedRating: 7,
    costRating: 7,
    description:
      'Strong balanced Qwen model for high-quality translations, examples, and learning recommendations.',
  },
] as const satisfies readonly OpenRouterModelOption[];
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
