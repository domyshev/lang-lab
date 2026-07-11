import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { AppShell, AppShellSection } from './components/AppShell';
import { AssistantProfileView } from './components/AssistantProfileView';
import { CardSetLibraryPicker } from './components/CardSetLibraryPicker';
import { CoachPanel } from './components/CoachPanel';
import { ExercisePicker } from './components/ExercisePicker';
import { GameHelpPanel } from './components/GameHelpPanel';
import { GameWarningIcon, GameWarningTooltip } from './components/GameWarningTooltip';
import { HistoryView } from './components/HistoryView';
import { ImportCardsView } from './components/ImportCardsView';
import { SplitWordStatsChip } from './components/SplitWordStatsChip';
import { MetricChip, StatsFormula } from './components/StatsFormula';
import { CursorAnchoredTooltip, TooltipContent } from './components/CursorAnchoredTooltip';
import { CardSetDetailView } from './components/CardSetDetailView';
import { CardSetListView } from './components/CardSetListView';
import {
  CrosswordExercise,
  type CrosswordDraftState,
} from './components/exercises/CrosswordExercise';
import { MissingLettersExercise } from './components/exercises/MissingLettersExercise';
import { MissingWordExercise } from './components/exercises/MissingWordExercise';
import { MultipleChoiceExercise } from './components/exercises/MultipleChoiceExercise';
import {
  LanguageCard,
  createCardSnapshot,
  getCardAnswer,
  getTranslationHints,
  isPhraseValue,
} from './domain/cards';
import {
  CrosswordEntry,
  CrosswordPuzzle,
  createCrossword,
} from './domain/crossword';
import {
  defaultVocabularyCards,
  defaultVocabularyCardSets,
} from './domain/defaultVocabulary';
import { getCoachProgressMessage } from './domain/coachProgress';
import { AssistantId } from './domain/assistants';
import {
  ExerciseAttempt,
  CrosswordAttemptSnapshot,
  ExercisePrompt,
  ExerciseType,
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from './domain/exercises';
import { summarizeExerciseHistory } from './domain/exerciseHistory';
import { getLanguageDisplayName, t } from './domain/i18n';
import { SupportedLanguage, languageFlags } from './domain/languages';
import {
  getPracticeSettings,
  orderCardsForMissingLettersPractice,
} from './domain/practiceOrdering';
import {
  ALL_CARDS_CARD_SET_ID,
  CardSet,
  getCardSetName,
} from './domain/cardSets';
import { createCardById, getCardsByIds } from './domain/cardIndexes';
import { forgetExerciseSession, saveAttempt } from './store/attemptsSlice';
import {
  acknowledgeGameHelp,
  getComplementaryLanguageForTarget,
  markFinishExerciseLampShown,
  markGameHelpCoachmarkShown,
  markHypersonicJumpLampShown,
} from './store/appSlice';
import { seedDefaultCards } from './store/cardsSlice';
import { rebuildStatsFromAttempts, recordAttemptStats } from './store/statsSlice';
import {
  mergeCardSetMetadata,
  seedDefaultCardSets,
  selectCardSet,
} from './store/cardSetsSlice';
import { AppDispatch, RootState } from './store/store';

type ExercisePreview =
  | { type: 'crossword'; puzzle: CrosswordPuzzle }
  | { type: 'multipleChoice'; prompt: ExercisePrompt & { options: string[] } }
  | {
      type: 'missingLetters';
      prompt?: MissingLettersPracticePrompt;
    }
  | {
      type: 'missingWord';
      prompt?: MissingWordPracticePrompt;
    };

type SelectableCardSet = CardSet & { isAllCards?: boolean };

type PracticePrompt<T extends ExercisePrompt> = T & {
  isRepeat: boolean;
  practiceKey: string;
};
type MissingLettersPracticePrompt = PracticePrompt<
  ExercisePrompt & { maskedAnswer: string }
>;
type MissingWordPracticePrompt = PracticePrompt<
  ExercisePrompt & { sentenceWithGap: string }
>;
type ResultPromptHold =
  | {
      exerciseType: 'missingLetters';
      prompt: MissingLettersPracticePrompt;
    }
  | {
      exerciseType: 'missingWord';
      prompt: MissingWordPracticePrompt;
    };
type CompletedExerciseSummary = {
  completedAt: string;
  correct: number;
  exerciseType: ExerciseType;
  incorrect: number;
};
const emptyCrosswordDraftState: CrosswordDraftState = {
  answers: {},
  answeredCardIds: [],
  cellValues: {},
  filledEntryCount: 0,
  hasAnyLetters: false,
};
type FinishExerciseJumpOption = {
  isAnswered: boolean;
  label: string;
  value: string;
};
type FinishExerciseJumpSelector = {
  onChange: (value: string) => void;
  options: FinishExerciseJumpOption[];
  value: string;
};
type RepeatProgress = {
  current: number;
  total: number;
};

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const hasSeededDefaultVocabulary = useRef(false);
  const hasMergedDefaultCardSetMetadata = useRef(false);
  const [activeSection, setActiveSection] =
    useState<AppShellSection>('game');
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType | null>(null);
  const [selectedGameCardSetId, setSelectedGameCardSetId] = useState('');
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [generationSeed, setGenerationSeed] = useState(() => Date.now());
  const [lastSavedAttemptId, setLastSavedAttemptId] = useState<string | null>(
    null,
  );
  const [
    answeredMissingLettersPromptKeys,
    setAnsweredMissingLettersPromptKeys,
  ] = useState<string[]>([]);
  const [answeredMissingWordPromptKeys, setAnsweredMissingWordPromptKeys] = useState<
    string[]
  >([]);
  const [answeredMultipleChoiceCardIds, setAnsweredMultipleChoiceCardIds] =
    useState<string[]>([]);
  const [multipleChoiceJumpCardId, setMultipleChoiceJumpCardId] =
    useState<string | null>(null);
  const [completedMissingLettersCardIds, setCompletedMissingLettersCardIds] =
    useState<string[]>([]);
  const [completedMissingWordCardIds, setCompletedMissingWordCardIds] =
    useState<string[]>([]);
  const [completedMultipleChoiceCardIds, setCompletedMultipleChoiceCardIds] =
    useState<string[]>([]);
  const [resultPromptHold, setResultPromptHold] =
    useState<ResultPromptHold | null>(null);
  const [completedExerciseSummary, setCompletedExerciseSummary] =
    useState<CompletedExerciseSummary | null>(null);
  const [currentExerciseAnsweredCount, setCurrentExerciseAnsweredCount] =
    useState(0);
  const [hasCurrentExerciseResult, setHasCurrentExerciseResult] =
    useState(false);
  const [currentExerciseSessionId, setCurrentExerciseSessionId] = useState(() =>
    createId('exercise-session'),
  );
  const [crosswordDraftState, setCrosswordDraftState] =
    useState<CrosswordDraftState>(emptyCrosswordDraftState);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishDialogIntent, setFinishDialogIntent] = useState<
    'finish' | 'home' | null
  >(null);
  const [profileAssistantId, setProfileAssistantId] =
    useState<AssistantId | null>(null);

  const cards = useSelector((state: RootState) => state.cards.cards);
  const cardSets = useSelector((state: RootState) => state.cardSets.cardSets);
  const selectedCardSetId = useSelector(
    (state: RootState) => state.cardSets.selectedCardSetId,
  );
  const attempts = useSelector((state: RootState) => state.attempts.attempts);
  const cardStats = useSelector((state: RootState) => state.stats.cardStats);
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const isGameHelpCollapsed = useSelector((state: RootState) =>
    Boolean(state.app.isGameHelpCollapsed),
  );
  const hasGameHelpCoachmarkBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasGameHelpCoachmarkBeenShown),
  );
  const practiceSettings = useSelector(
    (state: RootState) => state.app.practiceSettings,
  );
  const complementaryLanguages = useSelector(
    (state: RootState) => state.app.complementaryLanguages,
  );
  const complementaryLanguage = getComplementaryLanguageForTarget(
    complementaryLanguages,
    targetLanguage,
  );
  const cardById = useMemo(() => createCardById(cards), [cards]);
  const practiceOrderingAttempts = useMemo(
    () =>
      isExerciseStarted
        ? attempts.filter(
            (attempt) => attempt.exerciseSessionId !== currentExerciseSessionId,
          )
        : attempts,
    [attempts, currentExerciseSessionId, isExerciseStarted],
  );

  const visibleCardSets = useMemo(
    () => cardSets.filter((cardSet) => !cardSet.archivedAt),
    [cardSets],
  );
  const selectedCardSet = useMemo<SelectableCardSet | undefined>(() => {
    if (!selectedCardSetId || selectedCardSetId === ALL_CARDS_CARD_SET_ID) {
      return {
        id: ALL_CARDS_CARD_SET_ID,
        name: t(targetLanguage, 'allCards'),
        cardIds: cards.map((card) => card.id),
        createdAt: '',
        updatedAt: '',
        isAllCards: true,
      };
    }

    const cardSet = visibleCardSets.find(
      (item) => item.id === selectedCardSetId,
    );

    return cardSet
      ? {
          ...cardSet,
          name: getCardSetName(cardSet, targetLanguage),
        }
      : undefined;
  }, [cards, selectedCardSetId, targetLanguage, visibleCardSets]);
  const cardSetCards = useMemo(() => {
    if (!selectedCardSet) {
      return [];
    }

    return selectedCardSet.isAllCards
      ? cards
      : getCardsByIds(cardById, selectedCardSet.cardIds);
  }, [cardById, cards, selectedCardSet]);
  const eligibleCards = useMemo(
    () => getEligibleCardsForTarget(cardSetCards, targetLanguage),
    [targetLanguage, cardSetCards],
  );
  const randomizedEligibleCards = useMemo(
    () => shuffleCards(eligibleCards, generationSeed),
    [eligibleCards, generationSeed],
  );
  const missingLettersEligibleCards = useMemo(
    () =>
      eligibleCards.filter((card) => {
        const answer = getCardAnswer(card, targetLanguage);
        return Boolean(answer && !isPhraseValue(answer));
      }),
    [eligibleCards, targetLanguage],
  );
  const missingWordEligibleCards = useMemo(
    () =>
      eligibleCards.filter((card) => {
        const answer = getCardAnswer(card, targetLanguage);
        return Boolean(answer && isPhraseValue(answer));
      }),
    [eligibleCards, targetLanguage],
  );
  const missingLettersOrderedCards = useMemo(() => {
    if (selectedExerciseType !== 'missingLetters') {
      return [];
    }

    return orderCardsForMissingLettersPractice({
      attempts: practiceOrderingAttempts,
      cards: missingLettersEligibleCards,
      now: new Date().toISOString(),
      seed: generationSeed,
      settings: getPracticeSettings(practiceSettings),
      targetLanguage,
    });
  }, [
    generationSeed,
    missingLettersEligibleCards,
    practiceOrderingAttempts,
    practiceSettings,
    selectedExerciseType,
    targetLanguage,
  ]);
  const missingLettersPracticeCardIds = useMemo(
    () => uniqueValues(missingLettersOrderedCards.map((card) => card.id)),
    [missingLettersOrderedCards],
  );
  const missingWordOrderedCards = useMemo(() => {
    if (selectedExerciseType !== 'missingWord') {
      return [];
    }

    return orderCardsForMissingLettersPractice({
      attempts: practiceOrderingAttempts,
      cards: missingWordEligibleCards,
      now: new Date().toISOString(),
      seed: generationSeed,
      settings: getPracticeSettings(practiceSettings),
      targetLanguage,
    });
  }, [
    generationSeed,
    missingWordEligibleCards,
    practiceOrderingAttempts,
    practiceSettings,
    selectedExerciseType,
    targetLanguage,
  ]);
  const missingWordPracticeCardIds = useMemo(
    () => uniqueValues(missingWordOrderedCards.map((card) => card.id)),
    [missingWordOrderedCards],
  );
  const missingLettersPracticePrompts = useMemo(() => {
    const occurrenceCounts = new Map<string, number>();
    return missingLettersOrderedCards
      .map((card) => {
        const prompt = createMissingLettersPrompt({ card, targetLanguage });
        const occurrence = getNextOccurrence(card.id, occurrenceCounts);
        return prompt
          ? {
              ...prompt,
              isRepeat: occurrence > 0,
              practiceKey: createPracticeKey(card.id, occurrence),
            }
          : undefined;
      })
      .filter(
        (
          prompt,
        ): prompt is PracticePrompt<ExercisePrompt & { maskedAnswer: string }> =>
          Boolean(prompt),
      );
  }, [missingLettersOrderedCards, targetLanguage]);
  const missingWordPracticePrompts = useMemo(() => {
    const occurrenceCounts = new Map<string, number>();
    return missingWordOrderedCards
      .map((card) => {
        const prompt = createMissingWordPrompt({ card, targetLanguage });
        const occurrence = getNextOccurrence(card.id, occurrenceCounts);
        return prompt
          ? {
              ...prompt,
              isRepeat: occurrence > 0,
              practiceKey: createPracticeKey(card.id, occurrence),
            }
          : undefined;
      })
      .filter(
        (
          prompt,
        ): prompt is PracticePrompt<ExercisePrompt & { sentenceWithGap: string }> =>
          Boolean(prompt),
      );
  }, [missingWordOrderedCards, targetLanguage]);
  const lastSavedAttempt =
    attempts.find((attempt) => attempt.id === lastSavedAttemptId) ?? null;

  useEffect(() => {
    if (hasSeededDefaultVocabulary.current || cards.length > 0) {
      return;
    }

    hasSeededDefaultVocabulary.current = true;
    dispatch(seedDefaultCards(defaultVocabularyCards));
    dispatch(seedDefaultCardSets(defaultVocabularyCardSets));
  }, [cards.length, dispatch]);

  useEffect(() => {
    if (hasMergedDefaultCardSetMetadata.current || cardSets.length === 0) {
      return;
    }

    hasMergedDefaultCardSetMetadata.current = true;
    dispatch(mergeCardSetMetadata(defaultVocabularyCardSets));
  }, [cardSets.length, dispatch]);

  const exercisePreview = useMemo<ExercisePreview | null>(() => {
    const firstCard = randomizedEligibleCards[0];
    if (!firstCard) {
      return null;
    }

    if (selectedExerciseType === 'crossword') {
      return {
        type: 'crossword',
        puzzle: createCrossword({
          cards: randomizedEligibleCards,
          complementaryLanguage,
          targetLanguage,
        }),
      };
    }

    if (selectedExerciseType === 'multipleChoice') {
      const lastAnsweredCardId =
        answeredMultipleChoiceCardIds[answeredMultipleChoiceCardIds.length - 1];
      const blockedCardIds =
        answeredMultipleChoiceCardIds.length >= randomizedEligibleCards.length
          ? [lastAnsweredCardId]
          : answeredMultipleChoiceCardIds;
      const activeCard =
        randomizedEligibleCards.find((card) => card.id === multipleChoiceJumpCardId) ??
        pickMultipleChoiceCard(
          randomizedEligibleCards,
          answeredMultipleChoiceCardIds,
        ) ??
        firstCard;
      const freshDistractorCards = randomizedEligibleCards.filter(
        (card) =>
          card.id !== activeCard.id && !blockedCardIds.includes(card.id),
      );
      const fallbackDistractorCards = randomizedEligibleCards.filter(
        (card) =>
          card.id !== activeCard.id && blockedCardIds.includes(card.id),
      );

      return {
        type: 'multipleChoice',
        prompt: createMultipleChoicePrompt({
          card: activeCard,
          distractorCards: [...freshDistractorCards, ...fallbackDistractorCards],
          targetLanguage,
        }),
      };
    }

    if (selectedExerciseType === 'missingLetters') {
      const heldResultPrompt =
        resultPromptHold?.exerciseType === 'missingLetters'
          ? resultPromptHold.prompt
          : undefined;
      return {
        type: 'missingLetters',
        prompt:
          heldResultPrompt ??
          pickPracticePrompt(
            missingLettersPracticePrompts,
            answeredMissingLettersPromptKeys,
          ),
      };
    }

    const heldResultPrompt =
      resultPromptHold?.exerciseType === 'missingWord'
        ? resultPromptHold.prompt
        : undefined;
    return {
      type: 'missingWord',
      prompt:
        heldResultPrompt ??
        pickPracticePrompt(missingWordPracticePrompts, answeredMissingWordPromptKeys),
    };
  }, [
    answeredMissingLettersPromptKeys,
    answeredMissingWordPromptKeys,
    answeredMultipleChoiceCardIds,
    missingLettersPracticePrompts,
    missingWordPracticePrompts,
    multipleChoiceJumpCardId,
    complementaryLanguage,
    randomizedEligibleCards,
    resultPromptHold,
    selectedExerciseType,
    targetLanguage,
  ]);

  function resetExerciseState() {
    setIsExerciseStarted(false);
    setLastSavedAttemptId(null);
    setAnsweredMissingLettersPromptKeys([]);
    setAnsweredMissingWordPromptKeys([]);
    setAnsweredMultipleChoiceCardIds([]);
    setMultipleChoiceJumpCardId(null);
    setCompletedMissingLettersCardIds([]);
    setCompletedMissingWordCardIds([]);
    setCompletedMultipleChoiceCardIds([]);
    setResultPromptHold(null);
    setCompletedExerciseSummary(null);
    setCrosswordDraftState(emptyCrosswordDraftState);
    setCurrentExerciseAnsweredCount(0);
    setHasCurrentExerciseResult(false);
    setCurrentExerciseSessionId(createId('exercise-session'));
    setGenerationSeed((seed) => seed + 1);
  }

  function openFinishDialog(intent: 'finish' | 'home') {
    if (selectedExerciseType === 'crossword' && isExerciseStarted) {
      if (crosswordDraftState.filledEntryCount === 0) {
        resetExerciseState();
        if (intent === 'home') {
          setActiveSection('game');
        }
        return;
      }

      setFinishDialogIntent(intent);
      setIsFinishDialogOpen(true);
      return;
    }

    if (currentExerciseAnsweredCount === 0 && !hasCurrentExerciseResult) {
      resetExerciseState();
      if (intent === 'home') {
        setActiveSection('game');
      }
      return;
    }

    setFinishDialogIntent(intent);
    setIsFinishDialogOpen(true);
  }

  function handleFinishDialogCancel() {
    setFinishDialogIntent(null);
    setIsFinishDialogOpen(false);
  }

  function handleFinishDialogConfirm() {
    const shouldGoHome = finishDialogIntent === 'home';
    if (
      selectedExerciseType === 'crossword' &&
      currentExerciseAnsweredCount === 0 &&
      crosswordDraftState.filledEntryCount > 0 &&
      exercisePreview?.type === 'crossword'
    ) {
      saveCrosswordDraftAttempt(exercisePreview.puzzle, crosswordDraftState);
    }

    setFinishDialogIntent(null);
    setIsFinishDialogOpen(false);
    resetExerciseState();
    if (shouldGoHome) {
      setActiveSection('game');
    }
  }

  function handleFinishDialogForget() {
    const shouldGoHome = finishDialogIntent === 'home';
    const remainingAttempts = attempts.filter(
      (attempt) => attempt.exerciseSessionId !== currentExerciseSessionId,
    );

    dispatch(forgetExerciseSession(currentExerciseSessionId));
    dispatch(rebuildStatsFromAttempts(remainingAttempts));
    setFinishDialogIntent(null);
    setIsFinishDialogOpen(false);
    resetExerciseState();
    if (shouldGoHome) {
      setActiveSection('game');
    }
  }

  function handleLogoClick() {
    if (isExerciseStarted) {
      openFinishDialog('home');
      return;
    }

    setProfileAssistantId(null);
    setActiveSection('game');
  }

  function handleNavigate(section: AppShellSection) {
    if (section === 'game') {
      setProfileAssistantId(null);
      if (isExerciseStarted) {
        openFinishDialog('home');
        return;
      }
      setActiveSection('game');
      return;
    }

    if (section !== 'assistant') {
      setProfileAssistantId(null);
    }
    setActiveSection(section);
  }

  function openAssistantProfile(assistantId: AssistantId) {
    setProfileAssistantId(assistantId);
    setActiveSection('assistant');
  }

  function savePromptAttempt(
    exerciseType: Exclude<ExerciseType, 'crossword'>,
    prompt: ExercisePrompt,
    answer: string,
    options: { advance?: boolean } = {},
  ) {
    persistPromptAttempt({
      answer,
      exerciseType,
      isCorrect:
        normalizeAnswer(answer) === normalizeAnswer(prompt.expectedAnswer),
      prompt,
      advance: options.advance ?? true,
    });
  }

  function persistPromptAttempt({
    advance,
    answer,
    exerciseType,
    isCorrect,
    prompt,
  }: {
    advance: boolean;
    answer: string;
    exerciseType: Exclude<ExerciseType, 'crossword'>;
    isCorrect: boolean;
    prompt: ExercisePrompt;
  }) {
    if (exerciseType === 'missingLetters' || exerciseType === 'missingWord') {
      if (exerciseType === 'missingLetters') {
        setResultPromptHold({
          exerciseType,
          prompt: prompt as MissingLettersPracticePrompt,
        });
      } else {
        setResultPromptHold({
          exerciseType,
          prompt: prompt as MissingWordPracticePrompt,
        });
      }
    }

    persistAttempt({
      exerciseType,
      prompts: [prompt],
      answers: { [prompt.cardId]: answer },
      correctness: { [prompt.cardId]: isCorrect },
      hintsUsed: { [prompt.cardId]: 0 },
      cardIds: [prompt.cardId],
      advance,
    });
  }

  function saveCrosswordAttempt(
    puzzle: CrosswordPuzzle,
    answers: Record<string, string>,
    crosswordSnapshot: CrosswordAttemptSnapshot,
  ) {
    const answeredEntries = getCompletedCrosswordEntries(puzzle, answers);
    const filteredAnswers = Object.fromEntries(
      answeredEntries.map((entry) => [entry.cardId, answers[entry.cardId] ?? '']),
    );
    const prompts: ExercisePrompt[] = answeredEntries.map((entry) => ({
      cardId: entry.cardId,
      prompt: entry.clue,
      expectedAnswer: entry.answer,
      translationHints:
        cardSetCards.find((card) => card.id === entry.cardId)
          ? getTranslationHints(
              cardSetCards.find((card) => card.id === entry.cardId)!,
              targetLanguage,
            )
          : [],
    }));
    const correctness = Object.fromEntries(
      answeredEntries.map((entry) => [
        entry.cardId,
        normalizeAnswer(answers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer),
      ]),
    );
    const hintsUsed = Object.fromEntries(
      answeredEntries.map((entry) => [entry.cardId, 0]),
    );

    persistAttempt({
      exerciseType: 'crossword',
      prompts,
      answers: filteredAnswers,
      correctness,
      hintsUsed,
      cardIds: answeredEntries.map((entry) => entry.cardId),
      advance: false,
      isExerciseCompleted: answeredEntries.length === puzzle.entries.length,
      crosswordSnapshot,
    });
  }

  function saveCrosswordDraftAttempt(
    puzzle: CrosswordPuzzle,
    draft: CrosswordDraftState,
  ) {
    const answeredCardIds = draft.answeredCardIds;
    const prompts: ExercisePrompt[] = puzzle.entries
      .filter((entry) => answeredCardIds.includes(entry.cardId))
      .map((entry) => ({
        cardId: entry.cardId,
        prompt: entry.clue,
        expectedAnswer: entry.answer,
        translationHints:
          cardSetCards.find((card) => card.id === entry.cardId)
            ? getTranslationHints(
                cardSetCards.find((card) => card.id === entry.cardId)!,
                targetLanguage,
              )
            : [],
      }));
    const answers = Object.fromEntries(
      answeredCardIds.map((cardId) => [cardId, draft.answers[cardId] ?? '']),
    );
    const correctness = Object.fromEntries(
      puzzle.entries
        .filter((entry) => answeredCardIds.includes(entry.cardId))
        .map((entry) => [
          entry.cardId,
          normalizeAnswer(draft.answers[entry.cardId] ?? '') ===
            normalizeAnswer(entry.answer),
        ]),
    );
    const hintsUsed = Object.fromEntries(
      answeredCardIds.map((cardId) => [cardId, 0]),
    );

    persistAttempt({
      exerciseType: 'crossword',
      prompts,
      answers,
      correctness,
      hintsUsed,
      cardIds: answeredCardIds,
      advance: false,
      crosswordSnapshot: {
        puzzle,
        cellValues: { ...draft.cellValues },
      },
    });
  }

  function persistAttempt(input: {
    exerciseType: ExerciseType;
    prompts: ExercisePrompt[];
    answers: Record<string, string>;
    correctness: Record<string, boolean>;
    hintsUsed: Record<string, number>;
    cardIds: string[];
    advance: boolean;
    isExerciseCompleted?: boolean;
    crosswordSnapshot?: CrosswordAttemptSnapshot;
  }) {
    if (!selectedCardSet) {
      return;
    }

    const now = new Date().toISOString();
    const weightedScore = calculateWeightedScore({
      correctness: input.correctness,
      cardStats,
      targetLanguage,
    });
    const attempt: ExerciseAttempt = {
      id: createId('attempt'),
      exerciseSessionId: currentExerciseSessionId,
      exerciseType: input.exerciseType,
      cardSetId: selectedCardSet.id,
      targetLanguage,
      createdAt: now,
      completedAt: now,
      cardSnapshots: cardSetCards
        .filter((card) => input.cardIds.includes(card.id))
        .map(createCardSnapshot),
      prompts: input.prompts,
      answers: input.answers,
      correctness: input.correctness,
      hintsUsed: input.hintsUsed,
      isExerciseCompleted: input.isExerciseCompleted,
      crosswordSnapshot: input.crosswordSnapshot,
      weightedScore,
    };

    dispatch(saveAttempt(attempt));
    dispatch(recordAttemptStats(attempt));
    setLastSavedAttemptId(attempt.id);
    setCurrentExerciseAnsweredCount((count) => count + input.cardIds.length);
    setHasCurrentExerciseResult(true);
    if (input.advance) {
      setGenerationSeed((seed) => seed + 1);
    }
  }

  function completeExerciseSession(exerciseType: ExerciseType) {
    if (!selectedCardSet) {
      return;
    }

    const now = new Date().toISOString();
    const completionMarker: ExerciseAttempt = {
      id: createId('attempt'),
      exerciseSessionId: currentExerciseSessionId,
      exerciseType,
      cardSetId: selectedCardSet.id,
      targetLanguage,
      createdAt: now,
      completedAt: now,
      cardSnapshots: [],
      prompts: [],
      answers: {},
      correctness: {},
      hintsUsed: {},
      isExerciseCompleted: true,
    };
    const counts = countExerciseSessionAnswers([
      ...attempts,
      completionMarker,
    ], currentExerciseSessionId);

    dispatch(saveAttempt(completionMarker));
    setCompletedExerciseSummary({
      completedAt: now,
      correct: counts.correct,
      exerciseType,
      incorrect: counts.incorrect,
    });
    setLastSavedAttemptId(null);
    setResultPromptHold(null);
  }

  function renderMainContent() {
    if (activeSection === 'statistics') {
      return (
        <Stack
          data-test="app__statistics_section"
          spacing={3}
          sx={{
            height: { xs: 'auto', md: 'calc(100vh - 118px)' },
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <TargetStatsPanel />
          <HistoryView />
        </Stack>
      );
    }

    if (activeSection === 'cards') {
      return (
        <Box
          data-test="app__cards_section"
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' },
            alignItems: 'start',
            height: 'calc(100vh - 118px)',
            minHeight: 0,
            overflow: 'hidden',
            '@media (max-width: 899.95px)': {
              height: 'auto',
              overflow: 'visible',
            },
          }}
        >
          <CardSetListView />
          <CardSetDetailView />
        </Box>
      );
    }

    if (activeSection === 'assistant') {
      return (
        <Box data-test="app__assistant_section">
          <AssistantProfileView assistantId={profileAssistantId} />
        </Box>
      );
    }

    if (activeSection === 'agents') {
      return (
        <Box data-test="app__agents_section">
          <ImportCardsView />
        </Box>
      );
    }

    return renderGameContent();
  }

  function renderGameContent() {
    if (!isExerciseStarted) {
      return (
        <Stack data-test="app__game_setup_section" style={{ gap: 12 }}>
          <GameHelpPanel
            hasCoachmarkBeenShown={hasGameHelpCoachmarkBeenShown}
            interfaceLanguage={interfaceLanguage}
            isInitiallyCollapsed={isGameHelpCollapsed}
            onAcknowledge={() => dispatch(acknowledgeGameHelp())}
            onCoachmarkShown={() => dispatch(markGameHelpCoachmarkShown())}
          />
          <GameSetup />
        </Stack>
      );
    }

    const coachProgressMessage = getCoachProgressMessage({
      attempt: lastSavedAttempt,
      attempts,
      interfaceLanguage,
    });
    const currentPromptStats = getCurrentPromptStats();

    return (
      <Stack data-test="app__active_exercise_section" spacing={3}>
        <Stack
          data-test="app__exercise_toolbar"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <CoachPanel
            onAssistantOpen={openAssistantProfile}
            progressMessage={coachProgressMessage}
            thoughtSeed={generationSeed + currentExerciseAnsweredCount}
          />
        </Stack>
        {renderExercise()}
        {currentPromptStats && !completedExerciseSummary && (
          <CurrentPromptStatsPanel
            attempts={attempts}
            exerciseType={currentPromptStats.exerciseType}
            interfaceLanguage={interfaceLanguage}
            prompt={currentPromptStats.prompt}
            targetLanguage={targetLanguage}
          />
        )}
        {lastSavedAttempt && !currentPromptStats && (
          <AttemptSummary
            attempt={lastSavedAttempt}
            cardStats={cardStats}
            interfaceLanguage={interfaceLanguage}
            showExpectedAnswers={
              lastSavedAttempt.exerciseType !== 'missingLetters' &&
              lastSavedAttempt.exerciseType !== 'missingWord' &&
              lastSavedAttempt.exerciseType !== 'multipleChoice' &&
              lastSavedAttempt.exerciseType !== 'crossword'
            }
            targetLanguage={targetLanguage}
          />
        )}
        <FinishExerciseDialog
          hasCrosswordDraftLetters={
            selectedExerciseType === 'crossword' &&
            crosswordDraftState.hasAnyLetters &&
            currentExerciseAnsweredCount === 0
          }
          interfaceLanguage={interfaceLanguage}
          isCrossword={selectedExerciseType === 'crossword'}
          onCancel={handleFinishDialogCancel}
          onConfirm={handleFinishDialogConfirm}
          onForget={handleFinishDialogForget}
          answeredCount={
            selectedExerciseType === 'crossword' &&
            currentExerciseAnsweredCount === 0
              ? crosswordDraftState.filledEntryCount
              : currentExerciseAnsweredCount
          }
          open={isFinishDialogOpen}
        />
      </Stack>
    );
  }

  function getCurrentPromptStats():
    | {
        exerciseType: 'missingLetters' | 'missingWord';
        prompt: ExercisePrompt;
      }
    | null {
    if (!exercisePreview) {
      return null;
    }

    if (exercisePreview.type === 'missingLetters' && exercisePreview.prompt) {
      return {
        exerciseType: 'missingLetters',
        prompt: exercisePreview.prompt,
      };
    }

    if (exercisePreview.type === 'missingWord' && exercisePreview.prompt) {
      return {
        exerciseType: 'missingWord',
        prompt: exercisePreview.prompt,
      };
    }

    return null;
  }

  function GameSetup() {
    const currentCardSetId = selectedGameCardSetId;
    const setupCardSetCards = getCardsForSelectableCardSetId({
      cardById,
      cardSetId: currentCardSetId,
      cards,
      visibleCardSets,
    });
    const setupEligibleCards = getEligibleCardsForTarget(
      setupCardSetCards,
      targetLanguage,
    );
    const setupMissingLettersEligibleCards = setupEligibleCards.filter((card) => {
      const answer = getCardAnswer(card, targetLanguage);
      return Boolean(answer && !isPhraseValue(answer));
    });
    const setupMissingWordEligibleCards = setupEligibleCards.filter((card) => {
      const answer = getCardAnswer(card, targetLanguage);
      return Boolean(answer && isPhraseValue(answer));
    });
    const isCardSetSelected =
      Boolean(currentCardSetId) &&
      (currentCardSetId === ALL_CARDS_CARD_SET_ID ||
        visibleCardSets.some((cardSet) => cardSet.id === currentCardSetId));
    const isMissingLettersUnavailable =
      isCardSetSelected && setupMissingLettersEligibleCards.length === 0;
    const isMissingWordUnavailable =
      isCardSetSelected && setupMissingWordEligibleCards.length === 0;
    const canStart =
      isCardSetSelected &&
      Boolean(selectedExerciseType) &&
      setupEligibleCards.length > 0 &&
      (selectedExerciseType !== 'missingLetters' || !isMissingLettersUnavailable) &&
      (selectedExerciseType !== 'missingWord' || !isMissingWordUnavailable) &&
      (selectedExerciseType !== 'multipleChoice' || setupEligibleCards.length >= 3);
    const setupWarningMessages = [
      !isCardSetSelected
        ? t(interfaceLanguage, 'cannotStartGame')
        : null,
      !selectedExerciseType
        ? t(interfaceLanguage, 'chooseExercise')
        : null,
    ].filter((message): message is string => Boolean(message));

    const handleCardSetChange = (nextCardSetId: string) => {
      setSelectedGameCardSetId(nextCardSetId);
      dispatch(selectCardSet(nextCardSetId));
      resetExerciseState();
    };
    const pickerExerciseType =
      (selectedExerciseType === 'missingLetters' && isMissingLettersUnavailable) ||
      (selectedExerciseType === 'missingWord' && isMissingWordUnavailable)
        ? null
        : selectedExerciseType;
    const selectedExerciseLabel = pickerExerciseType
      ? t(interfaceLanguage, pickerExerciseType)
      : null;

    return (
      <Paper
        data-test="game_setup__panel"
        sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto', width: '100%' }}
      >
        <Stack data-test="game_setup__content" spacing={3}>
          <Stack data-test="game_library__section" style={{ gap: 12 }}>
            <Box data-test="game_library__header" sx={{ minWidth: 0 }}>
              <Typography
                data-test="game_library__title"
                sx={{ color: '#203015', fontSize: 18, fontWeight: 900 }}
              >
                {t(interfaceLanguage, 'gameLibrary')}
              </Typography>
              {selectedExerciseLabel ? (
                <Typography
                  data-test="game_library__selected_name"
                  sx={{ color: 'text.secondary', fontSize: 14, mt: 0.25 }}
                >
                  {selectedExerciseLabel}
                </Typography>
              ) : (
                <Typography
                  data-test="game_library__placeholder"
                  sx={{ color: 'text.secondary', fontSize: 14, mt: 0.25 }}
                >
                  {t(interfaceLanguage, 'chooseExercise')}
                </Typography>
              )}
            </Box>

            <ExercisePicker
              disabledExerciseTypes={{
                missingLetters: isMissingLettersUnavailable,
                missingWord: isMissingWordUnavailable,
              }}
              disabledExerciseTooltips={{
                missingLetters: isMissingLettersUnavailable
                  ? t(interfaceLanguage, 'missingLettersNeedsWords')
                  : undefined,
                missingWord: isMissingWordUnavailable
                  ? t(interfaceLanguage, 'missingWordNeedsPhrases')
                  : undefined,
              }}
              selectedExerciseType={pickerExerciseType}
              onPick={(exerciseType) => {
                setSelectedExerciseType(exerciseType);
                resetExerciseState();
              }}
            />
          </Stack>

          <CardSetLibraryPicker
            cards={cards}
            cardSets={visibleCardSets}
            interfaceLanguage={interfaceLanguage}
            onSelect={handleCardSetChange}
            selectedCardSetId={currentCardSetId}
            targetLanguage={targetLanguage}
          />

          <Stack
            data-test="game_setup__start_row"
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Button
              data-test="game_setup__start_button"
              variant="contained"
              size="large"
              onClick={() => {
                setIsExerciseStarted(true);
                setAnsweredMissingLettersPromptKeys([]);
                setAnsweredMissingWordPromptKeys([]);
                setAnsweredMultipleChoiceCardIds([]);
                setMultipleChoiceJumpCardId(null);
                setCompletedMissingLettersCardIds([]);
                setCompletedMissingWordCardIds([]);
                setCompletedMultipleChoiceCardIds([]);
                setResultPromptHold(null);
                setCompletedExerciseSummary(null);
                setCurrentExerciseAnsweredCount(0);
                setHasCurrentExerciseResult(false);
                setLastSavedAttemptId(null);
                setCurrentExerciseSessionId(createId('exercise-session'));
                setGenerationSeed((seed) => seed + 1);
              }}
              disabled={!canStart}
              sx={{ minWidth: 160 }}
            >
              {t(interfaceLanguage, 'start')}
            </Button>
            {!canStart && setupWarningMessages.length > 0 && (
              <GameWarningTooltip
                anchorDataTest="game_setup__start_warning_anchor"
                arrowDataTest="game_setup__start_warning_tooltip_arrow"
                iconDataTest="game_setup__start_warning_tooltip_icon"
                messages={setupWarningMessages}
              >
                <GameWarningIcon dataTest="game_setup__start_warning_icon" />
              </GameWarningTooltip>
            )}
          </Stack>
        </Stack>
      </Paper>
    );
  }

  function buildMissingLettersJumpSelector(
    currentPrompt: MissingLettersPracticePrompt,
  ): FinishExerciseJumpSelector {
    const jumpPrompts = getUniqueJumpPrompts(
      missingLettersPracticePrompts,
      currentPrompt,
    );
    const answerCounts = countCurrentSessionCardAnswers({
      attempts,
      currentExerciseSessionId,
      exerciseType: 'missingLetters',
    });

    return {
      value: getJumpSelectorValue(currentPrompt, jumpPrompts),
      options: jumpPrompts.map((prompt, index) => ({
        isAnswered: completedMissingLettersCardIds.includes(prompt.cardId),
        label: `${index + 1}. ${getJumpComplementaryLabel(
          prompt,
          complementaryLanguage,
        )}${formatJumpAnswerCount(answerCounts.get(prompt.cardId) ?? 0)}`,
        value: prompt.practiceKey,
      })),
      onChange: (nextPracticeKey) => {
        const nextCardId = getCardIdFromPracticeKey(nextPracticeKey);
        const nextPrompt =
          missingLettersPracticePrompts.find(
            (prompt) => prompt.practiceKey === nextPracticeKey,
          ) ??
          missingLettersPracticePrompts.find(
            (prompt) => prompt.cardId === nextCardId,
          );
        if (!nextPrompt) {
          return;
        }

        setResultPromptHold({
          exerciseType: 'missingLetters',
          prompt: nextPrompt,
        });
        setLastSavedAttemptId(null);
      },
    };
  }

  function buildMissingWordJumpSelector(
    currentPrompt: MissingWordPracticePrompt,
  ): FinishExerciseJumpSelector {
    const jumpPrompts = getUniqueJumpPrompts(
      missingWordPracticePrompts,
      currentPrompt,
    );
    const answerCounts = countCurrentSessionCardAnswers({
      attempts,
      currentExerciseSessionId,
      exerciseType: 'missingWord',
    });

    return {
      value: getJumpSelectorValue(currentPrompt, jumpPrompts),
      options: jumpPrompts.map((prompt, index) => ({
        isAnswered: completedMissingWordCardIds.includes(prompt.cardId),
        label: `${index + 1}. ${getJumpComplementaryLabel(
          prompt,
          complementaryLanguage,
        )}${formatJumpAnswerCount(answerCounts.get(prompt.cardId) ?? 0)}`,
        value: prompt.practiceKey,
      })),
      onChange: (nextPracticeKey) => {
        const nextCardId = getCardIdFromPracticeKey(nextPracticeKey);
        const nextPrompt =
          missingWordPracticePrompts.find(
            (prompt) => prompt.practiceKey === nextPracticeKey,
          ) ??
          missingWordPracticePrompts.find(
            (prompt) => prompt.cardId === nextCardId,
          );
        if (!nextPrompt) {
          return;
        }

        setResultPromptHold({
          exerciseType: 'missingWord',
          prompt: nextPrompt,
        });
        setLastSavedAttemptId(null);
      },
    };
  }

  function buildMultipleChoiceJumpSelector(
    currentPrompt: ExercisePrompt & { options: string[] },
  ): FinishExerciseJumpSelector {
    const answerCounts = countCurrentSessionCardAnswers({
      attempts,
      currentExerciseSessionId,
      exerciseType: 'multipleChoice',
    });

    return {
      value: currentPrompt.cardId,
      options: randomizedEligibleCards.map((card, index) => ({
        isAnswered: completedMultipleChoiceCardIds.includes(card.id),
        label: `${index + 1}. ${getCardJumpComplementaryLabel(
          card,
          complementaryLanguage,
          targetLanguage,
        )}${formatJumpAnswerCount(answerCounts.get(card.id) ?? 0)}`,
        value: card.id,
      })),
      onChange: (nextCardId) => {
        if (!randomizedEligibleCards.some((card) => card.id === nextCardId)) {
          return;
        }

        setMultipleChoiceJumpCardId(nextCardId);
        setLastSavedAttemptId(null);
      },
    };
  }

  function renderFinishExerciseAction(
    jumpSelector?: FinishExerciseJumpSelector,
    options?: { showHypersonicJumpGuide?: boolean },
  ) {
    return (
      <FinishExerciseAction
        interfaceLanguage={interfaceLanguage}
        jumpSelector={jumpSelector}
        onClick={() => openFinishDialog('finish')}
        showHypersonicJumpGuide={options?.showHypersonicJumpGuide}
      />
    );
  }

  function renderExercise() {
    if (completedExerciseSummary) {
      return (
        <ExerciseCompletePanel
          completedAt={completedExerciseSummary.completedAt}
          correct={completedExerciseSummary.correct}
          incorrect={completedExerciseSummary.incorrect}
          interfaceLanguage={interfaceLanguage}
          onFinish={resetExerciseState}
        />
      );
    }

    if (!selectedCardSet) {
      return (
        <Alert data-test="exercise_area__missing_card_set_alert" severity="info">
          {t(interfaceLanguage, 'chooseCardSet')}
        </Alert>
      );
    }

    if (eligibleCards.length === 0) {
      return (
        <Alert data-test="exercise_area__no_target_cards_alert" severity="warning">
          {t(interfaceLanguage, 'cannotStartGame')}
        </Alert>
      );
    }

    if (selectedExerciseType === 'multipleChoice' && eligibleCards.length < 3) {
      return (
        <Alert data-test="exercise_area__multiple_choice_needs_cards_alert" severity="info">
          Multiple choice needs at least 3 cards for the target language.
        </Alert>
      );
    }

    if (!exercisePreview) {
      return null;
    }

    if (exercisePreview.type === 'crossword') {
      return (
        <CrosswordExercise
          interfaceLanguage={interfaceLanguage}
          onDraftChange={setCrosswordDraftState}
          onCardSetOpen={() => {
            dispatch(selectCardSet(selectedCardSet.id));
            setActiveSection('cards');
          }}
          puzzle={exercisePreview.puzzle}
          recentResultsByCardId={getRecentResultsByCardId({
            attempts,
            cardIds: exercisePreview.puzzle.entries.map((entry) => entry.cardId),
            targetLanguage,
          })}
          cardSetName={selectedCardSet.name}
          finishAction={renderFinishExerciseAction(undefined, {
            showHypersonicJumpGuide: false,
          })}
          onFinish={resetExerciseState}
          onSubmit={(answers, crosswordSnapshot) =>
            saveCrosswordAttempt(
              exercisePreview.puzzle,
              answers,
              crosswordSnapshot,
            )
          }
        />
      );
    }

    if (exercisePreview.type === 'multipleChoice') {
      return (
        <MultipleChoiceExercise
          key={`${exercisePreview.prompt.cardId}:${generationSeed}`}
          complementaryLanguage={complementaryLanguage}
          interfaceLanguage={interfaceLanguage}
          progressCompletedCount={completedMultipleChoiceCardIds.length}
          progressTotalCount={eligibleCards.length}
          prompt={exercisePreview.prompt}
          cardSetName={selectedCardSet.name}
          finishAction={renderFinishExerciseAction(
            buildMultipleChoiceJumpSelector(exercisePreview.prompt),
          )}
          onAnswer={(answer) =>
            savePromptAttempt('multipleChoice', exercisePreview.prompt, answer, {
              advance: false,
            })
          }
          onNext={() => {
            const nextCompletedCardIds = uniqueValues([
              ...completedMultipleChoiceCardIds,
              exercisePreview.prompt.cardId,
            ]);
            if (nextCompletedCardIds.length >= eligibleCards.length) {
              setCompletedMultipleChoiceCardIds(nextCompletedCardIds);
              completeExerciseSession('multipleChoice');
              return;
            }

            setCompletedMultipleChoiceCardIds(nextCompletedCardIds);
            setResultPromptHold(null);
            setMultipleChoiceJumpCardId(null);
            setAnsweredMultipleChoiceCardIds((cardIds) => [
              ...cardIds.filter(
                (cardId) => cardId !== exercisePreview.prompt.cardId,
              ),
              exercisePreview.prompt.cardId,
            ]);
            setLastSavedAttemptId(null);
            setGenerationSeed((seed) => seed + 1);
          }}
        />
      );
    }

    if (exercisePreview.type === 'missingLetters') {
      if (!exercisePreview.prompt) {
        return (
          <Alert data-test="exercise_area__missing_letters_needs_words_alert" severity="info">
            {t(interfaceLanguage, 'missingLettersNeedsWords')}
          </Alert>
        );
      }

      const missingLettersPrompt = exercisePreview.prompt;
      return (
        <MissingLettersExercise
          key={missingLettersPrompt.practiceKey}
          complementaryLanguage={complementaryLanguage}
          interfaceLanguage={interfaceLanguage}
          isRepeatedPrompt={completedMissingLettersCardIds.includes(
            missingLettersPrompt.cardId,
          )}
          repeatProgress={getRepeatProgress(
            missingLettersPrompt,
            missingLettersPracticePrompts,
          )}
          progressCompletedCount={completedMissingLettersCardIds.length}
          progressTotalCount={missingLettersPracticeCardIds.length}
          prompt={missingLettersPrompt}
          cardSetName={selectedCardSet.name}
          finishAction={renderFinishExerciseAction(
            buildMissingLettersJumpSelector(missingLettersPrompt),
          )}
          onAnswer={(answer) =>
            savePromptAttempt('missingLetters', missingLettersPrompt, answer, {
              advance: false,
            })
          }
          onMemorizeResult={() => setHasCurrentExerciseResult(true)}
          onNext={() => {
            const nextCompletedCardIds = uniqueValues([
              ...completedMissingLettersCardIds,
              missingLettersPrompt.cardId,
            ]);
            if (
              nextCompletedCardIds.length >= missingLettersPracticeCardIds.length
            ) {
              setCompletedMissingLettersCardIds(nextCompletedCardIds);
              completeExerciseSession('missingLetters');
              return;
            }

            setCompletedMissingLettersCardIds(nextCompletedCardIds);
            setResultPromptHold(null);
            setAnsweredMissingLettersPromptKeys((promptKeys) => [
              ...promptKeys.filter(
                (promptKey) => promptKey !== missingLettersPrompt.practiceKey,
              ),
              missingLettersPrompt.practiceKey,
            ]);
            setLastSavedAttemptId(null);
            setGenerationSeed((seed) => seed + 1);
          }}
        />
      );
    }

    if (!exercisePreview.prompt) {
      return (
        <Alert data-test="exercise_area__no_more_cards_alert" severity="info">
          {t(interfaceLanguage, 'noMoreCardsInExercise')}
        </Alert>
      );
    }

    const missingWordPrompt = exercisePreview.prompt;
    return (
      <MissingWordExercise
        key={missingWordPrompt.practiceKey}
        complementaryLanguage={complementaryLanguage}
        finishAction={renderFinishExerciseAction(
          buildMissingWordJumpSelector(missingWordPrompt),
        )}
        isRepeatedPrompt={completedMissingWordCardIds.includes(
          missingWordPrompt.cardId,
        )}
        repeatProgress={getRepeatProgress(
          missingWordPrompt,
          missingWordPracticePrompts,
        )}
        prompt={missingWordPrompt}
        progressCompletedCount={completedMissingWordCardIds.length}
        progressTotalCount={missingWordPracticeCardIds.length}
        cardSetName={selectedCardSet.name}
        onAnswer={(answer) =>
          savePromptAttempt('missingWord', missingWordPrompt, answer, {
            advance: false,
          })
        }
        onMemorizeResult={() => setHasCurrentExerciseResult(true)}
        onNext={() => {
          const nextCompletedCardIds = uniqueValues([
            ...completedMissingWordCardIds,
            missingWordPrompt.cardId,
          ]);
          if (nextCompletedCardIds.length >= missingWordPracticeCardIds.length) {
            setCompletedMissingWordCardIds(nextCompletedCardIds);
            completeExerciseSession('missingWord');
            return;
          }

          setCompletedMissingWordCardIds(nextCompletedCardIds);
          setResultPromptHold(null);
          setAnsweredMissingWordPromptKeys((promptKeys) => [
            ...promptKeys.filter(
              (promptKey) => promptKey !== missingWordPrompt.practiceKey,
            ),
            missingWordPrompt.practiceKey,
          ]);
          setLastSavedAttemptId(null);
          setGenerationSeed((seed) => seed + 1);
        }}
      />
    );
  }

  function TargetStatsPanel() {
    const targetAttempts = attempts.filter(
      (attempt) => attempt.targetLanguage === targetLanguage,
    );
    const targetSummaries = summarizeExerciseHistory(targetAttempts);
    const totalAnswered = targetAttempts.reduce(
      (sum, attempt) => sum + Object.keys(attempt.correctness).length,
      0,
    );
    const correct = targetAttempts.reduce(
      (sum, attempt) =>
        sum + Object.values(attempt.correctness).filter(Boolean).length,
      0,
    );
    const incorrect = totalAnswered - correct;

    return (
      <Paper
        data-test="target_stats__panel"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.72)',
          border: '1px solid rgba(32, 48, 21, 0.14)',
          borderRadius: 2,
          boxShadow: '0 12px 28px rgba(32, 48, 21, 0.08)',
          p: 2,
        }}
      >
        <Stack data-test="target_stats__content" spacing={1.5}>
          <Typography data-test="target_stats__language" variant="overline">
            {languageFlags[targetLanguage]}{' '}
            {getLanguageDisplayName(interfaceLanguage, targetLanguage)}
          </Typography>
          <Typography
            data-test="target_stats__title"
            variant="h6"
            component="h2"
          >
            {t(interfaceLanguage, 'resultsTitle')}
          </Typography>
          <Box
            data-test="target_stats__metrics"
            sx={{
              alignItems: 'start',
              columnGap: 3,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              rowGap: 2,
            }}
          >
            <Stack
              data-test="target_stats__total_exercises__root"
              spacing={1}
              sx={{ alignItems: 'center', minWidth: 0 }}
            >
              <Typography
                component="span"
                data-test="target_stats__total_exercises__label"
                sx={targetStatsMetricLabelStyles}
              >
                {t(interfaceLanguage, 'totalExercises')}
              </Typography>
              <Box
                data-test="target_stats__total_exercises__value_group"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <MetricChip
                  ariaLabel={`${t(interfaceLanguage, 'totalExercises')} ${targetSummaries.length}`}
                  dataTest="target_stats__total_exercises__value_chip"
                  label={targetSummaries.length}
                  suffix={t(interfaceLanguage, 'metricCompletedSuffix')}
                  tone="total"
                  tooltip={t(interfaceLanguage, 'totalExercisesTooltip')}
                />
              </Box>
            </Stack>
            <Stack
              data-test="target_stats__answered_formula__root"
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                width: '100%',
              }}
            >
              <Stack
                data-test="target_stats__answered_formula__body"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '100%',
                  textAlign: 'center',
                  width: 'fit-content',
                }}
              >
                <Typography
                  component="span"
                  data-test="target_stats__answered_formula__label"
                  sx={targetStatsMetricLabelStyles}
                >
                  {interfaceLanguage === 'ru' ? (
                    <>
                      <Box
                        component="span"
                        data-test="target_stats__answered_formula__label_line__0"
                        sx={{ display: 'inline' }}
                      >
                        Всего отвечено
                      </Box>{' '}
                      <Box
                        component="span"
                        data-test="target_stats__answered_formula__label_line__1"
                        sx={{ display: 'inline' }}
                      >
                        карточек
                      </Box>
                    </>
                  ) : (
                    t(interfaceLanguage, 'targetAnsweredCards')
                  )}
                </Typography>
                <StatsFormula
                  correct={correct}
                  correctTooltip={t(interfaceLanguage, 'targetCorrectCardsTooltip')}
                  dataTestPrefix="target_stats__answered_formula"
                  incorrect={incorrect}
                  incorrectTooltip={t(interfaceLanguage, 'targetIncorrectCardsTooltip')}
                  interfaceLanguage={interfaceLanguage}
                  rootDataTest="target_stats__answered_formula__stats_root"
                  showLabel={false}
                  total={totalAnswered}
                  totalLabel={t(interfaceLanguage, 'targetAnsweredCards')}
                  totalTooltip={t(interfaceLanguage, 'targetAnsweredCardsTooltip')}
                  valueGroupJustify="center"
                />
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      onLogoClick={handleLogoClick}
      onNavigate={handleNavigate}
    >
      {renderMainContent()}
    </AppShell>
  );
}

