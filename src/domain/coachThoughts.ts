import { AssistantId, defaultAssistantId, resolveAssistantId } from './assistants';
import { SupportedLanguage } from './languages';

type ThoughtSource = {
  openings: string[];
  endings: string[];
};

type CharacterThoughtSources = Record<SupportedLanguage, ThoughtSource>;

const thoughtSources: Record<AssistantId, CharacterThoughtSources> = {
  studyTroll: {
    en: {
      openings: [
        'I found this word under a mossy grammar stone',
        'The forest notebook says you can handle this',
        'Small steps, big boots, clean memory',
        'I am grumbling approvingly at that focus',
        'A careful answer beats a loud answer',
        'This card is trying to hide behind a fern',
        'Your vocabulary trail is getting easier to follow',
        'The old stump council respects this attempt',
        'Let the letters line up like stepping stones',
        'A sturdy mind keeps walking through fog',
      ],
      endings: [
        'Look at the clue, then move with patience.',
        'One exact choice is better than three rushed guesses.',
        'If you miss, mark the path and try again.',
        'The answer is closer than it wants to admit.',
        'Keep the pace earthy and steady.',
        'Do not wrestle the word; invite it out.',
        'A remembered mistake is useful treasure.',
        'Listen for the shape of the phrase.',
        'Your next attempt has better footing.',
        'Accuracy first, celebration after.',
      ],
    },
    ru: {
      openings: [
        'Я нашел это слово под мшистым камнем грамматики',
        'Лесная тетрадь говорит, что ты справишься',
        'Малые шаги, крепкие ботинки, ясная память',
        'Я ворчу одобрительно на такой фокус',
        'Аккуратный ответ сильнее громкого ответа',
        'Карточка пытается спрятаться за папоротником',
        'Тропа словарного запаса становится понятнее',
        'Совет старых пней уважает эту попытку',
        'Пусть буквы станут как камни через ручей',
        'Крепкая голова проходит даже через туман',
      ],
      endings: [
        'Смотри на подсказку и двигайся терпеливо.',
        'Один точный выбор лучше трех поспешных.',
        'Если промахнулся, отметь тропу и пробуй еще.',
        'Ответ ближе, чем ему хочется казаться.',
        'Держи темп спокойно и надежно.',
        'Не борись со словом, выманивай его.',
        'Запомненная ошибка тоже полезная находка.',
        'Слушай форму фразы.',
        'У следующей попытки уже лучше опора.',
        'Сначала точность, праздник потом.',
      ],
    },
    es: {
      openings: [
        'Encontre esta palabra bajo una piedra de gramatica',
        'El cuaderno del bosque dice que puedes con esto',
        'Pasos pequenos, botas firmes, memoria clara',
        'Estoy refunfunando con aprobacion por ese foco',
        'Una respuesta cuidadosa gana a una ruidosa',
        'Esta tarjeta intenta esconderse tras un helecho',
        'Tu sendero de vocabulario se ve mas claro',
        'El consejo de troncos viejos respeta este intento',
        'Que las letras formen piedras sobre el arroyo',
        'Una cabeza firme cruza incluso la niebla',
      ],
      endings: [
        'Mira la pista y avanza con paciencia.',
        'Una eleccion exacta vale mas que tres prisas.',
        'Si fallas, marca el camino y vuelve.',
        'La respuesta esta mas cerca de lo que admite.',
        'Mantén un ritmo tranquilo y solido.',
        'No luches con la palabra; invitala a salir.',
        'Un error recordado tambien es un hallazgo util.',
        'Escucha la forma de la frase.',
        'El siguiente intento ya pisa mejor.',
        'Primero precision, celebracion despues.',
      ],
    },
  },
  trollMama: {
    en: {
      openings: [
        'I brought tea, order, and a sharp pencil',
        'Straighten the clue and the answer will sit properly',
        'No rushing at my table, only clean thinking',
        'That word needs a warm blanket and a clear rule',
        'I can see when memory has eaten breakfast',
        'A tidy attempt makes the whole kitchen brighter',
        'This phrase wants manners and attention',
        'Good learning smells like fresh pages',
        'We do not panic; we prepare',
        'Your answer is invited to behave',
      ],
      endings: [
        'Check the hint, then answer with care.',
        'A calm second is worth a noisy minute.',
        'Mistakes are allowed; mess is optional.',
        'If it feels slippery, say it once in your head.',
        'Keep the meaning warm and the spelling neat.',
        'The right word likes a steady hand.',
        'Feed the memory small portions.',
        'Make the phrase comfortable before choosing.',
        'You are closer when you slow down.',
        'Good discipline can still smile.',
      ],
    },
    ru: {
      openings: [
        'Я принесла чай, порядок и острый карандаш',
        'Выпрями подсказку, и ответ сядет ровно',
        'За моим столом не спешат, а думают чисто',
        'Этому слову нужен теплый плед и ясное правило',
        'Я вижу, когда память хорошо позавтракала',
        'Аккуратная попытка делает кухню светлее',
        'Эта фраза любит вежливость и внимание',
        'Хорошая учеба пахнет свежими страницами',
        'Мы не паникуем, мы готовимся',
        'Твой ответ приглашен вести себя прилично',
      ],
      endings: [
        'Проверь подсказку и отвечай бережно.',
        'Спокойная секунда ценнее шумной минуты.',
        'Ошибки можно, беспорядок не обязательно.',
        'Если скользит, произнеси в голове один раз.',
        'Держи смысл теплым, а написание аккуратным.',
        'Правильное слово любит ровную руку.',
        'Корми память маленькими порциями.',
        'Сначала устрой фразу удобно, потом выбирай.',
        'Ты ближе, когда замедляешься.',
        'Хорошая дисциплина тоже умеет улыбаться.',
      ],
    },
    es: {
      openings: [
        'Traje te, orden y un lapiz afilado',
        'Endereza la pista y la respuesta se sentara bien',
        'En mi mesa no se corre, se piensa limpio',
        'Esta palabra necesita manta tibia y regla clara',
        'Se nota cuando la memoria desayuno bien',
        'Un intento ordenado ilumina toda la cocina',
        'Esta frase quiere modales y atencion',
        'Aprender bien huele a paginas nuevas',
        'No entramos en panico; nos preparamos',
        'Tu respuesta esta invitada a portarse bien',
      ],
      endings: [
        'Revisa la pista y responde con cuidado.',
        'Un segundo tranquilo vale mas que un minuto ruidoso.',
        'Los errores se permiten; el desorden no hace falta.',
        'Si resbala, dilo una vez en la cabeza.',
        'Mantén el sentido tibio y la escritura limpia.',
        'La palabra correcta quiere una mano firme.',
        'Alimenta la memoria en porciones pequenas.',
        'Acomoda la frase antes de elegir.',
        'Estas mas cerca cuando vas mas despacio.',
        'La buena disciplina tambien sonrie.',
      ],
    },
  },
  capeChampion: {
    en: {
      openings: [
        'Cape status: focused and wind-tested',
        'The camera zooms in on your next answer',
        'Hero work today means precise vocabulary',
        'The city of meanings needs one clean choice',
        'Your training montage just got quieter',
        'A brave answer still checks the clue',
        'The spotlight likes accuracy',
        'This card is the scene before the comeback',
        'You do not need thunder, just the right word',
        'Every hero learns the small lines first',
      ],
      endings: [
        'Hold the frame and choose clearly.',
        'Let confidence follow evidence.',
        'One good correction saves the sequel.',
        'Read the hint like a mission brief.',
        'Make the answer land cleanly.',
        'Strong is useful; precise is better.',
        'The next scene rewards patience.',
        'Even capes need spelling.',
        'Your progress has main-character posture.',
        'Keep the ending neat.',
      ],
    },
    ru: {
      openings: [
        'Плащ в режиме фокуса и встречного ветра',
        'Камера приближает твой следующий ответ',
        'Геройство сегодня значит точный словарь',
        'Городу смыслов нужен один чистый выбор',
        'Твоя тренировочная сцена стала тише',
        'Смелый ответ все равно проверяет подсказку',
        'Прожектор любит точность',
        'Эта карточка как сцена перед камбэком',
        'Не нужен гром, нужно правильное слово',
        'Каждый герой сначала учит маленькие реплики',
      ],
      endings: [
        'Держи кадр и выбирай ясно.',
        'Пусть уверенность идет за доказательством.',
        'Одна хорошая поправка спасает продолжение.',
        'Читай подсказку как брифинг миссии.',
        'Посади ответ чисто.',
        'Сила полезна, точность полезнее.',
        'Следующая сцена наградит терпение.',
        'Даже плащу нужна орфография.',
        'У прогресса уже геройская осанка.',
        'Финал держим аккуратным.',
      ],
    },
    es: {
      openings: [
        'Estado de capa: foco y viento superados',
        'La camara se acerca a tu proxima respuesta',
        'Ser heroe hoy significa vocabulario preciso',
        'La ciudad de significados necesita una eleccion limpia',
        'Tu montaje de entrenamiento se volvio mas silencioso',
        'Una respuesta valiente tambien revisa la pista',
        'El foco de luz prefiere precision',
        'Esta tarjeta es la escena antes del regreso',
        'No necesitas trueno, solo la palabra correcta',
        'Todo heroe aprende primero las lineas pequenas',
      ],
      endings: [
        'Sostén el plano y elige claro.',
        'Que la confianza siga a la evidencia.',
        'Una buena correccion salva la secuela.',
        'Lee la pista como informe de mision.',
        'Haz aterrizar la respuesta limpiamente.',
        'La fuerza ayuda; la precision ayuda mas.',
        'La siguiente escena premia la paciencia.',
        'Incluso las capas necesitan ortografia.',
        'Tu progreso ya tiene postura protagonista.',
        'Mantén el final ordenado.',
      ],
    },
  },
  greenPower: {
    en: {
      openings: [
        'Power level: controlled, not chaotic',
        'Big strength, small spelling target',
        'The word barbell is ready',
        'Calm force beats random smashing',
        'Your focus just did a clean rep',
        'This answer needs grip, not noise',
        'Strong memory grows under steady load',
        'The clue is lighter when you breathe',
        'Green mode says: form first',
        'The next card cannot outlift patience',
      ],
      endings: [
        'Brace, read, answer.',
        'No drama, just clean technique.',
        'Control the letters all the way down.',
        'A miss is feedback, not defeat.',
        'Use power where precision points.',
        'Keep your stance under the meaning.',
        'The best rep is repeatable.',
        'Do not rush the final letter.',
        'Strong answers stay balanced.',
        'Reset your shoulders and go.',
      ],
    },
    ru: {
      openings: [
        'Уровень силы: под контролем, без хаоса',
        'Большая мощь, маленькая цель по буквам',
        'Словесная штанга готова',
        'Спокойная сила лучше случайного удара',
        'Твой фокус сделал чистый повтор',
        'Этому ответу нужен хват, не шум',
        'Сильная память растет под ровной нагрузкой',
        'Подсказка легче, когда ты дышишь',
        'Зеленый режим говорит: сначала техника',
        'Следующая карточка не перетянет терпение',
      ],
      endings: [
        'Соберись, прочитай, отвечай.',
        'Без драмы, только чистая техника.',
        'Контролируй буквы до самого конца.',
        'Промах это обратная связь, не поражение.',
        'Используй силу там, где точность показывает.',
        'Держи стойку под смыслом.',
        'Лучший повтор тот, который можно повторить.',
        'Не торопи последнюю букву.',
        'Сильные ответы стоят ровно.',
        'Сбрось плечи и вперед.',
      ],
    },
    es: {
      openings: [
        'Nivel de fuerza: controlado, no caotico',
        'Gran potencia, objetivo pequeno de letras',
        'La barra de palabras esta lista',
        'La fuerza tranquila gana al golpe aleatorio',
        'Tu foco hizo una repeticion limpia',
        'Esta respuesta necesita agarre, no ruido',
        'La memoria fuerte crece con carga estable',
        'La pista pesa menos cuando respiras',
        'Modo verde dice: tecnica primero',
        'La siguiente tarjeta no levanta mas que la paciencia',
      ],
      endings: [
        'Aprieta, lee, responde.',
        'Sin drama, solo tecnica limpia.',
        'Controla las letras hasta abajo.',
        'Un fallo es informacion, no derrota.',
        'Usa fuerza donde apunta la precision.',
        'Mantén la postura bajo el significado.',
        'La mejor repeticion se puede repetir.',
        'No apresures la ultima letra.',
        'Las respuestas fuertes mantienen equilibrio.',
        'Relaja los hombros y sigue.',
      ],
    },
  },
  webRunner: {
    en: {
      openings: [
        'Fast feet, quiet mind, clean answer',
        'The clue line is a rooftop route',
        'Your memory just made a neat swing',
        'Do not chase the word; intercept it',
        'The sentence has a hidden handhold',
        'A nimble guess still needs evidence',
        'This card is asking for timing',
        'Thread the meaning between the options',
        'Your focus landed without a stumble',
        'The next word is one swing away',
      ],
      endings: [
        'Look, aim, move.',
        'Use the hint like a line across the gap.',
        'Accuracy is the best shortcut.',
        'If you slip, recover from the nearest clue.',
        'Keep the answer light but exact.',
        'Do not overthink the jump.',
        'The phrase has rhythm; follow it.',
        'Clean timing beats speed alone.',
        'Trust the pattern you can prove.',
        'Land on the final letter.',
      ],
    },
    ru: {
      openings: [
        'Быстрые ноги, тихая голова, чистый ответ',
        'Линия подсказки как маршрут по крышам',
        'Память только что сделала аккуратный рывок',
        'Не гонись за словом, перехвати его',
        'В предложении есть скрытая зацепка',
        'Ловкая догадка все равно требует доказательств',
        'Эта карточка просит тайминг',
        'Проведи смысл между вариантами',
        'Фокус приземлился без запинки',
        'Следующее слово в одном прыжке',
      ],
      endings: [
        'Смотри, целься, двигайся.',
        'Используй подсказку как линию через разрыв.',
        'Точность лучший короткий путь.',
        'Если соскользнул, возвращайся к ближайшей подсказке.',
        'Держи ответ легким, но точным.',
        'Не перемудри прыжок.',
        'У фразы есть ритм, следуй ему.',
        'Чистый тайминг сильнее одной скорости.',
        'Доверяй только доказанному паттерну.',
        'Приземляйся на последнюю букву.',
      ],
    },
    es: {
      openings: [
        'Pies rapidos, mente quieta, respuesta limpia',
        'La linea de la pista es una ruta por tejados',
        'Tu memoria acaba de hacer un giro preciso',
        'No persigas la palabra; interceptala',
        'La frase tiene un agarre escondido',
        'Una conjetura agil tambien necesita pruebas',
        'Esta tarjeta pide sincronizacion',
        'Pasa el sentido entre las opciones',
        'Tu foco aterrizo sin tropiezo',
        'La siguiente palabra esta a un salto',
      ],
      endings: [
        'Mira, apunta, mueve.',
        'Usa la pista como linea sobre el hueco.',
        'La precision es el mejor atajo.',
        'Si resbalas, vuelve a la pista mas cercana.',
        'Mantén la respuesta ligera pero exacta.',
        'No compliques el salto.',
        'La frase tiene ritmo; siguelo.',
        'El buen timing gana a la velocidad sola.',
        'Confia en el patron que puedes probar.',
        'Aterriza en la ultima letra.',
      ],
    },
  },
};

