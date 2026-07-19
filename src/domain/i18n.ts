import { SupportedLanguage } from './languages';

type MessageLanguage = Exclude<SupportedLanguage, 'uk'>;

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
  | 'targetLearningLanguage'
  | 'targetLearningLanguages'
  | 'world'
  | 'appWorld'
  | 'footballWorld'
  | 'forestWorld'
  | 'footballWorldChoice'
  | 'forestWorldChoice'
  | 'assistant'
  | 'assistantProfileLink'
  | 'assistantSuperpowersTitle'
  | 'playerOnboardingTitle'
  | 'playerOnboardingBody'
  | 'playerNameLabel'
  | 'savePlayerName'
  | 'editPlayerName'
  | 'savePlayerNameChange'
  | 'continueAnonymously'
  | 'playerGreetingPrefix'
  | 'playerAnonymousName'
  | 'practiceSettings'
  | 'repeatManagementTitle'
  | 'complementaryLanguage'
  | 'moveCompanionLanguageUp'
  | 'moveCompanionLanguageDown'
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
  | 'agentsCapabilitiesTitle'
  | 'agentsAnalyzeStatsCapability'
  | 'agentsVocabularyCapability'
  | 'agentsRollbackNotice'
  | 'agentsIntroCoachmarkTitle'
  | 'aiAssistantTitle'
  | 'aiConnectionTitle'
  | 'aiConnectionSettings'
  | 'aiApiKeyLabel'
  | 'aiModelLabel'
  | 'aiShowKey'
  | 'aiHideKey'
  | 'aiSaveKey'
  | 'aiDeleteKey'
  | 'aiLocalKeyWarning'
  | 'aiChatTitle'
  | 'aiComposerLabel'
  | 'aiSendMessage'
  | 'aiThinking'
  | 'aiCancelRequest'
  | 'aiRetry'
  | 'aiClearChat'
  | 'aiCollapseChat'
  | 'aiClearChatDialogTitle'
  | 'aiClearChatDialogBody'
  | 'aiEraseChat'
  | 'aiSuggestionCreateSet'
  | 'aiSuggestionFindWeakCards'
  | 'aiSuggestionAddVocabulary'
  | 'aiMissingKey'
  | 'aiRequestFailed'
  | 'aiErrorInvalidKey'
  | 'aiErrorCredits'
  | 'aiErrorRateLimit'
  | 'aiErrorProvider'
  | 'aiErrorNetwork'
  | 'aiErrorSchema'
  | 'aiErrorTool'
  | 'aiErrorLoop'
  | 'aiApplyChanges'
  | 'aiChangesAppliedMessage'
  | 'aiCancelPreview'
  | 'aiOperationBlocked'
  | 'aiCardSetNameInputLabel'
  | 'aiBlockedPreviewTitle'
  | 'aiBlockedPreviewSummary'
  | 'aiBlockedPreviewWarnings'
  | 'aiCreatedCards'
  | 'aiUpdatedCards'
  | 'aiPendingDuplicates'
  | 'aiCreatedCardSets'
  | 'aiArchivedCardSets'
  | 'aiRenamedCardSets'
  | 'aiMembershipAdditions'
  | 'aiMembershipRemovals'
  | 'aiHistoryTitle'
  | 'aiHistoryEmpty'
  | 'aiRollback'
  | 'aiApplied'
  | 'aiReverted'
  | 'aiChanges'
  | 'aiOperationHistoryError'
  | 'aiRollbackConflictTitle'
  | 'aiRollbackConflictBody'
  | 'aiRollbackConflictLaterOperation'
  | 'importCards'
  | 'importDescription'
  | 'downloadCardFormat'
  | 'importErrorInvalidJson'
  | 'importErrorRootArray'
  | 'importErrorRecordObject'
  | 'importErrorTranslations'
  | 'importErrorUnknown'
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
  | 'openAiAssistant'
  | 'previousCardSets'
  | 'nextCardSets'
  | 'searchCardSetLibrary'
  | 'selectCardSetLibraryItem'
  | 'add'
  | 'addToCardSet'
  | 'addCards'
  | 'addCardsToSet'
  | 'saveCardsInSet'
  | 'save'
  | 'cancelCardSetEdit'
  | 'cancelCardSetEditTitle'
  | 'cancelCardSetEditBody'
  | 'searchCards'
  | 'searchCardSets'
  | 'clearCardSearch'
  | 'clearCardSetSearch'
  | 'showArchivedCardSets'
  | 'createActiveCopy'
  | 'archived'
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
  | 'finishExerciseJumpBenefitFootball'
  | 'finishExerciseJumpBenefitForest'
  | 'finishExerciseAnytimeTooltip'
  | 'finishExerciseHypersonicJumpTooltip'
  | 'finishExerciseJumpTooltipFootball'
  | 'finishExerciseJumpTooltipForest'
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
  | 'gameHelpIntroTitle'
  | 'gameHelpLab'
  | 'gameHelpPlayer'
  | 'gameHelpVocabulary'
  | 'gameHelpTeacher'
  | 'gameHelpOwnTrainer'
  | 'gameHelpGotIt'
  | 'gameHelpNext'
  | 'gameHelpBack'
  | 'gameHelpPage'
  | 'gameHelpAiChatTitle'
  | 'gameHelpAiChatCards'
  | 'gameHelpAiChatGames'
  | 'gameHelpAiChatStats'
  | 'gameHelpAiChatControl'
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
  | 'cardTypePrefix'
  | 'wordLabel'
  | 'phraseLabel'
  | 'noMoreCardsInExercise'
  | 'crosswordNeedsIntersections'
  | 'missingLettersNeedsWords'
  | 'missingWordNeedsPhrases'
  | 'correctResult'
  | 'memorizeResult'
  | 'markCardKnown'
  | 'markCardKnownTooltipTitle'
  | 'markCardKnownTooltip'
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
  | 'noCardStatsYet'
  | 'recentAnswerStatsChip'
  | 'recent20AnswersTitle'
  | 'crosswordWordsDescription'
  | 'crosswordPhraseDescription'
  | 'crosswordCardSetLabel'
  | 'cardSetChipPrefix'
  | 'crosswordCardSetCardsTooltip'
  | 'crosswordSubmitNeedsCompletedWord'
  | 'submitCrossword'
  | 'disableAdditionalHints';