function CurrentPromptStatsPanel({
  attempts,
  exerciseType,
  interfaceLanguage,
  prompt,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  exerciseType: 'missingLetters' | 'missingWord';
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  prompt: ExercisePrompt;
  targetLanguage: RootState['app']['targetLanguage'];
}) {
  const statsLabel = t(
    interfaceLanguage,
    exerciseType === 'missingWord' ? 'phraseStats' : 'wordStats',
  );
  const stats = getPromptHistoryCounts({
    attempts,
    cardId: prompt.cardId,
    targetLanguage,
  });

  return (
    <Paper
      data-test={`current_prompt_stats__panel__${prompt.cardId}`}
      sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}
    >
      <Stack data-test={`current_prompt_stats__content__${prompt.cardId}`} spacing={1}>
        <Typography
          data-test={`current_prompt_stats__label__${prompt.cardId}`}
          variant="overline"
        >
          {statsLabel}
        </Typography>
        <SplitWordStatsChip
          correct={stats.correct}
          dataTestPrefix={`current_prompt_stats__split_stats__${prompt.cardId}`}
          incorrect={stats.incorrect}
          interfaceLanguage={interfaceLanguage}
          statsLabel={statsLabel}
        />
      </Stack>
    </Paper>
  );
}

function FinishExerciseAction({
  interfaceLanguage,
  jumpSelector,
  onClick,
  showHypersonicJumpGuide = true,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  jumpSelector?: FinishExerciseJumpSelector;
  onClick: () => void;
  showHypersonicJumpGuide?: boolean;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const hasFinishExerciseLampBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasFinishExerciseLampBeenShown),
  );
  const hasHypersonicJumpLampBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasHypersonicJumpLampBeenShown),
  );

  useEffect(() => {
    if (!jumpSelector || jumpSelector.options.length < 2) {
      return undefined;
    }

    const handleJumpHotkey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }

      const currentIndex = jumpSelector.options.findIndex(
        (option) => option.value === jumpSelector.value,
      );
      if (currentIndex < 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + jumpSelector.options.length) %
        jumpSelector.options.length;
      const nextOption = jumpSelector.options[nextIndex];
      if (nextOption) {
        jumpSelector.onChange(nextOption.value);
      }
    };

    window.addEventListener('keydown', handleJumpHotkey);
    return () => window.removeEventListener('keydown', handleJumpHotkey);
  }, [jumpSelector]);

  return (
    <Box
      data-test="exercise_finish_action__root"
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.25,
        gridTemplateColumns: {
          xs: '1fr',
          md: showHypersonicJumpGuide ? 'minmax(260px, 1fr) auto' : 'auto',
        },
        justifyItems: { xs: 'stretch', md: 'end' },
        maxWidth: { xs: '100%', md: showHypersonicJumpGuide ? 560 : 'max-content' },
        ml: { sm: 'auto' },
        width: { xs: '100%', md: showHypersonicJumpGuide ? 'min(560px, 100%)' : 'auto' },
      }}
    >
      {showHypersonicJumpGuide && (
        <Box
          data-test="exercise_finish_action__thought_cluster"
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 2.5,
            justifySelf: 'stretch',
            maxWidth: 470,
            width: '100%',
          }}
        >
          {jumpSelector && (
            <HotkeyShortcutTooltip interfaceLanguage={interfaceLanguage} />
          )}
          <Box
            data-test="exercise_finish_action__thought_bubble"
            sx={{
              alignItems: 'flex-start',
              bgcolor: 'rgba(250, 246, 255, 0.96)',
              border: '1px solid rgba(113, 82, 188, 0.24)',
              borderRadius: '18px 18px 6px 18px',
              boxShadow: '0 12px 28px rgba(73, 48, 124, 0.10)',
              color: '#4b3a70',
              display: 'grid',
              flex: '1 1 auto',
              gap: 1,
              gridTemplateColumns: 'auto minmax(0, 1fr)',
              justifySelf: 'stretch',
              maxWidth: 390,
              minWidth: 0,
              p: 1.25,
              position: 'relative',
              '&::before': {
                bgcolor: 'rgba(250, 246, 255, 0.96)',
                border: '1px solid rgba(113, 82, 188, 0.22)',
                borderRadius: '999px',
                bottom: -8,
                content: '""',
                height: 12,
                position: 'absolute',
                right: 36,
                width: 12,
              },
              '&::after': {
                bgcolor: 'rgba(250, 246, 255, 0.96)',
                border: '1px solid rgba(113, 82, 188, 0.20)',
                borderRadius: '999px',
                bottom: -16,
                content: '""',
                height: 7,
                position: 'absolute',
                right: 24,
                width: 7,
              },
            }}
          >
          <CursorAnchoredTooltip
            anchorOrigin="triggerTopLeft"
            arrowDataTest="exercise_finish_action__thought_icon_tooltip_arrow"
            closeOnOtherOpen
            hideArrow
            title={
              <TooltipContent sx={jumpInfoTooltipContentStyles}>
                {t(interfaceLanguage, 'finishExerciseHypersonicJumpTooltip')}
              </TooltipContent>
            }
            tooltipSx={jumpInfoTooltipStyles}
          >
            <Box
              aria-label={t(interfaceLanguage, 'finishExerciseHypersonicJumpTooltip')}
              data-test="exercise_finish_action__thought_icon_anchor"
              onMouseEnter={() => {
                if (!hasHypersonicJumpLampBeenShown) {
                  dispatch(markHypersonicJumpLampShown());
                }
              }}
              role="img"
              sx={{
                alignItems: 'center',
                animation: hasHypersonicJumpLampBeenShown
                  ? 'none'
                  : lampPulseAnimation,
                background:
                  'radial-gradient(circle at 45% 35%, #fff7b8 0%, #ffe27a 44%, #b99cff 100%)',
                border: '1px solid rgba(123, 95, 196, 0.32)',
                borderRadius: '999px',
                boxShadow:
                  '0 0 0 3px rgba(255, 226, 122, 0.22), 0 10px 22px rgba(123, 95, 196, 0.20)',
                color: '#7b5fc4',
                display: 'inline-flex',
                height: 34,
                justifyContent: 'center',
                mt: 0.1,
                position: 'relative',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                width: 34,
                '&:hover': {
                  animation: 'none',
                  boxShadow:
                    '0 0 0 4px rgba(255, 226, 122, 0.32), 0 12px 26px rgba(123, 95, 196, 0.26)',
                  transform: 'translateY(-1px) scale(1.04)',
                },
                '@keyframes hypersonicJumpLampPulse': {
                  '0%, 100%': {
                    boxShadow:
                      '0 0 0 3px rgba(255, 226, 122, 0.22), 0 10px 22px rgba(123, 95, 196, 0.20)',
                    filter: 'brightness(1)',
                  },
                  '50%': {
                    boxShadow:
                      '0 0 0 5px rgba(255, 226, 122, 0.34), 0 14px 30px rgba(123, 95, 196, 0.28)',
                    filter: 'brightness(1.12)',
                  },
                },
              }}
            >
              <TipsAndUpdatesOutlinedIcon
                data-test="exercise_finish_action__thought_icon"
                sx={{ fontSize: 24 }}
              />
            </Box>
          </CursorAnchoredTooltip>
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Stack
              data-test="exercise_finish_action__note_row"
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', minWidth: 0 }}
            >
              <Typography
                data-test="exercise_finish_action__note"
                sx={{
                  color: '#4b3a70',
                  fontFamily:
                    '"Trebuchet MS", "Verdana", "Arial", sans-serif',
                  fontSize: 13.5,
                  fontStyle: 'italic',
                  fontWeight: 800,
                  letterSpacing: 0,
                  lineHeight: 1.25,
                  textAlign: 'left',
                }}
              >
                {t(interfaceLanguage, 'finishExerciseAnytimeBenefit')}
              </Typography>
            </Stack>
            {jumpSelector && (
              <Stack
                data-test="exercise_finish_action__jump_row"
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', minWidth: 0 }}
              >
                <FormControl
                  data-test="exercise_finish_action__jump_control"
                  size="small"
                  sx={{ flex: '1 1 170px', minWidth: 150 }}
                >
                  <InputLabel id="exercise-finish-jump-select-label">
                    {t(interfaceLanguage, 'exerciseJumps')}
                  </InputLabel>
                  <Select
                    data-test="exercise_finish_action__jump_select"
                    labelId="exercise-finish-jump-select-label"
                    label={t(interfaceLanguage, 'exerciseJumps')}
                    value={jumpSelector.value}
                    onChange={(event: SelectChangeEvent<string>) =>
                      jumpSelector.onChange(event.target.value)
                    }
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.72)',
                      borderRadius: 1,
                      '& .MuiSelect-select': {
                        fontSize: 13,
                        fontWeight: 800,
                        py: 0.75,
                      },
                    }}
                  >
                    {jumpSelector.options.map((option, index) => {
                      const zebraColor =
                        index % 2 === 0 ? '#ffffff' : '#faf6ff';

                      return (
                        <MenuItem
                          data-test={`exercise_finish_action__jump_option__${option.value}`}
                          key={option.value}
                          value={option.value}
                          sx={{
                            alignItems: 'flex-start',
                            bgcolor: zebraColor,
                            fontSize: 14,
                            fontWeight: 800,
                            lineHeight: 1.25,
                            minHeight: 42,
                            opacity: option.isAnswered ? 0.52 : 1,
                            whiteSpace: 'normal',
                            '&.Mui-selected': {
                              bgcolor: zebraColor,
                            },
                            '&.Mui-selected:hover, &:hover': {
                              bgcolor:
                                index % 2 === 0 ? '#f5f7ef' : '#f1eafe',
                            },
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <JumpInfoTooltip interfaceLanguage={interfaceLanguage} />
              </Stack>
            )}
          </Stack>
          </Box>
        </Box>
      )}
      <Box
        data-test="exercise_finish_action__finish_button_slot"
        sx={{
          alignSelf: 'center',
          display: 'inline-flex',
          flexShrink: 0,
          justifySelf: { xs: 'start', md: 'end' },
          position: 'relative',
        }}
      >
        <CursorAnchoredTooltip
          anchorOrigin="triggerTopLeft"
          arrowDataTest="exercise_finish_action__finish_button_tip_tooltip_arrow"
          closeOnOtherOpen
          hideArrow
          title={
            <TooltipContent sx={jumpInfoTooltipContentStyles}>
              {t(interfaceLanguage, 'finishExerciseAnytimeTooltip')}
            </TooltipContent>
          }
          tooltipSx={jumpInfoTooltipStyles}
        >
          <IconButton
            aria-label={t(interfaceLanguage, 'finishExerciseAnytimeTooltip')}
            data-test="exercise_finish_action__finish_button_tip_anchor"
            onMouseEnter={() => {
              if (!hasFinishExerciseLampBeenShown) {
                dispatch(markFinishExerciseLampShown());
              }
            }}
            size="small"
            sx={{
              animation: hasFinishExerciseLampBeenShown ? 'none' : lampPulseAnimation,
              background:
                'radial-gradient(circle at 45% 35%, #fff7b8 0%, #ffe27a 44%, #b99cff 100%)',
              border: '1px solid rgba(123, 95, 196, 0.32)',
              borderRadius: '999px',
              boxShadow:
                '0 0 0 3px rgba(255, 226, 122, 0.22), 0 10px 22px rgba(123, 95, 196, 0.20)',
              color: '#7b5fc4',
              left: '50%',
              position: 'absolute',
              top: -40,
              transform: 'translateX(-50%)',
              zIndex: 1,
              '&:hover': {
                animation: 'none',
                boxShadow:
                  '0 0 0 4px rgba(255, 226, 122, 0.32), 0 12px 26px rgba(123, 95, 196, 0.26)',
              },
            }}
          >
            <TipsAndUpdatesOutlinedIcon
              data-test="exercise_finish_action__finish_button_tip_icon"
              fontSize="small"
            />
          </IconButton>
        </CursorAnchoredTooltip>
        <Button
          data-test="app__finish_exercise_button"
          variant="outlined"
          color="error"
          onClick={onClick}
        >
          {t(interfaceLanguage, 'finishExercise')}
        </Button>
      </Box>
    </Box>
  );
}