export const coachThoughts: Record<
  AssistantId,
  Record<SupportedLanguage, string[]>
> = Object.fromEntries(
  Object.entries(thoughtSources).map(([assistantId, byLanguage]) => [
    assistantId,
    Object.fromEntries(
      Object.entries(byLanguage).map(([language, source]) => [
        language,
        buildThoughts(source.openings, source.endings),
      ]),
    ),
  ]),
) as Record<AssistantId, Record<SupportedLanguage, string[]>>;

export function getCoachThought(
  interfaceLanguage: SupportedLanguage,
  seed: number,
  assistantId: AssistantId | string | undefined = defaultAssistantId,
): string {
  const resolvedAssistantId = resolveAssistantId(assistantId);
  const thoughts = coachThoughts[resolvedAssistantId][interfaceLanguage];
  return thoughts[Math.abs(Math.trunc(seed)) % thoughts.length];
}

function buildThoughts(openings: string[], endings: string[]): string[] {
  return openings.flatMap((opening) =>
    endings.map((ending) => `${opening}: ${lowercaseFirst(stripPeriod(ending))}.`),
  );
}

function stripPeriod(value: string): string {
  return value.replace(/\.$/, '');
}

function lowercaseFirst(value: string): string {
  return value.charAt(0).toLocaleLowerCase() + value.slice(1);
}
