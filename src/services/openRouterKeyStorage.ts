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
    descriptions: {
      en: 'Balanced DeepSeek chat model for structured card edits and learning-stat summaries.',
      es: 'Modelo de chat DeepSeek equilibrado para editar tarjetas estructuradas y resumir estadisticas de aprendizaje.',
      ru: 'Сбалансированная чат-модель DeepSeek для структурного редактирования карточек и сводок по учебной статистике.',
      uk: 'Збалансована чат-модель DeepSeek для структурованого редагування карток і підсумків навчальної статистики.',
    },
  },
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
  {
    id: 'deepseek/deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    inputPricePerMillion: 0.435,
    outputPricePerMillion: 0.87,
    contextTokens: 1048576,
    maxOutputTokens: 384000,
    speedRating: 6,
    costRating: 8,
    descriptions: {
      en: 'Higher-capacity DeepSeek model for deeper analysis and large responses when latency is less important.',
      es: 'Modelo DeepSeek de mayor capacidad para analisis mas profundo y respuestas grandes cuando la latencia importa menos.',
      ru: 'Более мощная модель DeepSeek для глубокого анализа и больших ответов, когда задержка менее важна.',
      uk: 'Потужніша модель DeepSeek для глибшого аналізу й великих відповідей, коли затримка менш важлива.',
    },
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
    descriptions: {
      en: 'General Chinese model with tool support; useful as a secondary comparison model.',
      es: 'Modelo chino general con soporte de herramientas; util como modelo secundario para comparar.',
      ru: 'Универсальная китайская модель с поддержкой инструментов; полезна как запасной вариант для сравнения.',
      uk: 'Універсальна китайська модель з підтримкою інструментів; корисна як запасний варіант для порівняння.',
    },
  },
  {
    id: OPENROUTER_GPT_MODEL_ID,
    label: 'GPT-5.5',
    speedRating: undefined,
    costRating: undefined,
    descriptions: {
      en: 'Existing ChatGPT option kept unchanged; check OpenRouter for live availability, price, and limits.',
      es: 'Opcion ChatGPT existente sin cambios; consulta OpenRouter para disponibilidad, precio y limites actuales.',
      ru: 'Существующая опция ChatGPT оставлена без изменений; актуальные цену, доступность и лимиты смотрите в OpenRouter.',
      uk: 'Наявну опцію ChatGPT залишено без змін; актуальні ціну, доступність і ліміти дивіться в OpenRouter.',
    },
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
    descriptions: {
      en: 'Moonshot model with long-output tool workflows; better as a comparison than a default here.',
      es: 'Modelo Moonshot para flujos con herramientas y salidas largas; aqui encaja mejor como comparacion que como predeterminado.',
      ru: 'Модель Moonshot для tool-workflow и длинных ответов; здесь скорее вариант для сравнения, чем модель по умолчанию.',
      uk: 'Модель Moonshot для tool-workflow і довгих відповідей; тут радше варіант для порівняння, ніж модель за замовчуванням.',
    },
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
    descriptions: {
      en: 'Fast interactive candidate for card CRUD and topic-set generation with enough context for most libraries.',
      es: 'Candidata rapida para CRUD de tarjetas y generacion de conjuntos por tema, con contexto suficiente para la mayoria de bibliotecas.',
      ru: 'Быстрый интерактивный вариант для CRUD карточек и генерации тематических наборов с контекстом, достаточным для большинства библиотек.',
      uk: 'Швидкий інтерактивний варіант для CRUD карток і генерації тематичних наборів з контекстом, достатнім для більшості бібліотек.',
    },
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
    descriptions: {
      en: 'Fast Qwen option with a 1M context window; good for responsive card generation and larger prompts.',
      es: 'Opcion Qwen rapida con contexto de 1M; buena para generar tarjetas con respuesta agil y prompts grandes.',
      ru: 'Быстрый вариант Qwen с контекстом 1M; хорош для отзывчивой генерации карточек и больших промптов.',
      uk: 'Швидкий варіант Qwen з контекстом 1M; добрий для чуйної генерації карток і великих промптів.',
    },
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
    descriptions: {
      en: 'Premium Qwen option for quality checks and nuanced language work when cost is secondary.',
      es: 'Opcion premium de Qwen para revisar calidad y trabajo linguistico fino cuando el coste es secundario.',
      ru: 'Премиальный вариант Qwen для проверки качества и тонкой языковой работы, когда стоимость не главное.',
      uk: 'Преміальний варіант Qwen для перевірки якості й тонкої мовної роботи, коли вартість не головна.',
    },
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
    descriptions: {
      en: 'Strong balanced Qwen model for high-quality translations, examples, and learning recommendations.',
      es: 'Modelo Qwen potente y equilibrado para traducciones de calidad, ejemplos y recomendaciones de aprendizaje.',
      ru: 'Сильная сбалансированная модель Qwen для качественных переводов, примеров и учебных рекомендаций.',
      uk: 'Сильна збалансована модель Qwen для якісних перекладів, прикладів і навчальних рекомендацій.',
    },
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
