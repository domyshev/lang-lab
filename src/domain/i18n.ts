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
  | 'practiceSettings'
  | 'correctStreakCooldownFivePlus'
  | 'correctStreakCooldownFour'
  | 'correctStreakCooldownThree'
  | 'cooldownMonths'
  | 'newCardMixFrequency'
  | 'recentMistakeRepeatFrequency'
  | 'frequencyPercent'
  | 'agentsSection'
  | 'agentsTitle'
  | 'agentsOpenRouterIntro'
  | 'agentsOpenRouterIntroSuffix'
  | 'agentsTrialKeyNotice'
  | 'agentsCapabilitiesTitle'
  | 'agentsAnalyzeStatsCapability'
  | 'agentsVocabularyCapability'
  | 'agentsRollbackNotice'
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
  | 'gameHelpTitle'
  | 'gameHelpLab'
  | 'gameHelpPlayer'
  | 'gameHelpVocabulary'
  | 'gameHelpTeacher'
  | 'gameHelpOwnTrainer'
  | 'gameHelpGotIt'
  | 'gameHelpCoachmarkTitle'
  | 'gameHelpCoachmarkReturnTitle'
  | 'gameHelpCoachmarkReturnBody'
  | 'gameHelpCoachmarkSmartTitle'
  | 'gameHelpCoachmarkSmartBody'
  | 'tutorialClose'
  | 'close'
  | 'cancel'
  | 'confirm'
  | 'correctAnswer'
  | 'correctAnswers'
  | 'question'
  | 'incorrectAnswer'
  | 'exerciseDetails'
  | 'userAnswer'
  | 'noAnswer'
  | 'resultsTitle'
  | 'totalExercises'
  | 'totalAnsweredQuestions'
  | 'resultStats'
  | 'wordStats'
  | 'phraseStats'
  | 'wordLabel'
  | 'phraseLabel'
  | 'noMoreCardsInExercise'
  | 'correctResult'
  | 'memorizeResult'
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
  | 'noAttempts'
  | 'totalAnsweredTooltip'
  | 'correctAnsweredTooltip'
  | 'incorrectAnsweredTooltip'
  | 'correctInputTooltip'
  | 'crosswordWordsDescription'
  | 'crosswordPhraseDescription'
  | 'crosswordThemeLabel'
  | 'submitCrossword';

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
    practiceSettings: 'Practice settings',
    correctStreakCooldownFivePlus: 'Last 5 or more answers correct',
    correctStreakCooldownFour: 'Last 4 answers correct',
    correctStreakCooldownThree: 'Last 3 answers correct',
    cooldownMonths: 'Months before showing again',
    recentMistakeRepeatFrequency: 'Mistake repeat frequency',
    newCardMixFrequency: 'New word mix-in',
    frequencyPercent: 'Frequency percent',
    agentsSection: 'Agents LLM',
    agentsTitle: 'Agents LLM',
    agentsOpenRouterIntro:
      'You can add your own',
    agentsOpenRouterIntroSuffix:
      ' key to run agent features through your own quota.',
    agentsTrialKeyNotice:
      'A default trial Open Router key is available with a limited quota. When the quota is reached, Agents features will be unavailable until you enter your own key.',
    agentsCapabilitiesTitle: 'What agents can help with',
    agentsAnalyzeStatsCapability: 'Analyze statistics and create new themes.',
    agentsVocabularyCapability: 'Create and add vocabulary.',
    agentsRollbackNotice:
      'Everything created by agents will be marked as agent-created, and the agent work history will keep a matching record so changes can be rolled back. No worries, the agent will not spoil your work :)',
    importCards: 'Manual card import',
    importDescription:
      'You can also prepare data for your learning lab with an external LLM agent and upload it here in our format. Just download the requirements and give them to your agent.',
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
    gameHelpTitle: 'Help',
    gameHelpLab: 'This is a language learning laboratory.',
    gameHelpPlayer:
      'Here you are not just a student: you are a player creating your own game and playing by your own rules!',
    gameHelpVocabulary: 'You create and modify your own vocabulary.',
    gameHelpTeacher:
      'You are your own teacher - do not give away that responsibility.',
    gameHelpOwnTrainer:
      'Unlike most apps, this is not a "dumb" trainer someone built for you. You create your own trainer and play by your own rules!',
    gameHelpGotIt: 'Got it!',
    gameHelpCoachmarkTitle: 'Help stays here',
    gameHelpCoachmarkReturnTitle: 'Always available',
    gameHelpCoachmarkReturnBody:
      'You can always return by opening the Help accordion.',
    gameHelpCoachmarkSmartTitle: 'Smart help',
    gameHelpCoachmarkSmartBody:
      'It will not repeat the same thing every time; it will change with your reading and learning progress.',
    tutorialClose: 'OK',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    correctAnswer: 'Correct answer',
    correctAnswers: 'Correct answers',
    question: 'Question',
    incorrectAnswer: 'Incorrect answer',
    exerciseDetails: 'Exercise details',
    userAnswer: 'Your answer',
    noAnswer: 'No answer',
    resultsTitle: 'Results',
    totalExercises: 'Exercises completed',
    totalAnsweredQuestions: 'Questions answered',
    resultStats: 'Statistics',
    wordStats: 'Word statistics',
    phraseStats: 'Phrase statistics',
    wordLabel: 'Word',
    phraseLabel: 'Phrase',
    noMoreCardsInExercise: 'No more cards in this exercise.',
    correctResult: 'Correct!',
    memorizeResult: 'Remember!',
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
    totalAnsweredTooltip: 'Total number of answered questions in this exercise.',
    correctAnsweredTooltip: 'Number of questions answered correctly.',
    incorrectAnsweredTooltip: 'Number of questions answered incorrectly.',
    correctInputTooltip: 'The input was completed correctly.',
    crosswordWordsDescription: 'Up to 6 words from the selected theme',
    crosswordPhraseDescription: 'Single phrase challenge',
    crosswordThemeLabel: 'Theme',
    submitCrossword: 'Submit crossword',
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
    practiceSettings: 'Настройки практики',
    correctStreakCooldownFivePlus: 'Последние 5 и более раз верно',
    correctStreakCooldownFour: 'Последние 4 раза верно',
    correctStreakCooldownThree: 'Последние 3 раза верно',
    cooldownMonths: 'Месяцев до повтора',
    recentMistakeRepeatFrequency: 'Частота повторов ошибок',
    newCardMixFrequency: 'Примешивание новых слов',
    frequencyPercent: 'Процент появления',
    agentsSection: 'Агенты LLM',
    agentsTitle: 'Агенты LLM',
    agentsOpenRouterIntro:
      'Пользователь может добавить свой ключ',
    agentsOpenRouterIntroSuffix:
      ', чтобы запускать агентские функции через свои лимиты.',
    agentsTrialKeyNotice:
      'По умолчанию доступен триальный ключ Open Router с ограниченным лимитом. Когда лимит будет достигнут, функции Агенты станут недоступны до ввода своего ключа.',
    agentsCapabilitiesTitle: 'Что позволяют агенты',
    agentsAnalyzeStatsCapability: 'Анализировать статистику и создавать новые темы.',
    agentsVocabularyCapability: 'Создавать и добавлять словарный запас.',
    agentsRollbackNotice:
      'Все, что создано агентами в приложении, будет помечено как созданное агентами, а в истории работы агента появится соответствующая запись. Это позволит откатить внесенные изменения. Не переживайте, агент не испортит ваши наработки :)',
    importCards: 'Ручной импорт карточек',
    importDescription:
      'Вы можете также подготовить данные для своей учебной лаборатории через внешнего LLM агента и загрузить их здесь в нашем формате. Просто скачайте требования и передайте их вашему агенту.',
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
    gameHelpTitle: 'Помощь',
    gameHelpLab: 'Это лаборатория изучения языков.',
    gameHelpPlayer:
      'Здесь вы не просто ученик: вы игрок, создающий свою игру и играющий по своим правилам!',
    gameHelpVocabulary:
      'Вы сами создаете и модифицируете свой словарный запас.',
    gameHelpTeacher:
      'Вы сами являетесь себе учителем - не снимайте с себя эту ответственность.',
    gameHelpOwnTrainer:
      'В отличие от большинства приложений это не "тупой" тренажер, который кто-то сделал за вас. Вы сами создаете свой тренажер и играете по своим правилам!',
    gameHelpGotIt: 'Понятно!',
    gameHelpCoachmarkTitle: 'Помощь остается здесь',
    gameHelpCoachmarkReturnTitle: 'Всегда под рукой',
    gameHelpCoachmarkReturnBody:
      'К этой помощи всегда можно вернуться: откройте аккордион «Помощь».',
    gameHelpCoachmarkSmartTitle: 'Помощь умная',
    gameHelpCoachmarkSmartBody:
      'Она не показывает одно и то же каждый раз, а меняет содержимое по мере просмотра и прогресса ученика.',
    tutorialClose: 'Хорошо',
    close: 'Закрыть',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    correctAnswer: 'Правильный ответ',
    correctAnswers: 'Правильные ответы',
    question: 'Вопрос',
    incorrectAnswer: 'Неверный ответ',
    exerciseDetails: 'Детали упражнения',
    userAnswer: 'Ваш ответ',
    noAnswer: 'Нет ответа',
    resultsTitle: 'Результаты',
    totalExercises: 'Всего пройдено упражнений',
    totalAnsweredQuestions: 'Всего отвечено вопросов',
    resultStats: 'Статистика',
    wordStats: 'Статистика по слову',
    phraseStats: 'Статистика по фразе',
    wordLabel: 'Слово',
    phraseLabel: 'Фраза',
    noMoreCardsInExercise: 'Карточки для этого упражнения закончились.',
    correctResult: 'Правильно!',
    memorizeResult: 'Запомнить!',
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
    totalAnsweredTooltip: 'Общее количество отвеченных вопросов в упражнении.',
    correctAnsweredTooltip: 'Количество вопросов, отвеченных верно.',
    incorrectAnsweredTooltip: 'Количество вопросов, отвеченных неверно.',
    correctInputTooltip: 'Ввод был выполнен верно.',
    crosswordWordsDescription: 'До 6 слов из выбранной темы',
    crosswordPhraseDescription: 'Задание с одной фразой',
    crosswordThemeLabel: 'Тема',
    submitCrossword: 'Отправить кроссворд',
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
    practiceSettings: 'Ajustes de practica',
    correctStreakCooldownFivePlus: 'Ultimas 5 o mas respuestas correctas',
    correctStreakCooldownFour: 'Ultimas 4 respuestas correctas',
    correctStreakCooldownThree: 'Ultimas 3 respuestas correctas',
    cooldownMonths: 'Meses antes de mostrar otra vez',
    recentMistakeRepeatFrequency: 'Frecuencia de repeticion de errores',
    newCardMixFrequency: 'Mezcla de palabras nuevas',
    frequencyPercent: 'Porcentaje de frecuencia',
    agentsSection: 'Agentes LLM',
    agentsTitle: 'Agentes LLM',
    agentsOpenRouterIntro:
      'Puedes anadir tu propia clave de',
    agentsOpenRouterIntroSuffix:
      ' para ejecutar las funciones de agentes con tu propio limite.',
    agentsTrialKeyNotice:
      'Hay una clave de prueba de Open Router por defecto con limite reducido. Cuando se alcance el limite, las funciones de Agentes no estaran disponibles hasta que introduzcas tu propia clave.',
    agentsCapabilitiesTitle: 'Que pueden hacer los agentes',
    agentsAnalyzeStatsCapability: 'Analizar estadisticas y crear temas nuevos.',
    agentsVocabularyCapability: 'Crear y anadir vocabulario.',
    agentsRollbackNotice:
      'Todo lo creado por agentes se marcara como creado por agentes, y el historial de trabajo guardara un registro correspondiente para poder deshacer los cambios. No te preocupes, el agente no estropeara tu trabajo :)',
    importCards: 'Importacion manual de tarjetas',
    importDescription:
      'Tambien puedes preparar datos para tu laboratorio con un agente LLM externo y subirlos aqui en nuestro formato. Descarga los requisitos y daselos a tu agente.',
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
    gameHelpTitle: 'Ayuda',
    gameHelpLab: 'Esto es un laboratorio de aprendizaje de idiomas.',
    gameHelpPlayer:
      'Aqui no eres solo estudiante: eres un jugador que crea su propio juego y juega con sus propias reglas!',
    gameHelpVocabulary: 'Tu creas y modificas tu propio vocabulario.',
    gameHelpTeacher:
      'Tu eres tu propio profesor - no abandones esa responsabilidad.',
    gameHelpOwnTrainer:
      'A diferencia de la mayoria de apps, esto no es un entrenador "tonto" hecho por otra persona. Tu creas tu propio entrenador y juegas con tus propias reglas!',
    gameHelpGotIt: 'Entendido!',
    gameHelpCoachmarkTitle: 'La ayuda queda aqui',
    gameHelpCoachmarkReturnTitle: 'Siempre disponible',
    gameHelpCoachmarkReturnBody:
      'Siempre puedes volver abriendo el acordeon Ayuda.',
    gameHelpCoachmarkSmartTitle: 'Ayuda inteligente',
    gameHelpCoachmarkSmartBody:
      'No repite siempre lo mismo; cambia segun lo que ves y tu progreso.',
    tutorialClose: 'Bien',
    close: 'Cerrar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    correctAnswer: 'Respuesta correcta',
    correctAnswers: 'Respuestas correctas',
    question: 'Pregunta',
    incorrectAnswer: 'Respuesta incorrecta',
    exerciseDetails: 'Detalles del ejercicio',
    userAnswer: 'Tu respuesta',
    noAnswer: 'Sin respuesta',
    resultsTitle: 'Resultados',
    totalExercises: 'Ejercicios completados',
    totalAnsweredQuestions: 'Preguntas respondidas',
    resultStats: 'Estadisticas',
    wordStats: 'Estadisticas de la palabra',
    phraseStats: 'Estadisticas de la frase',
    wordLabel: 'Palabra',
    phraseLabel: 'Frase',
    noMoreCardsInExercise: 'No quedan tarjetas en este ejercicio.',
    correctResult: 'Correcto!',
    memorizeResult: 'Memorizar!',
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
    totalAnsweredTooltip: 'Numero total de preguntas respondidas en este ejercicio.',
    correctAnsweredTooltip: 'Numero de preguntas respondidas correctamente.',
    incorrectAnsweredTooltip: 'Numero de preguntas respondidas incorrectamente.',
    correctInputTooltip: 'La entrada se completo correctamente.',
    crosswordWordsDescription: 'Hasta 6 palabras del tema elegido',
    crosswordPhraseDescription: 'Reto de una sola frase',
    crosswordThemeLabel: 'Tema',
    submitCrossword: 'Enviar crucigrama',
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
