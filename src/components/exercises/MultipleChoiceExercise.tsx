import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MultipleChoicePrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import { ExerciseProgressChip, ExerciseThemeChip } from './ExerciseThemeChip';

export function MultipleChoiceExercise({
  interfaceLanguage,
  progressCompletedCount,
  progressTotalCount,
  prompt,
  onAnswer,
  onNext,
  themeName,
}: {
  interfaceLanguage: SupportedLanguage;
  prompt: MultipleChoicePrompt;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  progressCompletedCount?: number;
  progressTotalCount?: number;
  themeName?: string;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const isSubmitted = selectedAnswer !== null;
  const isCorrect = selectedAnswer === prompt.expectedAnswer;

  useEffect(() => {
    setSelectedAnswer(null);
  }, [prompt.cardId, prompt.expectedAnswer]);

  return (
    <Paper
      data-test={`multiple_choice_exercise__panel__${prompt.cardId}`}
      sx={{ p: 2 }}
    >
      <Stack
        data-test={`multiple_choice_exercise__content__${prompt.cardId}`}
        spacing={2}
      >
        <Stack
          data-test={`multiple_choice_exercise__header__${prompt.cardId}`}
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Typography
            component="h2"
            data-test={`multiple_choice_exercise__title__${prompt.cardId}`}
            variant="h6"
          >
            {t(interfaceLanguage, 'multipleChoice')}
          </Typography>
          {themeName && (
            <ExerciseThemeChip
              dataTest={`multiple_choice_exercise__theme_chip__${prompt.cardId}`}
              interfaceLanguage={interfaceLanguage}
              sx={exerciseThemeChipStyles}
              themeName={themeName}
            />
          )}
          {progressCompletedCount !== undefined &&
            progressTotalCount !== undefined && (
              <ExerciseProgressChip
                completed={progressCompletedCount}
                dataTest={`multiple_choice_exercise__progress_chip__${prompt.cardId}`}
                interfaceLanguage={interfaceLanguage}
                total={progressTotalCount}
              />
            )}
        </Stack>
        <Typography data-test={`multiple_choice_exercise__prompt__${prompt.cardId}`}>
          {prompt.prompt}
        </Typography>
        {prompt.definitionHint && (
          <Typography data-test={`multiple_choice_exercise__definition_hint__${prompt.cardId}`}>
            {prompt.definitionHint}
          </Typography>
        )}
        <Stack
          data-test={`multiple_choice_exercise__options__${prompt.cardId}`}
          direction="column"
          spacing={1}
          sx={{ alignItems: 'stretch', maxWidth: 420 }}
        >
          {prompt.options.map((option, index) => (
            <Button
              data-test={`multiple_choice_exercise__option__${prompt.cardId}__${index}`}
              disabled={isSubmitted}
              key={option}
              variant="outlined"
              onClick={() => {
                setSelectedAnswer(option);
                onAnswer(option);
              }}
              sx={{
                borderRadius: 1,
                fontSize: 18,
                fontWeight: 850,
                justifyContent: 'flex-start',
                minHeight: 46,
                px: 2,
                textTransform: 'none',
                '&.Mui-disabled': {
                  opacity: 1,
                },
                ...getOptionStyles({
                  isCorrectOption: option === prompt.expectedAnswer,
                  isSelected: option === selectedAnswer,
                  isSubmitted,
                }),
              }}
            >
              {option}
            </Button>
          ))}
        </Stack>
        {isSubmitted && (
          <Button
            data-test={`multiple_choice_exercise__next_button__${prompt.cardId}`}
            variant="contained"
            startIcon={
              isCorrect ? <EmojiEventsOutlinedIcon /> : <ErrorOutlineIcon />
            }
            onClick={onNext}
            sx={{
              alignSelf: 'flex-start',
              boxShadow: 'none',
              height: 40,
              minWidth: 148,
              ...(isCorrect
                ? {
                    bgcolor: '#2f7d32',
                    '&:hover': { bgcolor: '#276b2a', boxShadow: 'none' },
                  }
                : {
                    bgcolor: '#fdebee',
                    border: '1px solid #f2a7b4',
                    color: '#9f1239',
                    '&:hover': { bgcolor: '#fbdde3', boxShadow: 'none' },
                  }),
            }}
          >
            {isCorrect
              ? t(interfaceLanguage, 'correctResult')
              : t(interfaceLanguage, 'incorrect')}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function getOptionStyles({
  isCorrectOption,
  isSelected,
  isSubmitted,
}: {
  isCorrectOption: boolean;
  isSelected: boolean;
  isSubmitted: boolean;
}) {
  if (!isSubmitted) {
    return {
      bgcolor: '#ffffff',
      borderColor: 'divider',
      color: 'text.primary',
      '&:hover': {
        bgcolor: '#ffffff',
        borderColor: '#97c65a',
      },
    };
  }

  if (isCorrectOption) {
    return {
      bgcolor: 'rgb(235, 247, 225)',
      borderColor: '#8fc773',
      color: '#203015',
      opacity: 1,
      WebkitTextFillColor: '#203015',
    };
  }

  if (isSelected) {
    return {
      bgcolor: 'rgb(253, 235, 238)',
      borderColor: '#f2a7b4',
      color: '#4a111b',
      opacity: 1,
      WebkitTextFillColor: '#4a111b',
    };
  }

  return {
    bgcolor: 'background.paper',
    borderColor: 'divider',
    color: 'text.secondary',
    opacity: 1,
    WebkitTextFillColor: '#757575',
  };
}

const exerciseThemeChipStyles = {
  bgcolor: '#e7eefc',
  border: '1px solid rgba(68, 94, 150, 0.26)',
  color: '#203015',
  fontWeight: 850,
  height: 30,
};
