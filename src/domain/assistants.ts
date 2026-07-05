import { SupportedLanguage } from './languages';

export type AssistantId =
  | 'studyTroll'
  | 'trollMama'
  | 'capeChampion'
  | 'greenPower'
  | 'webRunner';

export interface AssistantCharacter {
  id: AssistantId;
  label: string;
  name: Record<SupportedLanguage, string>;
  superpower: Record<SupportedLanguage, string>;
}

export const assistantCharacters: AssistantCharacter[] = [
  {
    id: 'studyTroll',
    label: 'Study Troll',
    name: {
      en: 'Moss Minder',
      ru: 'Моховой Смотритель',
      es: 'Guarda Musgo',
    },
    superpower: {
      en: 'Notices stubborn mistakes and brings them back before they fossilize.',
      ru: 'Замечает упрямые ошибки и возвращает их до того, как они окаменеют.',
      es: 'Detecta errores tercos y los devuelve antes de que se fosilicen.',
    },
  },
  {
    id: 'trollMama',
    label: 'Troll Mama',
    name: {
      en: 'Mama Mnemo',
      ru: 'Мама Мнемо',
      es: 'Mama Mnemo',
    },
    superpower: {
      en: 'Turns messy attempts into calm repeatable memory rituals.',
      ru: 'Превращает хаотичные попытки в спокойные ритуалы запоминания.',
      es: 'Convierte intentos caoticos en rituales tranquilos de memoria.',
    },
  },
  {
    id: 'capeChampion',
    label: 'Cape Champion',
    name: {
      en: 'Captain Context',
      ru: 'Капитан Контекст',
      es: 'Capitan Contexto',
    },
    superpower: {
      en: 'Connects a word to its clue so the answer is easier to retrieve.',
      ru: 'Связывает слово с подсказкой, чтобы ответ было легче достать из памяти.',
      es: 'Conecta una palabra con su pista para recuperar mejor la respuesta.',
    },
  },
  {
    id: 'greenPower',
    label: 'Green Power',
    name: {
      en: 'Pattern Hulk',
      ru: 'Халк Паттернов',
      es: 'Hulk de Patrones',
    },
    superpower: {
      en: 'Crushes long words into visible chunks and rhythm.',
      ru: 'Разбивает длинные слова на видимые куски и ритм.',
      es: 'Rompe palabras largas en bloques visibles y ritmo.',
    },
  },
  {
    id: 'webRunner',
    label: 'Web Runner',
    name: {
      en: 'Web Sprinter',
      ru: 'Веб-Спринтер',
      es: 'Velocista Web',
    },
    superpower: {
      en: 'Spots fast associations between similar words without rushing the answer.',
      ru: 'Быстро замечает связи между похожими словами, не торопя ответ.',
      es: 'Detecta asociaciones rapidas entre palabras parecidas sin precipitar la respuesta.',
    },
  },
];

export const defaultAssistantId: AssistantId = 'studyTroll';

export function resolveAssistantId(value: unknown): AssistantId {
  return assistantCharacters.some((assistant) => assistant.id === value)
    ? (value as AssistantId)
    : defaultAssistantId;
}

export function getAssistantProfile(
  value: unknown,
  interfaceLanguage: SupportedLanguage,
): AssistantCharacter {
  const assistantId = resolveAssistantId(value);
  return (
    assistantCharacters.find((assistant) => assistant.id === assistantId) ??
    assistantCharacters[0]
  );
}

export function getAssistantTooltip(
  value: unknown,
  interfaceLanguage: SupportedLanguage,
): string {
  const assistant = getAssistantProfile(value, interfaceLanguage);
  return `${assistant.name[interfaceLanguage]}: ${assistant.superpower[interfaceLanguage]}`;
}
