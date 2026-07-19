import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
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
import { AiAssistantView } from './components/AiAssistantView';
import { AssistantProfileView } from './components/AssistantProfileView';
import { CardSetLibraryPicker } from './components/CardSetLibraryPicker';
import { CoachPanel } from './components/CoachPanel';
import { ExercisePicker } from './components/ExercisePicker';
import { GameHelpPanel } from './components/GameHelpPanel';
import { GameWarningIcon, GameWarningTooltip } from './components/GameWarningTooltip';
import { HistoryView } from './components/HistoryView';
import { SplitWordStatsChip } from './components/SplitWordStatsChip';
import { MetricPlainValue, StatsFormula } from './components/StatsFormula';
import { CursorAnchoredTooltip, TooltipContent } from './components/CursorAnchoredTooltip';
import { CardSetDetailView } from './components/CardSetDetailView';
import { CardSetListView } from './components/CardSetListView';
import {
  CrosswordExercise,
  type CrosswordDraftState,
} from './components/exercises/CrosswordExercise';
import { ExerciseProgressChip } from './components/exercises/ExerciseCardSetChip';
import { MissingLettersExercise } from './components/exercises/MissingLettersExercise';
import { MissingWordExercise } from './components/exercises/MissingWordExercise';
import { MultipleChoiceExercise } from './components/exercises/MultipleChoiceExercise';
import {
  LanguageCard,
  createCardSnapshot,
  getCardAnswer,
  getTranslationHints,
  isCardKnownForTarget,
  isPhraseValue,
} from './domain/cards';
import {
  canCreateCrossword,
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
  summarizePracticeByCardId,
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
  getComplementaryLanguagesForTarget,
  markFinishExerciseLampShown,
  markHypersonicJumpLampShown,
} from './store/appSlice';
import { seedDefaultCards, setCardKnown } from './store/cardsSlice';
import { rebuildStatsFromAttempts, recordAttemptStats } from './store/statsSlice';
import {
  mergeCardSetMetadata,
  seedDefaultCardSets,
  selectCardSet,
} from './store/cardSetsSlice';
import { AppDispatch, RootState } from './store/store';
import {
  getWorldAccent,
  getWorldResultColors,
  resolveWorldId,
  type WorldId,
} from './domain/worlds';

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
  const [activeExerciseCardIds, setActiveExerciseCardIds] = useState<string[]>(
    [],
  );
  const [
    isMissingLettersCooldownIgnored,
    setIsMissingLettersCooldownIgnored,
  ] = useState(false);
  const [activeHintLanguages, setActiveHintLanguages] = useState<
    Record<string, SupportedLanguage>
  >({});
  const [activeDefinitionLanguages, setActiveDefinitionLanguages] = useState<
    Record<string, SupportedLanguage>
  >({});
  const [crosswordDraftState, setCrosswordDraftState] =
    useState<CrosswordDraftState>(emptyCrosswordDraftState);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishDialogIntent, setFinishDialogIntent] = useState<
    'finish' | 'home' | 'navigate' | null
  >(null);
  const [finishDialogTargetSection, setFinishDialogTargetSection] =
    useState<AppShellSection | null>(null);
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
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const worldAccent = getWorldAccent(worldId);
  const worldResultColors = getWorldResultColors(worldId);
  const isGameHelpCollapsed = useSelector((state: RootState) =>
    Boolean(state.app.isGameHelpCollapsed),
  );
  const practiceSettings = useSelector(
    (state: RootState) => state.app.practiceSettings,
  );
  const complementaryLanguages = useSelector(
    (state: RootState) => state.app.complementaryLanguages,
  );
  const complementaryLanguagesForTarget = getComplementaryLanguagesForTarget(
    complementaryLanguages,
    targetLanguage,
    interfaceLanguage,
  );
  const complementaryLanguage = complementaryLanguagesForTarget[0];
  const disableAdditionalHints = useSelector(
    (state: RootState) => state.app.disableAdditionalHints ?? false,
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
  const eligibleCards = useMemo(() => {
    const cardsForExercise =
      isExerciseStarted && activeExerciseCardIds.length > 0
        ? getCardsByIds(cardById, activeExerciseCardIds)
        : cardSetCards;

    return getEligibleCardsForTarget(cardsForExercise, targetLanguage).filter(
      (card) =>
        isExerciseStarted || !isCardKnownForTarget(card, targetLanguage),
    );
  }, [
    activeExerciseCardIds,
    cardById,
    cardSetCards,
    isExerciseStarted,
    targetLanguage,
  ]);
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
      includeCoolingDown: isMissingLettersCooldownIgnored,
      now: new Date().toISOString(),
      seed: generationSeed,
      settings: getPracticeSettings(practiceSettings),
      targetLanguage,
    });
  }, [
    generationSeed,
    isMissingLettersCooldownIgnored,
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
  const missingLettersCooldownDetails = useMemo(() => {
    if (
      selectedExerciseType !== 'missingLetters' ||
      isMissingLettersCooldownIgnored ||
      missingLettersEligibleCards.length === 0 ||
      missingLettersOrderedCards.length > 0
    ) {
      return null;
    }

    const summariesByCardId = summarizePracticeByCardId({
      attempts: practiceOrderingAttempts,
      now: new Date().toISOString(),
      settings: getPracticeSettings(practiceSettings),
      targetLanguage,
    });
    const coolingCards = missingLettersEligibleCards
      .map((card) => summariesByCardId.get(card.id))
      .filter(
        (
          summary,
        ): summary is NonNullable<ReturnType<typeof summariesByCardId.get>> =>
          Boolean(summary?.isCoolingDown && summary.nextReviewAt),
      );
    const nextReviewAt = coolingCards
      .map((summary) => summary.nextReviewAt!)
      .sort((left, right) => left.localeCompare(right))[0];

    return nextReviewAt && coolingCards.length === missingLettersEligibleCards.length
      ? {
          coolingCount: coolingCards.length,
          nextReviewAt,
          totalCount: missingLettersEligibleCards.length,
        }
      : null;
  }, [
    isMissingLettersCooldownIgnored,
    missingLettersEligibleCards,
    missingLettersOrderedCards.length,
    practiceOrderingAttempts,
    practiceSettings,
    selectedExerciseType,
    targetLanguage,
  ]);
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
    setActiveExerciseCardIds([]);
    setIsMissingLettersCooldownIgnored(false);
    setActiveHintLanguages({});
    setActiveDefinitionLanguages({});
    setCurrentExerciseAnsweredCount(0);
    setHasCurrentExerciseResult(false);
    setCurrentExerciseSessionId(createId('exercise-session'));
    setGenerationSeed((seed) => seed + 1);
  }

  function openFinishDialog(
    intent: 'finish' | 'home' | 'navigate',
    targetSection?: AppShellSection,
  ) {
    if (selectedExerciseType === 'crossword' && isExerciseStarted) {
      if (crosswordDraftState.filledEntryCount === 0) {
        resetExerciseState();
        navigateAfterExerciseReset(intent, targetSection);
        return;
      }

      setFinishDialogTargetSection(targetSection ?? null);
      setFinishDialogIntent(intent);
      setIsFinishDialogOpen(true);
      return;
    }

    if (currentExerciseAnsweredCount === 0 && !hasCurrentExerciseResult) {
      resetExerciseState();
      navigateAfterExerciseReset(intent, targetSection);
      return;
    }

    setFinishDialogTargetSection(targetSection ?? null);
    setFinishDialogIntent(intent);
    setIsFinishDialogOpen(true);
  }

  function navigateAfterExerciseReset(
    intent: 'finish' | 'home' | 'navigate',
    targetSection?: AppShellSection,
  ) {
    if (intent === 'home') {
      setProfileAssistantId(null);
      setActiveSection('game');
      return;
    }

    if (intent === 'navigate' && targetSection) {
      if (targetSection !== 'assistant') {
        setProfileAssistantId(null);
      }
      setActiveSection(targetSection);
    }
  }

  function handleFinishDialogCancel() {
    setFinishDialogIntent(null);
    setFinishDialogTargetSection(null);
    setIsFinishDialogOpen(false);
  }

  function handleFinishDialogConfirm() {
    const targetSection = finishDialogTargetSection;
    const intent = finishDialogIntent;
    if (
      selectedExerciseType === 'crossword' &&
      currentExerciseAnsweredCount === 0 &&
      crosswordDraftState.filledEntryCount > 0 &&
      exercisePreview?.type === 'crossword'
    ) {
      saveCrosswordDraftAttempt(exercisePreview.puzzle, crosswordDraftState);
    }

    setFinishDialogIntent(null);
    setFinishDialogTargetSection(null);
    setIsFinishDialogOpen(false);
    resetExerciseState();
    navigateAfterExerciseReset(intent ?? 'finish', targetSection ?? undefined);
  }

  function handleFinishDialogForget() {
    const targetSection = finishDialogTargetSection;
    const intent = finishDialogIntent;
    const remainingAttempts = attempts.filter(
      (attempt) => attempt.exerciseSessionId !== currentExerciseSessionId,
    );

    dispatch(forgetExerciseSession(currentExerciseSessionId));
    dispatch(rebuildStatsFromAttempts(remainingAttempts));
    setFinishDialogIntent(null);
    setFinishDialogTargetSection(null);
    setIsFinishDialogOpen(false);
    resetExerciseState();
    navigateAfterExerciseReset(intent ?? 'finish', targetSection ?? undefined);
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
    if (isExerciseStarted) {
      if (section === 'game') {
        setProfileAssistantId(null);
        openFinishDialog('home');
        return;
      }
      openFinishDialog('navigate', section);
      return;
    }

    if (section === 'game') {
      setProfileAssistantId(null);
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

  function openGameAiAssistant() {
    setProfileAssistantId(null);
    setActiveSection('chat');
    const scrollRoot = document.querySelector<HTMLElement>(
      '[data-test="app_shell__root"]',
    );
    if (scrollRoot) {
      scrollRoot.scrollTop = 0;
    }
    window.requestAnimationFrame(() => {
      const nextScrollRoot = document.querySelector<HTMLElement>(
        '[data-test="app_shell__root"]',
      );
      if (nextScrollRoot) {
        nextScrollRoot.scrollTop = 0;
      }
    });
  }

  function setKnownForCurrentTarget(cardId: string, isKnown: boolean) {
    dispatch(
      setCardKnown({
        cardId,
        isKnown,
        now: new Date().toISOString(),
        targetLanguage,
      }),
    );
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
    const completedEntries = getCompletedCrosswordEntries(puzzle, answers);
    const submittedEntries = puzzle.entries;
    const submittedAnswers = Object.fromEntries(
      submittedEntries.map((entry) => [entry.cardId, answers[entry.cardId] ?? '']),
    );
    const prompts: ExercisePrompt[] = submittedEntries.map((entry) => ({
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
      submittedEntries.map((entry) => [
        entry.cardId,
        normalizeAnswer(answers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer),
      ]),
    );
    const hintsUsed = Object.fromEntries(
      submittedEntries.map((entry) => [entry.cardId, 0]),
    );

    persistAttempt({
      exerciseType: 'crossword',
      prompts,
      answers: submittedAnswers,
      correctness,
      hintsUsed,
      cardIds: submittedEntries.map((entry) => entry.cardId),
      advance: false,
      isExerciseCompleted: completedEntries.length === puzzle.entries.length,
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
            minWidth: 0,
            width: '100%',
            '& > *': {
              minWidth: 0,
            },
            '@media (max-width: 899.95px)': {
              height: 'auto',
              overflow: 'hidden',
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

    if (activeSection === 'help') {
      return (
        <Box data-test="app__help_section">
          <GameHelpPanel
            interfaceLanguage={interfaceLanguage}
            isInitiallyCollapsed={isGameHelpCollapsed}
            onAcknowledge={() => dispatch(acknowledgeGameHelp())}
            worldId={worldId}
          />
        </Box>
      );
    }

    return renderGameContent();
  }

  function renderGameContent() {
    if (!isExerciseStarted) {
      return (
        <Stack data-test="app__game_setup_section" style={{ gap: 12 }}>
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
        {lastSavedAttempt && !currentPromptStats && (
          <AttemptSummary
            attempt={lastSavedAttempt}
            cardStats={cardStats}
            interfaceLanguage={interfaceLanguage}
            resultColors={worldResultColors}
            showExpectedAnswers={
              lastSavedAttempt.exerciseType !== 'missingLetters' &&
              lastSavedAttempt.exerciseType !== 'missingWord' &&
              lastSavedAttempt.exerciseType !== 'multipleChoice' &&
              lastSavedAttempt.exerciseType !== 'crossword'
            }
            targetLanguage={targetLanguage}
          />
        )}
      </Stack>
    );
  }

  function getCurrentPromptStats():
    | {
        exerciseType: 'missingLetters' | 'missingWord' | 'multipleChoice';
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

    if (exercisePreview.type === 'multipleChoice' && exercisePreview.prompt) {
      return {
        exerciseType: 'multipleChoice',
        prompt: exercisePreview.prompt,
      };
    }

    return null;
  }

  function renderCurrentPromptStatsAction(
    exerciseType: 'missingLetters' | 'missingWord' | 'multipleChoice',
    prompt: ExercisePrompt,
  ) {
    if (completedExerciseSummary) {
      return null;
    }

    return (
      <CurrentPromptStatsButton
        attempts={attempts}
        exerciseType={exerciseType}
        interfaceLanguage={interfaceLanguage}
        prompt={prompt}
        resultColors={worldResultColors}
        targetLanguage={targetLanguage}
      />
    );
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
    ).filter((card) => !isCardKnownForTarget(card, targetLanguage));
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
    const isCrosswordUnavailable =
      isCardSetSelected &&
      !canCreateCrossword({
        cards: setupEligibleCards,
        complementaryLanguage,
        targetLanguage,
      });
    const canStart =
      isCardSetSelected &&
      Boolean(selectedExerciseType) &&
      setupEligibleCards.length > 0 &&
      (selectedExerciseType !== 'crossword' || !isCrosswordUnavailable) &&
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
      (selectedExerciseType === 'crossword' && isCrosswordUnavailable) ||
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
              <Stack
                data-test="game_library__title_row"
                direction="row"
                style={{ gap: '10px' }}
                sx={{ alignItems: 'center' }}
              >
                <Typography
                  data-test="game_library__title"
                  sx={{ color: '#203015', fontSize: 18, fontWeight: 900 }}
                >
                  {t(interfaceLanguage, 'gameLibrary')}
                </Typography>
                <Tooltip title={t(interfaceLanguage, 'openAiAssistant')}>
                  <IconButton
                    aria-label={t(interfaceLanguage, 'openAiAssistant')}
                    data-test="game_library__ai_assistant_button"
                    onClick={openGameAiAssistant}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(24, 119, 201, 0.10)',
                      color: worldAccent.main,
                      flexShrink: 0,
                      '&:hover': { bgcolor: 'rgba(24, 119, 201, 0.18)' },
                    }}
                  >
                    <AutoFixHighIcon
                      data-test="game_library__ai_assistant_icon"
                      fontSize="small"
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
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
                crossword: isCrosswordUnavailable,
                missingLetters: isMissingLettersUnavailable,
                missingWord: isMissingWordUnavailable,
              }}
              disabledExerciseTooltips={{
                crossword: isCrosswordUnavailable
                  ? t(interfaceLanguage, 'crosswordNeedsIntersections')
                  : undefined,
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
            onOpenAiAssistant={openGameAiAssistant}
            onSelect={handleCardSetChange}
            selectedCardSetId={currentCardSetId}
            targetLanguage={targetLanguage}
            worldId={worldId}
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
                setActiveExerciseCardIds(setupEligibleCards.map((card) => card.id));
                setActiveHintLanguages({});
                setActiveDefinitionLanguages({});
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
                setIsMissingLettersCooldownIgnored(false);
                setCurrentExerciseSessionId(createId('exercise-session'));
                setGenerationSeed((seed) => seed + 1);
              }}
              disabled={!canStart}
              sx={getGameSetupStartButtonSx(worldId)}
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
    options?: { progressChip?: ReactNode; showHypersonicJumpGuide?: boolean },
  ) {
    return (
      <FinishExerciseAction
        interfaceLanguage={interfaceLanguage}
        jumpSelector={jumpSelector}
        onClick={() => openFinishDialog('finish')}
        progressChip={options?.progressChip}
        showHypersonicJumpGuide={options?.showHypersonicJumpGuide}
        worldId={worldId}
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
          resultColors={worldResultColors}
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
          puzzle={exercisePreview.puzzle}
          resultColors={worldResultColors}
          targetLanguage={targetLanguage}
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
          complementaryLanguages={complementaryLanguagesForTarget}
          definitions={cardById.get(exercisePreview.prompt.cardId)?.definitions}
          disableAdditionalHints={disableAdditionalHints}
          activeHintLanguage={activeHintLanguages[exercisePreview.prompt.cardId]}
          activeDefinitionLanguage={activeDefinitionLanguages[exercisePreview.prompt.cardId]}
          onHintLanguageChange={(language: SupportedLanguage) =>
            setActiveHintLanguages((prev) => ({
              ...prev,
              [exercisePreview.prompt.cardId]: language,
            }))
          }
          onDefinitionLanguageChange={(language: SupportedLanguage) =>
            setActiveDefinitionLanguages((prev) => ({
              ...prev,
              [exercisePreview.prompt.cardId]: language,
            }))
          }
          interfaceLanguage={interfaceLanguage}
          prompt={exercisePreview.prompt}
          promptStatsAction={renderCurrentPromptStatsAction(
            'multipleChoice',
            exercisePreview.prompt,
          )}
          resultColors={worldResultColors}
          targetLanguage={targetLanguage}
          isKnown={isCardKnownForTarget(
            cardById.get(exercisePreview.prompt.cardId) ?? {
              knownTargetLanguages: [],
            },
            targetLanguage,
          )}
          cardSetName={selectedCardSet.name}
          finishAction={renderFinishExerciseAction(
            buildMultipleChoiceJumpSelector(exercisePreview.prompt),
            {
              progressChip: (
                <ExerciseProgressChip
                  completed={completedMultipleChoiceCardIds.length}
                  dataTest={`multiple_choice_exercise__progress_chip__${exercisePreview.prompt.cardId}`}
                  interfaceLanguage={interfaceLanguage}
                  total={eligibleCards.length}
                />
              ),
            },
          )}
          onAnswer={(answer) =>
            savePromptAttempt('multipleChoice', exercisePreview.prompt, answer, {
              advance: false,
            })
          }
          onKnownChange={(isKnown) =>
            setKnownForCurrentTarget(exercisePreview.prompt.cardId, isKnown)
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
            {missingLettersCooldownDetails ? (
              <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 750 }}>
                  {t(interfaceLanguage, 'missingLettersNeedsWords')}
                </Typography>
                <Typography sx={{ fontSize: 14 }}>
                  {getMissingLettersCooldownDetailsText({
                    coolingCount: missingLettersCooldownDetails.coolingCount,
                    interfaceLanguage,
                    nextReviewAt: missingLettersCooldownDetails.nextReviewAt,
                    totalCount: missingLettersCooldownDetails.totalCount,
                  })}
                </Typography>
                <Button
                  data-test="exercise_area__missing_letters_ignore_cooldown_button"
                  onClick={() => {
                    setIsMissingLettersCooldownIgnored(true);
                    setAnsweredMissingLettersPromptKeys([]);
                    setCompletedMissingLettersCardIds([]);
                    setResultPromptHold(null);
                    setGenerationSeed((seed) => seed + 1);
                  }}
                  size="small"
                  variant="outlined"
                >
                  {getIgnoreCooldownButtonLabel(interfaceLanguage)}
                </Button>
              </Stack>
            ) : (
              t(interfaceLanguage, 'missingLettersNeedsWords')
            )}
          </Alert>
        );
      }

      const missingLettersPrompt = exercisePreview.prompt;
      return (
        <MissingLettersExercise
          key={missingLettersPrompt.practiceKey}
          complementaryLanguages={complementaryLanguagesForTarget}
          definitions={cardById.get(missingLettersPrompt.cardId)?.definitions}
          disableAdditionalHints={disableAdditionalHints}
          activeHintLanguage={activeHintLanguages[missingLettersPrompt.cardId]}
          activeDefinitionLanguage={activeDefinitionLanguages[missingLettersPrompt.cardId]}
          onHintLanguageChange={(language: SupportedLanguage) =>
            setActiveHintLanguages((prev) => ({
              ...prev,
              [missingLettersPrompt.cardId]: language,
            }))
          }
          onDefinitionLanguageChange={(language: SupportedLanguage) =>
            setActiveDefinitionLanguages((prev) => ({
              ...prev,
              [missingLettersPrompt.cardId]: language,
            }))
          }
          interfaceLanguage={interfaceLanguage}
          isRepeatedPrompt={completedMissingLettersCardIds.includes(
            missingLettersPrompt.cardId,
          )}
          repeatProgress={getRepeatProgress(
            missingLettersPrompt,
            missingLettersPracticePrompts,
          )}
          promptStatsAction={renderCurrentPromptStatsAction(
            'missingLetters',
            missingLettersPrompt,
          )}
          prompt={missingLettersPrompt}
          resultColors={worldResultColors}
          targetLanguage={targetLanguage}
          isKnown={isCardKnownForTarget(
            cardById.get(missingLettersPrompt.cardId) ?? {
              knownTargetLanguages: [],
            },
            targetLanguage,
          )}
          cardSetName={selectedCardSet.name}
          finishAction={renderFinishExerciseAction(
            buildMissingLettersJumpSelector(missingLettersPrompt),
            {
              progressChip: (
                <ExerciseProgressChip
                  completed={completedMissingLettersCardIds.length}
                  dataTest={`missing_letters_exercise__progress_chip__${missingLettersPrompt.cardId}`}
                  interfaceLanguage={interfaceLanguage}
                  total={missingLettersPracticeCardIds.length}
                />
              ),
            },
          )}
          onAnswer={(answer) =>
            savePromptAttempt('missingLetters', missingLettersPrompt, answer, {
              advance: false,
            })
          }
          onMemorizeResult={() => setHasCurrentExerciseResult(true)}
          onKnownChange={(isKnown) =>
            setKnownForCurrentTarget(missingLettersPrompt.cardId, isKnown)
          }
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
        complementaryLanguages={complementaryLanguagesForTarget}
        definitions={cardById.get(missingWordPrompt.cardId)?.definitions}
        disableAdditionalHints={disableAdditionalHints}
        activeHintLanguage={activeHintLanguages[missingWordPrompt.cardId]}
        activeDefinitionLanguage={activeDefinitionLanguages[missingWordPrompt.cardId]}
        onHintLanguageChange={(language: SupportedLanguage) =>
          setActiveHintLanguages((prev) => ({
            ...prev,
            [missingWordPrompt.cardId]: language,
          }))
        }
        onDefinitionLanguageChange={(language: SupportedLanguage) =>
          setActiveDefinitionLanguages((prev) => ({
            ...prev,
            [missingWordPrompt.cardId]: language,
          }))
        }
        finishAction={renderFinishExerciseAction(
          buildMissingWordJumpSelector(missingWordPrompt),
          {
            progressChip: (
              <ExerciseProgressChip
                completed={completedMissingWordCardIds.length}
                dataTest={`missing_word_exercise__progress_chip__${missingWordPrompt.cardId}`}
                interfaceLanguage={interfaceLanguage}
                total={missingWordPracticeCardIds.length}
              />
            ),
          },
        )}
        isRepeatedPrompt={completedMissingWordCardIds.includes(
          missingWordPrompt.cardId,
        )}
        repeatProgress={getRepeatProgress(
          missingWordPrompt,
          missingWordPracticePrompts,
        )}
        prompt={missingWordPrompt}
        resultColors={worldResultColors}
        targetLanguage={targetLanguage}
        isKnown={isCardKnownForTarget(
          cardById.get(missingWordPrompt.cardId) ?? {
            knownTargetLanguages: [],
          },
          targetLanguage,
        )}
        promptStatsAction={renderCurrentPromptStatsAction(
          'missingWord',
          missingWordPrompt,
        )}
        cardSetName={selectedCardSet.name}
        onAnswer={(answer) =>
          savePromptAttempt('missingWord', missingWordPrompt, answer, {
            advance: false,
          })
        }
        onMemorizeResult={() => setHasCurrentExerciseResult(true)}
        onKnownChange={(isKnown) =>
          setKnownForCurrentTarget(missingWordPrompt.cardId, isKnown)
        }
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
          background:
            'linear-gradient(135deg, rgba(255, 251, 226, 0.76) 0%, rgba(237, 244, 255, 0.64) 52%, rgba(245, 238, 255, 0.7) 100%)',
          border: '1px solid rgba(32, 48, 21, 0.14)',
          borderRadius: 2,
          boxShadow: '0 12px 28px rgba(32, 48, 21, 0.08)',
          overflow: 'hidden',
          p: 2,
          position: 'relative',
        }}
      >
        <TargetStatsWorldBackground worldId={worldId} />
        <Stack
          data-test="target_stats__content"
          spacing={1.5}
          sx={{ position: 'relative', zIndex: 1 }}
        >
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
                <MetricPlainValue
                  ariaLabel={`${t(interfaceLanguage, 'totalExercises')} ${targetSummaries.length}`}
                  dataTest="target_stats__total_exercises__value"
                  label={targetSummaries.length}
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
                <Stack
                  data-test="target_stats__answered_formula__stats_root"
                  spacing={0.75}
                  sx={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <MetricPlainValue
                    ariaLabel={`${t(interfaceLanguage, 'targetAnsweredCards')} ${totalAnswered}`}
                    dataTest="target_stats__answered_formula__total_value"
                    label={totalAnswered}
                    tooltip={t(interfaceLanguage, 'targetAnsweredCardsTooltip')}
                  />
                  {(correct > 0 || incorrect > 0) && (
                    <Typography
                      data-test="target_stats__answered_formula__breakdown"
                      sx={{
                        color: '#203015',
                        fontSize: 16,
                        fontWeight: 850,
                        lineHeight: 1.25,
                      }}
                    >
                      {correct > 0 && (
                        <Box
                          component="span"
                          data-test="target_stats__answered_formula__correct_text"
                          sx={{ color: worldResultColors.correct.border }}
                        >
                          {correct} {t(interfaceLanguage, 'metricCorrectSuffix')}
                        </Box>
                      )}
                      {correct > 0 && incorrect > 0 ? (
                        <Box
                          component="span"
                          data-test="target_stats__answered_formula__plus_text"
                          sx={{ color: 'rgba(32, 48, 21, 0.62)' }}
                        >
                          {' + '}
                        </Box>
                      ) : null}
                      {incorrect > 0 && (
                        <Box
                          component="span"
                          data-test="target_stats__answered_formula__incorrect_text"
                          sx={{ color: worldResultColors.incorrect.border }}
                        >
                          {incorrect} {t(interfaceLanguage, 'metricIncorrectSuffix')}
                        </Box>
                      )}
                    </Typography>
                  )}
                </Stack>
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
      <Box
        aria-hidden={activeSection === 'chat' ? undefined : 'true'}
        data-test={
          activeSection === 'chat' ? 'app__chat_section' : 'app__chat_section_hidden'
        }
        sx={{
          display: activeSection === 'chat' ? 'block' : 'none',
          maxWidth: 760,
          mx: 'auto',
          width: '100%',
        }}
      >
        <AiAssistantView
          collapsible={false}
          dataTest="app_chat__assistant"
          embedded
          showManualImport={false}
        />
      </Box>
      {activeSection === 'chat' ? null : renderMainContent()}
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
    </AppShell>
  );
}