function HotkeyShortcutTooltip({
  interfaceLanguage,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
}) {
  return (
    <CursorAnchoredTooltip
      anchorOrigin="triggerTopLeft"
      arrowDataTest="exercise_finish_action__hotkeys_tooltip_arrow"
      closeOnOtherOpen
      hideArrow
      title={
        <TooltipContent sx={jumpInfoTooltipContentStyles}>
          {t(interfaceLanguage, 'exerciseJumpHotkeysTooltip')}
        </TooltipContent>
      }
      tooltipSx={jumpInfoTooltipStyles}
    >
      <Box
        aria-label={t(interfaceLanguage, 'exerciseJumpHotkeysTooltip')}
        data-test="exercise_finish_action__hotkeys_anchor"
        role="img"
        sx={{
          alignItems: 'center',
          display: 'inline-flex',
          flex: '0 0 auto',
          justifyContent: 'center',
          perspective: '140px',
          position: 'relative',
          width: { xs: 46, sm: 52 },
        }}
      >
        <Box
          data-test="exercise_finish_action__hotkeys_key"
          sx={{
            alignItems: 'center',
            background:
              'linear-gradient(145deg, #ffffff 0%, #f7f3ff 38%, #d8ccff 72%, #b8a6f5 100%)',
            border: '1px solid rgba(105, 78, 190, 0.34)',
            borderRadius: '14px',
            boxShadow:
              'inset 0 2px 0 rgba(255,255,255,0.96), inset 4px 0 0 rgba(255,255,255,0.32), inset -3px 0 0 rgba(84, 59, 166, 0.10), inset 0 -6px 0 rgba(84, 59, 166, 0.20), 0 8px 14px rgba(73, 48, 124, 0.16)',
            color: '#5d41b2',
            display: 'inline-flex',
            height: { xs: 40, sm: 44 },
            justifyContent: 'center',
            position: 'relative',
            transform: 'rotateX(10deg) rotateY(-8deg)',
            transformStyle: 'preserve-3d',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            width: { xs: 42, sm: 46 },
            '&::before': {
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.82), rgba(255,255,255,0.18))',
              borderRadius: '10px 10px 7px 7px',
              content: '""',
              height: '34%',
              left: 5,
              position: 'absolute',
              right: 5,
              top: 4,
            },
            '&::after': {
              background:
                'linear-gradient(180deg, rgba(143, 119, 222, 0.34), rgba(84, 59, 166, 0.18))',
              borderRadius: '0 0 12px 12px',
              bottom: -2,
              content: '""',
              height: 4,
              left: 5,
              position: 'absolute',
              right: 5,
              transform: 'translateZ(-8px)',
              zIndex: -1,
            },
            '&:hover': {
              boxShadow:
                'inset 0 2px 0 rgba(255,255,255,0.98), inset 4px 0 0 rgba(255,255,255,0.36), inset -3px 0 0 rgba(84, 59, 166, 0.12), inset 0 -6px 0 rgba(84, 59, 166, 0.22), 0 10px 18px rgba(73, 48, 124, 0.20)',
              transform: 'rotateX(7deg) rotateY(-5deg) translateY(-1px)',
            },
          }}
        >
          <Box
            component="span"
            data-test="exercise_finish_action__hotkeys_key_symbol"
            sx={{
              fontFamily: '"Trebuchet MS", "Verdana", "Arial", sans-serif',
              fontSize: { xs: 25, sm: 28 },
              fontWeight: 950,
              lineHeight: 1,
              position: 'relative',
              textShadow: '0 1px 0 rgba(255,255,255,0.82)',
              zIndex: 1,
            }}
          >
            ⌘
          </Box>
        </Box>
      </Box>
    </CursorAnchoredTooltip>
  );
}

