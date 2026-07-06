import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExercisePrompt } from '../domain/exercises';
import {
  ExerciseHistorySummary,
  summarizeExerciseHistory,
} from '../domain/exerciseHistory';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import { StatsFormula } from './StatsFormula';

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
}: {
  allAttempts: RootState['attempts']['attempts'];
  attempt: ExerciseHistorySummary;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
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
          <Typography
            data-test={`history_view__attempt_type__${attemptDomKey}`}
            variant="h6"
          >
            {t(interfaceLanguage, attempt.exerciseType)}
          </Typography>
          <StatsFormula
            correct={attempt.correct}
            dataTestPrefix={`history_view__attempt_formula__${attemptDomKey}`}
            incorrect={attempt.incorrect}
            interfaceLanguage={interfaceLanguage}
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
        <Stack data-test={`history_view__attempt_detail_rows__${attemptDomKey}`} spacing={1.25}>
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
              <Stack data-test={`history_view__detail_row_content__${rowDomKey}`} spacing={0.75}>
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
                  type={row.exerciseType}
                />
                {row.exerciseType === 'multipleChoice' && (
                  <Chip
                    data-test={`history_view__detail_result_chip__${rowDomKey}`}
                    label={t(
                      interfaceLanguage,
                      row.isCorrect ? 'correct' : 'incorrect',
                    )}
                    size="small"
                    variant="outlined"
                    sx={{
                      alignSelf: 'flex-start',
                      bgcolor: row.isCorrect
                        ? 'rgb(235, 247, 225)'
                        : 'rgb(253, 235, 238)',
                      borderColor: row.isCorrect ? '#8fc773' : '#f2a7b4',
                      color: '#111111',
                      fontWeight: 800,
                    }}
                  />
                )}
              </Stack>
            </Box>
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
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
  type,
}: {
  answer: string;
  dataTestPrefix: string;
  expectedAnswer: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  isCorrect: boolean;
  options: string[];
  recentResults: RecentCardResult[];
  type: ExerciseHistorySummary['exerciseType'];
}) {
  if (type === 'multipleChoice') {
    return (
      <Stack data-test={`${dataTestPrefix}__multiple_choice_options`} spacing={0.75} sx={{ maxWidth: 420 }}>
        {(options.length > 0 ? options : [expectedAnswer]).map((option, index) => (
          <Box
            data-test={`${dataTestPrefix}__multiple_choice_option__${index}`}
            key={option}
            sx={{
              border: '1px solid',
              borderColor:
                option === expectedAnswer
                  ? '#8fc773'
                  : option === answer
                    ? '#f2a7b4'
                    : 'divider',
              borderRadius: 1,
              bgcolor:
                option === expectedAnswer
                  ? 'rgb(235, 247, 225)'
                  : option === answer
                    ? 'rgb(253, 235, 238)'
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
    );
  }

  const answerContent = isCorrect ? (
      <Box component="span" sx={{ display: 'inline-flex' }}>
        <AnswerCells
          ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
          dataTestPrefix={`${dataTestPrefix}__correct_cells`}
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
          tone="incorrect"
          value={answer || t(interfaceLanguage, 'noAnswer')}
        />
        <AnswerCells
          ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
          dataTestPrefix={`${dataTestPrefix}__correct_cells`}
          expectedValue={expectedAnswer}
          tone="correct"
          value={expectedAnswer}
        />
      </Stack>
    );

  return (
    <RecentAnswersTooltip
      dataTestPrefix={dataTestPrefix}
      interfaceLanguage={interfaceLanguage}
      recentResults={recentResults}
      subject={expectedAnswer}
    >
      {answerContent}
    </RecentAnswersTooltip>
  );
}

function RecentAnswersTooltip({
  children,
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  subject,
}: {
  children: ReactElement;
  dataTestPrefix: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  recentResults: RecentCardResult[];
  subject: string;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTestPrefix}__tooltip_arrow`}
      tooltipSx={recentAnswersTooltipStyles}
      title={
        <Stack data-test={`${dataTestPrefix}__recent_tooltip`} spacing={0.75}>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_title`}
            sx={{ color: '#203015', fontSize: 14, fontWeight: 850 }}
          >
            {t(interfaceLanguage, 'recentAnswersTitle')}
          </Typography>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_subject`}
            sx={{
              color: 'rgba(32, 48, 21, 0.68)',
              fontSize: 11,
              fontWeight: 750,
              lineHeight: 1.25,
            }}
          >
            {subject}
          </Typography>
          <Stack data-test={`${dataTestPrefix}__recent_results`} spacing={0.5}>
            {recentResults.slice(0, 10).map((result, index) => (
              <Stack
                data-test={`${dataTestPrefix}__recent_result__${index}`}
                direction="row"
                key={`${result.occurredAt}-${index}`}
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Chip
                  data-test={`${dataTestPrefix}__recent_result_chip__${index}`}
                  label={t(
                    interfaceLanguage,
                    result.isCorrect
                      ? 'metricCorrectSuffix'
                      : 'metricIncorrectSuffix',
                  )}
                  size="small"
                  sx={{
                    bgcolor: result.isCorrect
                      ? 'rgb(235, 247, 225)'
                      : 'rgb(253, 235, 238)',
                    border: '1px solid',
                    borderColor: result.isCorrect ? '#8fc773' : '#f2a7b4',
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 24,
                  }}
                />
                <Typography
                  data-test={`${dataTestPrefix}__recent_result_date__${index}`}
                  sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}
                >
                  {formatAttemptDate(result.occurredAt)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      }
    >
      <Box
        data-test={`${dataTestPrefix}__tooltip_anchor`}
        sx={{
          alignItems: 'flex-start',
          display: 'inline-flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </CursorAnchoredTooltip>
  );
}

function AnswerCells({
  ariaLabel,
  dataTestPrefix,
  expectedValue,
  tone,
  value,
}: {
  ariaLabel: string;
  dataTestPrefix: string;
  expectedValue?: string;
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
        character.trim() === '' ? (
          <Box
            aria-hidden="true"
            component="span"
            data-test={`${dataTestPrefix}__space__${index}`}
            key={`space-${index}`}
            sx={{ display: 'inline-flex', height: 34, width: 10 }}
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
                  ? 'rgb(235, 247, 225)'
                  : 'rgb(253, 235, 238)',
              border: '1px solid',
              borderColor: tone === 'correct' ? '#8fc773' : '#f2a7b4',
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

type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

const recentAnswersTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  p: 1.25,
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

function toDomKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
