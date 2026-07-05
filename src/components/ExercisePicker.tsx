import {
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { ExerciseType } from '../domain/exercises';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';

const exerciseOptions: Array<{
  type: ExerciseType;
  labelKey: Parameters<typeof t>[1];
}> = [
  { type: 'crossword', labelKey: 'crossword' },
  { type: 'multipleChoice', labelKey: 'multipleChoice' },
  { type: 'missingLetters', labelKey: 'missingLetters' },
  { type: 'missingWord', labelKey: 'missingWord' },
];

export function ExercisePicker({
  selectedExerciseType,
  onPick,
}: {
  selectedExerciseType: ExerciseType;
  onPick: (exerciseType: ExerciseType) => void;
}) {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );

  return (
    <Paper data-test="exercise_picker__panel" sx={{ p: 2 }}>
      <Stack data-test="exercise_picker__content" spacing={2}>
        <Typography data-test="exercise_picker__title" variant="h6">
          {t(interfaceLanguage, 'chooseExercise')}
        </Typography>
        <ToggleButtonGroup
          data-test="exercise_picker__toggle_group"
          value={selectedExerciseType}
          exclusive
          onChange={(_, value: ExerciseType | null) => {
            if (value) {
              onPick(value);
            }
          }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              m: 0,
            },
          }}
        >
          {exerciseOptions.map((option) => (
            <ToggleButton
              data-test={`exercise_picker__option__${option.type}`}
              key={option.type}
              value={option.type}
              sx={{ justifyContent: 'flex-start', px: 1.5 }}
            >
              {t(interfaceLanguage, option.labelKey)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Paper>
  );
}