function JumpInfoTooltip({
  interfaceLanguage,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest="exercise_finish_action__jump_info_tooltip_arrow"
      closeOnOtherOpen
      title={
        <TooltipContent sx={jumpInfoTooltipContentStyles}>
          {t(interfaceLanguage, 'exerciseJumpsTooltip')}
        </TooltipContent>
      }
      tooltipSx={jumpInfoTooltipStyles}
    >
      <IconButton
        aria-label={t(interfaceLanguage, 'exerciseJumpsTooltip')}
        data-test="exercise_finish_action__jump_info_anchor"
        size="small"
        sx={{
          bgcolor: 'rgba(123, 95, 196, 0.10)',
          border: '1px solid rgba(123, 95, 196, 0.28)',
          color: '#6e56b5',
          // Keep this info icon in the DOM for future jump guidance; do not delete it.
          display: 'none',
          flex: '0 0 auto',
          '&:hover': {
            bgcolor: 'rgba(123, 95, 196, 0.16)',
          },
        }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </CursorAnchoredTooltip>
  );
}

const lampPulseAnimation = 'hypersonicJumpLampPulse 1100ms ease-in-out infinite';

const jumpInfoTooltipStyles = {
  background:
    'linear-gradient(135deg, #fffaf0 0%, #fff7c7 48%, #f4edff 100%)',
  border: '1px solid rgba(123, 95, 196, 0.24)',
  borderRadius: '24px 24px 24px 10px',
  boxShadow:
    '0 14px 30px rgba(73, 48, 124, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.58)',
  color: '#4b3a70',
  maxWidth: 340,
  overflow: 'visible',
  position: 'relative',
  px: 1.75,
  py: 1.35,
  '&::before': {
    bgcolor: '#ffe27a',
    border: '1px solid rgba(123, 95, 196, 0.18)',
    borderRadius: '999px',
    bottom: -8,
    boxShadow: '0 5px 12px rgba(73, 48, 124, 0.10)',
    content: '""',
    height: 9,
    left: 'calc(50% - 16px)',
    position: 'absolute',
    width: 9,
  },
  '&::after': {
    bgcolor: '#b99cff',
    border: '1px solid rgba(123, 95, 196, 0.14)',
    borderRadius: '999px',
    bottom: -15,
    boxShadow: '0 4px 10px rgba(73, 48, 124, 0.08)',
    content: '""',
    height: 6,
    left: 'calc(50% - 3px)',
    position: 'absolute',
    width: 6,
  },
};

const jumpInfoTooltipContentStyles = {
  bgcolor: 'transparent',
  color: '#4b3a70',
  fontFamily: '"Trebuchet MS", "Verdana", "Arial", sans-serif',
  fontSize: 13.5,
  fontWeight: 600,
  lineHeight: 1.38,
};

function ExerciseCompletePanel({
  completedAt,
  correct,
  incorrect,
  interfaceLanguage,
  onFinish,
}: {
  completedAt: string;
  correct: number;
  incorrect: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onFinish: () => void;
}) {
  const finishButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    finishButtonRef.current?.focus();
  }, []);

  return (
    <Paper
      data-test="exercise_complete__panel"
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.12)',
        borderRadius: 1,
        boxShadow: '0 8px 22px rgba(32, 48, 21, 0.12)',
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack
        data-test="exercise_complete__content"
        spacing={2}
        sx={{ alignItems: 'flex-start' }}
      >
        <Stack
          data-test="exercise_complete__header"
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center' }}
        >
          <EmojiEventsOutlinedIcon
            data-test="exercise_complete__trophy"
            sx={{ color: '#9f7a21', fontSize: 58 }}
          />
          <Box>
            <Typography
              data-test="exercise_complete__title"
              variant="h5"
              sx={{ fontWeight: 900 }}
            >
              {t(interfaceLanguage, 'exerciseCompleted')}
            </Typography>
            <Typography
              data-test="exercise_complete__completed_at"
              sx={{ color: 'rgba(32, 48, 21, 0.68)', fontSize: 13 }}
            >
              {formatAttemptDate(completedAt)}
            </Typography>
          </Box>
        </Stack>
        <SplitWordStatsChip
          correct={correct}
          dataTestPrefix="exercise_complete__split_stats"
          incorrect={incorrect}
          interfaceLanguage={interfaceLanguage}
          statsLabel={t(interfaceLanguage, 'resultsTitle')}
        />
        <Button
          data-test="exercise_complete__finish_button"
          ref={finishButtonRef}
          variant="contained"
          onClick={onFinish}
          sx={{ minWidth: 150 }}
        >
          {t(interfaceLanguage, 'exit')}
        </Button>
      </Stack>
    </Paper>
  );
}