const messages: Record<MessageLanguage, Record<I18nKey, string>> = {
  en: {
    appName: 'Language Lab',
    game: 'Game',
    gamesTab: 'Play',
    cards: 'Cards',
    statistics: 'Statistics',
    cardSets: 'Card sets',
    history: 'History',
    interfaceLanguage: 'Interface language',
    targetLanguage: 'Target',
    targetLearningLanguage: 'Target learning language',
    targetLearningLanguages: 'Target learning languages',
    world: 'World',
    appWorld: 'Game world',
    footballWorld: 'Football',
    forestWorld: 'Forest Elves',
    assistant: 'Character',
    assistantProfileLink: 'Meet them properly',
    assistantSuperpowersTitle: 'Superpowers',
    playerOnboardingTitle: 'Game world setup',
    playerOnboardingBody:
      'Your Spain supporter flag will travel with you through the football language lab.',
    footballWorldChoice: 'Football',
    forestWorldChoice: 'Forest Elves',
    playerNameLabel: 'Player name',
    savePlayerName: 'Configure',
    editPlayerName: 'Edit name',
    savePlayerNameChange: 'Save name',
    continueAnonymously: 'I forgot who I am',
    playerGreetingPrefix: 'Hello',
    playerAnonymousName: 'wanderer',
    practiceSettings: 'Game settings',
    repeatManagementTitle: 'Repeat management',
    complementaryLanguage: 'Hint languages',
    moveCompanionLanguageUp: 'Move up',
    moveCompanionLanguageDown: 'Move down',
    correctStreakCooldownFivePlus: 'Last 5 or more answers correct',
    correctStreakCooldownFour: 'Last 4 answers correct',
    correctStreakCooldownThree: 'Last 3 answers correct',
    cooldownMonths: 'Months before showing again',
    recentMistakeRepeatFrequency: 'Mistake repeat frequency',
    newCardMixFrequency: 'New word mix-in',
    frequencyPercent: 'Frequency percent',
    agentsSection: 'AI Assistant',
    agentsTitle: 'AI Assistant',
    agentsOpenRouterIntro:
      'You can add your own',
    agentsOpenRouterIntroSuffix:
      ' key to run agent features through your own quota.',
    agentsCapabilitiesTitle: 'What agents can help with',
    agentsAnalyzeStatsCapability: 'Analyze statistics and create new card sets.',
    agentsVocabularyCapability: 'Create and add vocabulary.',
    agentsRollbackNotice:
      'Everything created by agents will be marked as agent-created, and the agent work history will keep a matching record so changes can be rolled back. No worries, the agent will not spoil your work :)',
    agentsIntroCoachmarkTitle: 'Near plans',
    aiAssistantTitle: 'AI Assistant',
    aiConnectionTitle: 'Connection',
    aiConnectionSettings: 'Connection settings',
    aiApiKeyLabel: 'OpenRouter API key',
    aiModelLabel: 'OpenRouter model',
    aiShowKey: 'Show API key',
    aiHideKey: 'Hide API key',
    aiSaveKey: 'Save key',
    aiDeleteKey: 'Delete key',
    aiLocalKeyWarning:
      'Your key is stored locally and unencrypted in this browser. Use a restricted key and do not share this browser profile.',
    aiChatTitle: 'Chat',
    aiComposerLabel: 'Message the AI assistant',
    aiSendMessage: 'Send message',
    aiThinking: 'Thinking...',
    aiCancelRequest: 'Cancel request',
    aiRetry: 'Retry',
    aiClearChat: 'Clear chat',
    aiCollapseChat: 'Collapse chat',
    aiClearChatDialogTitle: 'Erase chat?',
    aiClearChatDialogBody:
      'This will erase the visible chat messages. Operation history will stay available.',
    aiEraseChat: 'Erase',
    aiSuggestionCreateSet: 'Create a travel card set',
    aiSuggestionFindWeakCards: 'Find my weakest cards',
    aiSuggestionAddVocabulary: 'Add vocabulary to my library',
    aiMissingKey: 'Add and save an OpenRouter API key before sending a message.',
    aiRequestFailed: 'The request could not be completed. Please try again.',
    aiErrorInvalidKey:
      'OpenRouter rejected this API key. Check whether it is valid and active.',
    aiErrorCredits: 'This OpenRouter account does not have enough credits.',
    aiErrorRateLimit:
      'OpenRouter is receiving too many requests. Wait a moment and try again.',
    aiErrorProvider:
      'The AI provider could not complete the request. Try again later.',
    aiErrorNetwork:
      'OpenRouter could not be reached. Check your connection and try again.',
    aiErrorSchema:
      'The AI response had an unexpected format and was not applied.',
    aiErrorTool:
      'The AI assistant could not complete its tool request. Nothing was applied.',
    aiErrorLoop:
      'The AI assistant stopped after too many tool steps. Nothing was applied.',
    aiApplyChanges: 'Apply changes',
    aiChangesAppliedMessage: 'Changes have been recorded.',
    aiCancelPreview: 'Cancel preview',
    aiOperationBlocked: 'The operation cannot be applied because the library changed.',
    aiCardSetNameInputLabel: 'Card set name',
    aiBlockedPreviewTitle: 'Review required',
    aiBlockedPreviewSummary:
      'This proposal cannot be applied until its validation warnings are resolved.',
    aiBlockedPreviewWarnings: 'Validation warnings',
    aiCreatedCards: 'Cards created',
    aiUpdatedCards: 'Cards updated',
    aiPendingDuplicates: 'Pending duplicates',
    aiCreatedCardSets: 'Sets created',
    aiArchivedCardSets: 'Archived card sets',
    aiRenamedCardSets: 'Sets renamed',
    aiMembershipAdditions: 'Membership additions',
    aiMembershipRemovals: 'Membership removals',
    aiHistoryTitle: 'Operation history',
    aiHistoryEmpty: 'No AI operations yet.',
    aiRollback: 'Roll back changes',
    aiApplied: 'Applied',
    aiReverted: 'Reverted',
    aiChanges: 'changes',
    aiOperationHistoryError:
      'The operation could not be completed. No library changes were applied.',
    aiRollbackConflictTitle: 'Changes cannot be rolled back',
    aiRollbackConflictBody:
      'The library changed after this operation was applied. Review the affected cards or sets before trying again.',
    aiRollbackConflictLaterOperation: 'Later operation:',
    importCards: 'Manual card import',
    importDescription:
      'You can also prepare data for your learning lab with an external LLM agent and upload it here in our format. Just download the requirements and give them to your agent.',
    downloadCardFormat: 'Download agent JSON requirements',
    importErrorInvalidJson:
      'The selected file does not contain valid JSON.',
    importErrorRootArray:
      'The top-level JSON value must be an array of cards.',
    importErrorRecordObject: 'Each card entry must be an object.',
    importErrorTranslations:
      'Each card needs translations in at least two supported languages.',
    importErrorUnknown: 'This card record could not be imported.',
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
    openAiAssistant: 'Open AI Assistant',
    previousCardSets: 'Previous card sets',
    nextCardSets: 'Next card sets',
    searchCardSetLibrary: 'Search by name or phrase',
    selectCardSetLibraryItem: 'Choose card set',
    add: 'Add',
    addToCardSet: 'Add to card set',
    addCards: 'Add cards',
    addCardsToSet: 'Edit set',
    saveCardsInSet: 'Save set',
    save: 'Save',
    cancelCardSetEdit: 'Cancel',
    cancelCardSetEditTitle: 'Cancel set editing?',
    cancelCardSetEditBody: 'Selected set changes will not be saved.',
    searchCards: 'Search cards',
    searchCardSets: 'Search card sets',
    clearCardSearch: 'Clear card search',
    clearCardSetSearch: 'Clear card set search',
    showArchivedCardSets: 'Archived',
    createActiveCopy: 'Create active copy',
    archived: 'Archived',
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
    finishExercise: 'Finish game',
    forgetAndExit: 'Forget and exit',
    forgetExerciseTooltip:
      'This game will not be included in statistics if you press this button.',
    finishExerciseAnytimeBenefit:
      'You can make hypersonic jumps between cards.',
    finishExerciseJumpBenefitFootball:
      'You can play quick passes between cards.',
    finishExerciseJumpBenefitForest:
      'You can follow elven trails between cards.',
    finishExerciseAnytimeTooltip:
      'You can finish the game at any moment - completed answers will still count.',
    finishExerciseHypersonicJumpTooltip:
      'A hypersonic jump moves you through space and bends the flow of time: the next card will be the one immediately after the card you choose.',
    finishExerciseJumpTooltipFootball:
      'A quick pass sends play to the chosen card: after it, the next card in the lineup gets the ball.',
    finishExerciseJumpTooltipForest:
      'An elven trail slips through the forest path: after the chosen card, the next card on the trail appears.',
    finishExerciseNotice:
      'Game results will be counted and the game will end.',
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
    gameHelpIntroTitle: 'About the game',
    gameHelpLab: 'This is a language learning laboratory.',
    gameHelpPlayer:
      'Here you are not just a student: you are a player creating your own game and playing by your own rules!',
    gameHelpVocabulary: 'You create and modify your own vocabulary.',
    gameHelpTeacher:
      'You are your own teacher - do not give away that responsibility.',
    gameHelpOwnTrainer:
      'Unlike most apps, this is not a "dumb" trainer someone built for you. You create your own trainer and play by your own rules!',
    gameHelpGotIt: 'Got it!',
    gameHelpNext: 'Next',
    gameHelpBack: 'Back',
    gameHelpPage: 'Page',
    gameHelpAiChatTitle: 'AI helper chat inside the games',
    gameHelpAiChatCards:
      'The chat can create card sets from the words and phrases you bring into the lab.',
    gameHelpAiChatGames:
      'It helps choose games for the current set: crossword, missing letters, phrases, or a quick three-option check.',
    gameHelpAiChatStats:
      'It reads game results and points out which cards deserve the next repetition.',
    gameHelpAiChatControl:
      'Before changing the library, the AI shows an operation for approval, so you stay in control.',
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
    exerciseDetails: 'Game details',
    userAnswer: 'Your answer',
    noAnswer: 'No answer',
    resultsTitle: 'Results',
    totalExercises: 'Games completed',
    totalAnsweredQuestions: 'Questions answered',
    targetAnsweredCards: 'Cards answered',
    resultStats: 'Statistics',
    wordStats: 'Word statistics',
    phraseStats: 'Phrase statistics',
    cardTypePrefix: 'Type',
    wordLabel: 'Word',
    phraseLabel: 'Phrase',
    noMoreCardsInExercise: 'No more cards in this game.',
    correctResult: 'Correct!',
    memorizeResult: 'Remember!',
    markCardKnown: 'I know',
    markCardKnownTooltipTitle: '“I know this” marker',
    markCardKnownTooltip:
      'Cards marked this way will not appear in games. You can remove this marker in Cards.',
    correct: 'Correct',
    incorrect: 'Incorrect',
    metricAnsweredSuffix: 'answered',
    metricCompletedSuffix: 'completed',
    metricCorrectSuffix: 'correct',
    metricIncorrectSuffix: 'incorrect',
    metricTotalSuffix: 'total',
    repeatPrompt: 'repeat',
    totalExercisesTooltip: 'Total number of completed games.',
    targetAnswerLabel: 'Target language',
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
    crosswordNeedsIntersections:
      'This card set does not have enough words to build a crossword.',
    missingLettersNeedsWords:
      'Missing letters needs single-word cards, but this set does not have any.',
    missingWordNeedsPhrases:
      'Missing word needs phrase cards, but this set does not have any.',
    totalAnsweredTooltip: 'Total number of answered questions in this game.',
    correctAnsweredTooltip: 'Number of questions answered correctly.',
    incorrectAnsweredTooltip: 'Number of questions answered incorrectly.',
    targetAnsweredCardsTooltip: 'Total cards answered across all games.',
    targetCorrectCardsTooltip: 'Number of cards answered correctly.',
    targetIncorrectCardsTooltip: 'Number of cards answered incorrectly.',
    correctInputTooltip: 'The input was completed correctly.',
    recentAnswersTitle: 'Last 10 answers',
    noCardStatsYet: 'no statistics yet',
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
    disableAdditionalHints: 'Disable additional translation hints',
  },
  ru: {
    appName: 'Language Lab',
    game: 'Игра',
    gamesTab: 'Играть',
    cards: 'Карточки',
    statistics: 'Статистика',
    cardSets: 'Наборы',
    history: 'История',
    interfaceLanguage: 'Язык интерфейса',
    targetLanguage: 'Цель',
    targetLearningLanguage: 'Язык - цель изучения',
    targetLearningLanguages: 'Язык - цель изучения',
    world: 'Мир',
    appWorld: 'Игровой мир',
    footballWorld: 'Футбол',
    forestWorld: 'Лесные эльфы',
    assistant: 'Персонаж',
    assistantProfileLink: 'Познакомиться поближе',
    assistantSuperpowersTitle: 'Супер-способности',
    playerOnboardingTitle: 'Настройка игрового мира',
    playerOnboardingBody:
      'Флаг болельщика Испании будет путешествовать с тобой по футбольной языковой лаборатории.',
    footballWorldChoice: 'Футбол',
    forestWorldChoice: 'Лесные эльфы',
    playerNameLabel: 'Имя игрока',
    savePlayerName: 'Настроить',
    editPlayerName: 'Изменить имя',
    savePlayerNameChange: 'Сохранить имя',
    continueAnonymously: 'я забыл кто я',
    playerGreetingPrefix: 'Привет',
    playerAnonymousName: 'странник',
    practiceSettings: 'Настройки игр',
    repeatManagementTitle: 'Управление повторениями',
    complementaryLanguage: 'Языки подсказок',
    moveCompanionLanguageUp: 'Выше',
    moveCompanionLanguageDown: 'Ниже',
    correctStreakCooldownFivePlus: 'Последние 5 и более раз верно',
    correctStreakCooldownFour: 'Последние 4 раза верно',
    correctStreakCooldownThree: 'Последние 3 раза верно',
    cooldownMonths: 'Месяцев до повтора',
    recentMistakeRepeatFrequency: 'Частота повторов ошибок',
    newCardMixFrequency: 'Примешивание новых слов',
    frequencyPercent: 'Процент появления',
    agentsSection: 'AI помощник',
    agentsTitle: 'AI помощник',
    agentsOpenRouterIntro:
      'Пользователь может добавить свой ключ',
    agentsOpenRouterIntroSuffix:
      ', чтобы запускать агентские функции через свои лимиты.',
    agentsCapabilitiesTitle: 'Что позволяют агенты',
    agentsAnalyzeStatsCapability: 'Анализировать статистику и создавать новые наборы карточек.',
    agentsVocabularyCapability: 'Создавать и добавлять словарный запас.',
    agentsRollbackNotice:
      'Все, что создано агентами в приложении, будет помечено как созданное агентами, а в истории работы агента появится соответствующая запись. Это позволит откатить внесенные изменения. Не переживайте, агент не испортит ваши наработки :)',
    agentsIntroCoachmarkTitle: 'Ближайшие планы',
    aiAssistantTitle: 'AI помощник',
    aiConnectionTitle: 'Подключение',
    aiConnectionSettings: 'Настройки подключения',
    aiApiKeyLabel: 'API-ключ OpenRouter',
    aiModelLabel: 'Модель OpenRouter',
    aiShowKey: 'Показать API-ключ',
    aiHideKey: 'Скрыть API-ключ',
    aiSaveKey: 'Сохранить ключ',
    aiDeleteKey: 'Удалить ключ',
    aiLocalKeyWarning:
      'Ключ хранится локально и без шифрования в этом браузере. Используйте ключ с ограничениями и не делитесь профилем браузера.',
    aiChatTitle: 'Чат',
    aiComposerLabel: 'Сообщение AI-ассистенту',
    aiSendMessage: 'Отправить сообщение',
    aiThinking: 'Думаю...',
    aiCancelRequest: 'Отменить запрос',
    aiRetry: 'Повторить',
    aiClearChat: 'Очистить чат',
    aiCollapseChat: 'Свернуть чат',
    aiClearChatDialogTitle: 'Стереть чат?',
    aiClearChatDialogBody:
      'Видимые сообщения чата будут стерты. История операций останется доступной.',
    aiEraseChat: 'Erase',
    aiSuggestionCreateSet: 'Создай набор для путешествий',
    aiSuggestionFindWeakCards: 'Найди мои самые сложные карточки',
    aiSuggestionAddVocabulary: 'Добавь слова в мою библиотеку',
    aiMissingKey: 'Добавьте и сохраните API-ключ OpenRouter перед отправкой сообщения.',
    aiRequestFailed: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
    aiErrorInvalidKey:
      'OpenRouter отклонил этот API-ключ. Проверьте, что ключ действителен и активен.',
    aiErrorCredits: 'На аккаунте OpenRouter недостаточно средств.',
    aiErrorRateLimit:
      'OpenRouter получает слишком много запросов. Немного подождите и попробуйте снова.',
    aiErrorProvider:
      'AI-провайдер не смог выполнить запрос. Попробуйте позже.',
    aiErrorNetwork:
      'Не удалось подключиться к OpenRouter. Проверьте соединение и попробуйте снова.',
    aiErrorSchema:
      'Ответ AI имеет неожиданный формат, поэтому изменения не были применены.',
    aiErrorTool:
      'AI-ассистент не смог выполнить запрос инструмента. Ничего не было применено.',
    aiErrorLoop:
      'AI-ассистент остановился после слишком большого числа шагов. Ничего не было применено.',
    aiApplyChanges: 'Применить изменения',
    aiChangesAppliedMessage: 'Изменения записаны.',
    aiCancelPreview: 'Отменить предпросмотр',
    aiOperationBlocked: 'Операцию нельзя применить, потому что библиотека изменилась.',
    aiCardSetNameInputLabel: 'Название набора',
    aiBlockedPreviewTitle: 'Требуется проверка',
    aiBlockedPreviewSummary:
      'Это предложение нельзя применить, пока не устранены замечания проверки.',
    aiBlockedPreviewWarnings: 'Замечания проверки',
    aiCreatedCards: 'Создано карточек',
    aiUpdatedCards: 'Обновлено карточек',
    aiPendingDuplicates: 'Дубликаты в ожидании',
    aiCreatedCardSets: 'Создано наборов',
    aiArchivedCardSets: 'Заархивированные наборы',
    aiRenamedCardSets: 'Переименовано наборов',
    aiMembershipAdditions: 'Добавлено в наборы',
    aiMembershipRemovals: 'Удалено из наборов',
    aiHistoryTitle: 'История операций',
    aiHistoryEmpty: 'Операций AI пока нет.',
    aiRollback: 'Отменить изменения',
    aiApplied: 'Применено',
    aiReverted: 'Отменено',
    aiChanges: 'изменений',
    aiOperationHistoryError:
      'Операцию не удалось выполнить. Изменения в библиотеке не применены.',
    aiRollbackConflictTitle: 'Нельзя отменить изменения',
    aiRollbackConflictBody:
      'Библиотека изменилась после применения этой операции. Проверьте затронутые карточки или наборы перед повторной попыткой.',
    aiRollbackConflictLaterOperation: 'Более поздняя операция:',
    importCards: 'Ручной импорт карточек',
    importDescription:
      'Вы можете также подготовить данные для своей учебной лаборатории через внешнего LLM агента и загрузить их здесь в нашем формате. Просто скачайте требования и передайте их вашему агенту.',
    downloadCardFormat: 'Скачать требования к JSON для агентов',
    importErrorInvalidJson:
      'Выбранный файл не содержит корректный JSON.',
    importErrorRootArray:
      'Верхнее значение JSON должно быть массивом карточек.',
    importErrorRecordObject:
      'Каждая запись карточки должна быть объектом.',
    importErrorTranslations:
      'Для каждой карточки нужны переводы минимум на два поддерживаемых языка.',
    importErrorUnknown: 'Эту запись карточки не удалось импортировать.',
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
    openAiAssistant: 'Открыть AI помощника',
    previousCardSets: 'Предыдущие наборы карточек',
    nextCardSets: 'Следующие наборы карточек',
    searchCardSetLibrary: 'Искать по названию или фразе',
    selectCardSetLibraryItem: 'Выбрать набор карточек',
    add: 'Добавить',
    addToCardSet: 'Добавить в набор',
    addCards: 'Добавить карточки',
    addCardsToSet: 'Редактировать набор',
    saveCardsInSet: 'Сохранить набор',
    save: 'Сохранить',
    cancelCardSetEdit: 'Отменить',
    cancelCardSetEditTitle: 'Отменить редактирование набора?',
    cancelCardSetEditBody: 'Выбранные изменения набора не будут сохранены.',
    searchCards: 'Поиск карточек',
    searchCardSets: 'Поиск наборов',
    clearCardSearch: 'Очистить поиск карточек',
    clearCardSetSearch: 'Очистить поиск наборов',
    showArchivedCardSets: 'Заархивированные',
    createActiveCopy: 'Создать активную копию',
    archived: 'Заархивировано',
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
    finishExercise: 'Закончить игру',
    forgetAndExit: 'Забыть и выйти',
    forgetExerciseTooltip:
      'Эта игра не будет включена в статистику, если нажать эту кнопку.',
    finishExerciseAnytimeBenefit:
      'Можно делать гиперзвуковые прыжки между карточками.',
    finishExerciseJumpBenefitFootball:
      'Можно делать быстрые пасы между карточками.',
    finishExerciseJumpBenefitForest:
      'Можно ходить эльфийскими тропами между карточками.',
    finishExerciseAnytimeTooltip:
      'Можно закончить игру в любой момент - уже достигнутый результат будет зачтен.',
    finishExerciseHypersonicJumpTooltip:
      'Гиперзвуковой прыжок переносит тебя в пространстве и меняет ход времени: следующей карточкой станет та, которая идет сразу после выбранной.',
    finishExerciseJumpTooltipFootball:
      'Быстрый пас переводит игру на выбранную карточку: следующей станет та, что идет сразу после нее в составе.',
    finishExerciseJumpTooltipForest:
      'Эльфийская тропа мягко ведет к выбранной карточке: следующей станет та, что идет сразу после нее на тропе.',
    finishExerciseNotice:
      'Результаты игры будут зачтены, а игра закончена.',
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
    gameHelpIntroTitle: 'Об игре',
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
    gameHelpNext: 'Далее',
    gameHelpBack: 'Назад',
    gameHelpPage: 'Страница',
    gameHelpAiChatTitle: 'Чат AI-помощника в играх',
    gameHelpAiChatCards:
      'Чат AI-помощника умеет создавать наборы карточек из слов и фраз, которые ты приносишь в лабораторию.',
    gameHelpAiChatGames:
      'Он помогает подбирать игры под текущий набор: кроссворд, пропущенные буквы, фразы или быстрый вопрос с вариантами.',
    gameHelpAiChatStats:
      'Он читает результаты игр и подсказывает, какие карточки лучше повторить следующими.',
    gameHelpAiChatControl:
      'Перед изменениями AI показывает операцию на проверку, поэтому библиотека остается под твоим контролем.',
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
    exerciseDetails: 'Детали игры',
    userAnswer: 'Ваш ответ',
    noAnswer: 'Нет ответа',
    resultsTitle: 'Результаты',
    totalExercises: 'Всего пройдено игр',
    totalAnsweredQuestions: 'Всего отвечено вопросов',
    targetAnsweredCards: 'Всего отвечено карточек',
    resultStats: 'Статистика',
    wordStats: 'Статистика по слову',
    phraseStats: 'Статистика по фразе',
    cardTypePrefix: 'Тип',
    wordLabel: 'Слово',
    phraseLabel: 'Фраза',
    noMoreCardsInExercise: 'Карточки для этой игры закончились.',
    correctResult: 'Правильно!',
    memorizeResult: 'Запомнить!',
    markCardKnown: 'Я знаю',
    markCardKnownTooltipTitle: 'Признак "Я знаю это"',
    markCardKnownTooltip:
      'Такие карточки не будут участвовать в играх. Снять признак можно в разделе Карточки.',
    correct: 'Верно',
    incorrect: 'Неверно',
    metricAnsweredSuffix: 'отвечено',
    metricCompletedSuffix: 'пройдено',
    metricCorrectSuffix: 'верно',
    metricIncorrectSuffix: 'неверно',
    metricTotalSuffix: 'всего',
    repeatPrompt: 'повтор',
    totalExercisesTooltip: 'Общее количество пройденных игр.',
    targetAnswerLabel: 'Целевой язык',
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
    crosswordNeedsIntersections:
      'В этом наборе недостаточно слов чтобы построить кроссворд',
    missingLettersNeedsWords:
      'Для игры с пропущенными буквами в наборе должны быть карточки со словами',
    missingWordNeedsPhrases:
      'Для игры с пропущенным словом в наборе должны быть карточки с фразами',
    totalAnsweredTooltip: 'Общее количество отвеченных вопросов в игре.',
    correctAnsweredTooltip: 'Количество вопросов, отвеченных верно.',
    incorrectAnsweredTooltip: 'Количество вопросов, отвеченных неверно.',
    targetAnsweredCardsTooltip: 'всего отвечено карточек во всех играх',
    targetCorrectCardsTooltip: 'количество карточек отвеченных верно',
    targetIncorrectCardsTooltip: 'количество карточек отвеченных неверно',
    correctInputTooltip: 'Ввод был выполнен верно.',
    recentAnswersTitle: '10 последних ответов',
    noCardStatsYet: 'статистики пока нет',
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
    disableAdditionalHints: 'Отключить дополнительные подсказки переводов',
  },
  es: {
    appName: 'Language Lab',
    game: 'Juego',
    gamesTab: 'Jugar',
    cards: 'Tarjetas',
    statistics: 'Estadisticas',
    cardSets: 'Conjuntos',
    history: 'Historial',
    interfaceLanguage: 'Idioma de interfaz',
    targetLanguage: 'Objetivo',
    targetLearningLanguage: 'Idioma objetivo de estudio',
    targetLearningLanguages: 'Idiomas objetivo de estudio',
    world: 'Mundo',
    appWorld: 'Mundo de juego',
    footballWorld: 'Futbol',
    forestWorld: 'Elfos del bosque',
    assistant: 'Personaje',
    assistantProfileLink: 'Conocerlo mejor',
    assistantSuperpowersTitle: 'Superpoderes',
    playerOnboardingTitle: 'Configuracion del mundo de juego',
    playerOnboardingBody:
      'Tu bandera de hincha de Espana viajara contigo por el laboratorio futbolero.',
    footballWorldChoice: 'Futbol',
    forestWorldChoice: 'Elfos del bosque',
    playerNameLabel: 'Nombre de jugador',
    savePlayerName: 'Configurar',
    editPlayerName: 'Cambiar nombre',
    savePlayerNameChange: 'Guardar nombre',
    continueAnonymously: 'olvide quien soy',
    playerGreetingPrefix: 'Hola',
    playerAnonymousName: 'viajero',
    practiceSettings: 'Ajustes de juegos',
    repeatManagementTitle: 'Gestion de repeticiones',
    complementaryLanguage: 'Idiomas de pistas',
    moveCompanionLanguageUp: 'Subir',
    moveCompanionLanguageDown: 'Bajar',
    correctStreakCooldownFivePlus: 'Ultimas 5 o mas respuestas correctas',
    correctStreakCooldownFour: 'Ultimas 4 respuestas correctas',
    correctStreakCooldownThree: 'Ultimas 3 respuestas correctas',
    cooldownMonths: 'Meses antes de mostrar otra vez',
    recentMistakeRepeatFrequency: 'Frecuencia de repeticion de errores',
    newCardMixFrequency: 'Mezcla de palabras nuevas',
    frequencyPercent: 'Porcentaje de frecuencia',
    agentsSection: 'Asistente IA',
    agentsTitle: 'Asistente IA',
    agentsOpenRouterIntro:
      'Puedes anadir tu propia clave de',
    agentsOpenRouterIntroSuffix:
      ' para ejecutar las funciones de agentes con tu propio limite.',
    agentsCapabilitiesTitle: 'Que pueden hacer los agentes',
    agentsAnalyzeStatsCapability: 'Analizar estadisticas y crear conjuntos de tarjetas nuevos.',
    agentsVocabularyCapability: 'Crear y anadir vocabulario.',
    agentsRollbackNotice:
      'Todo lo creado por agentes se marcara como creado por agentes, y el historial de trabajo guardara un registro correspondiente para poder deshacer los cambios. No te preocupes, el agente no estropeara tu trabajo :)',
    agentsIntroCoachmarkTitle: 'Planes cercanos',
    aiAssistantTitle: 'Asistente IA',
    aiConnectionTitle: 'Conexion',
    aiConnectionSettings: 'Ajustes de conexion',
    aiApiKeyLabel: 'Clave API de OpenRouter',
    aiModelLabel: 'Modelo de OpenRouter',
    aiShowKey: 'Mostrar clave API',
    aiHideKey: 'Ocultar clave API',
    aiSaveKey: 'Guardar clave',
    aiDeleteKey: 'Eliminar clave',
    aiLocalKeyWarning:
      'Tu clave se guarda localmente y sin cifrar en este navegador. Usa una clave restringida y no compartas este perfil.',
    aiChatTitle: 'Chat',
    aiComposerLabel: 'Mensaje para el asistente de IA',
    aiSendMessage: 'Enviar mensaje',
    aiThinking: 'Pensando...',
    aiCancelRequest: 'Cancelar solicitud',
    aiRetry: 'Reintentar',
    aiClearChat: 'Limpiar chat',
    aiCollapseChat: 'Contraer chat',
    aiClearChatDialogTitle: 'Borrar chat?',
    aiClearChatDialogBody:
      'Se borraran los mensajes visibles del chat. El historial de operaciones seguira disponible.',
    aiEraseChat: 'Erase',
    aiSuggestionCreateSet: 'Crea un conjunto para viajar',
    aiSuggestionFindWeakCards: 'Encuentra mis tarjetas mas dificiles',
    aiSuggestionAddVocabulary: 'Anade vocabulario a mi biblioteca',
    aiMissingKey: 'Anade y guarda una clave API de OpenRouter antes de enviar un mensaje.',
    aiRequestFailed: 'No se pudo completar la solicitud. Intentalo de nuevo.',
    aiErrorInvalidKey:
      'OpenRouter rechazo esta clave API. Comprueba que sea valida y este activa.',
    aiErrorCredits: 'Esta cuenta de OpenRouter no tiene creditos suficientes.',
    aiErrorRateLimit:
      'OpenRouter esta recibiendo demasiadas solicitudes. Espera un momento e intentalo de nuevo.',
    aiErrorProvider:
      'El proveedor de IA no pudo completar la solicitud. Intentalo mas tarde.',
    aiErrorNetwork:
      'No se pudo conectar con OpenRouter. Comprueba tu conexion e intentalo de nuevo.',
    aiErrorSchema:
      'La respuesta de IA tenia un formato inesperado y no se aplico.',
    aiErrorTool:
      'El asistente de IA no pudo completar la solicitud de herramienta. No se aplico nada.',
    aiErrorLoop:
      'El asistente de IA se detuvo tras demasiados pasos. No se aplico nada.',
    aiApplyChanges: 'Aplicar cambios',
    aiChangesAppliedMessage: 'Cambios registrados.',
    aiCancelPreview: 'Cancelar vista previa',
    aiOperationBlocked: 'La operacion no se puede aplicar porque la biblioteca cambio.',
    aiCardSetNameInputLabel: 'Nombre del conjunto',
    aiBlockedPreviewTitle: 'Revision necesaria',
    aiBlockedPreviewSummary:
      'Esta propuesta no se puede aplicar hasta resolver las advertencias de validacion.',
    aiBlockedPreviewWarnings: 'Advertencias de validacion',
    aiCreatedCards: 'Tarjetas creadas',
    aiUpdatedCards: 'Tarjetas actualizadas',
    aiPendingDuplicates: 'Duplicados pendientes',
    aiCreatedCardSets: 'Conjuntos creados',
    aiArchivedCardSets: 'Conjuntos archivados',
    aiRenamedCardSets: 'Conjuntos renombrados',
    aiMembershipAdditions: 'Tarjetas anadidas a conjuntos',
    aiMembershipRemovals: 'Tarjetas retiradas de conjuntos',
    aiHistoryTitle: 'Historial de operaciones',
    aiHistoryEmpty: 'Todavia no hay operaciones de IA.',
    aiRollback: 'Deshacer cambios',
    aiApplied: 'Aplicado',
    aiReverted: 'Deshecho',
    aiChanges: 'cambios',
    aiOperationHistoryError:
      'No se pudo completar la operacion. No se aplicaron cambios a la biblioteca.',
    aiRollbackConflictTitle: 'No se pueden deshacer los cambios',
    aiRollbackConflictBody:
      'La biblioteca cambio despues de aplicar esta operacion. Revisa las tarjetas o conjuntos afectados antes de intentarlo otra vez.',
    aiRollbackConflictLaterOperation: 'Operacion posterior:',
    importCards: 'Importacion manual de tarjetas',
    importDescription:
      'Tambien puedes preparar datos para tu laboratorio con un agente LLM externo y subirlos aqui en nuestro formato. Descarga los requisitos y daselos a tu agente.',
    downloadCardFormat: 'Descargar requisitos JSON para agentes',
    importErrorInvalidJson:
      'El archivo seleccionado no contiene JSON valido.',
    importErrorRootArray:
      'El valor JSON principal debe ser una lista de tarjetas.',
    importErrorRecordObject:
      'Cada registro de tarjeta debe ser un objeto.',
    importErrorTranslations:
      'Cada tarjeta necesita traducciones en al menos dos idiomas compatibles.',
    importErrorUnknown: 'No se pudo importar este registro de tarjeta.',
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
    openAiAssistant: 'Abrir Asistente IA',
    previousCardSets: 'Conjuntos anteriores',
    nextCardSets: 'Conjuntos siguientes',
    searchCardSetLibrary: 'Buscar por nombre o frase',
    selectCardSetLibraryItem: 'Elegir conjunto de tarjetas',
    add: 'Anadir',
    addToCardSet: 'Anadir al conjunto',
    addCards: 'Anadir tarjetas',
    addCardsToSet: 'Editar conjunto',
    saveCardsInSet: 'Guardar conjunto',
    save: 'Guardar',
    cancelCardSetEdit: 'Cancelar',
    cancelCardSetEditTitle: 'Cancelar edicion del conjunto?',
    cancelCardSetEditBody: 'Los cambios seleccionados del conjunto no se guardaran.',
    searchCards: 'Buscar tarjetas',
    searchCardSets: 'Buscar conjuntos',
    clearCardSearch: 'Borrar busqueda de tarjetas',
    clearCardSetSearch: 'Borrar busqueda de conjuntos',
    showArchivedCardSets: 'Archivados',
    createActiveCopy: 'Crear copia activa',
    archived: 'Archivado',
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
    finishExercise: 'Terminar juego',
    forgetAndExit: 'Olvidar y salir',
    forgetExerciseTooltip:
      'Este juego no se incluira en las estadisticas si pulsas este boton.',
    finishExerciseAnytimeBenefit:
      'Puedes hacer saltos hipersonicos entre tarjetas.',
    finishExerciseJumpBenefitFootball:
      'Puedes dar pases rapidos entre tarjetas.',
    finishExerciseJumpBenefitForest:
      'Puedes seguir senderos elficos entre tarjetas.',
    finishExerciseAnytimeTooltip:
      'Puedes terminar el juego en cualquier momento: las respuestas completadas contaran.',
    finishExerciseHypersonicJumpTooltip:
      'Un salto hipersonico te mueve por el espacio y cambia el curso del tiempo: la siguiente tarjeta sera la que va justo despues de la elegida.',
    finishExerciseJumpTooltipFootball:
      'Un pase rapido manda la jugada a la tarjeta elegida: despues, la siguiente tarjeta de la alineacion recibe el balon.',
    finishExerciseJumpTooltipForest:
      'Un sendero elfico se desliza por el bosque: despues de la tarjeta elegida, aparece la siguiente del camino.',
    finishExerciseNotice:
      'Los resultados del juego se guardaran y el juego terminara.',
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
    gameHelpIntroTitle: 'Sobre el juego',
    gameHelpLab: 'Esto es un laboratorio de aprendizaje de idiomas.',
    gameHelpPlayer:
      'Aqui no eres solo estudiante: eres un jugador que crea su propio juego y juega con sus propias reglas!',
    gameHelpVocabulary: 'Tu creas y modificas tu propio vocabulario.',
    gameHelpTeacher:
      'Tu eres tu propio profesor - no abandones esa responsabilidad.',
    gameHelpOwnTrainer:
      'A diferencia de la mayoria de apps, esto no es un entrenador "tonto" hecho por otra persona. Tu creas tu propio entrenador y juegas con tus propias reglas!',
    gameHelpGotIt: 'Entendido!',
    gameHelpNext: 'Siguiente',
    gameHelpBack: 'Atras',
    gameHelpPage: 'Pagina',
    gameHelpAiChatTitle: 'Chat del asistente AI dentro de los juegos',
    gameHelpAiChatCards:
      'El chat puede crear conjuntos de tarjetas a partir de palabras y frases que traes al laboratorio.',
    gameHelpAiChatGames:
      'Ayuda a elegir juegos para el conjunto actual: crucigrama, letras faltantes, frases o una prueba rapida de tres opciones.',
    gameHelpAiChatStats:
      'Lee los resultados de los juegos y muestra que tarjetas conviene repetir primero.',
    gameHelpAiChatControl:
      'Antes de cambiar la biblioteca, el AI muestra una operacion para aprobar, asi que tu mantienes el control.',
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
    exerciseDetails: 'Detalles del juego',
    userAnswer: 'Tu respuesta',
    noAnswer: 'Sin respuesta',
    resultsTitle: 'Resultados',
    totalExercises: 'Juegos completados',
    totalAnsweredQuestions: 'Preguntas respondidas',
    targetAnsweredCards: 'Tarjetas respondidas',
    resultStats: 'Estadisticas',
    wordStats: 'Estadisticas de la palabra',
    phraseStats: 'Estadisticas de la frase',
    cardTypePrefix: 'Tipo',
    wordLabel: 'Palabra',
    phraseLabel: 'Frase',
    noMoreCardsInExercise: 'No quedan tarjetas en este juego.',
    correctResult: 'Correcto!',
    memorizeResult: 'Memorizar!',
    markCardKnown: 'Lo se',
    markCardKnownTooltipTitle: 'Marca "Ya lo se"',
    markCardKnownTooltip:
      'Las tarjetas marcadas asi no participaran en los juegos. Puedes quitar esta marca en Tarjetas.',
    correct: 'Correctas',
    incorrect: 'Incorrectas',
    metricAnsweredSuffix: 'respondidas',
    metricCompletedSuffix: 'completados',
    metricCorrectSuffix: 'correctas',
    metricIncorrectSuffix: 'incorrectas',
    metricTotalSuffix: 'total',
    repeatPrompt: 'repeticion',
    totalExercisesTooltip: 'Numero total de juegos completados.',
    targetAnswerLabel: 'Idioma objetivo',
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
    crosswordNeedsIntersections:
      'Este conjunto no tiene suficientes palabras para crear un crucigrama.',
    missingLettersNeedsWords:
      'Letras que faltan necesita tarjetas de una sola palabra, pero este conjunto no tiene ninguna.',
    missingWordNeedsPhrases:
      'Palabra que falta necesita tarjetas con frases, pero este conjunto no tiene ninguna.',
    totalAnsweredTooltip: 'Numero total de preguntas respondidas en este juego.',
    correctAnsweredTooltip: 'Numero de preguntas respondidas correctamente.',
    incorrectAnsweredTooltip: 'Numero de preguntas respondidas incorrectamente.',
    targetAnsweredCardsTooltip: 'Total de tarjetas respondidas en todos los juegos.',
    targetCorrectCardsTooltip: 'Numero de tarjetas respondidas correctamente.',
    targetIncorrectCardsTooltip: 'Numero de tarjetas respondidas incorrectamente.',
    correctInputTooltip: 'La entrada se completo correctamente.',
    recentAnswersTitle: '10 ultimas respuestas',
    noCardStatsYet: 'aun no hay estadisticas',
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
    disableAdditionalHints: 'Desactivar pistas de traducción adicionales',
  },
};

