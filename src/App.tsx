import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { AppShell, AppShellSection } from './components/AppShell';
import { CoachPanel } from './components/CoachPanel';
import { ExercisePicker } from './components/ExercisePicker';
import { HistoryView } from './components/HistoryView';
import { ImportCardsView } from './components/ImportCardsView';
import { SplitWordStatsChip } from './components/SplitWordStatsChip';
import { CountMetric, StatsFormula } from './components/StatsFormula';
import { ThemeDetailView } from './components/ThemeDetailView';
import { ThemeListView } from './components/ThemeListView';
import { CrosswordExercise } from './components/exercises/CrosswordExercise';
import { MissingLettersExercise } from './components/exercises/MissingLettersExercise';
import { MissingWordExercise } from './components/exercises/MissingWordExercise';
import { MultipleChoiceExercise } from './components/exercises/MultipleChoiceExercise';
import {
  LanguageCard,
  createCardSnapshot,
  getTranslationHints,
} from './domain/cards';
import { CrosswordPuzzle, createCrossword } from './domain/crossword';
import { defaultVocabularyJson } from './domain/defaultVocabulary';
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
import { ALL_WORDS_THEME_ID, Theme } from './domain/themes';
import { saveAttempt } from './store/attemptsSlice';
import { applyImportResult } from './store/cardsSlice';
import { recordAttemptStats } from './store/statsSlice';
import { selectTheme } from './store/themesSlice';
import { AppDispatch, RootState } from './store/store';

type ExercisePreview =
  | { type: 'crossword'; puzzle: CrosswordPuzzle }
  | { type: 'multipleChoice'; prompt: ExercisePrompt & { options: string[] } }
  | { type: 'missingLetters'; prompt?: ExercisePrompt & { maskedAnswer: string } }
  | { type: 'missingWord'; prompt?: ExercisePrompt & { sentenceWithGap: string } };

