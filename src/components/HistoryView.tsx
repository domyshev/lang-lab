import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExercisePrompt } from '../domain/exercises';
import {
  ExerciseHistorySummary,
  summarizeExerciseHistory,
} from '../domain/exerciseHistory';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
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
    <Stack data-test="history_view__root" spacing={1.5}>
      {attemptSummaries.map((attempt) => (
        <AttemptHistoryCard
          key={attempt.id}
          attempt={attempt}
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
  attempt,
  interfaceLanguage,
}: {
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
                  type={row.exerciseType}
                />
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
  type,
}: {
  answer: string;
  dataTestPrefix: string;
  expectedAnswer: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  isCorrect: boolean;
  options: string[];
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

  if (isCorrect) {
    return (
      <AnswerCells
        ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
        dataTestPrefix={`${dataTestPrefix}__correct_cells`}
        tone="correct"
        value={expectedAnswer}
      />
    );
  }

  return (
    <Stack data-test={`${dataTestPrefix}__answer_cells_stack`} spacing={0.75}>
      <AnswerCells
        ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
        dataTestPrefix={`${dataTestPrefix}__correct_cells`}
        tone="correct"
        value={expectedAnswer}
      />
      <AnswerCells
        ariaLabel={`${t(interfaceLanguage, 'incorrectAnswer')}: ${
          answer || t(interfaceLanguage, 'noAnswer')
        }`}
        dataTestPrefix={`${dataTestPrefix}__incorrect_cells`}
        tone="incorrect"
        value={answer || t(interfaceLanguage, 'noAnswer')}
      />
    </Stack>
  );
}

function AnswerCells({
  ariaLabel,
  dataTestPrefix,
  tone,
  value,
}: {
  ariaLabel: string;
  dataTestPrefix: string;
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
              color: 'rgb(117, 117, 117)',
              display: 'inline-flex',
              fontSize: 20,
              fontWeight: 800,
              height: 34,
              justifyContent: 'center',
              lineHeight: 1,
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

function getPromptOptions(prompt: ExercisePrompt): string[] {
  return (prompt as ExercisePrompt & { options?: string[] }).options ?? [];
}

function toDomKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}
