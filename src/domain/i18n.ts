import { SupportedLanguage } from './languages';

type I18nKey =
  | 'appName'
  | 'game'
  | 'cards'
  | 'statistics'
  | 'themes'
  | 'history'
  | 'interfaceLanguage'
  | 'targetLanguage'
  | 'assistant'
  | 'importSection'
  | 'importCards'
  | 'importDescription'
  | 'downloadCardFormat'
  | 'startLearning'
  | 'start'
  | 'allWords'
  | 'add'
  | 'archive'
  | 'newTheme'
  | 'create'
  | 'chooseTheme'
  | 'chooseExercise'
  | 'fileImport'
  | 'pasteJson'
  | 'chooseJsonFile'
  | 'cardsJson'
  | 'crossword'
  | 'multipleChoice'
  | 'missingLetters'
  | 'missingWord'
  | 'submit'
  | 'importAction'
  | 'answer'
  | 'next'
  | 'finishExercise'
  | 'finishExerciseNotice'
  | 'answeredWords'
  | 'fillAllGapsWarning'
  | 'cancel'
  | 'confirm'
  | 'correctAnswer'
  | 'correctAnswers'
  | 'exerciseDetails'
  | 'userAnswer'
  | 'noAnswer'
  | 'resultsTitle'
  | 'totalExercises'
  | 'totalAnsweredQuestions'
  | 'resultStats'
  | 'wordStats'
  | 'phraseStats'
  | 'correctResult'
  | 'correct'
  | 'incorrect'
  | 'targetAnswerLabel'
  | 'targetLanguageAnswer'
  | 'fallbackTranslationShown'
  | 'selectThemeToManage'
  | 'importCardsBeforeTheme'
  | 'allImportedCardsInTheme'
  | 'importCardsToFillList'
  | 'addImportedCardsToStartTheme'
  | 'noTranslationAvailable'
  | 'fileImported'
  | 'couldNotReadFile'
  | 'importAdded'
  | 'importSafeMerged'
  | 'importPendingDuplicates'
  | 'importInvalid'
  | 'importSkipped'
  | 'recordsCouldNotBeImported'
  | 'row'
  | 'selectedAssistant'
  | 'coachThought'
  | 'noAttempts';

