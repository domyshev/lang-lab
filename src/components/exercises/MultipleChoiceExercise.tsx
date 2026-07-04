import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { CSSProperties } from 'react';
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
          {prompt.options.map((option, index) => (
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
                  index,
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
        {isSubmitted && !isCorrect && (
          <Stack spacing={0.75}>
            <Typography variant="overline">
              {t(interfaceLanguage, 'correctAnswer')}
            </Typography>
            <Stack
              aria-label={`${t(interfaceLanguage, 'correctAnswer')}: ${
                prompt.expectedAnswer
              }`}
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
            >
              {prompt.expectedAnswer.split('').map((character, index) =>
                character.trim() === '' ? (
                  <AnswerSpace key={`correct-space-${index}`} />
                ) : (
                  <Box
                    key={`correct-${character}-${index}`}
                    component="span"
                    style={getLetterCellInlineStyle('correct')}
                    sx={letterCellStyles}
                  >
                    {character}
                  </Box>
                ),
              )}
            </Stack>
          </Stack>
        )}
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

const idleOptionPalettes = [
  { bgcolor: '#eef7db', borderColor: '#97c65a', color: '#203015' },
  { bgcolor: '#eaf5ff', borderColor: '#7ab7d8', color: '#163040' },
  { bgcolor: '#fff2dc', borderColor: '#d9aa58', color: '#3d2a0d' },
];

function getOptionStyles({
  index,
  isCorrectOption,
  isSelected,
  isSubmitted,
}: {
  index: number;
  isCorrectOption: boolean;
  isSelected: boolean;
  isSubmitted: boolean;
}) {
  if (!isSubmitted) {
    const palette = idleOptionPalettes[index % idleOptionPalettes.length];
    return {
      bgcolor: palette.bgcolor,
      borderColor: palette.borderColor,
      color: palette.color,
      '&:hover': {
        bgcolor: palette.bgcolor,
        borderColor: palette.borderColor,
        filter: 'brightness(0.98)',
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

function AnswerSpace() {
  return (
    <Box
      aria-hidden="true"
      component="span"
      sx={{ display: 'inline-flex', height: 38, width: 10 }}
    />
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

function getLetterCellInlineStyle(
  resultTone: 'correct' | 'incorrect' | null,
): CSSProperties | undefined {
  if (!resultTone) {
    return undefined;
  }

  return {
    backgroundColor:
      resultTone === 'correct' ? 'rgb(235, 247, 225)' : 'rgb(253, 235, 238)',
    borderColor: resultTone === 'correct' ? '#8fc773' : '#f2a7b4',
    color: 'rgb(117, 117, 117)',
    WebkitTextFillColor: 'rgb(117, 117, 117)',
  };
}
