import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useSelector } from 'react-redux';
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
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Missing word</Typography>
        <Typography>{prompt.sentenceWithGap}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <TextField
          label="Answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <Button variant="contained" onClick={() => onAnswer(answer)}>
          {t(interfaceLanguage, 'submit')}
        </Button>
      </Stack>
    </Paper>
  );
}
