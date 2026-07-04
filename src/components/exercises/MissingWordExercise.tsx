import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IncompleteAnswerWarning } from '../IncompleteAnswerWarning';
import { MissingWordPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { RootState } from '../../store/store';

export function MissingWordExercise({
  prompt,
  onAnswer,
}: {
  prompt: MissingWordPrompt;
  onAnswer: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState('');
  const [warningPulse, setWarningPulse] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );

  useEffect(() => {
    setAnswer('');
    setIsWarningVisible(false);
  }, [prompt.cardId, prompt.sentenceWithGap]);

  useEffect(() => {
    if (!isWarningVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsWarningVisible(false);
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [isWarningVisible, warningPulse]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{t(interfaceLanguage, 'missingWord')}</Typography>
        <Typography>{prompt.sentenceWithGap}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label={t(interfaceLanguage, 'answer')}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IncompleteAnswerWarning
            label={t(interfaceLanguage, 'fillAllGapsWarning')}
            pulseKey={warningPulse}
            visible={isWarningVisible}
          />
        </Stack>
        <Button
          variant="contained"
          onClick={() => {
            if (!answer.trim()) {
              setWarningPulse((value) => value + 1);
              setIsWarningVisible(true);
              return;
            }

            onAnswer(answer);
          }}
        >
          {t(interfaceLanguage, 'submit')}
        </Button>
      </Stack>
    </Paper>
  );
}
