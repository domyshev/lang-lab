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
      isCorrect: Boolean(savedAttempt.correctness[prompt.cardId]),
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
                <Typography fontWeight={800}>{row.expectedAnswer}</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Typography component="span" fontWeight={800}>
                    {t(interfaceLanguage, 'userAnswer')}:
                  </Typography>
                  <Typography component="span">
                    {row.answer || t(interfaceLanguage, 'noAnswer')}
                  </Typography>
                </Stack>
                <Chip
                  label={t(
                    interfaceLanguage,
                    row.isCorrect ? 'correct' : 'incorrect',
                  )}
                  size="small"
                  color={row.isCorrect ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start' }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