const ukrainianMessages: Partial<Record<I18nKey, string>> = {
  agentsSection: 'AI помічник',
  agentsTitle: 'AI помічник',
  aiAssistantTitle: 'AI помічник',
  aiChatTitle: 'Чат',
  aiComposerLabel: 'Повідомлення AI-помічнику',
  aiSendMessage: 'Надіслати повідомлення',
  addCards: 'Додати картки',
  addCardsToSet: 'Редагувати набір',
  allCards: 'Усі картки',
  appWorld: 'Ігровий світ',
  appName: 'Language Lab',
  assistant: 'Персонаж',
  cardSetLabel: 'Набір карток',
  cardSetLibrary: 'Бібліотека карток',
  cards: 'Картки',
  cardSets: 'Набори',
  cancelCardSetEdit: 'Скасувати',
  cancelCardSetEditBody: 'Вибрані зміни набору не буде збережено.',
  cancelCardSetEditTitle: 'Скасувати редагування набору?',
  chooseCardSet: 'Виберіть набір карток',
  chooseCardSetPlaceholder: 'Виберіть набір карток',
  chooseExercise: 'Виберіть гру',
  complementaryLanguage: 'Мови підказок',
  continueAnonymously: 'я забув хто я',
  crossword: 'Кросворд',
  editPlayerName: "Змінити ім'я",
  footballWorld: 'Футбол',
  footballWorldChoice: 'Футбол',
  forestWorld: 'Лісові ельфи',
  forestWorldChoice: 'Лісові ельфи',
  finishExercise: 'Закінчити гру',
  finishExerciseJumpBenefitFootball:
    'Можна робити швидкі паси між картками.',
  finishExerciseJumpBenefitForest:
    'Можна ходити ельфійськими стежками між картками.',
  finishExerciseJumpTooltipFootball:
    'Швидкий пас переводить гру на вибрану картку: наступною стане та, що йде одразу після неї у складі.',
  finishExerciseJumpTooltipForest:
    'Ельфійська стежка м’яко веде до вибраної картки: наступною стане та, що йде одразу після неї на стежці.',
  game: 'Гра',
  gameHelpTitle: 'Допомога',
  gameHelpIntroTitle: 'Про гру',
  gameHelpBack: 'Назад',
  gameHelpPage: 'Сторінка',
  gameLibrary: 'Бібліотека ігор',
  gamesTab: 'Грати',
  history: 'Історія',
  interfaceLanguage: 'Мова інтерфейсу',
  missingLetters: 'Пропущені літери',
  missingWord: 'Пропущене слово',
  multipleChoice: 'Питання з 3 варіантами',
  next: 'Далі',
  openAiAssistant: 'Відкрити AI помічника',
  playerAnonymousName: 'мандрівник',
  playerNameLabel: "Ім'я гравця",
  playerOnboardingBody:
    'Прапор уболівальника Іспанії подорожуватиме з тобою футбольною мовною лабораторією.',
  playerOnboardingTitle: 'Налаштування ігрового світу',
  moveCompanionLanguageUp: 'Вище',
  moveCompanionLanguageDown: 'Нижче',
  noCardStatsYet: 'статистики поки немає',
  practiceSettings: 'Налаштування ігор',
  repeatManagementTitle: 'Керування повтореннями',
  cardTypePrefix: 'Тип',
  resultsTitle: 'Результати',
  savePlayerName: 'Налаштувати',
  save: 'Зберегти',
  saveCardsInSet: 'Зберегти набір',
  savePlayerNameChange: "Зберегти ім'я",
  searchCards: 'Пошук карток',
  searchCardSets: 'Пошук наборів',
  start: 'Грати',
  statistics: 'Статистика',
  submit: 'Надіслати',
  targetLanguage: 'Ціль',
  targetLearningLanguage: 'Мова - ціль вивчення',
  targetLearningLanguages: 'Мови - ціль вивчення',
  targetAnswerLabel: 'Цільова мова',
  world: 'Світ',
  disableAdditionalHints: 'Вимкнути додаткові підказки перекладів',
};

const languageNames: Record<
  SupportedLanguage,
  Record<SupportedLanguage, string>
> = {
  en: {
    ru: 'Russian',
    en: 'English',
    es: 'Spanish',
    uk: 'Ukrainian',
  },
  ru: {
    ru: 'Русский',
    en: 'Английский',
    es: 'Испанский',
    uk: 'Украинский',
  },
  es: {
    ru: 'ruso',
    en: 'ingles',
    es: 'espanol',
    uk: 'ucraniano',
  },
  uk: {
    ru: 'російська',
    en: 'англійська',
    es: 'іспанська',
    uk: 'українська',
  },
};

export function t(language: SupportedLanguage, key: I18nKey): string {
  if (language === 'uk') {
    return ukrainianMessages[key] ?? messages.ru[key];
  }

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

  if (language === 'uk') {
    return formatRussianCount(value, ['набір', 'набори', 'наборів']);
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

  if (language === 'uk') {
    return formatRussianCount(value, ['картка', 'картки', 'карток']);
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

  if (language === 'uk') {
    return `Зараз збережено: ${formatCardCount(language, value)}`;
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