function getGameSetupStartButtonSx(worldId: WorldId) {
  const isForest = worldId === 'forest';
  const background = isForest
    ? 'linear-gradient(180deg, #f8ffe6 0%, #93cc46 50%, #4f8730 100%)'
    : 'linear-gradient(180deg, #fff6b5 0%, #ffc52b 50%, #e98312 100%)';
  const hoverBackground = isForest
    ? 'linear-gradient(180deg, #fbffe8 0%, #9ed54c 50%, #5b9636 100%)'
    : 'linear-gradient(180deg, #fff8c0 0%, #ffd03f 50%, #ee941b 100%)';

  return {
    background,
    borderRadius: 2,
    boxShadow: isForest
      ? 'inset 0 0 0 1px rgba(47, 77, 36, 0.16), inset 0 2px 0 rgba(255,255,255,0.90), inset 0 -3px 0 rgba(36, 74, 28, 0.18), 0 8px 18px rgba(63, 91, 38, 0.18)'
      : 'inset 0 0 0 1px rgba(116, 63, 8, 0.15), inset 0 2px 0 rgba(255,255,255,0.90), inset 0 -3px 0 rgba(121, 68, 8, 0.15), 0 8px 18px rgba(124, 21, 24, 0.16)',
    color: isForest ? '#183813' : '#203015',
    fontWeight: 950,
    minWidth: 160,
    textTransform: 'none',
    '&:hover': {
      background: hoverBackground,
      boxShadow: isForest
        ? 'inset 0 0 0 1px rgba(47, 77, 36, 0.16), inset 0 2px 0 rgba(255,255,255,0.92), inset 0 -3px 0 rgba(36, 74, 28, 0.16), 0 10px 22px rgba(63, 91, 38, 0.20)'
        : 'inset 0 0 0 1px rgba(116, 63, 8, 0.13), inset 0 2px 0 rgba(255,255,255,0.92), inset 0 -3px 0 rgba(121, 68, 8, 0.13), 0 10px 22px rgba(124, 21, 24, 0.18)',
    },
    '&.Mui-disabled': {
      background: isForest
        ? 'linear-gradient(180deg, #f6faef 0%, #c7dea5 50%, #9abc79 100%)'
        : 'linear-gradient(180deg, #fff8d8 0%, #f3cf69 50%, #d9a34c 100%)',
      color: isForest ? 'rgba(24, 56, 19, 0.58)' : 'rgba(32, 48, 21, 0.56)',
    },
  };
}

