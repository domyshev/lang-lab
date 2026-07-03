import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { MissingLettersPrompt } from '../../domain/exercises';

export function MissingLettersExercise({
  prompt,
  onAnswer,
}: {
  prompt: MissingLettersPrompt;
  onAnswer: (answer: string) => void;
}) {
  const [letters, setLetters] = useState<Record<number, string>>({});
  const maskedCharacters = prompt.maskedAnswer.split('');
  const answer = maskedCharacters
    .map((character, index) =>
      character === '_' ? (letters[index] ?? '') : character,
    )
    .join('');

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Missing letters</Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {maskedCharacters.map((character, index) =>
            character === '_' ? (
              <Box
                key={index}
                component="input"
                aria-label={`Missing letter ${index + 1}`}
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
        <Button variant="contained" onClick={() => onAnswer(answer)}>
          Submit
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
};
