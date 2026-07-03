import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MissingLettersPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

export function MissingLettersExercise({
  interfaceLanguage,
  onNext,
  prompt,
  onAnswer,
}: {
  interfaceLanguage: SupportedLanguage;
  prompt: MissingLettersPrompt;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  const [letters, setLetters] = useState<Record<number, string>>({});
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const maskedCharacters = prompt.maskedAnswer.split('');
  const answer = maskedCharacters
    .map((character, index) =>
      character === '_' ? (letters[index] ?? '') : character,
    )
    .join('');
  const isSubmitted = submittedAnswer !== null;

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
  }, [prompt.cardId, prompt.maskedAnswer]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          {t(interfaceLanguage, 'missingLetters')}
        </Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {maskedCharacters.map((character, index) =>
            character === '_' ? (
              <Box
                key={index}
                component="input"
                aria-label={`Missing letter ${index + 1}`}
                disabled={isSubmitted}
                value={letters[index] ?? ''}
                onChange={(event) =>
                  setLetters((current) => ({
                    ...current,
                    [index]: event.target.value.slice(-1),
                  }))
                }
                sx={letterCellStyles}
              />
            ) : (
              <Box key={index} component="span" sx={letterCellStyles}>
                {character}
              </Box>
            ),
          )}
        </Stack>
        <Button
          variant="contained"
          onClick={() => {
            if (isSubmitted) {
              onNext();
              return;
            }

            setSubmittedAnswer(answer);
            onAnswer(answer);
          }}
        >
          {isSubmitted ? t(interfaceLanguage, 'next') : t(interfaceLanguage, 'submit')}
        </Button>
      </Stack>
    </Paper>
  );
}

const letterCellStyles = {
  alignItems: 'center',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  display: 'inline-flex',
  fontSize: 22,
  fontWeight: 800,
  height: 38,
  justifyContent: 'center',
  lineHeight: 1,
  textAlign: 'center',
  textTransform: 'lowercase',
  width: 38,
  '&:disabled': {
    color: 'text.primary',
    opacity: 1,
    WebkitTextFillColor: 'currentColor',
  },
};
