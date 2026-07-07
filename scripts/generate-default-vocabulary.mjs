import { writeFile } from 'node:fs/promises';

const CREATED_AT = '2026-07-07T00:00:00.000Z';
const OUTPUT_PATH = new URL('../data/default-vocabulary-seed.json', import.meta.url);

const THEMES = [
  {
    id: 'love',
    name: 'Любовь',
    words: splitWords(`
      love date kiss smile heart crush flirt charm affection trust
      romance partner couple feeling tenderness gentleness sweetness caring honesty loyalty
      passion desire admiration longing cherish cuddle blush attraction chemistry promise
      commitment marriage wedding anniversary friendship soulmate beloved darling attention kindness
      respect support closeness apology forgiveness surprise gift flowers devotion intimacy
    `),
    objects: [
      'my feelings',
      'this date',
      'our plans',
      'the message',
      'the gift',
      'a surprise',
      'the apology',
      'your family',
      'our promise',
      'the invitation',
    ],
  },
  {
    id: 'family',
    name: 'Семья',
    words: splitWords(`
      family mother father parent child children son daughter brother sister
      sibling grandmother grandfather grandson granddaughter aunt uncle cousin nephew niece
      husband wife spouse relative household baby toddler teenager adult elder
      generation caregiver visit call dinner holiday birthday memory photo tradition
      advice rule chore bedtime school play story lullaby guardian ancestor
    `),
    objects: [
      'family dinner',
      'the kids',
      'my parents',
      'our weekend',
      'the birthday',
      'home chores',
      'family photos',
      'grandma',
      'the school run',
      'bedtime',
    ],
  },
  {
    id: 'home',
    name: 'Дом',
    words: splitWords(`
      house apartment room kitchen bathroom bedroom door window wall floor
      ceiling table chair sofa bed pillow blanket sheet closet shelf
      drawer mirror shower sink toilet towel soap light lamp fridge
      oven stove kettle dish plate cup spoon fork knife trash
      cleaning laundry vacuum broom key lock neighbor rent repair balcony
    `),
    objects: [
      'the kitchen',
      'the bathroom',
      'the keys',
      'the rent',
      'the repair',
      'the laundry',
      'the fridge',
      'the bedroom',
      'the neighbors',
      'the balcony',
    ],
  },
  {
    id: 'food',
    name: 'Еда',
    words: splitWords(`
      food meal breakfast lunch supper snack water coffee tea milk
      juice bread butter cheese egg rice pasta soup salad chicken
      beef pork fish seafood vegetable fruit apple banana orange potato
      tomato onion garlic carrot pepper salt sugar honey sauce oil
      flour cake cookie icecream yogurt cereal sandwich pizza burger restaurant
    `),
    objects: [
      'breakfast',
      'some coffee',
      'the menu',
      'a table',
      'the bill',
      'fresh bread',
      'dinner',
      'the recipe',
      'more water',
      'a snack',
    ],
  },
  {
    id: 'travel',
    name: 'Путешествия',
    words: splitWords(`
      travel trip journey flight airport ticket passport luggage suitcase backpack
      map route station platform train bus taxi car bicycle scooter
      hotel hostel reservation reception beach mountain island getaway tour guide
      museum monument street avenue bridge tunnel border customs delay arrival
      departure gate seat boarding transfer traffic distance destination adventure souvenir
    `),
    objects: [
      'the flight',
      'my passport',
      'the hotel',
      'the route',
      'the station',
      'our luggage',
      'the map',
      'the reservation',
      'the delay',
      'the destination',
    ],
  },
  {
    id: 'work',
    name: 'Работа',
    words: splitWords(`
      work job office desk meeting deadline task project manager team
      colleague client email report presentation schedule calendar plan goal priority
      progress feedback contract budget invoice salary career skill training interview
      resume position department company business market customer service product quality
      decision problem solution idea note file folder printer break shift
    `),
    objects: [
      'the meeting',
      'the deadline',
      'the project',
      'the report',
      'my schedule',
      'the client',
      'the budget',
      'the contract',
      'the presentation',
      'the next task',
    ],
  },
  {
    id: 'study',
    name: 'Учеба',
    words: splitWords(`
      study lesson course class teacher student book notebook pen pencil
      paper homework exam test quiz grade subject language grammar vocabulary
      pronunciation reading writing listening speaking practice exercise answer question example
      definition meaning mistake correction progression level chapter page library lecture
      seminar workshop certificate diploma campus dormitory education knowledge learning tutor
    `),
    objects: [
      'this lesson',
      'the homework',
      'the exam',
      'new vocabulary',
      'the grammar',
      'my mistake',
      'the example',
      'the answer',
      'the pronunciation',
      'the next chapter',
    ],
  },
  {
    id: 'health',
    name: 'Здоровье',
    words: splitWords(`
      health doctor nurse clinic hospital appointment symptom pain headache fever
      cough cold flu allergy medicine pill tablet vitamin therapy treatment
      recovery injury wound blood pressure temperature breath sleep energy diet
      fitness workout heartbeat stomach back throat eye ear tooth skin
      muscle bone stress anxiety rest relaxation checkup insurance pharmacy emergency
    `),
    objects: [
      'my appointment',
      'this symptom',
      'the medicine',
      'the doctor',
      'my sleep',
      'the treatment',
      'the pain',
      'my diet',
      'the pharmacy',
      'the checkup',
    ],
  },
  {
    id: 'shopping',
    name: 'Покупки',
    words: splitWords(`
      shop store marketplace cart basket cashier checkout receipt price discount
      sale offer coupon brand size color style fashion clothes shirt
      pants dress skirt jacket coat shoes socks hat bag wallet
      card cash change refund return delivery package order online website
      review rating choice option selection buyer seller bargain payment counter
    `),
    objects: [
      'the price',
      'this size',
      'the receipt',
      'the discount',
      'my order',
      'the delivery',
      'the return',
      'the payment',
      'these shoes',
      'the package',
    ],
  },
  {
    id: 'time',
    name: 'Время',
    words: splitWords(`
      time minute hour day week month year morning afternoon evening
      night today tomorrow yesterday soon later early late now then
      before after during while always often sometimes rarely never again
      already still period moment second quarter season spring summer autumn
      winter weekend weekday timeline duration frequency future past present midnight
    `),
    objects: [
      'the time',
      'this morning',
      'tomorrow',
      'next week',
      'the weekend',
      'the deadline',
      'the schedule',
      'a few minutes',
      'the future',
      'last night',
    ],
  },
  {
    id: 'weather',
    name: 'Погода',
    words: splitWords(`
      weather sun moon sky cloud rain snow wind storm thunder
      lightning fog mist ice frost heat humidity climate forecast umbrella
      drizzle monsoon rainbow sunrise sunset breeze gale hail puddle mud
      seasonality barometer sunlight shade dryness wetness snowfall rainfall windspeed daylight
      darkness cloudy sunny rainy snowy windy freezing warm hot cool
    `),
    objects: [
      'the weather',
      'the forecast',
      'the rain',
      'the snow',
      'the wind',
      'my umbrella',
      'the temperature',
      'the sunshine',
      'the storm',
      'the cold',
    ],
  },
  {
    id: 'emotions',
    name: 'Эмоции',
    words: splitWords(`
      emotion happiness sadness anger fear joy worry excitement boredom calm
      hope doubt confidence shame guilt pride relief jealousy patience courage
      mood sensation tears laughter grin frown panic peace comfort tension
      amazement disappointment frustration gratitude curiosity interest confusion loneliness compassion resentment
      nervousness enthusiasm optimism pessimism empathy sympathy valor bravery irritation delight
    `),
    objects: [
      'my mood',
      'this feeling',
      'your worry',
      'my excitement',
      'the tension',
      'the confusion',
      'my confidence',
      'the disappointment',
      'your patience',
      'a little calm',
    ],
  },
  {
    id: 'communication',
    name: 'Общение',
    words: splitWords(`
      communication conversation message chat talk speech voice word sentence phrase
      inquiry response reply comment request invitation explanation discussion argument agreement
      disagreement opinion concept detail topic anecdote joke rumor news briefing
      phonecall text letter memo reminder announcement critique greeting goodbye regret
      thanks please yes no maybe definitely honestly clearly quietly loudly
    `),
    objects: [
      'your message',
      'this question',
      'the answer',
      'the topic',
      'our conversation',
      'the invitation',
      'the explanation',
      'the update',
      'the joke',
      'my reply',
    ],
  },
  {
    id: 'technology',
    name: 'Технологии',
    words: splitWords(`
      technology phone computer laptop smartwatch screen keyboard mouse charger battery
      cable app browser portal password account login logout upgrade download
      upload document archive screenshot video audio camera microphone speaker network
      wifi internet signal device software hardware bug feature setting notification
      messenger inbox server backup storage privacy security code data database
    `),
    objects: [
      'my phone',
      'the password',
      'the app',
      'the update',
      'the file',
      'the camera',
      'the internet',
      'the notification',
      'the backup',
      'the account',
    ],
  },
  {
    id: 'city',
    name: 'Город',
    words: splitWords(`
      city town village district neighborhood center suburb square park road
      sidewalk crossing corner intersection building boutique cafe bank postbox
      apothecary kindergarten courthouse bookstore theater cinema terminal stop metro tram
      shelter depot parking garage entrance exit elevator stairs escalator
      address directory sign billboard bench fountain playground bazaar plaza alley
      crosswalk courtyard
    `),
    objects: [
      'the address',
      'the bus stop',
      'the metro',
      'the parking',
      'the entrance',
      'the bank',
      'the post office',
      'the corner',
      'the crossing',
      'the city center',
    ],
  },
  {
    id: 'nature',
    name: 'Природа',
    words: splitWords(`
      nature tree forest leaf flower grass river lake sea ocean
      peak hill valley field garden path stone rock sand soil
      animal bird dog cat horse cow sheep deer insect butterfly
      bee spider ant highland meadow branch root seed plant harvest
      orchard wildlife habitat waterfall desert jungle seashore coastline cave
      woodland
    `),
    objects: [
      'the forest',
      'the river',
      'the garden',
      'the flowers',
      'the path',
      'the mountain',
      'the lake',
      'the animals',
      'the tree',
      'the beach',
    ],
  },
  {
    id: 'hobbies',
    name: 'Хобби',
    words: splitWords(`
      hobby music song guitar piano dance painting drawing scrapbooking cooking
      baking novel poetry gaming sport running swimming cycling hiking yoga
      fishing gardening knitting sewing chess puzzle movie series podcast blogging
      craft pottery sculpture photography improv singing pilates skating skiing surfing
      camping climbing collecting volunteering meditation journaling streaming acting karaoke
      calligraphy
    `),
    objects: [
      'my hobby',
      'this song',
      'the movie',
      'the recipe',
      'the game',
      'my workout',
      'the book',
      'the podcast',
      'the painting',
      'our hike',
    ],
  },
  {
    id: 'money',
    name: 'Деньги',
    words: splitWords(`
      money funds coin bill purse lender ledger balance income expense
      lease mortgage loan debt credit debit savings allowance fare cost
      fee tax tip paycheck wage installment remittance exchange currency euro
      dollar statement voucher rebate markdown clearance investment profit loss risk
      coverage pension billpay banking wealth poverty afford owe earn spend
    `),
    objects: [
      'the budget',
      'the bill',
      'my account',
      'the payment',
      'the price',
      'the transfer',
      'the refund',
      'the rent',
      'the tax',
      'my savings',
    ],
  },
  {
    id: 'action-verbs',
    name: 'Глаголы действий',
    words: splitWords(`
      do make get take give put bring send keep leave
      go come see look hear listen speak say tell ask
      respond open close start halt finish try use need want
      like help find lose buy sell pay wait move turn
      hold carry sit stand walk run drive ride cook clean
    `),
    objects: [
      'to start now',
      'to stop here',
      'to open the door',
      'to close the window',
      'to find the key',
      'to pay the bill',
      'to wait a minute',
      'to drive home',
      'to cook dinner',
      'to clean the room',
    ],
  },
  {
    id: 'thinking-verbs',
    name: 'Глаголы мышления',
    words: splitWords(`
      think know understand remember forget learn absorb believe ponder guess
      notice realize imagine decide choose compare explain describe mean matter
      wonder consider expect suppose assume infer recognize focus concentrate strategize
      organize solve improve revise repeat rehearse analyze check confirm deny
      agree disagree prefer estimate evaluate measure count predict prepare discover
    `),
    objects: [
      'to remember this word',
      'to understand the rule',
      'to choose an answer',
      'to compare the options',
      'to explain the meaning',
      'to focus on practice',
      'to repeat the phrase',
      'to check the result',
      'to plan the lesson',
      'to improve my memory',
    ],
  },
];

