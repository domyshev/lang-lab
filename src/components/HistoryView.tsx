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
    <Stack spacing={1.5}>
      {attemptSummaries.map((attempt) => (
        <AttemptHistoryCard
          key={attempt.id}
          attempt={attempt}
          interfaceLanguage={interfaceLanguage}
        />
      ))}
      {attemptSummaries.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">
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
      data-testid="history-attempt-card"
      disableGutters
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.14)',
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        boxShadow: 'none',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={1.25} sx={{ width: '100%', pr: 1 }}>
          <Typography variant="h6">
            {t(interfaceLanguage, attempt.exerciseType)}
          </Typography>
          <StatsFormula
            correct={attempt.correct}
            incorrect={attempt.incorrect}
            interfaceLanguage={interfaceLanguage}
            showLabel={false}
            total={attempt.total}
            totalLabel={t(interfaceLanguage, 'totalAnsweredQuestions')}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={1.25}>
          <Typography variant="overline">
            {t(interfaceLanguage, 'exerciseDetails')}
          </Typography>
          {detailRows.map((row) => (
            <Box
              key={row.id}
              sx={{
                border: '1px solid rgba(32, 48, 21, 0.12)',
                borderRadius: 1,
                p: 1.25,
              }}
            >
              <Stack spacing={0.75}>
                <Typography color="text.secondary" variant="body2">
                  {row.prompt}
                </Typography>
                <HistoryAnswer
                  answer={row.answer}
                  expectedAnswer={row.expectedAnswer}
                  interfaceLanguage={interfaceLanguage}
                  isCorrect={row.isCorrect}
                  options={row.options}
                  type={row.exerciseType}
                />
                <Chip
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
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function HistoryAnswer({
  answer,
  expectedAnswer,
  interfaceLanguage,
  isCorrect,
  options,
  type,
}: {
  answer: string;
  expectedAnswer: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  isCorrect: boolean;
  options: string[];
  type: ExerciseHistorySummary['exerciseType'];
}) {
  if (type === 'multipleChoice') {
    return (
      <Stack spacing={0.75} sx={{ maxWidth: 420 }}>
        {(options.length > 0 ? options : [expectedAnswer]).map((option) => (
          <Box
            data-testid="history-multiple-choice-option"
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
        tone="correct"
        value={expectedAnswer}
      />
    );
  }

  return (
    <Stack spacing={0.75}>
      <AnswerCells
        ariaLabel={`${t(interfaceLanguage, 'correctAnswer')}: ${expectedAnswer}`}
        tone="correct"
        value={expectedAnswer}
      />
      <AnswerCells
        ariaLabel={`${t(interfaceLanguage, 'incorrectAnswer')}: ${
          answer || t(interfaceLanguage, 'noAnswer')
        }`}
        tone="incorrect"
        value={answer || t(interfaceLanguage, 'noAnswer')}
      />
    </Stack>
  );
}

function AnswerCells({
  ariaLabel,
  tone,
  value,
}: {
  ariaLabel: string;
  tone: 'correct' | 'incorrect';
  value: string;
}) {
  return (
    <Stack
      aria-label={ariaLabel}
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
            key={`space-${index}`}
            sx={{ display: 'inline-flex', height: 34, width: 10 }}
          />
        ) : (
          <Box
            component="span"
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
