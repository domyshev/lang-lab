import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
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
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { AppShell, AppShellSection } from './components/AppShell';
import { AssistantProfileView } from './components/AssistantProfileView';
import { CoachPanel } from './components/CoachPanel';
import { ExercisePicker } from './components/ExercisePicker';
import { GameHelpPanel } from './components/GameHelpPanel';
import { HistoryView } from './components/HistoryView';
import { ImportCardsView } from './components/ImportCardsView';
import { SplitWordStatsChip } from './components/SplitWordStatsChip';
import { MetricChip, StatsFormula } from './components/StatsFormula';
import { ThemeDetailView } from './components/ThemeDetailView';
import { ThemeListView } from './components/ThemeListView';
import { CrosswordExercise } from './components/exercises/CrosswordExercise';
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
import { CrosswordPuzzle, createCrossword } from './domain/crossword';
import { defaultVocabularyJson } from './domain/defaultVocabulary';
import { getCoachProgressMessage } from './domain/coachProgress';
import { AssistantId } from './domain/assistants';
import {
  ExerciseAttempt,
  ExercisePrompt,
  ExerciseType,
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from './domain/exercises';
import { summarizeExerciseHistory } from './domain/exerciseHistory';
import { importLanguageCards } from './domain/importCards';
import { getLanguageDisplayName, t } from './domain/i18n';
import { languageFlags } from './domain/languages';
import {
  getPracticeSettings,
  orderCardsForMissingLettersPractice,
} from './domain/practiceOrdering';
import { ALL_WORDS_THEME_ID, Theme } from './domain/themes';
import { saveAttempt } from './store/attemptsSlice';
import { acknowledgeGameHelp, markGameHelpCoachmarkShown } from './store/appSlice';
import { applyImportResult } from './store/cardsSlice';
import { recordAttemptStats } from './store/statsSlice';
import { selectTheme } from './store/themesSlice';
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

type SelectableTheme = Theme & { isAllWords?: boolean };

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

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const hasSeededDefaultVocabulary = useRef(false);
  const [activeSection, setActiveSection] =
    useState<AppShellSection>('game');
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType>('crossword');
  const [selectedGameThemeId, setSelectedGameThemeId] = useState('');
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
  const [currentExerciseSessionId, setCurrentExerciseSessionId] = useState(() =>
    createId('exercise-session'),
  );
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishDialogIntent, setFinishDialogIntent] = useState<
    'finish' | 'home' | null
  >(null);
  const [profileAssistantId, setProfileAssistantId] =
    useState<AssistantId | null>(null);

  const cards = useSelector((state: RootState) => state.cards.cards);
  const themes = useSelector((state: RootState) => state.themes.themes);
  const selectedThemeId = useSelector(
    (state: RootState) => state.themes.selectedThemeId,
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

  const visibleThemes = useMemo(
    () => themes.filter((theme) => !theme.archivedAt),
    [themes],
  );
  const selectedTheme = useMemo<SelectableTheme | undefined>(() => {
    if (!selectedThemeId || selectedThemeId === ALL_WORDS_THEME_ID) {
      return {
        id: ALL_WORDS_THEME_ID,
        name: t(interfaceLanguage, 'allWords'),
        cardIds: cards.map((card) => card.id),
        createdAt: '',
        updatedAt: '',
        isAllWords: true,
      };
    }

    return visibleThemes.find((theme) => theme.id === selectedThemeId);
  }, [cards, interfaceLanguage, selectedThemeId, visibleThemes]);
  const themeCards = useMemo(() => {
    if (!selectedTheme) {
      return [];
    }

    return selectedTheme.cardIds
      .map((cardId) => cards.find((card) => card.id === cardId))
      .filter((card): card is LanguageCard => Boolean(card));
  }, [cards, selectedTheme]);
  const eligibleCards = useMemo(
    () => getEligibleCardsForTarget(themeCards, targetLanguage),
    [targetLanguage, themeCards],
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
  const missingLettersOrderedCards = useMemo(
    () =>
      orderCardsForMissingLettersPractice({
        attempts,
        cards: missingLettersEligibleCards,
        now: new Date().toISOString(),
        seed: generationSeed,
        settings: getPracticeSettings(practiceSettings),
        targetLanguage,
      }),
    [
      attempts,
      generationSeed,
      missingLettersEligibleCards,
      practiceSettings,
      targetLanguage,
    ],
  );
  const missingWordOrderedCards = useMemo(
    () =>
      orderCardsForMissingLettersPractice({
        attempts,
        cards: missingWordEligibleCards,
        now: new Date().toISOString(),
        seed: generationSeed,
        settings: getPracticeSettings(practiceSettings),
        targetLanguage,
      }),
    [
      attempts,
      generationSeed,
      missingWordEligibleCards,
      practiceSettings,
      targetLanguage,
    ],
  );
  const lastSavedAttempt =
    attempts.find((attempt) => attempt.id === lastSavedAttemptId) ?? null;

  useEffect(() => {
    if (hasSeededDefaultVocabulary.current || cards.length > 0) {
      return;
    }

    hasSeededDefaultVocabulary.current = true;
    const result = importLanguageCards({
      existingCards: [],
      pastedJson: defaultVocabularyJson,
      now: new Date().toISOString(),
    });

    if (result.cards.length > 0) {
      dispatch(applyImportResult(result));
    }
  }, [cards.length, dispatch]);

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
        randomizedEligibleCards.find(
          (card) => !blockedCardIds.includes(card.id),
        ) ?? firstCard;
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
      const occurrenceCounts = new Map<string, number>();
      const missingLettersPrompts = missingLettersOrderedCards
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
      const heldResultPrompt =
        resultPromptHold?.exerciseType === 'missingLetters'
          ? resultPromptHold.prompt
          : undefined;
      return {
        type: 'missingLetters',
        prompt:
          heldResultPrompt ??
          pickPracticePrompt(
            missingLettersPrompts,
            answeredMissingLettersPromptKeys,
          ),
      };
    }

    const occurrenceCounts = new Map<string, number>();
    const missingWordPrompts = missingWordOrderedCards
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
    const heldResultPrompt =
      resultPromptHold?.exerciseType === 'missingWord'
        ? resultPromptHold.prompt
        : undefined;
    return {
      type: 'missingWord',
      prompt:
        heldResultPrompt ??
        pickPracticePrompt(missingWordPrompts, answeredMissingWordPromptKeys),
    };
  }, [
    answeredMissingLettersPromptKeys,
    answeredMissingWordPromptKeys,
    answeredMultipleChoiceCardIds,
    missingLettersOrderedCards,
    missingWordOrderedCards,
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
    setCompletedMissingLettersCardIds([]);
    setCompletedMissingWordCardIds([]);
    setCompletedMultipleChoiceCardIds([]);
    setResultPromptHold(null);
    setCompletedExerciseSummary(null);
    setCurrentExerciseAnsweredCount(0);
    setCurrentExerciseSessionId(createId('exercise-session'));
    setGenerationSeed((seed) => seed + 1);
  }

  function openFinishDialog(intent: 'finish' | 'home') {
    if (currentExerciseAnsweredCount === 0) {
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
  ) {
    const prompts: ExercisePrompt[] = puzzle.entries.map((entry) => ({
      cardId: entry.cardId,
      prompt: entry.clue,
      expectedAnswer: entry.answer,
      translationHints:
        themeCards.find((card) => card.id === entry.cardId)
          ? getTranslationHints(
              themeCards.find((card) => card.id === entry.cardId)!,
              targetLanguage,
            )
          : [],
    }));
    const correctness = Object.fromEntries(
      puzzle.entries.map((entry) => [
        entry.cardId,
        normalizeAnswer(answers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer),
      ]),
    );
    const hintsUsed = Object.fromEntries(
      puzzle.entries.map((entry) => [entry.cardId, 0]),
    );

    persistAttempt({
      exerciseType: 'crossword',
      prompts,
      answers,
      correctness,
      hintsUsed,
      cardIds: puzzle.entries.map((entry) => entry.cardId),
      advance: false,
      isExerciseCompleted: true,
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
  }) {
    if (!selectedTheme) {
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
      themeId: selectedTheme.id,
      targetLanguage,
      createdAt: now,
      completedAt: now,
      cardSnapshots: themeCards
        .filter((card) => input.cardIds.includes(card.id))
        .map(createCardSnapshot),
      prompts: input.prompts,
      answers: input.answers,
      correctness: input.correctness,
      hintsUsed: input.hintsUsed,
      isExerciseCompleted: input.isExerciseCompleted,
      weightedScore,
    };

    dispatch(saveAttempt(attempt));
    dispatch(recordAttemptStats(attempt));
    setLastSavedAttemptId(attempt.id);
    setCurrentExerciseAnsweredCount((count) => count + input.cardIds.length);
    if (input.advance) {
      setGenerationSeed((seed) => seed + 1);
    }
  }

  function completeExerciseSession(exerciseType: ExerciseType) {
    if (!selectedTheme) {
      return;
    }

    const now = new Date().toISOString();
    const completionMarker: ExerciseAttempt = {
      id: createId('attempt'),
      exerciseSessionId: currentExerciseSessionId,
      exerciseType,
      themeId: selectedTheme.id,
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
          }}
        >
          <ThemeListView />
          <ThemeDetailView />
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
        <Stack data-test="app__game_setup_section" spacing={3}>
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
          {!completedExerciseSummary && (
            <Button
              data-test="app__finish_exercise_button"
              variant="outlined"
              color="error"
              onClick={() => openFinishDialog('finish')}
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'center' },
                flexShrink: 0,
                ml: { sm: 'auto' },
              }}
            >
              {t(interfaceLanguage, 'finishExercise')}
            </Button>
          )}
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
          interfaceLanguage={interfaceLanguage}
          onCancel={handleFinishDialogCancel}
          onConfirm={handleFinishDialogConfirm}
          answeredCount={currentExerciseAnsweredCount}
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
    const currentThemeId = selectedGameThemeId;
    const canStart =
      Boolean(currentThemeId) &&
      Boolean(selectedTheme) &&
      eligibleCards.length > 0 &&
      (selectedExerciseType !== 'multipleChoice' || eligibleCards.length >= 3);

    const handleThemeChange = (event: SelectChangeEvent<string>) => {
      const nextThemeId = event.target.value;
      setSelectedGameThemeId(nextThemeId);
      dispatch(selectTheme(nextThemeId));
      resetExerciseState();
    };

    return (
      <Paper
        data-test="game_setup__panel"
        sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}
      >
        <Stack data-test="game_setup__content" spacing={3}>
          <Stack data-test="game_setup__theme_section" spacing={2}>
            <Typography
              component="h2"
              data-test="game_setup__theme_title"
              variant="h6"
            >
              {t(interfaceLanguage, 'chooseTheme')}
            </Typography>
            <FormControl data-test="game_setup__theme_control" fullWidth>
              <Select
                data-test="game_setup__theme_select"
                displayEmpty
                inputProps={{
                  'aria-label': t(interfaceLanguage, 'chooseTheme'),
                }}
                value={currentThemeId}
                onChange={handleThemeChange}
                sx={{
                  height: 40,
                  '& .MuiSelect-select': {
                    alignItems: 'center',
                    display: 'flex',
                    minHeight: '0 !important',
                    py: 0.75,
                  },
                }}
              >
                <MenuItem
                  data-test="game_setup__theme_option__empty"
                  disabled
                  value=""
                  sx={{ display: 'none' }}
                />
                <MenuItem
                  data-test="game_setup__theme_option__all_words"
                  value={ALL_WORDS_THEME_ID}
                >
                  {t(interfaceLanguage, 'allWords')} ({cards.length})
                </MenuItem>
                {visibleThemes.map((theme) => (
                  <MenuItem
                    data-test={`game_setup__theme_option__${theme.id}`}
                    key={theme.id}
                    value={theme.id}
                  >
                    {theme.name} ({theme.cardIds.length})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <ExercisePicker
            selectedExerciseType={selectedExerciseType}
            onPick={(exerciseType) => {
              setSelectedExerciseType(exerciseType);
              resetExerciseState();
            }}
          />

          {!canStart && (
            <Alert data-test="game_setup__cannot_start_alert" severity="info">
              {t(interfaceLanguage, 'cannotStartGame')}
            </Alert>
          )}

          <Button
            data-test="game_setup__start_button"
            variant="contained"
            size="large"
            onClick={() => {
              setIsExerciseStarted(true);
              setAnsweredMissingLettersPromptKeys([]);
              setAnsweredMissingWordPromptKeys([]);
              setAnsweredMultipleChoiceCardIds([]);
              setCompletedMissingLettersCardIds([]);
              setCompletedMissingWordCardIds([]);
              setCompletedMultipleChoiceCardIds([]);
              setResultPromptHold(null);
              setCompletedExerciseSummary(null);
              setCurrentExerciseAnsweredCount(0);
              setLastSavedAttemptId(null);
              setCurrentExerciseSessionId(createId('exercise-session'));
              setGenerationSeed((seed) => seed + 1);
            }}
            disabled={!canStart}
            sx={{ alignSelf: 'flex-start', minWidth: 160 }}
          >
            {t(interfaceLanguage, 'start')}
          </Button>
        </Stack>
      </Paper>
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

    if (!selectedTheme) {
      return (
        <Alert data-test="exercise_area__missing_theme_alert" severity="info">
          Select a theme to start a practice set.
        </Alert>
      );
    }

    if (eligibleCards.length === 0) {
      return (
        <Alert data-test="exercise_area__no_target_cards_alert" severity="warning">
          This theme has no cards for{' '}
          {getLanguageDisplayName(interfaceLanguage, targetLanguage)} yet.
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
          onThemeOpen={() => {
            dispatch(selectTheme(selectedTheme.id));
            setActiveSection('cards');
          }}
          puzzle={exercisePreview.puzzle}
          recentResultsByCardId={getRecentResultsByCardId({
            attempts,
            cardIds: exercisePreview.puzzle.entries.map((entry) => entry.cardId),
            targetLanguage,
          })}
          themeName={selectedTheme.name}
          onFinish={resetExerciseState}
          onSubmit={(answers) =>
            saveCrosswordAttempt(exercisePreview.puzzle, answers)
          }
        />
      );
    }

    if (exercisePreview.type === 'multipleChoice') {
      return (
        <MultipleChoiceExercise
          key={`${exercisePreview.prompt.cardId}:${generationSeed}`}
          interfaceLanguage={interfaceLanguage}
          progressCompletedCount={completedMultipleChoiceCardIds.length}
          progressTotalCount={eligibleCards.length}
          prompt={exercisePreview.prompt}
          themeName={selectedTheme.name}
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
            Missing letters practice needs single-word cards for the target
            language.
          </Alert>
        );
      }

      const missingLettersPrompt = exercisePreview.prompt;
      return (
        <MissingLettersExercise
          key={missingLettersPrompt.practiceKey}
          interfaceLanguage={interfaceLanguage}
          isRepeatedPrompt={completedMissingLettersCardIds.includes(
            missingLettersPrompt.cardId,
          )}
          progressCompletedCount={completedMissingLettersCardIds.length}
          progressTotalCount={missingLettersEligibleCards.length}
          prompt={missingLettersPrompt}
          themeName={selectedTheme.name}
          onAnswer={(answer) =>
            savePromptAttempt('missingLetters', missingLettersPrompt, answer, {
              advance: false,
            })
          }
          onNext={() => {
            const nextCompletedCardIds = uniqueValues([
              ...completedMissingLettersCardIds,
              missingLettersPrompt.cardId,
            ]);
            if (
              nextCompletedCardIds.length >= missingLettersEligibleCards.length
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
        isRepeatedPrompt={completedMissingWordCardIds.includes(
          missingWordPrompt.cardId,
        )}
        prompt={missingWordPrompt}
        progressCompletedCount={completedMissingWordCardIds.length}
        progressTotalCount={missingWordEligibleCards.length}
        themeName={selectedTheme.name}
        onAnswer={(answer) =>
          savePromptAttempt('missingWord', missingWordPrompt, answer, {
            advance: false,
          })
        }
        onNext={() => {
          const nextCompletedCardIds = uniqueValues([
            ...completedMissingWordCardIds,
            missingWordPrompt.cardId,
          ]);
          if (nextCompletedCardIds.length >= missingWordEligibleCards.length) {
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
      <Paper data-test="target_stats__panel" sx={{ p: 2 }}>
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
              sx={{ alignItems: 'center', minWidth: 0 }}
            >
              <Stack
                data-test="target_stats__answered_formula__body"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  maxWidth: '100%',
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
                        вопросов
                      </Box>
                    </>
                  ) : (
                    t(interfaceLanguage, 'totalAnsweredQuestions')
                  )}
                </Typography>
                <StatsFormula
                  correct={correct}
                  dataTestPrefix="target_stats__answered_formula"
                  incorrect={incorrect}
                  interfaceLanguage={interfaceLanguage}
                  showLabel={false}
                  total={totalAnswered}
                  totalLabel={t(interfaceLanguage, 'totalAnsweredQuestions')}
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
          variant="contained"
          onClick={onFinish}
          sx={{ minWidth: 150 }}
        >
          {t(interfaceLanguage, 'finish')}
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
  interfaceLanguage,
  onCancel,
  onConfirm,
  open,
}: {
  answeredCount: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onCancel: () => void;
  onConfirm: () => void;
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
          maxWidth: 420,
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
        <Typography data-test="finish_exercise_dialog__notice">
          {t(interfaceLanguage, 'finishExerciseNotice')}
        </Typography>
        <Typography data-test="finish_exercise_dialog__answered_count" sx={{ mt: 2 }}>
          {t(interfaceLanguage, 'answeredWords')}: {answeredCount}
        </Typography>
      </DialogContent>
      <DialogActions
        data-test="finish_exercise_dialog__actions"
        sx={{ px: 3, pb: 2 }}
      >
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

function pickPracticePrompt<T extends PracticePrompt<ExercisePrompt>>(
  prompts: T[],
  answeredPromptKeys: string[],
): T | undefined {
  const lastAnsweredPromptKey = answeredPromptKeys[answeredPromptKeys.length - 1];
  const lastAnsweredPrompt = prompts.find(
    (prompt) => prompt.practiceKey === lastAnsweredPromptKey,
  );
  const blockedPromptKeys =
    answeredPromptKeys.length >= prompts.length
      ? [lastAnsweredPromptKey]
      : answeredPromptKeys;
  const availablePrompts = prompts.filter(
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
