import { SupportedLanguage } from './languages';
import type { WorldId } from './worlds';

export type AssistantId =
  | 'studyTroll'
  | 'trollMama'
  | 'capeChampion'
  | 'greenPower'
  | 'webRunner'
  | 'forestElf'
  | 'unicorn';

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

const footballAssistantCharacters: RawAssistantCharacter[] = [
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

const forestAssistantCharacters: RawAssistantCharacter[] = [
  {
    id: 'studyTroll',
    label: 'Cheerful Leaf',
    motto: {
      en: 'Soft repeats, fresh attention.',
      ru: 'Мягкий повтор, свежее внимание.',
      es: 'Repeticion suave, atencion fresca.',
      uk: 'Мʼяке повторення, свіжа увага.',
    },
    name: {
      en: 'Cheerful Leaf',
      ru: 'Веселый листочек',
      es: 'Hojita Alegre',
      uk: 'Веселий листочок',
    },
    description: {
      en: 'A light forest coach for days when vocabulary feels heavy. It keeps practice playful, nudges recent mistakes back into view, and mixes in fresh words before repetition gets stale.',
      ru: 'Легкий лесной тренер для дней, когда словарь становится тяжелым. Он оставляет практику игровой, возвращает свежие ошибки в поле зрения и подмешивает новые слова до того, как повторение надоест.',
      es: 'Un entrenador ligero del bosque para dias en que el vocabulario pesa. Mantiene la practica juguetona, devuelve errores recientes y mezcla palabras nuevas antes de que la repeticion canse.',
      uk: 'Легкий лісовий тренер для днів, коли словник здається важким. Він зберігає практику ігровою, повертає свіжі помилки в поле зору й домішує нові слова до того, як повторення набридає.',
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
      uk: [
        'Вітер свіжих помилок: швидко повертає промахнуту картку, але не безкінечно.',
        'Домішування свіжого листя: вставляє нові картки між повторами, щоб берегти увагу.',
        'Мʼякий контроль серії: помічає стабільне згадування без поспіху до наступної картки.',
      ],
    },
    superpower: {
      en: 'Notices stubborn mistakes and brings them back before they fossilize.',
      ru: 'Замечает упрямые ошибки и возвращает их до того, как они окаменеют.',
      es: 'Detecta errores tercos y los devuelve antes de que se fosilicen.',
      uk: 'Помічає вперті помилки й повертає їх до того, як вони закамʼяніють.',
    },
  },
  {
    id: 'trollMama',
    label: 'Mnemo-Mama',
    motto: {
      en: 'Memory likes order and a warm cup.',
      ru: 'Память любит порядок и теплую кружку.',
      es: 'La memoria quiere orden y una taza tibia.',
      uk: 'Памʼять любить порядок і теплу чашку.',
    },
    name: {
      en: 'Mnemo-Mama',
      ru: 'Мнемо-мама',
      es: 'Mama Mnemo',
      uk: 'Мнемо-мама',
    },
    description: {
      en: 'A calm mentor who turns scattered attempts into rituals. She is best for careful learners who want steady review, tidy answers, and less panic around difficult phrases.',
      ru: 'Спокойная наставница, которая превращает разбросанные попытки в ритуалы. Лучше всего подходит аккуратным ученикам, которым нужны ровное повторение, чистые ответы и меньше паники вокруг сложных фраз.',
      es: 'Una mentora tranquila que convierte intentos dispersos en rituales. Va bien para estudiantes cuidadosos que quieren repaso estable, respuestas limpias y menos panico con frases dificiles.',
      uk: 'Спокійна наставниця, що перетворює розкидані спроби на ритуали. Найкраще пасує уважним учням, яким потрібні рівне повторення, охайні відповіді й менше паніки навколо складних фраз.',
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
      uk: [
        'Черга-ритуал: збирає слабкі картки в маленькі спокійні порції.',
        'Плед для фраз: дає карткам-фразам трохи більше простору для повторення.',
        'Охайний фініш: ставить точність вище швидкості, коли останні відповіді шумні.',
      ],
    },
    superpower: {
      en: 'Turns messy attempts into calm repeatable memory rituals.',
      ru: 'Превращает хаотичные попытки в спокойные ритуалы запоминания.',
      es: 'Convierte intentos caoticos en rituales tranquilos de memoria.',
      uk: 'Перетворює хаотичні спроби на спокійні ритуали запамʼятовування.',
    },
  },
  {
    id: 'capeChampion',
    label: 'Captain Knowledge',
    motto: {
      en: 'Context first, victory second.',
      ru: 'Сначала контекст, потом победа.',
      es: 'Primero contexto, luego victoria.',
      uk: 'Спершу контекст, потім перемога.',
    },
    name: {
      en: 'Captain Knowledge',
      ru: 'Капитан знаний',
      es: 'Capitan Saber',
      uk: 'Капітан знань',
    },
    description: {
      en: 'A cinematic strategist who treats each prompt like a mission brief. He helps connect answers with clues, definitions, and examples so recall comes from meaning, not guessing.',
      ru: 'Кинематографичный стратег, который относится к каждому заданию как к брифингу миссии. Он связывает ответы с подсказками, определениями и примерами, чтобы вспоминание шло от смысла, а не от угадывания.',
      es: 'Un estratega cinematografico que trata cada ejercicio como informe de mision. Conecta respuestas con pistas, definiciones y ejemplos para recordar por sentido, no por azar.',
      uk: 'Кінематографічний стратег, який сприймає кожне завдання як брифінг місії. Він повʼязує відповіді з підказками, визначеннями й прикладами, щоб згадування йшло від змісту, а не від вгадування.',
    },
    abilities: {
      en: [
        'Context beam: highlights the clue language that best separates close answers.',
        'Mission brief: summarizes why this card belongs in the current topic.',
        'Example anchor: favors cards with examples when phrases need context.',
      ],
      ru: [
        'Луч контекста: подсвечивает подсказку, которая лучше отделяет близкие ответы.',
        'Брифинг миссии: кратко объясняет, почему карточка относится к текущей теме.',
        'Якорь примера: чаще опирается на примеры, когда фразам нужен контекст.',
      ],
      es: [
        'Rayo de contexto: destaca la pista que mejor separa respuestas cercanas.',
        'Informe de mision: resume por que la tarjeta pertenece al tema actual.',
        'Ancla de ejemplo: favorece ejemplos cuando las frases necesitan contexto.',
      ],
      uk: [
        'Промінь контексту: підсвічує підказку, яка найкраще відділяє близькі відповіді.',
        'Брифінг місії: коротко пояснює, чому картка належить до поточного набору.',
        'Якір прикладу: частіше спирається на приклади, коли фразам потрібен контекст.',
      ],
    },
    superpower: {
      en: 'Connects a word to its clue so the answer is easier to retrieve.',
      ru: 'Связывает слово с подсказкой, чтобы ответ было легче достать из памяти.',
      es: 'Conecta una palabra con su pista para recuperar mejor la respuesta.',
      uk: 'Повʼязує слово з підказкою, щоб відповідь було легше дістати з памʼяті.',
    },
  },
  {
    id: 'greenPower',
    label: 'Memory Hulk',
    motto: {
      en: 'Break the word, not the learner.',
      ru: 'Ломай слово на части, а не ученика.',
      es: 'Rompe la palabra, no al estudiante.',
      uk: 'Ламай слово на частини, а не учня.',
    },
    name: {
      en: 'Memory Hulk',
      ru: 'Халк запоминания',
      es: 'Hulk de Memoria',
      uk: 'Халк запамʼятовування',
    },
    description: {
      en: 'A big-energy coach for long words, dense spelling, and stubborn patterns. He turns intimidating answers into chunks, rhythm, and visible structure.',
      ru: 'Энергичный тренер для длинных слов, плотного написания и упрямых паттернов. Он превращает пугающие ответы в куски, ритм и видимую структуру.',
      es: 'Un entrenador de mucha energia para palabras largas, ortografia densa y patrones tercos. Convierte respuestas intimidantes en bloques, ritmo y estructura visible.',
      uk: 'Енергійний тренер для довгих слів, щільного написання й упертих патернів. Він перетворює лячні відповіді на шматки, ритм і видиму структуру.',
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
      uk: [
        'Удар по шматках: ділить довгі відповіді на частини, які легше згадати.',
        'Хват патерна: помічає повторювані форми літер між картками.',
        'Запас сили: залишає найважчі картки на моменти, коли вже є розгін.',
      ],
    },
    superpower: {
      en: 'Crushes long words into visible chunks and rhythm.',
      ru: 'Разбивает длинные слова на видимые куски и ритм.',
      es: 'Rompe palabras largas en bloques visibles y ritmo.',
      uk: 'Розбиває довгі слова на видимі шматки й ритм.',
    },
  },
  {
    id: 'webRunner',
    label: 'Wise Spider',
    motto: {
      en: 'Every word is a thread.',
      ru: 'Каждое слово - это нить.',
      es: 'Cada palabra es un hilo.',
      uk: 'Кожне слово - це нитка.',
    },
    name: {
      en: 'Wise Spider',
      ru: 'Мудрый паучок',
      es: 'Aranita Sabia',
      uk: 'Мудрий павучок',
    },
    description: {
      en: 'A precise connector for learners who like patterns between languages. It notices similar words, false friends, and translation threads so vocabulary becomes a web instead of a pile.',
      ru: 'Точный связист для учеников, которым нравятся связи между языками. Он замечает похожие слова, ложных друзей и нити переводов, чтобы словарь становился сетью, а не кучей.',
      es: 'Un conector preciso para quienes disfrutan patrones entre idiomas. Nota palabras parecidas, falsos amigos e hilos de traduccion para que el vocabulario sea red, no monton.',
      uk: 'Точний звʼязківець для учнів, яким подобаються звʼязки між мовами. Він помічає схожі слова, хибних друзів і нитки перекладів, щоб словник ставав мережею, а не купою.',
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
      uk: [
        'Карта ниток: повʼязує картки зі схожим написанням, коренями або змістом.',
        'Сигнал хибного друга: попереджає, коли знайоме на вигляд слово може обманути.',
        'Мережеве згадування: пропонує сусідні картки, коли одна відповідь постійно вислизає.',
      ],
    },
    superpower: {
      en: 'Spots fast associations between similar words without rushing the answer.',
      ru: 'Быстро замечает связи между похожими словами, не торопя ответ.',
      es: 'Detecta asociaciones rapidas entre palabras parecidas sin precipitar la respuesta.',
      uk: 'Швидко помічає звʼязки між схожими словами, не кваплячи відповідь.',
    },
  },
  {
    id: 'forestElf',
    label: 'Forest Elf',
    motto: {
      en: 'Quiet steps, bright clues.',
      ru: 'Тихие шаги, светлые подсказки.',
      es: 'Pasos suaves, pistas claras.',
      uk: 'Тихі кроки, світлі підказки.',
    },
    name: {
      en: 'Forest Elf',
      ru: 'Лесной эльф',
      es: 'Elfo del bosque',
      uk: 'Лісовий ельф',
    },
    description: {
      en: 'A nimble forest guide who moves lightly through difficult cards. The elf keeps the route playful, notices small hints, and helps the next answer feel discoverable instead of forced.',
      ru: 'Ловкий лесной проводник, который легко проходит через сложные карточки. Эльф оставляет маршрут игровым, замечает маленькие намеки и помогает следующему ответу находиться без нажима.',
      es: 'Un guia agil del bosque que avanza ligero por tarjetas dificiles. El elfo mantiene la ruta juguetona, nota pistas pequenas y ayuda a encontrar la respuesta sin forzarla.',
      uk: 'Спритний лісовий провідник, що легко проходить крізь складні картки. Ельф зберігає маршрут ігровим, помічає маленькі підказки й допомагає знаходити відповідь без натиску.',
    },
    abilities: {
      en: [
        'Moonlit hint: makes the most useful clue feel a little brighter.',
        'Silent shortcut: moves from one tricky card to the next without drama.',
        'Leaf-step rhythm: keeps repeats light and evenly spaced.',
      ],
      ru: [
        'Лунная подсказка: делает самый полезный намек чуть светлее.',
        'Тихая тропинка: переводит от одной сложной карточки к другой без драмы.',
        'Ритм листового шага: держит повторы легкими и ровными.',
      ],
      es: [
        'Pista lunar: hace que la pista mas util brille un poco mas.',
        'Atajo silencioso: pasa de una tarjeta dificil a otra sin drama.',
        'Ritmo de hoja: mantiene repeticiones ligeras y espaciadas.',
      ],
      uk: [
        'Місячна підказка: робить найкорисніший натяк трохи світлішим.',
        'Тиха стежка: переводить від однієї складної картки до іншої без драми.',
        'Ритм листяного кроку: тримає повтори легкими й рівними.',
      ],
    },
    superpower: {
      en: 'Finds quiet shortcuts between clue and answer without rushing you.',
      ru: 'Находит тихие тропинки от подсказки к ответу, не подгоняя тебя.',
      es: 'Encuentra atajos tranquilos entre pista y respuesta sin apurarte.',
      uk: 'Знаходить тихі стежки від підказки до відповіді, не підганяючи тебе.',
    },
  },
  {
    id: 'unicorn',
    label: 'Silver Unicorn',
    motto: {
      en: 'Sparkle is practice wearing a crown.',
      ru: 'Блеск - это практика в короне.',
      es: 'El brillo es practica con corona.',
      uk: 'Блиск - це практика в короні.',
    },
    name: {
      en: 'Silver Unicorn',
      ru: 'Серебряный единорог',
      es: 'Unicornio plateado',
      uk: 'Срібний єдиноріг',
    },
    description: {
      en: 'A bright mythical friend for cards that need a little wonder. The unicorn turns a dry repeat into a small celebration and helps confidence come back after misses.',
      ru: 'Светлый сказочный друг для карточек, которым нужно немного чуда. Единорог превращает сухой повтор в маленький праздник и помогает уверенности вернуться после промахов.',
      es: 'Un amigo mitico y luminoso para tarjetas que necesitan maravilla. El unicornio convierte un repaso seco en una pequena fiesta y devuelve confianza tras fallos.',
      uk: 'Світлий казковий друг для карток, яким потрібно трохи дива. Єдиноріг перетворює сухий повтор на маленьке свято й повертає впевненість після промахів.',
    },
    abilities: {
      en: [
        'Rainbow reset: softens a miss so the next card starts clean.',
        'Sparkle streak: notices when a once-hard card begins to shine.',
        'Wonder mix: brings fresh cards into repeats before the forest gets sleepy.',
      ],
      ru: [
        'Радужный сброс: смягчает промах, чтобы следующая карточка началась чисто.',
        'Искристая серия: замечает, когда трудная карточка начинает сиять.',
        'Чудо-подмешивание: добавляет свежие карточки в повторы до того, как лес заскучает.',
      ],
      es: [
        'Reinicio arcoiris: suaviza un fallo para empezar limpia la siguiente tarjeta.',
        'Racha brillante: nota cuando una tarjeta dificil empieza a brillar.',
        'Mezcla maravillosa: trae tarjetas frescas antes de que el bosque se duerma.',
      ],
      uk: [
        'Райдужний скид: помʼякшує промах, щоб наступна картка почалася чисто.',
        'Іскриста серія: помічає, коли складна картка починає сяяти.',
        'Диво-домішування: додає свіжі картки до повторів, перш ніж ліс засумує.',
      ],
    },
    superpower: {
      en: 'Turns shaky repeats into a bright reset and keeps courage alive.',
      ru: 'Превращает шаткие повторы в светлый перезапуск и поддерживает смелость.',
      es: 'Convierte repeticiones inseguras en reinicio brillante y mantiene el animo.',
      uk: 'Перетворює хиткі повтори на світлий перезапуск і підтримує сміливість.',
    },
  },
];

export const assistantCharacters: AssistantCharacter[] = footballAssistantCharacters;

export const assistantCharactersByWorld: Record<WorldId, AssistantCharacter[]> = {
  football: footballAssistantCharacters,
  forest: forestAssistantCharacters,
};

export const defaultAssistantId: AssistantId = 'studyTroll';

export const visibleAssistantIds: AssistantId[] = [
  'studyTroll',
  'greenPower',
  'webRunner',
  'capeChampion',
];

const visibleAssistantIdsByWorld: Record<WorldId, AssistantId[]> = {
  football: visibleAssistantIds,
  forest: ['studyTroll', 'forestElf', 'unicorn'],
};

export const visibleAssistantCharacters = getVisibleAssistantCharacters('football');

export function resolveAssistantId(
  value: unknown,
  worldId: WorldId = 'football',
): AssistantId {
  if (value === 'trollMama') {
    return defaultAssistantId;
  }
  const visibleIds = visibleAssistantIdsByWorld[worldId] ?? visibleAssistantIds;
  return visibleIds.some((assistantId) => assistantId === value)
    ? (value as AssistantId)
    : getDefaultAssistantIdForAssistantWorld(worldId);
}

export function getAssistantProfile(
  value: unknown,
  interfaceLanguage: SupportedLanguage,
  worldId: WorldId = 'football',
): AssistantCharacter {
  const assistantId = resolveAssistantId(value, worldId);
  return (
    getAssistantCharactersForWorld(worldId).find(
      (assistant) => assistant.id === assistantId,
    ) ?? getAssistantCharactersForWorld(worldId)[0]
  );
}

export function getAssistantTooltip(
  value: unknown,
  interfaceLanguage: SupportedLanguage,
  worldId: WorldId = 'football',
): string {
  const assistant = getAssistantProfile(value, interfaceLanguage, worldId);
  return `${assistant.name[interfaceLanguage]}: ${assistant.superpower[interfaceLanguage]}`;
}

export function getAssistantCharactersForWorld(
  worldId: WorldId = 'football',
): AssistantCharacter[] {
  return assistantCharactersByWorld[worldId] ?? footballAssistantCharacters;
}

export function getVisibleAssistantCharacters(
  worldId: WorldId = 'football',
): AssistantCharacter[] {
  const visibleIds = visibleAssistantIdsByWorld[worldId] ?? visibleAssistantIds;
  return getAssistantCharactersForWorld(worldId).filter((assistant) =>
    visibleIds.includes(assistant.id),
  );
}

export function getDefaultAssistantIdForAssistantWorld(
  worldId: WorldId = 'football',
): AssistantId {
  return worldId === 'forest' ? 'studyTroll' : defaultAssistantId;
}
