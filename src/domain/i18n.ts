import { SupportedLanguage } from './languages';

type I18nKey =
  | 'appName'
  | 'game'
  | 'gamesTab'
  | 'cards'
  | 'statistics'
  | 'cardSets'
  | 'history'
  | 'interfaceLanguage'
  | 'targetLanguage'
  | 'assistant'
  | 'assistantProfileLink'
  | 'assistantSuperpowersTitle'
  | 'playerOnboardingTitle'
  | 'playerOnboardingBody'
  | 'playerNameLabel'
  | 'savePlayerName'
  | 'continueAnonymously'
  | 'playerGreetingPrefix'
  | 'playerAnonymousName'
  | 'practiceSettings'
  | 'complementaryLanguage'
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
  | 'agentsIntroCoachmarkTitle'
  | 'importCards'
  | 'importDescription'
  | 'downloadCardFormat'
  | 'startLearning'
  | 'start'
  | 'allCards'
  | 'cardSetLabel'
  | 'cardSetLibrary'
  | 'cardSetLibraryDialogTitle'
  | 'cardSetLibraryNoResults'
  | 'chooseCardSetPlaceholder'
  | 'gameLibrary'
  | 'openCardSetLibrary'
  | 'previousCardSets'
  | 'nextCardSets'
  | 'searchCardSetLibrary'
  | 'selectCardSetLibraryItem'
  | 'add'
  | 'addToCardSet'
  | 'addCards'
  | 'addCardsToSet'
  | 'saveCardsInSet'
  | 'searchCards'
  | 'archive'
  | 'newCardSet'
  | 'create'
  | 'chooseCardSet'
  | 'chooseExercise'
  | 'cannotStartGame'
  | 'createCardSetToAddCards'
  | 'createCardSetBeforeSelectingCards'
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
  | 'exit'
  | 'finish'
  | 'finishExercise'
  | 'forgetAndExit'
  | 'forgetExerciseTooltip'
  | 'finishExerciseAnytimeBenefit'
  | 'finishExerciseAnytimeTooltip'
  | 'finishExerciseHypersonicJumpTooltip'
  | 'finishExerciseNotice'
  | 'exerciseJumps'
  | 'exerciseJumpsTooltip'
  | 'exerciseJumpHotkeysTooltip'
  | 'crosswordFinishExerciseNotice'
  | 'crosswordFinishHasLetters'
  | 'crosswordFinishNoCompletedWords'
  | 'crosswordFinishCompletedWordsWillCount'
  | 'exerciseCompleted'
  | 'completedResult'
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
  | 'targetAnsweredCards'
  | 'resultStats'
  | 'wordStats'
  | 'phraseStats'
  | 'wordLabel'
  | 'phraseLabel'
  | 'noMoreCardsInExercise'
  | 'missingLettersNeedsWords'
  | 'missingWordNeedsPhrases'
  | 'correctResult'
  | 'memorizeResult'
  | 'correct'
  | 'incorrect'
  | 'metricAnsweredSuffix'
  | 'metricCompletedSuffix'
  | 'metricCorrectSuffix'
  | 'metricIncorrectSuffix'
  | 'metricTotalSuffix'
  | 'repeatPrompt'
  | 'totalExercisesTooltip'
  | 'targetAnswerLabel'
  | 'cardSetCardSelectionMode'
  | 'targetLanguageAnswer'
  | 'fallbackTranslationShown'
  | 'selectCardSetToManage'
  | 'importCardsBeforeCardSet'
  | 'allImportedCardsInCardSet'
  | 'importCardsToFillList'
  | 'addImportedCardsToStartCardSet'
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
  | 'targetAnsweredCardsTooltip'
  | 'targetCorrectCardsTooltip'
  | 'targetIncorrectCardsTooltip'
  | 'correctInputTooltip'
  | 'recentAnswersTitle'
  | 'recentAnswerStatsChip'
  | 'recent20AnswersTitle'
  | 'crosswordWordsDescription'
  | 'crosswordPhraseDescription'
  | 'crosswordCardSetLabel'
  | 'cardSetChipPrefix'
  | 'crosswordCardSetCardsTooltip'
  | 'crosswordSubmitNeedsCompletedWord'
  | 'submitCrossword';

