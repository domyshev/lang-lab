import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isMissingAnswerCharacter } from '../domain/answerPlaceholders';
import { ExercisePrompt } from '../domain/exercises';
import {
  ExerciseHistorySummary,
  summarizeExerciseHistory,
} from '../domain/exerciseHistory';
import { t } from '../domain/i18n';
import {
  getWorldResultColors,
  resolveWorldId,
  type WorldResultColors,
} from '../domain/worlds';
import { RootState } from '../store/store';
import { CursorAnchoredTooltip, TooltipContent } from './CursorAnchoredTooltip';
import { StatsFormula } from './StatsFormula';
import { CrosswordHistoryReplay } from './history/CrosswordHistoryReplay';
import {
  formatAttemptDate,
  type RecentCardResult,
  RecentAnswersChip,
} from './history/RecentAnswersChip';

export function HistoryView() {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const allAttempts = useSelector(
    (state: RootState) => state.attempts.attempts,
  );
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const resultColors = getWorldResultColors(worldId);
  const attemptSummaries = useMemo(
    () =>
      summarizeExerciseHistory(
        allAttempts.filter((attempt) => attempt.targetLanguage === targetLanguage),
      ),
    [allAttempts, targetLanguage],
  );

  return (
    <Stack
      data-test="history_view__root"
      spacing={1.5}
      sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}
    >
      {attemptSummaries.map((attempt) => (
        <AttemptHistoryCard
          key={attempt.id}
          attempt={attempt}
          allAttempts={allAttempts}
          interfaceLanguage={interfaceLanguage}
          resultColors={resultColors}
        />
      ))}
      {attemptSummaries.length === 0 && (
        <Paper data-test="history_view__empty_panel" sx={{ p: 2 }}>
          <Typography color="text.secondary" data-test="history_view__empty_text">
            {t(interfaceLanguage, 'noAttempts')}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}

function AttemptHistoryCard({
  allAttempts,
  attempt,
  interfaceLanguage,
  resultColors,
}: {
  allAttempts: RootState['attempts']['attempts'];
  attempt: ExerciseHistorySummary;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  resultColors: WorldResultColors;
}) {
  const attemptDomKey = toDomKey(attempt.id);
  const detailRows = attempt.attempts.flatMap((savedAttempt) =>
    savedAttempt.prompts.map((prompt) => ({
      id: `${savedAttempt.id}:${prompt.cardId}`,
      answer: savedAttempt.answers[prompt.cardId] ?? '',
      expectedAnswer: prompt.expectedAnswer,
      exerciseType: savedAttempt.exerciseType,
      isCorrect: Boolean(savedAttempt.correctness[prompt.cardId]),
      options: getPromptOptions(prompt),
      prompt: prompt.prompt,
      recentResults: getRecentCardResults({
        attempts: allAttempts,
        cardId: prompt.cardId,
        targetLanguage: savedAttempt.targetLanguage,
      }),
    })),
  );
  const crosswordAttempt = attempt.attempts.find(
    (savedAttempt) =>
      savedAttempt.exerciseType === 'crossword' &&
      Boolean(savedAttempt.crosswordSnapshot),
  );
  const crosswordRecentResultsByCardId =
    crosswordAttempt?.crosswordSnapshot
      ? Object.fromEntries(
          crosswordAttempt.crosswordSnapshot.puzzle.entries.map((entry) => [
            entry.cardId,
            getRecentCardResults({
              attempts: allAttempts,
              cardId: entry.cardId,
              targetLanguage: crosswordAttempt.targetLanguage,
            }),
          ]),
        )
      : {};

  return (
    <Accordion
      data-test={`history_view__attempt_card__${attemptDomKey}`}
      disableGutters
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.14)',
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        boxShadow: 'none',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary
        data-test={`history_view__attempt_summary__${attemptDomKey}`}
        expandIcon={<ExpandMoreIcon data-test={`history_view__attempt_expand_icon__${attemptDomKey}`} />}
      >
        <Stack
          data-test={`history_view__attempt_summary_content__${attemptDomKey}`}
          spacing={1.25}
          sx={{ width: '100%', pr: 1 }}
        >
          <Stack
            data-test={`history_view__attempt_title_row__${attemptDomKey}`}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography
              data-test={`history_view__attempt_type__${attemptDomKey}`}
              variant="h6"
            >
              {t(interfaceLanguage, attempt.exerciseType)}
            </Typography>
            {attempt.isExerciseCompleted && attempt.exerciseCompletedAt && (
              <CompletedExerciseTrophy
                completedAt={attempt.exerciseCompletedAt}
                dataTest={`history_view__completed_trophy__${attemptDomKey}`}
                interfaceLanguage={interfaceLanguage}
              />
            )}
          </Stack>
          <StatsFormula
            correct={attempt.correct}
            dataTestPrefix={`history_view__attempt_formula__${attemptDomKey}`}
            incorrect={attempt.incorrect}
            interfaceLanguage={interfaceLanguage}
            resultColors={resultColors}
            showLabel={false}
            total={attempt.total}
            totalLabel={t(interfaceLanguage, 'totalAnsweredQuestions')}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        data-test={`history_view__attempt_details__${attemptDomKey}`}
        sx={{ pt: 0 }}
      >
        {crosswordAttempt?.crosswordSnapshot ? (
          <CrosswordHistoryReplay
            correctness={crosswordAttempt.correctness}
            dataTestPrefix={`history_view__crossword_replay__${attemptDomKey}`}
            interfaceLanguage={interfaceLanguage}
            recentResultsByCardId={crosswordRecentResultsByCardId}
            resultColors={resultColors}
            snapshot={crosswordAttempt.crosswordSnapshot}
          />
        ) : (
          <Stack
            data-test={`history_view__attempt_detail_rows__${attemptDomKey}`}
            spacing={1.25}
          >
            <Typography
              data-test={`history_view__attempt_details_label__${attemptDomKey}`}
              variant="overline"
            >
              {t(interfaceLanguage, 'exerciseDetails')}
            </Typography>
            {detailRows.map((row) => {
              const rowDomKey = toDomKey(row.id);

              return (
                <Box
                  data-test={`history_view__detail_row__${rowDomKey}`}
                  key={row.id}
                  sx={{
                    border: '1px solid rgba(32, 48, 21, 0.12)',
                    borderRadius: 1,
                    p: 1.25,
                  }}
                >
                  <Stack
                    data-test={`history_view__detail_row_content__${rowDomKey}`}
                    spacing={0.75}
                  >
                    <Typography
                      color="text.secondary"
                      data-test={`history_view__detail_prompt__${rowDomKey}`}
                      variant="body2"
                    >
                      {row.prompt}
                    </Typography>
                    <HistoryAnswer
                      answer={row.answer}
                      dataTestPrefix={`history_view__detail_answer__${rowDomKey}`}
                      expectedAnswer={row.expectedAnswer}
                      interfaceLanguage={interfaceLanguage}
                      isCorrect={row.isCorrect}
                      options={row.options}
                      recentResults={row.recentResults}
                      resultColors={resultColors}
                      type={row.exerciseType}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function CompletedExerciseTrophy({
  completedAt,
  dataTest,
  interfaceLanguage,
}: {
  completedAt: string;
  dataTest: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
}) {
  const label = `${t(interfaceLanguage, 'exerciseCompleted')} ${formatAttemptDate(
    completedAt,
  )}`;
  const trophy = (
    <Box
      aria-label={label}
      component="span"
      data-test={dataTest}
      role="img"
      sx={{
        alignItems: 'center',
        color: '#9f7a21',
        display: 'inline-flex',
        fontSize: 24,
        lineHeight: 1,
      }}
    >
      <EmojiEventsOutlinedIcon fontSize="inherit" />
    </Box>
  );

  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTest}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      title={<TooltipContent sx={completedTrophyTooltipContentStyles}>{label}</TooltipContent>}
      transitionTimeout={0}
      tooltipSx={completedTrophyTooltipStyles}
    >
      {trophy}
    </CursorAnchoredTooltip>
  );
}

function HistoryAnswer({
  answer,
  dataTestPrefix,
  expectedAnswer,
  interfaceLanguage,
  isCorrect,
  options,
  recentResults,
  resultColors,
  type,
}: {
  answer: string;
  dataTestPrefix: string;
  expectedAnswer: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  isCorrect: boolean;
  options: string[];
  recentResults: RecentCardResult[];
  resultColors: WorldResultColors;
  type: ExerciseHistorySummary['exerciseType'];
}) {
  const answerContent =
    type === 'multipleChoice' ? (
      <Stack data-test={`${dataTestPrefix}__multiple_choice_options`} spacing={0.75} sx={{ maxWidth: 420 }}>
        {(options.length > 0 ? options : [expectedAnswer]).map((option, index) => (
          <Box
            data-test={`${dataTestPrefix}__multiple_choice_option__${index}`}
            key={option}
            sx={{
              border: '1px solid',
              borderColor:
                option === expectedAnswer
                  ? resultColors.correct.border
                  : option === answer
                    ? resultColors.incorrect.border
                    : 'divider',
              borderRadius: 1,
              bgcolor:
                option === expectedAnswer
                  ? resultColors.correct.soft
                  : option === answer
                    ? resultColors.incorrect.soft
                    : '#ffffff',
              color: '#203015',
              fontSize: 18,
              fontWeight: 850,
              minHeight: 40,
              px: 1.5,
              py: 0.75,
            }}
          >
            {option}
          </Box>
        ))}
      </Stack>
    ) : isCorrect ? (
      <Box component="span" sx={{ display: 'inline-flex' }}>
        <AnswerCells
          ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
          dataTestPrefix={`${dataTestPrefix}__correct_cells`}
          resultColors={resultColors}
          tone="correct"
          value={expectedAnswer}
        />
      </Box>
    ) : (
      <Stack data-test={`${dataTestPrefix}__answer_cells_stack`} spacing={0.75}>
        <AnswerCells
          ariaLabel={`${t(interfaceLanguage, 'incorrectAnswer')}: ${
            answer || t(interfaceLanguage, 'noAnswer')
          }`}
          dataTestPrefix={`${dataTestPrefix}__incorrect_cells`}
          expectedValue={expectedAnswer}
          resultColors={resultColors}
          tone="incorrect"
          value={answer || t(interfaceLanguage, 'noAnswer')}
        />
        <AnswerCells
          ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
          dataTestPrefix={`${dataTestPrefix}__correct_cells`}
          expectedValue={expectedAnswer}
          resultColors={resultColors}
          tone="correct"
          value={expectedAnswer}
        />
      </Stack>
    );

  if (type === 'crossword') {
    return answerContent;
  }

  return (
    <Stack data-test={`${dataTestPrefix}__content`} spacing={0.9}>
      {answerContent}
      <RecentAnswersChip
      dataTestPrefix={dataTestPrefix}
      interfaceLanguage={interfaceLanguage}
      recentResults={recentResults}
      resultColors={resultColors}
      subject={expectedAnswer}
      />
    </Stack>
  );
}

function AnswerCells({
  ariaLabel,
  dataTestPrefix,
  expectedValue,
  resultColors,
  tone,
  value,
}: {
  ariaLabel: string;
  dataTestPrefix: string;
  expectedValue?: string;
  resultColors: WorldResultColors;
  tone: 'correct' | 'incorrect';
  value: string;
}) {
  return (
    <Stack
      aria-label={ariaLabel}
      data-test={`${dataTestPrefix}__root`}
      direction="row"
      spacing={0.75}
      flexWrap="wrap"
      useFlexGap
    >
      {value.split('').map((character, index) =>
        isMissingAnswerCharacter(character) ? (
          <Box
            aria-hidden="true"
            component="span"
            data-test={`${dataTestPrefix}__missing_cell__${index}`}
            key={`missing-${index}`}
            sx={{
              alignItems: 'center',
              bgcolor: 'rgb(238, 238, 238)',
              border: '1px solid',
              borderColor: 'rgb(216, 216, 216)',
              borderRadius: 1,
              color: 'rgb(117, 117, 117)',
              display: 'inline-flex',
              fontSize: 20,
              fontWeight: 800,
              height: 34,
              justifyContent: 'center',
              lineHeight: 1,
              textDecorationLine: 'none',
              width: 34,
            }}
          />
        ) : character.trim() === '' ? (
          <Box
            aria-hidden="true"
            component="span"
            data-test={`${dataTestPrefix}__space__${index}`}
            key={`space-${index}`}
            sx={{ display: 'inline-flex', height: 34, width: 34 }}
          />
        ) : (
          <Box
            component="span"
            data-test={`${dataTestPrefix}__cell__${index}`}
            key={`${character}-${index}`}
            sx={{
              alignItems: 'center',
              bgcolor:
                tone === 'correct'
                  ? resultColors.correct.soft
                  : resultColors.incorrect.soft,
              border: '1px solid',
              borderColor:
                tone === 'correct'
                  ? resultColors.correct.border
                  : resultColors.incorrect.border,
              borderRadius: 1,
              color: '#203015',
              display: 'inline-flex',
              fontSize: 20,
              fontWeight: 800,
              height: 34,
              justifyContent: 'center',
              lineHeight: 1,
              textDecorationLine:
                tone === 'incorrect' &&
                !areAnswerCharactersEqual(character, expectedValue?.[index] ?? '')
                  ? 'line-through'
                  : 'none',
              textDecorationThickness: '2px',
              textTransform: 'lowercase',
              width: 34,
            }}
          >
            {character}
          </Box>
        ),
      )}
    </Stack>
  );
}

function areAnswerCharactersEqual(
  answerCharacter: string,
  expectedCharacter: string,
) {
  return (
    answerCharacter.toLocaleLowerCase() === expectedCharacter.toLocaleLowerCase()
  );
}

const completedTrophyTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  fontSize: 14,
  lineHeight: 1.35,
  maxWidth: 280,
  px: 1.25,
  py: 1,
};

const completedTrophyTooltipContentStyles = {
  bgcolor: '#ffffff',
  color: '#203015',
  display: 'inline-block',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.35,
};

function getPromptOptions(prompt: ExercisePrompt): string[] {
  return (prompt as ExercisePrompt & { options?: string[] }).options ?? [];
}

function getRecentCardResults({
  attempts,
  cardId,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  cardId: string;
  targetLanguage: RootState['app']['targetLanguage'];
}): RecentCardResult[] {
  return [...attempts]
    .filter(
      (attempt) =>
        attempt.targetLanguage === targetLanguage &&
        Object.prototype.hasOwnProperty.call(attempt.correctness, cardId),
    )
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? right.createdAt) -
        Date.parse(left.completedAt ?? left.createdAt),
    )
    .slice(0, 10)
    .map((attempt) => ({
      isCorrect: Boolean(attempt.correctness[cardId]),
      occurredAt: attempt.completedAt ?? attempt.createdAt,
    }));
}

function toDomKey(value: string): string {
  return encodeURIComponent(value);
}