function getPromptHistoryCounts({
  attempts,
  cardId,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  cardId: string;
  targetLanguage: RootState['app']['targetLanguage'];
}) {
  return attempts.reduce(
    (counts, attempt) => {
      if (
        attempt.targetLanguage !== targetLanguage ||
        !Object.prototype.hasOwnProperty.call(attempt.correctness, cardId)
      ) {
        return counts;
      }

      if (attempt.correctness[cardId]) {
        counts.correct += 1;
      } else {
        counts.incorrect += 1;
      }

      return counts;
    },
    { correct: 0, incorrect: 0 },
  );
}

function AttemptSummary({
  attempt,
  cardStats,
  interfaceLanguage,
  showExpectedAnswers,
  targetLanguage,
}: {
  attempt: ExerciseAttempt;
  cardStats: RootState['stats']['cardStats'];
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  showExpectedAnswers: boolean;
  targetLanguage: RootState['app']['targetLanguage'];
}) {
  const expectedAnswers = attempt.prompts.map((prompt) => prompt.expectedAnswer);
  const relevantStats = attempt.cardSnapshots
    .map((card) =>
      cardStats.find(
        (stat) =>
          stat.cardId === card.id && stat.targetLanguage === targetLanguage,
      ),
    )
    .filter((stat): stat is RootState['stats']['cardStats'][number] =>
      Boolean(stat),
    );
  const correctCount = relevantStats.reduce(
    (sum, stat) => sum + stat.correct,
    0,
  );
  const incorrectCount = relevantStats.reduce(
    (sum, stat) => sum + stat.incorrect,
    0,
  );
  const isAttemptCorrect = Object.values(attempt.correctness).every(Boolean);
  const attemptCorrectCount = Object.values(attempt.correctness).filter(Boolean)
    .length;
  const attemptTotalCount = Object.keys(attempt.correctness).length;
  const attemptIncorrectCount = attemptTotalCount - attemptCorrectCount;
  const usesSplitStats =
    attempt.exerciseType === 'missingLetters' ||
    attempt.exerciseType === 'missingWord' ||
    attempt.exerciseType === 'multipleChoice';
  const statsLabel =
    attempt.exerciseType === 'missingWord'
      ? t(interfaceLanguage, 'phraseStats')
      : usesSplitStats
        ? t(interfaceLanguage, 'wordStats')
        : t(interfaceLanguage, 'resultStats');

  return (
    <Paper
      data-test={`attempt_summary__panel__${attempt.id}`}
      sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}
    >
      <Stack data-test={`attempt_summary__content__${attempt.id}`} spacing={1.5}>
        {showExpectedAnswers && (
          <>
            <Typography
              data-test={`attempt_summary__expected_answers_label__${attempt.id}`}
              variant="overline"
            >
              {expectedAnswers.length === 1
                ? t(interfaceLanguage, 'correctAnswer')
                : t(interfaceLanguage, 'correctAnswers')}
            </Typography>
            <Typography
              data-test={`attempt_summary__expected_answers_text__${attempt.id}`}
              fontWeight={800}
            >
              {expectedAnswers.join(' / ')}
            </Typography>
            <Chip
              data-test={`attempt_summary__result_chip__${attempt.id}`}
              label={t(
                interfaceLanguage,
                isAttemptCorrect ? 'correct' : 'incorrect',
              )}
              size="small"
              color={isAttemptCorrect ? 'success' : 'error'}
              sx={{ alignSelf: 'flex-start' }}
            />
            <Divider />
          </>
        )}
        <Typography
          data-test={`attempt_summary__stats_label__${attempt.id}`}
          variant="overline"
        >
          {statsLabel}
        </Typography>
        <Stack
          data-test={`attempt_summary__stats_chips__${attempt.id}`}
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
        >
          {attempt.exerciseType === 'crossword' ? (
            <StatsFormula
              correct={attemptCorrectCount}
              dataTestPrefix={`attempt_summary__crossword_formula__${attempt.id}`}
              incorrect={attemptIncorrectCount}
              interfaceLanguage={interfaceLanguage}
              showLabel={false}
              total={attemptTotalCount}
              totalLabel={t(interfaceLanguage, 'totalAnsweredQuestions')}
            />
          ) : usesSplitStats ? (
            <SplitWordStatsChip
              correct={correctCount}
              dataTestPrefix={`attempt_summary__split_stats__${attempt.id}`}
              incorrect={incorrectCount}
              interfaceLanguage={interfaceLanguage}
              statsLabel={statsLabel}
            />
          ) : (
            <>
              {correctCount > 0 && (
                <Chip
                  data-test={`attempt_summary__correct_chip__${attempt.id}`}
                  label={`${t(interfaceLanguage, 'correct')}: ${correctCount}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {incorrectCount > 0 && (
                <Chip
                  data-test={`attempt_summary__incorrect_chip__${attempt.id}`}
                  label={`${t(interfaceLanguage, 'incorrect')}: ${incorrectCount}`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function FinishExerciseDialog({
  answeredCount,
  hasCrosswordDraftLetters = false,
  interfaceLanguage,
  isCrossword = false,
  onCancel,
  onConfirm,
  onForget,
  open,
}: {
  answeredCount: number;
  hasCrosswordDraftLetters?: boolean;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  isCrossword?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onForget: () => void;
  open: boolean;
}) {
  return (
    <Dialog
      data-test="finish_exercise_dialog__root"
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          boxShadow: '0 20px 50px rgba(32, 48, 21, 0.22)',
          maxWidth: 560,
        },
      }}
    >
      <DialogTitle
        data-test="finish_exercise_dialog__title"
        sx={{ fontWeight: 900 }}
      >
        {t(interfaceLanguage, 'finishExercise')}
      </DialogTitle>
      <DialogContent data-test="finish_exercise_dialog__content">
        <Stack spacing={1}>
          <Typography data-test="finish_exercise_dialog__notice">
            {isCrossword
              ? t(interfaceLanguage, 'crosswordFinishExerciseNotice')
              : t(interfaceLanguage, 'finishExerciseNotice')}
          </Typography>
          {hasCrosswordDraftLetters && (
            <Typography data-test="finish_exercise_dialog__crossword_letters_notice">
              {t(interfaceLanguage, 'crosswordFinishHasLetters')}
            </Typography>
          )}
          {isCrossword && answeredCount === 0 && (
            <Typography data-test="finish_exercise_dialog__crossword_empty_stats_notice">
              {t(interfaceLanguage, 'crosswordFinishNoCompletedWords')}
            </Typography>
          )}
          {isCrossword && answeredCount > 0 && (
            <Typography data-test="finish_exercise_dialog__crossword_stats_notice">
              {t(interfaceLanguage, 'crosswordFinishCompletedWordsWillCount')}
            </Typography>
          )}
        </Stack>
        <Typography data-test="finish_exercise_dialog__answered_count" sx={{ mt: 2 }}>
          {t(interfaceLanguage, 'answeredWords')}: {answeredCount}
        </Typography>
      </DialogContent>
      <DialogActions
        data-test="finish_exercise_dialog__actions"
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: 1,
          justifyContent: 'space-between',
          px: 3,
          pb: 2,
        }}
      >
        <Tooltip
          arrow
          describeChild
          title={t(interfaceLanguage, 'forgetExerciseTooltip')}
        >
          <Button
            data-test="finish_exercise_dialog__forget_button"
            variant="outlined"
            onClick={onForget}
            sx={{
              borderColor: '#7b5fc4',
              color: '#6046b6',
              fontWeight: 800,
              mr: 'auto',
              '&:hover': {
                bgcolor: 'rgba(123, 95, 196, 0.08)',
                borderColor: '#6046b6',
              },
            }}
          >
            {t(interfaceLanguage, 'forgetAndExit')}
          </Button>
        </Tooltip>
        <Stack direction="row" spacing={1}>
          <Button
            color="success"
            data-test="finish_exercise_dialog__cancel_button"
            variant="contained"
            onClick={onCancel}
          >
            {t(interfaceLanguage, 'cancel')}
          </Button>
          <Button
            color="error"
            data-test="finish_exercise_dialog__confirm_button"
            variant="contained"
            onClick={onConfirm}
          >
            {t(interfaceLanguage, 'confirm')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

function calculateWeightedScore(input: {
  correctness: Record<string, boolean>;
  cardStats: RootState['stats']['cardStats'];
  targetLanguage: RootState['app']['targetLanguage'];
}): number {
  const cardIds = Object.keys(input.correctness);
  if (cardIds.length === 0) {
    return 0;
  }

  const score = cardIds.reduce((sum, cardId) => {
    const stat = input.cardStats.find(
      (item) =>
        item.cardId === cardId &&
        item.targetLanguage === input.targetLanguage,
    );

    if (input.correctness[cardId]) {
      return sum + 1;
    }

    if (!stat || stat.attempts === 0) {
      return sum + 0.45;
    }

    if (stat.stability === 'weak' || stat.recentMistakes >= 2) {
      return sum;
    }

    return sum + 0.2;
  }, 0);

  return Math.round((score / cardIds.length) * 100);
}

function getJumpComplementaryLabel(
  prompt: ExercisePrompt,
  complementaryLanguage: SupportedLanguage,
): string {
  const complementaryHint = prompt.translationHints
    .find((hint) => hint.language === complementaryLanguage)
    ?.value.trim();

  if (complementaryHint) {
    return complementaryHint;
  }

  const fallbackHint = prompt.translationHints.find((hint) =>
    hint.value.trim(),
  )?.value;

  return fallbackHint ?? prompt.prompt;
}

function getCardJumpComplementaryLabel(
  card: LanguageCard,
  complementaryLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
): string {
  const complementaryAnswer = getCardAnswer(card, complementaryLanguage)?.trim();
  if (complementaryAnswer) {
    return complementaryAnswer;
  }

  const fallbackAnswer = Object.entries(card.translations).find(
    ([language, value]) => language !== targetLanguage && Boolean(value?.trim()),
  )?.[1];

  return fallbackAnswer?.trim() ?? card.id;
}

function getCompletedCrosswordEntries(
  puzzle: CrosswordPuzzle,
  answers: Record<string, string>,
): CrosswordEntry[] {
  return puzzle.entries.filter((entry) =>
    isCrosswordAnswerComplete(entry, answers[entry.cardId] ?? ''),
  );
}

function isCrosswordAnswerComplete(
  entry: CrosswordEntry,
  answer: string,
): boolean {
  return entry.answer.split('').every((character, index) => {
    if (/\s/.test(character)) {
      return true;
    }

    return Boolean(answer[index]?.trim());
  });
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function shuffleCards(cards: LanguageCard[], seed: number): LanguageCard[] {
  return [...cards].sort(
    (left, right) =>
      hashString(`${left.id}:${seed}`) - hashString(`${right.id}:${seed}`),
  );
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createPracticeKey(cardId: string, index: number): string {
  return `${cardId}__${index}`;
}

function getCardIdFromPracticeKey(practiceKey: string): string {
  return practiceKey.replace(/__\d+$/, '');
}

function getPracticeKeyOccurrence(practiceKey: string): number {
  const occurrenceMatch = practiceKey.match(/__(\d+)$/);
  return occurrenceMatch ? Number(occurrenceMatch[1]) : 0;
}

function getUniqueJumpPrompts<T extends PracticePrompt<ExercisePrompt>>(
  prompts: T[],
  currentPrompt: T,
): T[] {
  const source = prompts.some((prompt) => prompt.cardId === currentPrompt.cardId)
    ? prompts
    : [currentPrompt, ...prompts];
  const seenCardIds = new Set<string>();

  return source.filter((prompt) => {
    if (seenCardIds.has(prompt.cardId)) {
      return false;
    }

    seenCardIds.add(prompt.cardId);
    return true;
  });
}

function getJumpSelectorValue<T extends PracticePrompt<ExercisePrompt>>(
  currentPrompt: T,
  jumpPrompts: T[],
): string {
  return (
    jumpPrompts.find((prompt) => prompt.cardId === currentPrompt.cardId)
      ?.practiceKey ?? currentPrompt.practiceKey
  );
}

function formatJumpAnswerCount(count: number): string {
  return count > 1 ? ` (${count})` : '';
}

function getRepeatProgress<T extends PracticePrompt<ExercisePrompt>>(
  prompt: T,
  prompts: T[],
): RepeatProgress | undefined {
  const current = getPracticeKeyOccurrence(prompt.practiceKey);
  if (!prompt.isRepeat || current <= 0) {
    return undefined;
  }

  const total = Math.max(
    0,
    ...prompts
      .filter((item) => item.cardId === prompt.cardId)
      .map((item) => getPracticeKeyOccurrence(item.practiceKey)),
  );

  return total > 0 ? { current, total } : undefined;
}

function countCurrentSessionCardAnswers({
  attempts,
  currentExerciseSessionId,
  exerciseType,
}: {
  attempts: ExerciseAttempt[];
  currentExerciseSessionId: string;
  exerciseType: ExerciseType;
}): Map<string, number> {
  const counts = new Map<string, number>();

  attempts
    .filter(
      (attempt) =>
        attempt.exerciseSessionId === currentExerciseSessionId &&
        attempt.exerciseType === exerciseType,
    )
    .forEach((attempt) => {
      Object.keys(attempt.correctness).forEach((cardId) => {
        counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
      });
    });

  return counts;
}

function pickMultipleChoiceCard(
  cards: LanguageCard[],
  answeredCardIds: string[],
): LanguageCard | undefined {
  const lastAnsweredCardId = answeredCardIds[answeredCardIds.length - 1];
  const lastAnsweredCardIndex = cards.findIndex(
    (card) => card.id === lastAnsweredCardId,
  );
  const lastAnsweredCard =
    lastAnsweredCardIndex >= 0 ? cards[lastAnsweredCardIndex] : undefined;
  const blockedCardIds =
    answeredCardIds.length >= cards.length ? [lastAnsweredCardId] : answeredCardIds;
  const orderedCards =
    lastAnsweredCardIndex >= 0
      ? [
          ...cards.slice(lastAnsweredCardIndex + 1),
          ...cards.slice(0, lastAnsweredCardIndex + 1),
        ]
      : cards;
  const availableCards = orderedCards.filter(
    (card) => !blockedCardIds.includes(card.id),
  );

  return (
    availableCards[0] ??
    (lastAnsweredCard
      ? cards.find((card) => card.id !== lastAnsweredCard.id)
      : undefined) ??
    cards[0]
  );
}

function pickPracticePrompt<T extends PracticePrompt<ExercisePrompt>>(
  prompts: T[],
  answeredPromptKeys: string[],
): T | undefined {
  const lastAnsweredPromptKey = answeredPromptKeys[answeredPromptKeys.length - 1];
  const lastAnsweredPromptIndex = prompts.findIndex(
    (prompt) => prompt.practiceKey === lastAnsweredPromptKey,
  );
  const lastAnsweredPrompt =
    lastAnsweredPromptIndex >= 0 ? prompts[lastAnsweredPromptIndex] : undefined;
  const blockedPromptKeys =
    answeredPromptKeys.length >= prompts.length
      ? [lastAnsweredPromptKey]
      : answeredPromptKeys;
  const orderedPrompts =
    lastAnsweredPromptIndex >= 0
      ? [
          ...prompts.slice(lastAnsweredPromptIndex + 1),
          ...prompts.slice(0, lastAnsweredPromptIndex + 1),
        ]
      : prompts;
  const availablePrompts = orderedPrompts.filter(
    (prompt) => !blockedPromptKeys.includes(prompt.practiceKey),
  );
  const promptsForDifferentCard = lastAnsweredPrompt
    ? availablePrompts.filter(
        (prompt) => prompt.cardId !== lastAnsweredPrompt.cardId,
      )
    : availablePrompts;

  return (
    promptsForDifferentCard[0] ??
    availablePrompts[0] ??
    (lastAnsweredPrompt
      ? prompts.find((prompt) => prompt.cardId !== lastAnsweredPrompt.cardId)
      : undefined) ??
    prompts[0]
  );
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function getCardsForSelectableCardSetId({
  cardById,
  cardSetId,
  cards,
  visibleCardSets,
}: {
  cardById: Map<string, LanguageCard>;
  cardSetId: string;
  cards: LanguageCard[];
  visibleCardSets: CardSet[];
}): LanguageCard[] {
  if (!cardSetId) {
    return [];
  }

  if (cardSetId === ALL_CARDS_CARD_SET_ID) {
    return cards;
  }

  const cardSet = visibleCardSets.find((item) => item.id === cardSetId);
  if (!cardSet) {
    return [];
  }

  return getCardsByIds(cardById, cardSet.cardIds);
}

function countExerciseSessionAnswers(
  attempts: ExerciseAttempt[],
  exerciseSessionId: string,
) {
  return attempts
    .filter((attempt) => attempt.exerciseSessionId === exerciseSessionId)
    .reduce(
      (counts, attempt) => {
        Object.values(attempt.correctness).forEach((isCorrect) => {
          if (isCorrect) {
            counts.correct += 1;
          } else {
            counts.incorrect += 1;
          }
        });

        return counts;
      },
      { correct: 0, incorrect: 0 },
    );
}

function getRecentResultsByCardId({
  attempts,
  cardIds,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  cardIds: string[];
  targetLanguage: RootState['app']['targetLanguage'];
}): Record<string, Array<{ isCorrect: boolean; occurredAt: string }>> {
  const cardIdSet = new Set(cardIds);
  const resultsByCardId: Record<
    string,
    Array<{ isCorrect: boolean; occurredAt: string }>
  > = {};

  [...attempts]
    .filter((attempt) => attempt.targetLanguage === targetLanguage)
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? right.createdAt) -
        Date.parse(left.completedAt ?? left.createdAt),
    )
    .forEach((attempt) => {
      Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
        if (!cardIdSet.has(cardId)) {
          return;
        }

        const results = resultsByCardId[cardId] ?? [];
        if (results.length >= 10) {
          return;
        }

        resultsByCardId[cardId] = [
          ...results,
          {
            isCorrect: Boolean(isCorrect),
            occurredAt: attempt.completedAt ?? attempt.createdAt,
          },
        ];
      });
    });

  return resultsByCardId;
}

function formatAttemptDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    `${padDatePart(date.getMonth() + 1)}/${padDatePart(
      date.getDate(),
    )}/${date.getFullYear()}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  ].join(' ');
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function getNextOccurrence(
  cardId: string,
  occurrenceCounts: Map<string, number>,
): number {
  const occurrence = occurrenceCounts.get(cardId) ?? 0;
  occurrenceCounts.set(cardId, occurrence + 1);
  return occurrence;
}

const targetStatsMetricLabelStyles = {
  color: '#203015',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.25,
  textAlign: 'center',
};