const PHRASE_TEMPLATES = [
  'I need help with {object}.',
  'Can we talk about {object}?',
  'I have a question about {object}.',
  'Please remind me about {object}.',
  'I am trying to understand {object}.',
];

function splitWords(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function buildEnglishCards() {
  const cards = [];
  const cardSets = [];

  THEMES.forEach((theme) => {
    if (theme.words.length !== 50) {
      throw new Error(`${theme.name} must have 50 words, got ${theme.words.length}`);
    }
    if (theme.objects.length !== 10) {
      throw new Error(`${theme.name} must have 10 phrase objects, got ${theme.objects.length}`);
    }

    const cardIds = [];
    theme.words.forEach((word, index) => {
      const id = `default-${theme.id}-word-${String(index + 1).padStart(2, '0')}`;
      cardIds.push(id);
      cards.push({
        id,
        kind: 'word',
        text: word,
        tags: ['default', 'daily', 'word', theme.id],
        difficulty: index < 20 ? 'easy' : index < 40 ? 'medium' : 'hard',
      });
    });

    const phrases = theme.objects.flatMap((object) =>
      PHRASE_TEMPLATES.map((template) => template.replace('{object}', object)),
    );
    if (phrases.length !== 50) {
      throw new Error(`${theme.name} must have 50 phrases, got ${phrases.length}`);
    }

    phrases.forEach((phrase, index) => {
      const id = `default-${theme.id}-phrase-${String(index + 1).padStart(2, '0')}`;
      cardIds.push(id);
      cards.push({
        id,
        kind: 'phrase',
        text: phrase,
        tags: ['default', 'daily', 'phrase', theme.id],
        difficulty: index < 20 ? 'easy' : index < 40 ? 'medium' : 'hard',
      });
    });

    cardSets.push({
      id: `default-set-${theme.id}`,
      name: theme.name,
      cardIds,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
  });

  return { cards, cardSets };
}

async function translateMany(texts, targetLanguage) {
  const output = [];
  const chunkSize = 40;

  for (let index = 0; index < texts.length; index += chunkSize) {
    const chunk = texts.slice(index, index + chunkSize);
    const translated = await translateChunk(chunk, targetLanguage);
    output.push(...translated);
  }

  return output;
}

async function translateChunk(texts, targetLanguage) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', targetLanguage);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', texts.join('\n'));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const translatedText = payload[0].map((entry) => entry[0]).join('');
  const translatedLines = translatedText.split('\n').map((line) => line.trim());

  if (translatedLines.length !== texts.length) {
    throw new Error(
      `Translate returned ${translatedLines.length} lines for ${texts.length} ${targetLanguage} lines`,
    );
  }

  return translatedLines;
}

function assertSeed(seed) {
  const words = seed.cards.filter((card) => !/\s/.test(card.translations.en.trim()));
  const phrases = seed.cards.filter((card) => /\s/.test(card.translations.en.trim()));
  if (seed.cards.length !== 2000) {
    throw new Error(`Expected 2000 cards, got ${seed.cards.length}`);
  }
  if (words.length !== 1000) {
    throw new Error(`Expected 1000 words, got ${words.length}`);
  }
  if (phrases.length !== 1000) {
    throw new Error(`Expected 1000 phrases, got ${phrases.length}`);
  }
  if (seed.cardSets.length !== 20) {
    throw new Error(`Expected 20 card sets, got ${seed.cardSets.length}`);
  }
  seed.cardSets.forEach((cardSet) => {
    if (cardSet.cardIds.length !== 100) {
      throw new Error(`${cardSet.name} must have 100 cards, got ${cardSet.cardIds.length}`);
    }
  });
}

const englishSeed = buildEnglishCards();
const englishTexts = englishSeed.cards.map((card) => card.text);
const ruTexts = await translateMany(englishTexts, 'ru');
const esTexts = await translateMany(englishTexts, 'es');

const seed = {
  cards: englishSeed.cards.map((card, index) => ({
    id: card.id,
    translations: {
      en: card.text,
      ru: ruTexts[index],
      es: esTexts[index],
    },
    tags: card.tags,
    difficulty: card.difficulty,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  })),
  cardSets: englishSeed.cardSets,
};

assertSeed(seed);

await writeFile(OUTPUT_PATH, `${JSON.stringify(seed, null, 2)}\n`);
console.log(
  `Generated ${seed.cards.length} cards and ${seed.cardSets.length} card sets at ${OUTPUT_PATH.pathname}`,
);