const messages: Record<SupportedLanguage, Record<I18nKey, string>> = {
  en: {
    appName: 'Language Lab',
    game: 'Game',
    cards: 'Cards',
    statistics: 'Statistics',
    themes: 'Themes',
    history: 'History',
    interfaceLanguage: 'Interface',
    targetLanguage: 'Target',
    assistant: 'Character',
    importSection: 'Import',
    importCards: 'Import cards',
    importDescription: 'Load a JSON file or paste a JSON array of language cards.',
    downloadCardFormat: 'Download agent JSON requirements',
    startLearning: 'Start learning',
    start: 'Start',
    allWords: 'All words',
    add: 'Add',
    archive: 'Archive',
    newTheme: 'New theme',
    create: 'Create',
    chooseTheme: 'Choose theme',
    chooseExercise: 'Choose exercise',
    fileImport: 'Import from file',
    pasteJson: 'Paste JSON',
    chooseJsonFile: 'Choose JSON file',
    cardsJson: 'Cards JSON',
    crossword: 'Crossword',
    multipleChoice: 'Question with 3 answers',
    missingLetters: 'Missing letters',
    missingWord: 'Missing word in sentence',
    submit: 'Submit',
    importAction: 'Import',
    answer: 'Answer',
    next: 'Next',
    finishExercise: 'Finish exercise',
    finishExerciseNotice:
      'Exercise results will be counted and the exercise will end.',
    answeredWords: 'Answered words',
    fillAllGapsWarning: 'Fill all gaps',
    cancel: 'Cancel',
    confirm: 'Confirm',
    correctAnswer: 'Correct answer',
    correctAnswers: 'Correct answers',
    exerciseDetails: 'Exercise details',
    userAnswer: 'Your answer',
    noAnswer: 'No answer',
    resultsTitle: 'Results',
    totalExercises: 'Exercises completed',
    totalAnsweredQuestions: 'Questions answered',
    resultStats: 'Statistics',
    wordStats: 'Word statistics',
    phraseStats: 'Phrase statistics',
    correctResult: 'Correct!',
    correct: 'Correct',
    incorrect: 'Incorrect',
    targetAnswerLabel: 'Target answer',
    targetLanguageAnswer: 'answer',
    fallbackTranslationShown: 'Fallback translation shown',
    selectThemeToManage: 'Select a theme to manage its cards.',
    importCardsBeforeTheme: 'Import cards before adding them to a theme.',
    allImportedCardsInTheme: 'All imported cards are in this theme.',
    importCardsToFillList: 'Import cards to fill this list.',
    addImportedCardsToStartTheme: 'Add imported cards to start this theme.',
    noTranslationAvailable: 'No translation available',
    fileImported: 'imported',
    couldNotReadFile: 'Could not read this file.',
    importAdded: 'Added',
    importSafeMerged: 'Safe merged',
    importPendingDuplicates: 'Pending duplicates',
    importInvalid: 'Invalid',
    importSkipped: 'Skipped',
    recordsCouldNotBeImported: 'Some records could not be imported.',
    row: 'Row',
    selectedAssistant: 'Selected character',
    coachThought: 'Character thought',
    noAttempts: 'No attempts for this target language yet.',
  },
  ru: {
    appName: 'Language Lab',
    game: 'Игра',
    cards: 'Карточки',
    statistics: 'Статистика',
    themes: 'Темы',
    history: 'История',
    interfaceLanguage: 'Интерфейс',
    targetLanguage: 'Цель',
    assistant: 'Персонаж',
    importSection: 'Импорт',
    importCards: 'Импорт карточек',
    importDescription:
      'Загрузите JSON-файл или вставьте JSON-массив языковых карточек.',
    downloadCardFormat: 'Скачать требования к JSON для агентов',
    startLearning: 'Начать учиться',
    start: 'Начать',
    allWords: 'Все слова',
    add: 'Добавить',
    archive: 'В архив',
    newTheme: 'Новая тема',
    create: 'Создать',
    chooseTheme: 'Выберите тему',
    chooseExercise: 'Выберите упражнение',
    fileImport: 'Импорт из файла',
    pasteJson: 'Вставить JSON',
    chooseJsonFile: 'Выбрать JSON-файл',
    cardsJson: 'JSON карточек',
    crossword: 'Кроссворд',
    multipleChoice: 'Вопрос с 3 вариантами',
    missingLetters: 'Пропущенные буквы',
    missingWord: 'Пропущенное слово',
    submit: 'Отправить',
    importAction: 'Импортировать',
    answer: 'Ответ',
    next: 'Следующий',
    finishExercise: 'Закончить упражнение',
    finishExerciseNotice:
      'Результаты упражнения будут зачтены, а упражнение закончено.',
    answeredWords: 'Отвечено слов',
    fillAllGapsWarning: 'Заполните все пропуски',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    correctAnswer: 'Правильный ответ',
    correctAnswers: 'Правильные ответы',
    exerciseDetails: 'Детали упражнения',
    userAnswer: 'Ваш ответ',
    noAnswer: 'Нет ответа',
    resultsTitle: 'Результаты',
    totalExercises: 'Всего пройдено упражнений',
    totalAnsweredQuestions: 'Всего отвечено вопросов',
    resultStats: 'Статистика',
    wordStats: 'Статистика по слову',
    phraseStats: 'Статистика по фразе',
    correctResult: 'Правильно!',
    correct: 'Верно',
    incorrect: 'Неверно',
    targetAnswerLabel: 'Целевой ответ',
    targetLanguageAnswer: 'ответ',
    fallbackTranslationShown: 'Показан запасной перевод',
    selectThemeToManage: 'Выберите тему, чтобы управлять карточками.',
    importCardsBeforeTheme: 'Импортируйте карточки, прежде чем добавлять их в тему.',
    allImportedCardsInTheme: 'Все импортированные карточки уже в этой теме.',
    importCardsToFillList: 'Импортируйте карточки, чтобы заполнить список.',
    addImportedCardsToStartTheme: 'Добавьте импортированные карточки, чтобы начать тему.',
    noTranslationAvailable: 'Перевод пока не указан',
    fileImported: 'импортирован',
    couldNotReadFile: 'Не удалось прочитать этот файл.',
    importAdded: 'Добавлено',
    importSafeMerged: 'Безопасно объединено',
    importPendingDuplicates: 'Дубликаты в ожидании',
    importInvalid: 'Некорректные',
    importSkipped: 'Пропущено',
    recordsCouldNotBeImported: 'Некоторые записи не удалось импортировать.',
    row: 'Строка',
    selectedAssistant: 'Выбранный персонаж',
    coachThought: 'Мысль персонажа',
    noAttempts: 'Пока нет упражнений для этого языка-цели.',
  },
  es: {
    appName: 'Language Lab',
    game: 'Juego',
    cards: 'Tarjetas',
    statistics: 'Estadisticas',
    themes: 'Temas',
    history: 'Historial',
    interfaceLanguage: 'Interfaz',
    targetLanguage: 'Objetivo',
    assistant: 'Personaje',
    importSection: 'Importar',
    importCards: 'Importar tarjetas',
    importDescription:
      'Carga un archivo JSON o pega un array JSON de tarjetas de idioma.',
    downloadCardFormat: 'Descargar requisitos JSON para agentes',
    startLearning: 'Empezar',
    start: 'Empezar',
    allWords: 'Todas las palabras',
    add: 'Anadir',
    archive: 'Archivar',
    newTheme: 'Nuevo tema',
    create: 'Crear',
    chooseTheme: 'Elegir tema',
    chooseExercise: 'Elegir ejercicio',
    fileImport: 'Importar desde archivo',
    pasteJson: 'Pegar JSON',
    chooseJsonFile: 'Elegir archivo JSON',
    cardsJson: 'JSON de tarjetas',
    crossword: 'Crucigrama',
    multipleChoice: 'Pregunta con 3 respuestas',
    missingLetters: 'Letras que faltan',
    missingWord: 'Palabra que falta',
    submit: 'Enviar',
    importAction: 'Importar',
    answer: 'Respuesta',
    next: 'Siguiente',
    finishExercise: 'Terminar ejercicio',
    finishExerciseNotice:
      'Los resultados del ejercicio se guardaran y el ejercicio terminara.',
    answeredWords: 'Palabras respondidas',
    fillAllGapsWarning: 'Rellena todos los huecos',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    correctAnswer: 'Respuesta correcta',
    correctAnswers: 'Respuestas correctas',
    exerciseDetails: 'Detalles del ejercicio',
    userAnswer: 'Tu respuesta',
    noAnswer: 'Sin respuesta',
    resultsTitle: 'Resultados',
    totalExercises: 'Ejercicios completados',
    totalAnsweredQuestions: 'Preguntas respondidas',
    resultStats: 'Estadisticas',
    wordStats: 'Estadisticas de la palabra',
    phraseStats: 'Estadisticas de la frase',
    correctResult: 'Correcto!',
    correct: 'Correctas',
    incorrect: 'Incorrectas',
    targetAnswerLabel: 'Respuesta objetivo',
    targetLanguageAnswer: 'respuesta',
    fallbackTranslationShown: 'Traduccion alternativa mostrada',
    selectThemeToManage: 'Elige un tema para gestionar sus tarjetas.',
    importCardsBeforeTheme: 'Importa tarjetas antes de anadirlas a un tema.',
    allImportedCardsInTheme: 'Todas las tarjetas importadas estan en este tema.',
    importCardsToFillList: 'Importa tarjetas para llenar esta lista.',
    addImportedCardsToStartTheme: 'Anade tarjetas importadas para empezar este tema.',
    noTranslationAvailable: 'No hay traduccion disponible',
    fileImported: 'importado',
    couldNotReadFile: 'No se pudo leer este archivo.',
    importAdded: 'Anadidas',
    importSafeMerged: 'Unidas con seguridad',
    importPendingDuplicates: 'Duplicados pendientes',
    importInvalid: 'Invalidas',
    importSkipped: 'Omitidas',
    recordsCouldNotBeImported: 'Algunos registros no se pudieron importar.',
    row: 'Fila',
    selectedAssistant: 'Personaje seleccionado',
    coachThought: 'Pensamiento del personaje',
    noAttempts: 'Todavia no hay intentos para este idioma objetivo.',
  },
};

