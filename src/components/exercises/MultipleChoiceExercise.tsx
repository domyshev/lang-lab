import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MultipleChoicePrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

export function MultipleChoiceExercise({
  interfaceLanguage,
  prompt,
  onAnswer,
  onNext,
}: {
  interfaceLanguage: SupportedLanguage;
  prompt: MultipleChoicePrompt;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const isSubmitted = selectedAnswer !== null;
  const isCorrect = selectedAnswer === prompt.expectedAnswer;

  useEffect(() => {
    setSelectedAnswer(null);
  }, [prompt.cardId, prompt.expectedAnswer]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          {t(interfaceLanguage, 'multipleChoice')}
        </Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack
          data-testid="multiple-choice-options"
          direction="column"
          spacing={1}
          sx={{ alignItems: 'stretch', maxWidth: 420 }}
        >
          {prompt.options.map((option) => (
            <Button
              data-testid="multiple-choice-option"
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
