import { Button, Paper, Stack, Typography } from '@mui/material';
import { MultipleChoicePrompt } from '../../domain/exercises';

export function MultipleChoiceExercise({
  prompt,
  onAnswer,
}: {
  prompt: MultipleChoicePrompt;
  onAnswer: (answer: string) => void;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Question</Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {prompt.options.map((option) => (
            <Button
              key={option}
              variant="outlined"
              onClick={() => onAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
