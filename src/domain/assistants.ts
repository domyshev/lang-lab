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
    label: 'Cheerful Leaf',
    name: {
      en: 'Cheerful Leaf',
      ru: 'Веселый листочек',
      es: 'Hojita Alegre',
    },
    superpower: {
      en: 'Notices stubborn mistakes and brings them back before they fossilize.',
      ru: 'Замечает упрямые ошибки и возвращает их до того, как они окаменеют.',
      es: 'Detecta errores tercos y los devuelve antes de que se fosilicen.',
    },
  },
  {
    id: 'trollMama',
    label: 'Mnemo-Mama',
    name: {
      en: 'Mnemo-Mama',
      ru: 'Мнемо-мама',
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
    label: 'Captain Knowledge',
    name: {
      en: 'Captain Knowledge',
      ru: 'Капитан знаний',
      es: 'Capitan Saber',
    },
    superpower: {
      en: 'Connects a word to its clue so the answer is easier to retrieve.',
      ru: 'Связывает слово с подсказкой, чтобы ответ было легче достать из памяти.',
      es: 'Conecta una palabra con su pista para recuperar mejor la respuesta.',
    },
  },
  {
    id: 'greenPower',
    label: 'Memory Hulk',
    name: {
      en: 'Memory Hulk',
      ru: 'Халк запоминания',
      es: 'Hulk de Memoria',
    },
    superpower: {
      en: 'Crushes long words into visible chunks and rhythm.',
      ru: 'Разбивает длинные слова на видимые куски и ритм.',
      es: 'Rompe palabras largas en bloques visibles y ritmo.',
    },
  },
  {
    id: 'webRunner',
    label: 'Wise Spider',
    name: {
      en: 'Wise Spider',
      ru: 'Мудрый паучок',
      es: 'Aranita Sabia',
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