function TargetStatsWorldBackground({ worldId }: { worldId: WorldId }) {
  if (worldId === 'forest') {
    return <TargetStatsForestBackground />;
  }

  return (
    <Box
      aria-hidden="true"
      data-test="target_stats__football_background"
      sx={{
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
    >
      <Box
        component="svg"
        data-test="target_stats__football_ball"
        viewBox="0 0 120 120"
        sx={{
          height: 150,
          opacity: 0.16,
          position: 'absolute',
          right: { xs: -26, sm: 30 },
          top: -44,
          width: 150,
        }}
      >
        <circle cx="60" cy="60" fill="#ffffff" r="54" stroke="#203015" strokeWidth="6" />
        <polygon
          fill="#203015"
          points="60,30 80,45 72,70 48,70 40,45"
        />
        <path
          d="M40 45 L20 38 M80 45 L100 38 M48 70 L36 96 M72 70 L84 96 M60 30 L60 9"
          fill="none"
          stroke="#203015"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <path
          d="M23 83 C33 105 51 113 73 110 C94 107 108 88 111 67"
          fill="none"
          stroke="#203015"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </Box>
      <Box
        component="svg"
        data-test="target_stats__football_trophy"
        viewBox="0 0 128 128"
        sx={{
          bottom: -36,
          height: 156,
          left: '48%',
          opacity: 0.13,
          position: 'absolute',
          transform: 'translateX(-50%) rotate(-5deg)',
          width: 156,
        }}
      >
        <path
          d="M42 18 H86 V47 C86 65 75 77 64 77 C53 77 42 65 42 47 Z"
          fill="#f5c84c"
          stroke="#8b5d00"
          strokeWidth="5"
        />
        <path
          d="M42 27 H21 C21 49 30 63 48 65 M86 27 H107 C107 49 98 63 80 65"
          fill="none"
          stroke="#8b5d00"
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          d="M58 78 H70 V94 H58 Z M42 97 H86 L96 114 H32 Z"
          fill="#f5c84c"
          stroke="#8b5d00"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M54 32 C61 27 70 27 77 32"
          fill="none"
          stroke="#fff4b8"
          strokeLinecap="round"
          strokeWidth="6"
        />
      </Box>
      <Box
        component="svg"
        data-test="target_stats__football_spain_ribbon"
        viewBox="0 0 260 62"
        sx={{
          bottom: 20,
          height: 68,
          left: -34,
          opacity: 0.18,
          position: 'absolute',
          transform: 'rotate(-13deg)',
          width: 260,
        }}
      >
        <rect fill="#c60b1e" height="62" rx="18" width="260" />
        <rect fill="#ffc400" height="30" rx="13" width="260" y="16" />
        <circle cx="48" cy="31" fill="rgba(255,255,255,0.55)" r="16" />
        <path
          d="M88 31 H226"
          stroke="#7c2d12"
          strokeLinecap="round"
          strokeWidth="8"
        />
      </Box>
    </Box>
  );
}

function TargetStatsForestBackground() {
  return (
    <Box
      aria-hidden="true"
      data-test="target_stats__forest_background"
      sx={{
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
    >
      <Box
        component="svg"
        data-test="target_stats__forest_leaf"
        viewBox="0 0 140 120"
        sx={{
          height: 160,
          opacity: 0.16,
          position: 'absolute',
          right: { xs: -24, sm: 36 },
          top: -46,
          width: 180,
        }}
      >
        <path
          d="M22 82 C34 28 92 5 128 20 C118 68 76 108 22 82 Z"
          fill="#75a843"
          stroke="#2f4d24"
          strokeWidth="5"
        />
        <path
          d="M30 78 C56 62 82 44 118 24"
          fill="none"
          stroke="#f4fbeb"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          d="M58 62 C58 48 54 38 48 29 M78 50 C80 38 78 29 72 20 M52 66 C42 61 33 60 24 61"
          fill="none"
          stroke="#f4fbeb"
          strokeLinecap="round"
          strokeWidth="4"
          opacity="0.74"
        />
      </Box>
      <Box
        component="svg"
        data-test="target_stats__forest_mushroom"
        viewBox="0 0 128 128"
        sx={{
          bottom: -40,
          height: 150,
          left: '48%',
          opacity: 0.12,
          position: 'absolute',
          transform: 'translateX(-50%) rotate(6deg)',
          width: 150,
        }}
      >
        <path
          d="M18 62 C24 26 50 14 72 18 C96 22 112 42 110 68 C86 64 52 64 18 62 Z"
          fill="#d86b7c"
          stroke="#6a2130"
          strokeWidth="5"
        />
        <path
          d="M48 62 H82 L88 111 H42 Z"
          fill="#fff7df"
          stroke="#6a2130"
          strokeWidth="5"
        />
        <circle cx="48" cy="38" fill="#fff7df" r="8" />
        <circle cx="78" cy="34" fill="#fff7df" r="7" />
        <circle cx="94" cy="53" fill="#fff7df" r="6" />
      </Box>
      <Box
        component="svg"
        data-test="target_stats__forest_creek"
        viewBox="0 0 260 62"
        sx={{
          bottom: 18,
          height: 70,
          left: -42,
          opacity: 0.17,
          position: 'absolute',
          transform: 'rotate(-10deg)',
          width: 280,
        }}
      >
        <path
          d="M10 42 C46 10 88 58 130 28 C174 -4 210 42 252 20"
          fill="none"
          stroke="#65a8c9"
          strokeLinecap="round"
          strokeWidth="18"
        />
        <path
          d="M20 40 C54 20 84 50 124 31 C166 12 202 36 246 22"
          fill="none"
          stroke="#e7f7ef"
          strokeLinecap="round"
          strokeWidth="6"
        />
      </Box>
    </Box>
  );
}

function CurrentPromptStatsButton({
  attempts,
  exerciseType,
  interfaceLanguage,
  prompt,
  resultColors,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  exerciseType: 'missingLetters' | 'missingWord' | 'multipleChoice';
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  prompt: ExercisePrompt;
  resultColors: ReturnType<typeof getWorldResultColors>;
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
  const recentResults =
    getRecentResultsByCardId({
      attempts,
      cardIds: [prompt.cardId],
      targetLanguage,
    })[prompt.cardId] ?? [];

  return (
    <CursorAnchoredTooltip
      arrowDataTest={`current_prompt_stats__tooltip_arrow__${prompt.cardId}`}
      closeOnOtherOpen
      describeChild
      leaveDelay={0}
      transitionTimeout={0}
      tooltipSx={{
        bgcolor: '#ffffff',
        border: '1px solid rgba(32, 48, 21, 0.14)',
        boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
        color: '#203015',
        p: 1.25,
      }}
      title={
        <Stack data-test={`current_prompt_stats__tooltip__${prompt.cardId}`} spacing={1}>
          <SplitWordStatsChip
            correct={stats.correct}
            dataTestPrefix={`current_prompt_stats__tooltip_split_stats__${prompt.cardId}`}
            incorrect={stats.incorrect}
            interfaceLanguage={interfaceLanguage}
            resultColors={resultColors}
            size="compact"
            statsLabel={statsLabel}
          />
          <Typography
            data-test={`current_prompt_stats__recent_title__${prompt.cardId}`}
            sx={{
              color: '#203015',
              display: recentResults.length > 0 ? 'block' : 'none',
              fontSize: 14,
              fontWeight: 850,
            }}
          >
            {t(interfaceLanguage, 'recentAnswersTitle')}
          </Typography>
          {recentResults.length === 0 ? (
            <Typography
              data-test={`current_prompt_stats__empty__${prompt.cardId}`}
              sx={{ color: 'rgba(32, 48, 21, 0.68)', fontSize: 13, fontWeight: 750 }}
            >
              {t(interfaceLanguage, 'noCardStatsYet')}
            </Typography>
          ) : (
            <Stack data-test={`current_prompt_stats__recent_results__${prompt.cardId}`} spacing={0.5}>
              {recentResults.slice(0, 10).map((result, index) => (
                <Stack
                  data-test={`current_prompt_stats__recent_result__${prompt.cardId}__${index}`}
                  direction="row"
                  key={`${result.occurredAt}-${index}`}
                  spacing={0.75}
                  sx={{ alignItems: 'center' }}
                >
                  <Chip
                    data-test={`current_prompt_stats__recent_result_chip__${prompt.cardId}__${index}`}
                    label={t(
                      interfaceLanguage,
                      result.isCorrect
                        ? 'metricCorrectSuffix'
                        : 'metricIncorrectSuffix',
                    )}
                    size="small"
                    sx={{
                      bgcolor: result.isCorrect
                        ? resultColors.correct.soft
                        : resultColors.incorrect.soft,
                      border: '1px solid',
                      borderColor: result.isCorrect
                        ? resultColors.correct.border
                        : resultColors.incorrect.border,
                      color: '#111111',
                      fontSize: 12,
                      fontWeight: 800,
                      height: 24,
                    }}
                  />
                  <Typography sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}>
                    {formatAttemptDate(result.occurredAt)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      }
    >
      <IconButton
        aria-label={`${statsLabel}: ${t(interfaceLanguage, 'correct')} ${
          stats.correct
        }, ${t(interfaceLanguage, 'incorrect')} ${stats.incorrect}`}
        data-test={`current_prompt_stats__icon_button__${prompt.cardId}`}
        type="button"
        size="small"
        sx={{
          bgcolor: 'rgba(32, 48, 21, 0.045)',
          border: '1px solid rgba(32, 48, 21, 0.12)',
          color: 'rgba(32, 48, 21, 0.54)',
          cursor: 'pointer',
          height: 30,
          width: 30,
          '&:hover': {
            bgcolor: 'rgba(32, 48, 21, 0.08)',
            color: 'rgba(32, 48, 21, 0.72)',
          },
        }}
      >
        <QueryStatsOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </CursorAnchoredTooltip>
  );
}

function FinishExerciseAction({
  interfaceLanguage,
  jumpSelector,
  onClick,
  progressChip,
  showHypersonicJumpGuide = true,
  worldId,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  jumpSelector?: FinishExerciseJumpSelector;
  onClick: () => void;
  progressChip?: ReactNode;
  showHypersonicJumpGuide?: boolean;
  worldId: WorldId;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const hasFinishExerciseLampBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasFinishExerciseLampBeenShown),
  );
  const hasHypersonicJumpLampBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasHypersonicJumpLampBeenShown),
  );
  const jumpBenefitKey =
    worldId === 'forest'
      ? 'finishExerciseJumpBenefitForest'
      : 'finishExerciseJumpBenefitFootball';
  const jumpTooltipKey =
    worldId === 'forest'
      ? 'finishExerciseJumpTooltipForest'
      : 'finishExerciseJumpTooltipFootball';
  const jumpVisualTheme = getJumpVisualTheme(worldId);

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
            <HotkeyShortcutTooltip
              interfaceLanguage={interfaceLanguage}
              worldId={worldId}
            />
          )}
          <Box
            data-test="exercise_finish_action__thought_bubble"
            sx={{
              alignItems: 'flex-start',
              bgcolor: jumpVisualTheme.bubbleBg,
              border: `1px solid ${jumpVisualTheme.bubbleBorder}`,
              borderRadius: '18px 18px 6px 18px',
              boxShadow: jumpVisualTheme.bubbleShadow,
              color: jumpVisualTheme.text,
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
                bgcolor: jumpVisualTheme.bubbleBg,
                border: `1px solid ${jumpVisualTheme.bubbleBorder}`,
                borderRadius: '999px',
                bottom: -8,
                content: '""',
                height: 12,
                position: 'absolute',
                right: 36,
                width: 12,
              },
              '&::after': {
                bgcolor: jumpVisualTheme.bubbleBg,
                border: `1px solid ${jumpVisualTheme.bubbleBorder}`,
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
                {t(interfaceLanguage, jumpTooltipKey)}
              </TooltipContent>
            }
            tooltipSx={jumpInfoTooltipStyles}
          >
            <Box
              aria-label={t(interfaceLanguage, jumpTooltipKey)}
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
                  jumpVisualTheme.lampGradient,
                border: `1px solid ${jumpVisualTheme.lampBorder}`,
                borderRadius: '999px',
                boxShadow:
                  jumpVisualTheme.lampShadow,
                color: jumpVisualTheme.icon,
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
                    jumpVisualTheme.lampHoverShadow,
                  transform: 'translateY(-1px) scale(1.04)',
                },
                '@keyframes hypersonicJumpLampPulse': {
                  '0%, 100%': {
                    boxShadow:
                      jumpVisualTheme.lampShadow,
                    filter: 'brightness(1)',
                  },
                  '50%': {
                    boxShadow:
                      jumpVisualTheme.lampPulseShadow,
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
                  color: jumpVisualTheme.text,
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
                {t(interfaceLanguage, jumpBenefitKey)}
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
                        index % 2 === 0 ? '#ffffff' : jumpVisualTheme.optionStripe;

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
                                index % 2 === 0
                                  ? jumpVisualTheme.optionHover
                                  : jumpVisualTheme.optionStripeHover,
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
            {progressChip ? (
              <Box
                data-test="exercise_finish_action__progress_slot"
                sx={{
                  display: 'inline-flex',
                  justifyContent: 'flex-start',
                  minWidth: 0,
                }}
              >
                {progressChip}
              </Box>
            ) : null}
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
  worldId,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  worldId: WorldId;
}) {
  const jumpVisualTheme = getJumpVisualTheme(worldId);

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
          cursor: 'default',
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
            background: jumpVisualTheme.hotkeyGradient,
            border: `1px solid ${jumpVisualTheme.hotkeyBorder}`,
            borderRadius: '14px',
            boxShadow: jumpVisualTheme.hotkeyShadow,
            color: jumpVisualTheme.hotkeyText,
            cursor: 'default',
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
              background: jumpVisualTheme.hotkeyBottomGradient,
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
              boxShadow: jumpVisualTheme.hotkeyHoverShadow,
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

function getJumpVisualTheme(worldId: WorldId) {
  if (worldId === 'forest') {
    return {
      bubbleBg: 'rgba(246, 255, 235, 0.96)',
      bubbleBorder: 'rgba(91, 150, 54, 0.26)',
      bubbleShadow: '0 12px 28px rgba(58, 89, 40, 0.12)',
      hotkeyBorder: 'rgba(91, 150, 54, 0.36)',
      hotkeyBottomGradient:
        'linear-gradient(180deg, rgba(91, 150, 54, 0.30), rgba(49, 96, 38, 0.20))',
      hotkeyGradient:
        'linear-gradient(145deg, #ffffff 0%, #f3ffe8 38%, #cbeea4 72%, #8fca62 100%)',
      hotkeyHoverShadow:
        'inset 0 2px 0 rgba(255,255,255,0.98), inset 4px 0 0 rgba(255,255,255,0.36), inset -3px 0 0 rgba(49, 96, 38, 0.12), inset 0 -6px 0 rgba(49, 96, 38, 0.22), 0 10px 18px rgba(58, 89, 40, 0.20)',
      hotkeyShadow:
        'inset 0 2px 0 rgba(255,255,255,0.96), inset 4px 0 0 rgba(255,255,255,0.32), inset -3px 0 0 rgba(49, 96, 38, 0.10), inset 0 -6px 0 rgba(49, 96, 38, 0.20), 0 8px 14px rgba(58, 89, 40, 0.16)',
      hotkeyText: '#386f2d',
      icon: '#386f2d',
      lampBorder: 'rgba(91, 150, 54, 0.34)',
      lampGradient:
        'radial-gradient(circle at 45% 35%, #fff9c7 0%, #bfe879 44%, #5b9636 100%)',
      lampHoverShadow:
        '0 0 0 4px rgba(191, 232, 121, 0.32), 0 12px 26px rgba(58, 89, 40, 0.26)',
      lampPulseShadow:
        '0 0 0 5px rgba(191, 232, 121, 0.34), 0 14px 30px rgba(58, 89, 40, 0.28)',
      lampShadow:
        '0 0 0 3px rgba(191, 232, 121, 0.22), 0 10px 22px rgba(58, 89, 40, 0.20)',
      optionHover: '#f4faee',
      optionStripe: '#f1fae7',
      optionStripeHover: '#e7f5dc',
      text: '#2f4d24',
    };
  }

  return {
    bubbleBg: 'rgba(255, 248, 217, 0.96)',
    bubbleBorder: 'rgba(198, 11, 30, 0.24)',
    bubbleShadow: '0 12px 28px rgba(126, 55, 12, 0.12)',
    hotkeyBorder: 'rgba(198, 11, 30, 0.34)',
    hotkeyBottomGradient:
      'linear-gradient(180deg, rgba(198, 11, 30, 0.30), rgba(126, 55, 12, 0.18))',
    hotkeyGradient:
      'linear-gradient(145deg, #ffffff 0%, #fff5c5 38%, #ffd15f 72%, #e96f12 100%)',
    hotkeyHoverShadow:
      'inset 0 2px 0 rgba(255,255,255,0.98), inset 4px 0 0 rgba(255,255,255,0.36), inset -3px 0 0 rgba(198, 11, 30, 0.12), inset 0 -6px 0 rgba(198, 11, 30, 0.22), 0 10px 18px rgba(126, 55, 12, 0.20)',
    hotkeyShadow:
      'inset 0 2px 0 rgba(255,255,255,0.96), inset 4px 0 0 rgba(255,255,255,0.32), inset -3px 0 0 rgba(198, 11, 30, 0.10), inset 0 -6px 0 rgba(198, 11, 30, 0.20), 0 8px 14px rgba(126, 55, 12, 0.16)',
    hotkeyText: '#8c171b',
    icon: '#a45112',
    lampBorder: 'rgba(198, 11, 30, 0.34)',
    lampGradient:
      'radial-gradient(circle at 45% 35%, #fff8b7 0%, #ffc400 44%, #c60b1e 100%)',
    lampHoverShadow:
      '0 0 0 4px rgba(255, 196, 0, 0.32), 0 12px 26px rgba(198, 11, 30, 0.24)',
    lampPulseShadow:
      '0 0 0 5px rgba(255, 196, 0, 0.34), 0 14px 30px rgba(198, 11, 30, 0.26)',
    lampShadow:
      '0 0 0 3px rgba(255, 196, 0, 0.22), 0 10px 22px rgba(198, 11, 30, 0.20)',
    optionHover: '#fff7dc',
    optionStripe: '#fff0c8',
    optionStripeHover: '#ffe4a8',
    text: '#743016',
  };
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
  resultColors,
}: {
  completedAt: string;
  correct: number;
  incorrect: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onFinish: () => void;
  resultColors: ReturnType<typeof getWorldResultColors>;
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
          resultColors={resultColors}
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
  resultColors,
  showExpectedAnswers,
  targetLanguage,
}: {
  attempt: ExerciseAttempt;
  cardStats: RootState['stats']['cardStats'];
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  resultColors: ReturnType<typeof getWorldResultColors>;
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
              resultColors={resultColors}
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
              resultColors={resultColors}
              size="compact"
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

function getMissingLettersCooldownDetailsText({
  coolingCount,
  interfaceLanguage,
  nextReviewAt,
  totalCount,
}: {
  coolingCount: number;
  interfaceLanguage: SupportedLanguage;
  nextReviewAt: string;
  totalCount: number;
}): string {
  const availableAt = formatCooldownDate(nextReviewAt, interfaceLanguage);

  if (interfaceLanguage === 'es') {
    return `Todas las palabras disponibles estan en pausa por estadisticas. La primera volvera el ${availableAt}. En pausa: ${coolingCount} de ${totalCount}.`;
  }

  if (interfaceLanguage === 'uk') {
    return `Усі доступні слова тимчасово на паузі за статистикою. Перше слово повернеться ${availableAt}. На паузі: ${coolingCount} з ${totalCount}.`;
  }

  if (interfaceLanguage === 'ru') {
    return `Все доступные слова временно на паузе по статистике. Первое слово вернется ${availableAt}. На паузе: ${coolingCount} из ${totalCount}.`;
  }

  return `All available words are temporarily paused by practice statistics. The first word returns on ${availableAt}. Cooling down: ${coolingCount} of ${totalCount}.`;
}

function getIgnoreCooldownButtonLabel(interfaceLanguage: SupportedLanguage): string {
  if (interfaceLanguage === 'es') {
    return 'Quiero jugar de todos modos';
  }

  if (interfaceLanguage === 'uk') {
    return 'Все одно хочу зіграти';
  }

  if (interfaceLanguage === 'ru') {
    return 'Все равно хочу сыграть';
  }

  return 'Play anyway';
}

function formatCooldownDate(value: string, language: SupportedLanguage): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(getDateLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getDateLocale(language: SupportedLanguage): string {
  switch (language) {
    case 'es':
      return 'es-ES';
    case 'uk':
      return 'uk-UA';
    case 'ru':
      return 'ru-RU';
    case 'en':
    default:
      return 'en-US';
  }
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