type SelectableTheme = Theme & { isAllWords?: boolean };

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const hasSeededDefaultVocabulary = useRef(false);
  const [activeSection, setActiveSection] =
    useState<AppShellSection>('game');
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType>('crossword');
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [generationSeed, setGenerationSeed] = useState(() => Date.now());
  const [lastSavedAttemptId, setLastSavedAttemptId] = useState<string | null>(
    null,
  );
  const [
    answeredMissingLettersCardIds,
    setAnsweredMissingLettersCardIds,
  ] = useState<string[]>([]);
  const [answeredMissingWordCardIds, setAnsweredMissingWordCardIds] = useState<
    string[]
  >([]);
  const [currentExerciseAnsweredCount, setCurrentExerciseAnsweredCount] =
    useState(0);
  const [currentExerciseSessionId, setCurrentExerciseSessionId] = useState(() =>
    createId('exercise-session'),
  );
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishDialogIntent, setFinishDialogIntent] = useState<
    'finish' | 'home' | null
  >(null);

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
      return {
        type: 'multipleChoice',
        prompt: createMultipleChoicePrompt({
          card: firstCard,
          distractorCards: randomizedEligibleCards.slice(1),
          targetLanguage,
        }),
      };
    }

    if (selectedExerciseType === 'missingLetters') {
      const missingLettersPrompts = randomizedEligibleCards
        .map((card) => createMissingLettersPrompt({ card, targetLanguage }))
        .filter((prompt): prompt is ExercisePrompt & { maskedAnswer: string } =>
          Boolean(prompt),
        );
      const lastAnsweredCardId =
        answeredMissingLettersCardIds[answeredMissingLettersCardIds.length - 1];
      const blockedCardIds =
        answeredMissingLettersCardIds.length >= missingLettersPrompts.length
          ? [lastAnsweredCardId]
          : answeredMissingLettersCardIds;

      return {
        type: 'missingLetters',
        prompt:
          missingLettersPrompts.find(
            (prompt) => !blockedCardIds.includes(prompt.cardId),
          ) ?? missingLettersPrompts[0],
      };
    }

    const missingWordPrompts = randomizedEligibleCards
      .map((card) => createMissingWordPrompt({ card, targetLanguage }))
      .filter((prompt): prompt is ExercisePrompt & { sentenceWithGap: string } =>
        Boolean(prompt),
      );

    return {
      type: 'missingWord',
      prompt: missingWordPrompts.find(
        (prompt) => !answeredMissingWordCardIds.includes(prompt.cardId),
      ),
    };
  }, [
    answeredMissingLettersCardIds,
    answeredMissingWordCardIds,
    randomizedEligibleCards,
    selectedExerciseType,
    targetLanguage,
  ]);

  function resetExerciseState() {
    setIsExerciseStarted(false);
    setLastSavedAttemptId(null);
    setAnsweredMissingLettersCardIds([]);
    setAnsweredMissingWordCardIds([]);
    setCurrentExerciseAnsweredCount(0);
    setCurrentExerciseSessionId(createId('exercise-session'));
    setGenerationSeed((seed) => seed + 1);
  }

  function openFinishDialog(intent: 'finish' | 'home') {
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

    setActiveSection('game');
  }

  function savePromptAttempt(
    exerciseType: Exclude<ExerciseType, 'crossword'>,
    prompt: ExercisePrompt,
    answer: string,
    options: { advance?: boolean } = {},
  ) {
    const isCorrect =
      normalizeAnswer(answer) === normalizeAnswer(prompt.expectedAnswer);

    persistAttempt({
      exerciseType,
      prompts: [prompt],
      answers: { [prompt.cardId]: answer },
      correctness: { [prompt.cardId]: isCorrect },
      hintsUsed: { [prompt.cardId]: 0 },
      cardIds: [prompt.cardId],
      advance: options.advance ?? true,
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
      advance: true,
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

  function renderMainContent() {
    if (activeSection === 'statistics') {
      return (
        <Stack spacing={3}>
          <TargetStatsPanel />
          <HistoryView />
        </Stack>
      );
    }

    if (activeSection === 'cards') {
      return (
        <Box
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

    if (activeSection === 'import') {
      return <ImportCardsView />;
    }

    return renderGameContent();
  }

  function renderGameContent() {
    if (!isExerciseStarted) {
      return <GameSetup />;
    }

    return (
      <Stack spacing={3}>
        <Stack
          data-testid="exercise-toolbar"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <CoachPanel thoughtSeed={generationSeed + currentExerciseAnsweredCount} />
          <Button
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
        </Stack>
        {renderExercise()}
        {lastSavedAttempt && (
          <AttemptSummary
            attempt={lastSavedAttempt}
            cardStats={cardStats}
            interfaceLanguage={interfaceLanguage}
            showExpectedAnswers={
              lastSavedAttempt.exerciseType !== 'missingLetters' &&
              lastSavedAttempt.exerciseType !== 'missingWord' &&
              lastSavedAttempt.exerciseType !== 'multipleChoice'
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

  function GameSetup() {
    const currentThemeId = selectedTheme?.id ?? ALL_WORDS_THEME_ID;
    const canStart =
      Boolean(selectedTheme) &&
      eligibleCards.length > 0 &&
      (selectedExerciseType !== 'multipleChoice' || eligibleCards.length >= 3);

    const handleThemeChange = (event: SelectChangeEvent<string>) => {
      dispatch(selectTheme(event.target.value));
      resetExerciseState();
    };

    return (
      <Paper sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="game-theme-label">
              {t(interfaceLanguage, 'chooseTheme')}
            </InputLabel>
            <Select
              labelId="game-theme-label"
              label={t(interfaceLanguage, 'chooseTheme')}
              value={currentThemeId}
              onChange={handleThemeChange}
            >
              <MenuItem value={ALL_WORDS_THEME_ID}>
                {t(interfaceLanguage, 'allWords')} ({cards.length})
              </MenuItem>
              {visibleThemes.map((theme) => (
                <MenuItem key={theme.id} value={theme.id}>
                  {theme.name} ({theme.cardIds.length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ExercisePicker
            selectedExerciseType={selectedExerciseType}
            onPick={(exerciseType) => {
              setSelectedExerciseType(exerciseType);
              resetExerciseState();
            }}
          />

          {!canStart && (
            <Alert severity="info">
              Import cards or choose a theme with cards for the current target
              language.
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setIsExerciseStarted(true);
              setAnsweredMissingLettersCardIds([]);
              setAnsweredMissingWordCardIds([]);
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
    if (!selectedTheme) {
      return (
        <Alert severity="info">Select a theme to start a practice set.</Alert>
      );
    }

    if (eligibleCards.length === 0) {
      return (
        <Alert severity="warning">
          This theme has no cards for{' '}
          {getLanguageDisplayName(interfaceLanguage, targetLanguage)} yet.
        </Alert>
      );
    }

    if (selectedExerciseType === 'multipleChoice' && eligibleCards.length < 3) {
      return (
        <Alert severity="info">
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
          puzzle={exercisePreview.puzzle}
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
          prompt={exercisePreview.prompt}
          onAnswer={(answer) =>
            savePromptAttempt('multipleChoice', exercisePreview.prompt, answer, {
              advance: false,
            })
          }
          onNext={() => {
            setLastSavedAttemptId(null);
            setGenerationSeed((seed) => seed + 1);
          }}
        />
      );
    }

    if (exercisePreview.type === 'missingLetters') {
      if (!exercisePreview.prompt) {
        return (
          <Alert severity="info">
            Missing letters practice needs single-word cards for the target
            language.
          </Alert>
        );
      }

      const missingLettersPrompt = exercisePreview.prompt;
      return (
        <MissingLettersExercise
          key={`${missingLettersPrompt.cardId}:${generationSeed}`}
          interfaceLanguage={interfaceLanguage}
          prompt={missingLettersPrompt}
          onAnswer={(answer) =>
            savePromptAttempt('missingLetters', missingLettersPrompt, answer, {
              advance: false,
            })
          }
          onNext={() => {
            setAnsweredMissingLettersCardIds((cardIds) => [
              ...cardIds.filter((cardId) => cardId !== missingLettersPrompt.cardId),
              missingLettersPrompt.cardId,
            ]);
            setLastSavedAttemptId(null);
            setGenerationSeed((seed) => seed + 1);
          }}
        />
      );
    }

    if (!exercisePreview.prompt) {
      return (
        <Alert severity="info">
          {t(interfaceLanguage, 'noMoreCardsInExercise')}
        </Alert>
      );
    }

    const missingWordPrompt = exercisePreview.prompt;
    return (
      <MissingWordExercise
        key={`${missingWordPrompt.cardId}:${generationSeed}`}
        prompt={missingWordPrompt}
        onAnswer={(answer) =>
          savePromptAttempt('missingWord', missingWordPrompt, answer, {
            advance: false,
          })
        }
        onNext={() => {
          setAnsweredMissingWordCardIds((cardIds) => [
            ...cardIds.filter((cardId) => cardId !== missingWordPrompt.cardId),
            missingWordPrompt.cardId,
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
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="overline">
            {languageFlags[targetLanguage]}{' '}
            {getLanguageDisplayName(interfaceLanguage, targetLanguage)}
          </Typography>
          <Typography variant="h6" component="h2">
            {t(interfaceLanguage, 'resultsTitle')}
          </Typography>
          <Stack spacing={2.25}>
            <CountMetric
              label={t(interfaceLanguage, 'totalExercises')}
              value={targetSummaries.length}
            />
            <StatsFormula
              correct={correct}
              incorrect={incorrect}
              interfaceLanguage={interfaceLanguage}
              total={totalAnswered}
              totalLabel={t(interfaceLanguage, 'totalAnsweredQuestions')}
            />
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      onLogoClick={handleLogoClick}
      onNavigate={setActiveSection}
    >
      {renderMainContent()}
    </AppShell>
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
    <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
      <Stack spacing={1.5}>
        {showExpectedAnswers && (
          <>
            <Typography variant="overline">
              {expectedAnswers.length === 1
                ? t(interfaceLanguage, 'correctAnswer')
                : t(interfaceLanguage, 'correctAnswers')}
            </Typography>
            <Typography fontWeight={800}>{expectedAnswers.join(' / ')}</Typography>
            <Chip
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
        <Typography variant="overline">
          {statsLabel}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {usesSplitStats ? (
            <SplitWordStatsChip
              correct={correctCount}
              incorrect={incorrectCount}
              interfaceLanguage={interfaceLanguage}
              statsLabel={statsLabel}
            />
          ) : (
            <>
              {correctCount > 0 && (
                <Chip
                  label={`${t(interfaceLanguage, 'correct')}: ${correctCount}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {incorrectCount > 0 && (
                <Chip
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
      <DialogTitle sx={{ fontWeight: 900 }}>
        {t(interfaceLanguage, 'finishExercise')}
      </DialogTitle>
      <DialogContent>
        <Typography>{t(interfaceLanguage, 'finishExerciseNotice')}</Typography>
        <Typography sx={{ mt: 2 }}>
          {t(interfaceLanguage, 'answeredWords')}: {answeredCount}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="success" variant="contained" onClick={onCancel}>
          {t(interfaceLanguage, 'cancel')}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
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