const messages: Record<SupportedLanguage, Record<I18nKey, string>> = {
  en: {
    appName: 'Language Lab',
    game: 'Game',
    gamesTab: 'Games',
    cards: 'Cards',
    statistics: 'Statistics',
    cardSets: 'Card sets',
    history: 'History',
    interfaceLanguage: 'Interface',
    targetLanguage: 'Target',
    assistant: 'Character',
    assistantProfileLink: 'Meet them properly',
    assistantSuperpowersTitle: 'Superpowers',
    playerOnboardingTitle: 'What should we call you?',
    playerOnboardingBody:
      'A bright pixel avatar will travel with you through the learning lab.',
    playerNameLabel: 'Player name',
    savePlayerName: 'Save',
    continueAnonymously: 'Continue anonymously',
    playerGreetingPrefix: 'Hello',
    playerAnonymousName: 'wanderer',
    practiceSettings: 'Practice settings',
    complementaryLanguage: 'Complementary language',
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
    agentsAnalyzeStatsCapability: 'Analyze statistics and create new card sets.',
    agentsVocabularyCapability: 'Create and add vocabulary.',
    agentsRollbackNotice:
      'Everything created by agents will be marked as agent-created, and the agent work history will keep a matching record so changes can be rolled back. No worries, the agent will not spoil your work :)',
    agentsIntroCoachmarkTitle: 'Near plans',
    importCards: 'Manual card import',
    importDescription:
      'You can also prepare data for your learning lab with an external LLM agent and upload it here in our format. Just download the requirements and give them to your agent.',
    downloadCardFormat: 'Download agent JSON requirements',
    startLearning: 'Start learning',
    start: 'Play',
    allCards: 'All cards',
    cardSetLabel: 'Card set',
    cardSetLibrary: 'Card library',
    cardSetLibraryDialogTitle: 'Card set library',
    cardSetLibraryNoResults: 'No card sets found.',
    chooseCardSetPlaceholder: 'Choose card set',
    gameLibrary: 'Game library',
    openCardSetLibrary: 'Open card set library',
    previousCardSets: 'Previous card sets',
    nextCardSets: 'Next card sets',
    searchCardSetLibrary: 'Search by name or phrase',
    selectCardSetLibraryItem: 'Choose card set',
    add: 'Add',
    addToCardSet: 'Add to card set',
    addCards: 'Add cards',
    addCardsToSet: 'Edit cards',
    saveCardsInSet: 'Save cards',
    searchCards: 'Search cards',
    archive: 'Archive',
    newCardSet: 'New card set',
    create: 'Create',
    chooseCardSet: 'Choose card set',
    chooseExercise: 'Choose game',
    cannotStartGame:
      'Choose a card set',
    createCardSetToAddCards: 'create a card set so the cards can be added to it',
    createCardSetBeforeSelectingCards:
      'first give the card set a name and press "Create", then continue selecting cards',
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
    exit: 'Exit',
    finish: 'Finish',
    finishExercise: 'Finish exercise',
    forgetAndExit: 'Forget and exit',
    forgetExerciseTooltip:
      'This game will not be included in statistics if you press this button.',
    finishExerciseAnytimeBenefit:
      'You can make hypersonic jumps between cards.',
    finishExerciseAnytimeTooltip:
      'You can finish the exercise at any moment - completed answers will still count.',
    finishExerciseHypersonicJumpTooltip:
      'A hypersonic jump moves you through space and bends the flow of time: the next card will be the one immediately after the card you choose.',
    finishExerciseNotice:
      'Exercise results will be counted and the exercise will end.',
    exerciseJumps: 'Jumps',
    exerciseJumpsTooltip:
      'Do you like jumps through space? We have them too: jump to any card without losing your completed result.',
    exerciseJumpHotkeysTooltip:
      'Cmd on Mac or Ctrl on Windows/Linux plus left/right arrows jump to the previous or next card. From the first card, a left jump lands on the last.',
    crosswordFinishExerciseNotice:
      'Completed crossword words will be counted and the game will end.',
    crosswordFinishHasLetters: 'The crossword already has entered letters.',
    crosswordFinishNoCompletedWords:
      'There are no complete words yet, so there is nothing to add to statistics.',
    crosswordFinishCompletedWordsWillCount:
      'Completed words will be added to statistics.',
    exerciseCompleted: 'Game completed',
    completedResult: 'Completed!',
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
    totalExercises: 'Games completed',
    totalAnsweredQuestions: 'Questions answered',
    targetAnsweredCards: 'Cards answered',
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
    metricAnsweredSuffix: 'answered',
    metricCompletedSuffix: 'completed',
    metricCorrectSuffix: 'correct',
    metricIncorrectSuffix: 'incorrect',
    metricTotalSuffix: 'total',
    repeatPrompt: 'repeat',
    totalExercisesTooltip: 'Total number of completed games.',
    targetAnswerLabel: 'Target answer',
    cardSetCardSelectionMode: 'Select cards for the card set.',
    targetLanguageAnswer: 'answer',
    fallbackTranslationShown: 'Fallback translation shown',
    selectCardSetToManage: 'Select a card set to manage its cards.',
    importCardsBeforeCardSet: 'Import cards before adding them to a card set.',
    allImportedCardsInCardSet: 'All imported cards are in this card set.',
    importCardsToFillList: 'Import cards to fill this list.',
    addImportedCardsToStartCardSet: 'Add imported cards to start this card set.',
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
    noAttempts: 'You have not played yet, so statistics are empty.',
    missingLettersNeedsWords:
      'Missing letters needs single-word cards, but this set does not have any.',
    missingWordNeedsPhrases:
      'Missing word needs phrase cards, but this set does not have any.',
    totalAnsweredTooltip: 'Total number of answered questions in this exercise.',
    correctAnsweredTooltip: 'Number of questions answered correctly.',
    incorrectAnsweredTooltip: 'Number of questions answered incorrectly.',
    targetAnsweredCardsTooltip: 'Total cards answered across all games.',
    targetCorrectCardsTooltip: 'Number of cards answered correctly.',
    targetIncorrectCardsTooltip: 'Number of cards answered incorrectly.',
    correctInputTooltip: 'The input was completed correctly.',
    recentAnswersTitle: 'Last 10 answers',
    recentAnswerStatsChip: 'Recent answer statistics',
    recent20AnswersTitle: 'Last 20 answers',
    crosswordWordsDescription: 'Up to 6 words from the selected card set',
    crosswordPhraseDescription: 'Single phrase challenge',
    crosswordCardSetLabel: 'Card set',
    cardSetChipPrefix: 'Card set',
    crosswordCardSetCardsTooltip: 'Click to open the card set list.',
    crosswordSubmitNeedsCompletedWord:
      'Enter at least one complete word to check the results.',
    submitCrossword: 'Submit crossword',
  },
  ru: {
    appName: 'Language Lab',
    game: 'Игра',
    gamesTab: 'Игры',
    cards: 'Карточки',
    statistics: 'Статистика',
    cardSets: 'Наборы',
    history: 'История',
    interfaceLanguage: 'Интерфейс',
    targetLanguage: 'Цель',
    assistant: 'Персонаж',
    assistantProfileLink: 'Познакомиться поближе',
    assistantSuperpowersTitle: 'Супер-способности',
    playerOnboardingTitle: 'Как тебя зовут?',
    playerOnboardingBody:
      'Яркая пиксельная иконка будет путешествовать с тобой по учебной лаборатории.',
    playerNameLabel: 'Имя игрока',
    savePlayerName: 'Сохранить',
    continueAnonymously: 'Продолжить анонимно',
    playerGreetingPrefix: 'Привет',
    playerAnonymousName: 'странник',
    practiceSettings: 'Настройки практики',
    complementaryLanguage: 'Дополняющий язык',
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
    agentsAnalyzeStatsCapability: 'Анализировать статистику и создавать новые наборы карточек.',
    agentsVocabularyCapability: 'Создавать и добавлять словарный запас.',
    agentsRollbackNotice:
      'Все, что создано агентами в приложении, будет помечено как созданное агентами, а в истории работы агента появится соответствующая запись. Это позволит откатить внесенные изменения. Не переживайте, агент не испортит ваши наработки :)',
    agentsIntroCoachmarkTitle: 'Ближайшие планы',
    importCards: 'Ручной импорт карточек',
    importDescription:
      'Вы можете также подготовить данные для своей учебной лаборатории через внешнего LLM агента и загрузить их здесь в нашем формате. Просто скачайте требования и передайте их вашему агенту.',
    downloadCardFormat: 'Скачать требования к JSON для агентов',
    startLearning: 'Начать учиться',
    start: 'Играть',
    allCards: 'Все карточки',
    cardSetLabel: 'Набор карточек',
    cardSetLibrary: 'Библиотека карточек',
    cardSetLibraryDialogTitle: 'Библиотека наборов карточек',
    cardSetLibraryNoResults: 'Наборы не найдены.',
    chooseCardSetPlaceholder: 'Выберите набор карточек',
    gameLibrary: 'Библиотека игр',
    openCardSetLibrary: 'Открыть библиотеку наборов',
    previousCardSets: 'Предыдущие наборы карточек',
    nextCardSets: 'Следующие наборы карточек',
    searchCardSetLibrary: 'Искать по названию или фразе',
    selectCardSetLibraryItem: 'Выбрать набор карточек',
    add: 'Добавить',
    addToCardSet: 'Добавить в набор',
    addCards: 'Добавить карточки',
    addCardsToSet: 'Редактировать карточки',
    saveCardsInSet: 'Сохранить карточки',
    searchCards: 'Поиск карточек',
    archive: 'В архив',
    newCardSet: 'Новый набор карточек',
    create: 'Создать',
    chooseCardSet: 'Выберите набор карточек',
    chooseExercise: 'Выберите игру',
    cannotStartGame:
      'Выберите набор карточек',
    createCardSetToAddCards: 'создайте набор карточек чтобы карточки добавились в него',
    createCardSetBeforeSelectingCards:
      'нужно сначала придумать название набора карточек и нажать "Создать" а потом продолжить выбор карточек',
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
    exit: 'Выйти',
    finish: 'Закончить',
    finishExercise: 'Закончить упражнение',
    forgetAndExit: 'Забыть и выйти',
    forgetExerciseTooltip:
      'Эта игра не будет включена в статистику, если нажать эту кнопку.',
    finishExerciseAnytimeBenefit:
      'Можно делать гиперзвуковые прыжки между карточками.',
    finishExerciseAnytimeTooltip:
      'Можно закончить упражнение в любой момент - уже достигнутый результат будет зачтен.',
    finishExerciseHypersonicJumpTooltip:
      'Гиперзвуковой прыжок переносит тебя в пространстве и меняет ход времени: следующей карточкой станет та, которая идет сразу после выбранной.',
    finishExerciseNotice:
      'Результаты упражнения будут зачтены, а упражнение закончено.',
    exerciseJumps: 'Прыжки',
    exerciseJumpsTooltip:
      'Любишь прыжки в пространстве? Вот и у нас есть: прыгай к любой карточке, а уже выполненный результат не потеряется.',
    exerciseJumpHotkeysTooltip:
      'Cmd на Mac или Ctrl на Windows/Linux плюс стрелки влево/вправо делают прыжок к предыдущей или следующей карточке. С первой карточки прыжок влево переносит к последней.',
    crosswordFinishExerciseNotice:
      'Отвеченные слова попадут в статистику, а кроссворд будет закончен.',
    crosswordFinishHasLetters: 'В кроссворде уже введены буквы.',
    crosswordFinishNoCompletedWords:
      'Пока нет целых слов, поэтому в статистику нечего добавить.',
    crosswordFinishCompletedWordsWillCount:
      'Заполненные целиком слова попадут в статистику.',
    exerciseCompleted: 'Игра пройдена',
    completedResult: 'Пройдено!',
    answeredWords: 'Отвечено слов',
    fillAllGapsWarning: 'Заполните все пропуски',
    gameHelpTitle: 'Помощь',
    gameHelpLab: 'Это лаборатория изучения языков.',
    gameHelpPlayer:
      'Здесь Вы не просто ученик: Вы игрок, создающий свою игру и играющий по своим правилам!',
    gameHelpVocabulary:
      'Вы сами создаете и модифицируете свой словарный запас.',
    gameHelpTeacher:
      'Вы сами являетесь себе учителем - не снимайте с себя эту ответственность.',
    gameHelpOwnTrainer:
      'В отличие от большинства приложений это не "мертвый" тренажер, который кто-то сделал за вас. Вы сами создаете свой тренажер и играете по своим правилам!',
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
    totalExercises: 'Всего пройдено игр',
    totalAnsweredQuestions: 'Всего отвечено вопросов',
    targetAnsweredCards: 'Всего отвечено карточек',
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
    metricAnsweredSuffix: 'отвечено',
    metricCompletedSuffix: 'пройдено',
    metricCorrectSuffix: 'правильно',
    metricIncorrectSuffix: 'неверно',
    metricTotalSuffix: 'всего',
    repeatPrompt: 'повтор',
    totalExercisesTooltip: 'Общее количество пройденных игр.',
    targetAnswerLabel: 'Целевой ответ',
    cardSetCardSelectionMode: 'Выберите карточки для набора.',
    targetLanguageAnswer: 'ответ',
    fallbackTranslationShown: 'Показан запасной перевод',
    selectCardSetToManage: 'Выберите набор карточек, чтобы управлять карточками.',
    importCardsBeforeCardSet: 'Импортируйте карточки, прежде чем добавлять их в набор.',
    allImportedCardsInCardSet: 'Все импортированные карточки уже в этом наборе.',
    importCardsToFillList: 'Импортируйте карточки, чтобы заполнить список.',
    addImportedCardsToStartCardSet: 'Добавьте импортированные карточки, чтобы начать набор.',
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
    noAttempts: 'вы еще не играли, поэтому статистика пустая',
    missingLettersNeedsWords:
      'Для игры с пропущенными буквами в наборе должны быть карточки со словами',
    missingWordNeedsPhrases:
      'Для игры с пропущенным словом в наборе должны быть карточки с фразами',
    totalAnsweredTooltip: 'Общее количество отвеченных вопросов в упражнении.',
    correctAnsweredTooltip: 'Количество вопросов, отвеченных верно.',
    incorrectAnsweredTooltip: 'Количество вопросов, отвеченных неверно.',
    targetAnsweredCardsTooltip: 'всего отвечено карточек во всех упражнениях',
    targetCorrectCardsTooltip: 'количество карточек отвеченных верно',
    targetIncorrectCardsTooltip: 'количество карточек отвеченных неверно',
    correctInputTooltip: 'Ввод был выполнен верно.',
    recentAnswersTitle: '10 последних ответов',
    recentAnswerStatsChip: 'Статистика последних ответов',
    recent20AnswersTitle: '20 последних ответов',
    crosswordWordsDescription: 'До 6 слов из выбранного набора карточек',
    crosswordPhraseDescription: 'Задание с одной фразой',
    crosswordCardSetLabel: 'Набор карточек',
    cardSetChipPrefix: 'Набор карточек',
    crosswordCardSetCardsTooltip: 'Кликните чтобы перейти к списку карточек набора.',
    crosswordSubmitNeedsCompletedWord:
      'Введите хотя бы одно слово, чтобы проверить результаты.',
    submitCrossword: 'Отправить кроссворд',
  },
  es: {
    appName: 'Language Lab',
    game: 'Juego',
    gamesTab: 'Juegos',
    cards: 'Tarjetas',
    statistics: 'Estadisticas',
    cardSets: 'Conjuntos',
    history: 'Historial',
    interfaceLanguage: 'Interfaz',
    targetLanguage: 'Objetivo',
    assistant: 'Personaje',
    assistantProfileLink: 'Conocerlo mejor',
    assistantSuperpowersTitle: 'Superpoderes',
    playerOnboardingTitle: 'Como te llamamos?',
    playerOnboardingBody:
      'Un avatar pixelado y brillante viajara contigo por el laboratorio.',
    playerNameLabel: 'Nombre de jugador',
    savePlayerName: 'Guardar',
    continueAnonymously: 'Continuar anonimo',
    playerGreetingPrefix: 'Hola',
    playerAnonymousName: 'viajero',
    practiceSettings: 'Ajustes de practica',
    complementaryLanguage: 'Idioma complementario',
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
    agentsAnalyzeStatsCapability: 'Analizar estadisticas y crear conjuntos de tarjetas nuevos.',
    agentsVocabularyCapability: 'Crear y anadir vocabulario.',
    agentsRollbackNotice:
      'Todo lo creado por agentes se marcara como creado por agentes, y el historial de trabajo guardara un registro correspondiente para poder deshacer los cambios. No te preocupes, el agente no estropeara tu trabajo :)',
    agentsIntroCoachmarkTitle: 'Planes cercanos',
    importCards: 'Importacion manual de tarjetas',
    importDescription:
      'Tambien puedes preparar datos para tu laboratorio con un agente LLM externo y subirlos aqui en nuestro formato. Descarga los requisitos y daselos a tu agente.',
    downloadCardFormat: 'Descargar requisitos JSON para agentes',
    startLearning: 'Empezar',
    start: 'Jugar',
    allCards: 'Todas las tarjetas',
    cardSetLabel: 'Conjunto de tarjetas',
    cardSetLibrary: 'Biblioteca de tarjetas',
    cardSetLibraryDialogTitle: 'Biblioteca de conjuntos de tarjetas',
    cardSetLibraryNoResults: 'No se encontraron conjuntos.',
    chooseCardSetPlaceholder: 'Elige conjunto de tarjetas',
    gameLibrary: 'Biblioteca de juegos',
    openCardSetLibrary: 'Abrir biblioteca de conjuntos',
    previousCardSets: 'Conjuntos anteriores',
    nextCardSets: 'Conjuntos siguientes',
    searchCardSetLibrary: 'Buscar por nombre o frase',
    selectCardSetLibraryItem: 'Elegir conjunto de tarjetas',
    add: 'Anadir',
    addToCardSet: 'Anadir al conjunto',
    addCards: 'Anadir tarjetas',
    addCardsToSet: 'Editar tarjetas',
    saveCardsInSet: 'Guardar tarjetas',
    searchCards: 'Buscar tarjetas',
    archive: 'Archivar',
    newCardSet: 'Nuevo conjunto de tarjetas',
    create: 'Crear',
    chooseCardSet: 'Elegir conjunto de tarjetas',
    chooseExercise: 'Elegir juego',
    cannotStartGame:
      'Elige un conjunto de tarjetas',
    createCardSetToAddCards: 'crea un conjunto de tarjetas para poder anadirlas',
    createCardSetBeforeSelectingCards:
      'primero pon nombre al conjunto y pulsa "Crear"; despues sigue seleccionando tarjetas',
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
    exit: 'Salir',
    finish: 'Terminar',
    finishExercise: 'Terminar ejercicio',
    forgetAndExit: 'Olvidar y salir',
    forgetExerciseTooltip:
      'Este juego no se incluira en las estadisticas si pulsas este boton.',
    finishExerciseAnytimeBenefit:
      'Puedes hacer saltos hipersonicos entre tarjetas.',
    finishExerciseAnytimeTooltip:
      'Puedes terminar el ejercicio en cualquier momento: las respuestas completadas contaran.',
    finishExerciseHypersonicJumpTooltip:
      'Un salto hipersonico te mueve por el espacio y cambia el curso del tiempo: la siguiente tarjeta sera la que va justo despues de la elegida.',
    finishExerciseNotice:
      'Los resultados del ejercicio se guardaran y el ejercicio terminara.',
    exerciseJumps: 'Saltos',
    exerciseJumpsTooltip:
      'Te gustan los saltos por el espacio? Aqui tambien hay: salta a cualquier tarjeta sin perder lo ya completado.',
    exerciseJumpHotkeysTooltip:
      'Cmd en Mac o Ctrl en Windows/Linux con flechas izquierda/derecha salta a la tarjeta anterior o siguiente. Desde la primera, el salto a la izquierda vuelve a la ultima.',
    crosswordFinishExerciseNotice:
      'Las palabras completas del crucigrama se guardaran y el juego terminara.',
    crosswordFinishHasLetters: 'El crucigrama ya tiene letras escritas.',
    crosswordFinishNoCompletedWords:
      'Todavia no hay palabras completas, asi que no hay nada para estadisticas.',
    crosswordFinishCompletedWordsWillCount:
      'Las palabras completas se anadiran a las estadisticas.',
    exerciseCompleted: 'Juego completado',
    completedResult: 'Completado!',
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
    totalExercises: 'Juegos completados',
    totalAnsweredQuestions: 'Preguntas respondidas',
    targetAnsweredCards: 'Tarjetas respondidas',
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
    metricAnsweredSuffix: 'respondidas',
    metricCompletedSuffix: 'completados',
    metricCorrectSuffix: 'correctas',
    metricIncorrectSuffix: 'incorrectas',
    metricTotalSuffix: 'total',
    repeatPrompt: 'repeticion',
    totalExercisesTooltip: 'Numero total de juegos completados.',
    targetAnswerLabel: 'Respuesta objetivo',
    cardSetCardSelectionMode: 'Selecciona tarjetas para el conjunto.',
    targetLanguageAnswer: 'respuesta',
    fallbackTranslationShown: 'Traduccion alternativa mostrada',
    selectCardSetToManage: 'Elige un conjunto para gestionar sus tarjetas.',
    importCardsBeforeCardSet: 'Importa tarjetas antes de anadirlas a un conjunto.',
    allImportedCardsInCardSet: 'Todas las tarjetas importadas estan en este conjunto.',
    importCardsToFillList: 'Importa tarjetas para llenar esta lista.',
    addImportedCardsToStartCardSet: 'Anade tarjetas importadas para empezar este conjunto.',
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
    noAttempts: 'Todavia no has jugado, asi que las estadisticas estan vacias.',
    missingLettersNeedsWords:
      'Letras que faltan necesita tarjetas de una sola palabra, pero este conjunto no tiene ninguna.',
    missingWordNeedsPhrases:
      'Palabra que falta necesita tarjetas con frases, pero este conjunto no tiene ninguna.',
    totalAnsweredTooltip: 'Numero total de preguntas respondidas en este ejercicio.',
    correctAnsweredTooltip: 'Numero de preguntas respondidas correctamente.',
    incorrectAnsweredTooltip: 'Numero de preguntas respondidas incorrectamente.',
    targetAnsweredCardsTooltip: 'Total de tarjetas respondidas en todos los juegos.',
    targetCorrectCardsTooltip: 'Numero de tarjetas respondidas correctamente.',
    targetIncorrectCardsTooltip: 'Numero de tarjetas respondidas incorrectamente.',
    correctInputTooltip: 'La entrada se completo correctamente.',
    recentAnswersTitle: '10 ultimas respuestas',
    recentAnswerStatsChip: 'Estadísticas de respuestas recientes',
    recent20AnswersTitle: '20 ultimas respuestas',
    crosswordWordsDescription: 'Hasta 6 palabras del conjunto elegido',
    crosswordPhraseDescription: 'Reto de una sola frase',
    crosswordCardSetLabel: 'Conjunto de tarjetas',
    cardSetChipPrefix: 'Conjunto',
    crosswordCardSetCardsTooltip: 'Haz clic para abrir la lista de tarjetas del conjunto.',
    crosswordSubmitNeedsCompletedWord:
      'Introduce al menos una palabra completa para comprobar resultados.',
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

export function formatCardSetCount(
  language: SupportedLanguage,
  value: number,
): string {
  if (language === 'ru') {
    return formatRussianCount(value, ['набор', 'набора', 'наборов']);
  }

  if (language === 'es') {
    return `${value} ${value === 1 ? 'conjunto' : 'conjuntos'}`;
  }

  return `${value} ${value === 1 ? 'card set' : 'card sets'}`;
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