const languageNames: Record<
  SupportedLanguage,
  Record<SupportedLanguage, string>
> = {
  en: {
    ru: 'Russian',
    en: 'English',
    es: 'Spanish',
  },
  ru: {
    ru: 'Русский',
    en: 'Английский',
    es: 'Испанский',
  },
  es: {
    ru: 'ruso',
    en: 'ingles',
    es: 'espanol',
  },
};

export function t(language: SupportedLanguage, key: I18nKey): string {
  return messages[language][key];
}

export function getLanguageDisplayName(
  interfaceLanguage: SupportedLanguage,
  language: SupportedLanguage,
): string {
  return languageNames[interfaceLanguage][language];
}

export function formatTopicCount(
  language: SupportedLanguage,
  value: number,
): string {
  if (language === 'ru') {
    return formatRussianCount(value, ['тема', 'темы', 'тем']);
  }

  if (language === 'es') {
    return `${value} ${value === 1 ? 'tema' : 'temas'}`;
  }

  return `${value} ${value === 1 ? 'topic' : 'topics'}`;
}

export function formatCardCount(
  language: SupportedLanguage,
  value: number,
): string {
  if (language === 'ru') {
    return formatRussianCount(value, ['карточка', 'карточки', 'карточек']);
  }

  if (language === 'es') {
    return `${value} ${value === 1 ? 'tarjeta' : 'tarjetas'}`;
  }

  return `${value} ${value === 1 ? 'card' : 'cards'}`;
}

export function formatStoredCardCount(
  language: SupportedLanguage,
  value: number,
): string {
  if (language === 'ru') {
    return `Сейчас сохранено: ${formatCardCount(language, value)}`;
  }

  if (language === 'es') {
    return `${formatCardCount(language, value)} guardadas`;
  }

  return `${formatCardCount(language, value)} currently stored`;
}

export function formatImportedFile(
  language: SupportedLanguage,
  fileName: string,
): string {
  return `${fileName} ${t(language, 'fileImported')}`;
}

function formatRussianCount(
  value: number,
  [one, few, many]: [string, string, string],
): string {
  const absoluteValue = Math.abs(value);
  const mod10 = absoluteValue % 10;
  const mod100 = absoluteValue % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? one
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? few
        : many;

  return `${value} ${word}`;
}
