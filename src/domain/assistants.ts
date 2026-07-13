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

interface RawAssistantCharacter {
  abilities: Record<SupportedLanguage, string[]>;
  description: Record<SupportedLanguage, string>;
  id: AssistantId;
  label: string;
  motto: Record<SupportedLanguage, string>;
  name: Record<SupportedLanguage, string>;
  superpower: Record<SupportedLanguage, string>;
}

const rawAssistantCharacters: RawAssistantCharacter[] = [
  {
    id: 'studyTroll',
    label: 'Spain Winger',
    motto: {
      en: 'One touch, one sprint, one brave answer.',
      ru: 'Одно касание, один рывок, один смелый ответ.',
      es: 'Un toque, una carrera, una respuesta valiente.',
      uk: 'Один дотик, один ривок, одна смілива відповідь.',
    },
    name: {
      en: 'Spanish Winger',
      ru: 'Испанский вингер',
      es: 'Extremo Espanol',
      uk: 'Іспанський вінгер',
    },
    description: {
      en: 'A fearless wing wonderkid for fast games and brave guesses. He keeps the tempo bright, attacks weak cards early, and turns a difficult prompt into a chance to break through the flank.',
      ru: 'Бесстрашный фланговый вундеркинд для быстрых игр и смелых попыток. Он держит яркий темп, рано атакует слабые карточки и превращает трудный вопрос в шанс прорваться по краю.',
      es: 'Un extremo joven y valiente para partidas rapidas e intentos atrevidos. Mantiene el ritmo vivo, ataca tarjetas debiles pronto y convierte una pregunta dificil en una ruptura por banda.',
      uk: 'Безстрашний фланговий вундеркінд для швидких ігор і сміливих спроб. Він тримає яскравий темп, рано атакує слабкі картки й перетворює складне запитання на шанс прорватися краєм.',
    },
    abilities: {
      en: [
        'Wing burst: moves recent mistakes higher without making the whole match feel stuck.',
        'First-touch focus: keeps the next prompt simple and quick after a hard miss.',
        'Crowd spark: rewards streaks with short, match-like encouragement.',
      ],
      ru: [
        'Рывок по флангу: поднимает свежие ошибки выше, но не превращает матч в застревание.',
        'Первое касание: после тяжелого промаха держит следующий вопрос простым и быстрым.',
        'Искра трибун: коротко празднует серии, как опасную атаку у ворот.',
      ],
      es: [
        'Arranque por banda: sube errores recientes sin atascar todo el partido.',
        'Primer toque: tras un fallo duro mantiene la siguiente pregunta simple y rapida.',
        'Chispa de grada: celebra rachas con animo corto de dia de partido.',
      ],
      uk: [
        'Ривок флангом: піднімає свіжі помилки вище, але не застрягає весь матч.',
        'Перший дотик: після важкого промаху тримає наступне запитання простим і швидким.',
        'Іскра трибун: коротко святкує серії, як небезпечну атаку біля воріт.',
      ],
    },
    superpower: {
      en: 'Explodes down the wing and brings weak cards back into scoring range.',
      ru: 'Взрывает фланг и возвращает слабые карточки в ударную позицию.',
      es: 'Explota la banda y devuelve tarjetas debiles a zona de remate.',
      uk: 'Вибухає на фланзі й повертає слабкі картки в ударну позицію.',
    },
  },
  {
    id: 'trollMama',
    label: 'Iniesta Maestro',
    motto: {
      en: 'Calm feet, clean pass, perfect pause.',
      ru: 'Спокойные ноги, чистый пас, идеальная пауза.',
      es: 'Pies tranquilos, pase limpio, pausa perfecta.',
      uk: 'Спокійні ноги, чистий пас, ідеальна пауза.',
    },
    name: {
      en: 'Iniesta Maestro',
      ru: 'Иньеста-маэстро',
      es: 'Iniesta Maestro',
      uk: 'Іньєста-маестро',
    },
    description: {
      en: 'A quiet midfield artist for careful phrases, soft rhythm, and answers that need one extra second. He slows the game just enough for memory to find the open lane.',
      ru: 'Тихий художник центра поля для аккуратных фраз, мягкого ритма и ответов, которым нужна лишняя секунда. Он замедляет игру ровно настолько, чтобы память нашла свободный коридор.',
      es: 'Un artista silencioso del centro para frases cuidadas, ritmo suave y respuestas que necesitan un segundo mas. Baja el ritmo lo justo para que la memoria encuentre el pasillo.',
      uk: 'Тихий художник центру поля для акуратних фраз, мʼякого ритму й відповідей, яким потрібна ще одна секунда. Він сповільнює гру рівно настільки, щоб памʼять знайшла відкритий коридор.',
    },
    abilities: {
      en: [
        'La pausa: gives phrase cards a little more breathing room.',
        'Through ball: connects clue language with the exact answer lane.',
        'Calm control: favors accuracy when the last few attempts were noisy.',
      ],
      ru: [
        'Ла пауза: дает фразам чуть больше воздуха перед ответом.',
        'Разрезающий пас: связывает язык подсказки с точной линией ответа.',
        'Спокойный контроль: выбирает точность, когда последние попытки шумят.',
      ],
      es: [
        'La pausa: da a las frases un poco mas de aire antes de responder.',
        'Pase filtrado: conecta la lengua de la pista con la linea exacta.',
        'Control sereno: prioriza precision cuando los ultimos intentos hacen ruido.',
      ],
      uk: [
        'La pausa: дає фразам трохи більше повітря перед відповіддю.',
        'Розрізний пас: зʼєднує мову підказки з точною лінією відповіді.',
        'Спокійний контроль: обирає точність, коли останні спроби шумлять.',
      ],
    },
    superpower: {
      en: 'Finds the quiet passing lane between clue, phrase, and answer.',
      ru: 'Находит тихий коридор паса между подсказкой, фразой и ответом.',
      es: 'Encuentra el pasillo tranquilo entre pista, frase y respuesta.',
      uk: 'Знаходить тихий коридор пасу між підказкою, фразою та відповіддю.',
    },
  },
  {
    id: 'capeChampion',
    label: 'German Saver',
    motto: {
      en: 'Read the strike, own the line, keep the match alive.',
      ru: 'Читай удар, держи линию, сохраняй матч живым.',
      es: 'Lee el tiro, domina la linea y salva el partido.',
      uk: 'Читай удар, тримай лінію, зберігай матч живим.',
    },
    name: {
      en: 'German Saver',
      ru: 'Немецкий сейвер',
      es: 'Salvador Aleman',
      uk: 'Німецький сейвер',
    },
    description: {
      en: 'A German keeper for defensive focus and pressure moments. He protects the session from panic, asks for one clean save, and makes even a wrong answer useful for the next attack.',
      ru: 'Немецкий вратарь для концентрации и моментов давления. Он защищает игру от паники, просит один чистый сейв и делает даже неверный ответ полезным для следующей атаки.',
      es: 'Un portero aleman para concentracion y momentos de presion. Protege la partida del panico, pide una parada limpia y convierte un fallo en informacion para el siguiente ataque.',
      uk: 'Німецький воротар для концентрації та моментів тиску. Він захищає гру від паніки, просить один чистий сейв і робить навіть неправильну відповідь корисною для наступної атаки.',
    },
    abilities: {
      en: [
        'Glove save: catches repeated mistakes before they become easy goals.',
        'Penalty calm: steadies the player after a red result.',
        'Clean sheet: notices when a card has stayed correct across a streak.',
      ],
      ru: [
        'Сейв перчаткой: ловит повторные ошибки до того, как они станут легкими голами.',
        'Пенальти-спокойствие: стабилизирует игрока после красного результата.',
        'Сухой матч: замечает карточку, которая держится верной серией.',
      ],
      es: [
        'Parada de guante: atrapa errores repetidos antes de que sean goles faciles.',
        'Calma de penalti: estabiliza al jugador tras un resultado rojo.',
        'Porteria a cero: nota una tarjeta que mantiene una racha correcta.',
      ],
      uk: [
        'Сейв рукавицею: ловить повторні помилки до того, як вони стануть легкими голами.',
        'Пенальті-спокій: стабілізує гравця після червоного результату.',
        'Сухий матч: помічає картку, що тримається правильною серією.',
      ],
    },
    superpower: {
      en: 'Turns pressure into a clean save and protects the match streak.',
      ru: 'Превращает давление в чистый сейв и защищает игровую серию.',
      es: 'Convierte la presion en parada limpia y protege la racha.',
      uk: 'Перетворює тиск на чистий сейв і захищає ігрову серію.',
    },
  },
  {
    id: 'greenPower',
    label: 'Portugal Striker',
    motto: {
      en: 'Shoot early, press high, celebrate loud.',
      ru: 'Бей рано, прессингуй высоко, празднуй громко.',
      es: 'Remata pronto, presiona arriba y celebra fuerte.',
      uk: 'Бий рано, пресингуй високо, святкуй гучно.',
    },
    name: {
      en: 'Portuguese Striker',
      ru: 'Португальский бомбардир',
      es: 'Goleador Portugues',
      uk: 'Португальський бомбардир',
    },
    description: {
      en: 'A Portuguese finisher for stubborn words and heavy spelling. He attacks long answers in pieces and turns a difficult card into a shot on target.',
      ru: 'Португальский финишер для упрямых слов и тяжелого написания. Он атакует длинные ответы по частям и превращает сложную карточку в удар в створ.',
      es: 'Un rematador portugues para palabras tercas y ortografia pesada. Ataca respuestas largas por partes y convierte una tarjeta dificil en tiro a puerta.',
      uk: 'Португальський фінішер для впертих слів і важкого написання. Він атакує довгі відповіді частинами й перетворює складну картку на удар у площину воріт.',
    },
    abilities: {
      en: [
        'Captain tackle: splits long words into defendable chunks.',
        'Set-piece header: brings back the card at the moment it can be won.',
        'Last-minute roar: keeps a tough game alive after mistakes.',
      ],
      ru: [
        'Капитанский подкат: делит длинные слова на куски, которые можно защитить.',
        'Удар головой со стандарта: возвращает карточку в момент, когда ее можно выиграть.',
        'Рев последних минут: держит тяжелую игру живой после ошибок.',
      ],
      es: [
        'Entrada de capitan: divide palabras largas en bloques defendibles.',
        'Cabeza a balon parado: devuelve la tarjeta cuando se puede ganar.',
        'Rugido final: mantiene vivo un juego duro despues de errores.',
      ],
      uk: [
        'Капітанський підкат: ділить довгі слова на шматки, які можна захистити.',
        'Удар головою зі стандарту: повертає картку в момент, коли її можна виграти.',
        'Рев останніх хвилин: тримає важку гру живою після помилок.',
      ],
    },
    superpower: {
      en: 'Breaks long answers into shots and finishes them under pressure.',
      ru: 'Разбивает длинные ответы на удары и завершает их под давлением.',
      es: 'Divide respuestas largas en remates y las define bajo presion.',
      uk: 'Розбиває довгі відповіді на удари й завершує їх під тиском.',
    },
  },
  {
    id: 'webRunner',
    label: 'England Captain',
    motto: {
      en: 'Lead the press, call the pass, keep the shape.',
      ru: 'Веди прессинг, зови пас, держи схему.',
      es: 'Lidera la presion, pide el pase y guarda la forma.',
      uk: 'Веди пресинг, клич пас, тримай схему.',
    },
    name: {
      en: 'English Captain',
      ru: 'Английский капитан',
      es: 'Capitan Ingles',
      uk: 'Англійський капітан',
    },
    description: {
      en: 'An English captain for patterns, passing lanes, and language links. He sees similar words early, spots false friends, and makes the whole library feel like a team shape.',
      ru: 'Английский капитан для паттернов, линий паса и языковых связей. Он рано видит похожие слова, замечает ложных друзей и превращает библиотеку в командную схему.',
      es: 'Un capitan ingles para patrones, lineas de pase y enlaces entre idiomas. Ve palabras parecidas pronto, detecta falsos amigos y convierte la biblioteca en forma de equipo.',
      uk: 'Англійський капітан для патернів, ліній пасу та мовних звʼязків. Він рано бачить схожі слова, помічає хибних друзів і перетворює бібліотеку на командну схему.',
    },
    abilities: {
      en: [
        'Tiki-taka map: links cards with roots, spelling, or meaning.',
        'False-friend whistle: flags a familiar-looking word before it tricks you.',
        'Triangle recall: uses nearby cards to open a memory lane.',
      ],
      ru: [
        'Карта тики-таки: связывает карточки с похожими корнями, написанием или смыслом.',
        'Свисток ложного друга: отмечает знакомое на вид слово до того, как оно обманет.',
        'Треугольник памяти: использует соседние карточки, чтобы открыть линию вспоминания.',
      ],
      es: [
        'Mapa tiki-taka: conecta tarjetas por raices, escritura o sentido.',
        'Silbato de falso amigo: marca una palabra familiar antes de que engane.',
        'Triangulo de memoria: usa tarjetas cercanas para abrir linea de recuerdo.',
      ],
      uk: [
        'Карта тікі-таки: повʼязує картки зі схожими коренями, написанням або змістом.',
        'Свисток хибного друга: позначає знайоме на вигляд слово до того, як воно обдурить.',
        'Трикутник памʼяті: використовує сусідні картки, щоб відкрити лінію згадування.',
      ],
    },
    superpower: {
      en: 'Organizes cards into passing lanes so every answer has a route.',
      ru: 'Собирает карточки в линии паса, чтобы у каждого ответа был маршрут.',
      es: 'Ordena tarjetas en lineas de pase para que cada respuesta tenga ruta.',
      uk: 'Збирає картки в лінії пасу, щоб кожна відповідь мала маршрут.',
    },
  },
];

export const assistantCharacters: AssistantCharacter[] = rawAssistantCharacters;

export const defaultAssistantId: AssistantId = 'studyTroll';

export const visibleAssistantIds: AssistantId[] = [
  'studyTroll',
  'greenPower',
  'webRunner',
  'capeChampion',
];

export const visibleAssistantCharacters = assistantCharacters.filter((assistant) =>
  visibleAssistantIds.includes(assistant.id),
);

export function resolveAssistantId(value: unknown): AssistantId {
  if (value === 'trollMama') {
    return defaultAssistantId;
  }
  return visibleAssistantIds.some((assistantId) => assistantId === value)
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
