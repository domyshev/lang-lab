import { SupportedLanguage } from './languages';

export type AssistantId =
  | 'studyTroll'
  | 'trollMama'
  | 'capeChampion'
  | 'greenPower'
  | 'webRunner';

export interface AssistantCharacter {
  abilities: Record<SupportedLanguage, string[]>;
  description: Record<SupportedLanguage, string>;
  id: AssistantId;
  label: string;
  motto: Record<SupportedLanguage, string>;
  name: Record<SupportedLanguage, string>;
  superpower: Record<SupportedLanguage, string>;
}

export const assistantCharacters: AssistantCharacter[] = [
  {
    id: 'studyTroll',
    label: 'Cheerful Leaf',
    motto: {
      en: 'Soft repeats, fresh attention.',
      ru: 'Мягкий повтор, свежее внимание.',
      es: 'Repeticion suave, atencion fresca.',
    },
    name: {
      en: 'Cheerful Leaf',
      ru: 'Веселый листочек',
      es: 'Hojita Alegre',
    },
    description: {
      en: 'A light forest coach for days when vocabulary feels heavy. It keeps practice playful, nudges recent mistakes back into view, and mixes in fresh words before repetition gets stale.',
      ru: 'Легкий лесной тренер для дней, когда словарь становится тяжелым. Он оставляет практику игровой, возвращает свежие ошибки в поле зрения и подмешивает новые слова до того, как повторение надоест.',
      es: 'Un entrenador ligero del bosque para dias en que el vocabulario pesa. Mantiene la practica juguetona, devuelve errores recientes y mezcla palabras nuevas antes de que la repeticion canse.',
    },
    abilities: {
      en: [
        'Recent-mistake breeze: brings back a missed card soon, but not endlessly.',
        'Fresh leaf mix-in: adds new cards between repeats to protect attention.',
        'Gentle streak watch: praises stable recall without rushing the next card.',
      ],
      ru: [
        'Ветер свежих ошибок: возвращает промахнутую карточку скоро, но не бесконечно.',
        'Подмешивание свежих листьев: вставляет новые карточки между повторами, чтобы не убить внимание.',
        'Мягкий контроль серии: замечает устойчивое вспоминание без спешки к следующей карточке.',
      ],
      es: [
        'Brisa de errores recientes: devuelve pronto una tarjeta fallada, pero no sin fin.',
        'Mezcla de hojas frescas: intercala tarjetas nuevas entre repeticiones para cuidar la atencion.',
        'Vigilancia suave de rachas: reconoce recuerdo estable sin apresurar la siguiente tarjeta.',
      ],
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
    motto: {
      en: 'Memory likes order and a warm cup.',
      ru: 'Память любит порядок и теплую кружку.',
      es: 'La memoria quiere orden y una taza tibia.',
    },
    name: {
      en: 'Mnemo-Mama',
      ru: 'Мнемо-мама',
      es: 'Mama Mnemo',
    },
    description: {
      en: 'A calm mentor who turns scattered attempts into rituals. She is best for careful learners who want steady review, tidy answers, and less panic around difficult phrases.',
      ru: 'Спокойная наставница, которая превращает разбросанные попытки в ритуалы. Лучше всего подходит аккуратным ученикам, которым нужны ровное повторение, чистые ответы и меньше паники вокруг сложных фраз.',
      es: 'Una mentora tranquila que convierte intentos dispersos en rituales. Va bien para estudiantes cuidadosos que quieren repaso estable, respuestas limpias y menos panico con frases dificiles.',
    },
    abilities: {
      en: [
        'Ritual queue: groups weak cards into small calm batches.',
        'Phrase blanket: gives phrase cards a little more review space.',
        'Careful finish: favors accuracy over speed when recent answers are noisy.',
      ],
      ru: [
        'Очередь-ритуал: собирает слабые карточки в маленькие спокойные порции.',
        'Плед для фраз: дает карточкам-фразам чуть больше места для повторения.',
        'Аккуратный финиш: ставит точность выше скорости, когда последние ответы шумные.',
      ],
      es: [
        'Cola ritual: agrupa tarjetas debiles en lotes pequenos y tranquilos.',
        'Manta para frases: da a las frases un poco mas de espacio de repaso.',
        'Final cuidadoso: prioriza precision sobre velocidad cuando las respuestas recientes son ruidosas.',
      ],
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
    motto: {
      en: 'Context first, victory second.',
      ru: 'Сначала контекст, потом победа.',
      es: 'Primero contexto, luego victoria.',
    },
    name: {
      en: 'Captain Knowledge',
      ru: 'Капитан знаний',
      es: 'Capitan Saber',
    },
    description: {
      en: 'A cinematic strategist who treats each prompt like a mission brief. He helps connect answers with clues, definitions, and examples so recall comes from meaning, not guessing.',
      ru: 'Кинематографичный стратег, который относится к каждому заданию как к брифингу миссии. Он связывает ответы с подсказками, определениями и примерами, чтобы вспоминание шло от смысла, а не от угадывания.',
      es: 'Un estratega cinematografico que trata cada ejercicio como informe de mision. Conecta respuestas con pistas, definiciones y ejemplos para recordar por sentido, no por azar.',
    },
    abilities: {
      en: [
        'Context beam: highlights the clue language that best separates close answers.',
        'Mission brief: summarizes why this card belongs in the current topic.',
        'Example anchor: favors cards with examples when phrases need context.',
      ],
      ru: [
        'Луч контекста: подсвечивает подсказку, которая лучше отделяет близкие ответы.',
        'Брифинг миссии: кратко объясняет, почему карточка относится к текущей наборе.',
        'Якорь примера: чаще опирается на примеры, когда фразам нужен контекст.',
      ],
      es: [
        'Rayo de contexto: destaca la pista que mejor separa respuestas cercanas.',
        'Informe de mision: resume por que la tarjeta pertenece al tema actual.',
        'Ancla de ejemplo: favorece ejemplos cuando las frases necesitan contexto.',
      ],
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
    motto: {
      en: 'Break the word, not the learner.',
      ru: 'Ломай слово на части, а не ученика.',
      es: 'Rompe la palabra, no al estudiante.',
    },
    name: {
      en: 'Memory Hulk',
      ru: 'Халк запоминания',
      es: 'Hulk de Memoria',
    },
    description: {
      en: 'A big-energy coach for long words, dense spelling, and stubborn patterns. He turns intimidating answers into chunks, rhythm, and visible structure.',
      ru: 'Энергичный тренер для длинных слов, плотного написания и упрямых паттернов. Он превращает пугающие ответы в куски, ритм и видимую структуру.',
      es: 'Un entrenador de mucha energia para palabras largas, ortografia densa y patrones tercos. Convierte respuestas intimidantes en bloques, ritmo y estructura visible.',
    },
    abilities: {
      en: [
        'Chunk smash: splits long answers into recallable pieces.',
        'Pattern grip: notices repeated letter shapes across cards.',
        'Strength reserve: saves the hardest cards for moments with enough momentum.',
      ],
      ru: [
        'Удар по кускам: делит длинные ответы на части, которые легче вспоминать.',
        'Хват паттерна: замечает повторяющиеся формы букв между карточками.',
        'Запас силы: оставляет самые тяжелые карточки на моменты, когда уже есть разгон.',
      ],
      es: [
        'Golpe de bloques: divide respuestas largas en partes recordables.',
        'Agarre de patron: detecta formas de letras repetidas entre tarjetas.',
        'Reserva de fuerza: guarda tarjetas duras para momentos con suficiente impulso.',
      ],
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
    motto: {
      en: 'Every word is a thread.',
      ru: 'Каждое слово - это нить.',
      es: 'Cada palabra es un hilo.',
    },
    name: {
      en: 'Wise Spider',
      ru: 'Мудрый паучок',
      es: 'Aranita Sabia',
    },
    description: {
      en: 'A precise connector for learners who like patterns between languages. It notices similar words, false friends, and translation threads so vocabulary becomes a web instead of a pile.',
      ru: 'Точный связист для учеников, которым нравятся связи между языками. Он замечает похожие слова, ложных друзей и нити переводов, чтобы словарь становился сетью, а не кучей.',
      es: 'Un conector preciso para quienes disfrutan patrones entre idiomas. Nota palabras parecidas, falsos amigos e hilos de traduccion para que el vocabulario sea red, no monton.',
    },
    abilities: {
      en: [
        'Thread map: links cards that share spelling, roots, or meaning.',
        'False-friend alert: warns when a familiar-looking word can mislead.',
        'Web recall: suggests nearby cards when one answer keeps slipping.',
      ],
      ru: [
        'Карта нитей: связывает карточки с похожим написанием, корнями или смыслом.',
        'Сигнал ложного друга: предупреждает, когда знакомое на вид слово может обмануть.',
        'Сетевое вспоминание: предлагает соседние карточки, когда один ответ постоянно ускользает.',
      ],
      es: [
        'Mapa de hilos: conecta tarjetas con escritura, raices o sentido parecidos.',
        'Alerta de falso amigo: avisa cuando una palabra familiar puede enganar.',
        'Recuerdo en red: sugiere tarjetas vecinas cuando una respuesta se escapa.',
      ],
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
