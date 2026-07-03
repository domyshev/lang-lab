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
  | 'importSection'
  | 'importCards'
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
  | 'missingWord';

const messages: Record<SupportedLanguage, Record<I18nKey, string>> = {
  en: {
    appName: 'Language Crossword Lab',
    game: 'Game',
    cards: 'Cards',
    statistics: 'Statistics',
    themes: 'Themes',
    history: 'History',
    interfaceLanguage: 'Interface',
    targetLanguage: 'Target',
    importSection: 'Import',
    importCards: 'Import cards',
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
  },
  ru: {
    appName: 'Language Crossword Lab',
    game: 'Игра',
    cards: 'Карточки',
    statistics: 'Статистика',
    themes: 'Темы',
    history: 'История',
    interfaceLanguage: 'Интерфейс',
    targetLanguage: 'Цель',
    importSection: 'Импорт',
    importCards: 'Импорт карточек',
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
  },
  es: {
    appName: 'Language Crossword Lab',
    game: 'Juego',
    cards: 'Tarjetas',
    statistics: 'Estadisticas',
    themes: 'Temas',
    history: 'Historial',
    interfaceLanguage: 'Interfaz',
    targetLanguage: 'Objetivo',
    importSection: 'Importar',
    importCards: 'Importar tarjetas',
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
  },
};

export function t(language: SupportedLanguage, key: I18nKey): string {
  return messages[language][key];
}
