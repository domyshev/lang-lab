import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import {
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { MultipleChoicePrompt } from '../../domain/exercises';
import { footballResultColors } from '../../domain/footballTheme';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import type { WorldResultColors } from '../../domain/worlds';
import { KnownCardToggleButton } from '../KnownCardToggleButton';
import {
  ExerciseProgressChip,
  ExerciseCardSetChip,
  ExerciseTargetLanguageChip,
} from './ExerciseCardSetChip';
import { TranslationHintRow } from './TranslationHintRow';

export function MultipleChoiceExercise({
  complementaryLanguage,
  interfaceLanguage,
  progressCompletedCount,
  progressTotalCount,
  prompt,
  resultColors = footballResultColors,
  isKnown = false,
  onAnswer,
  onKnownChange,
  onNext,
  cardSetName,
  finishAction,
  targetLanguage = 'en',
}: {
  complementaryLanguage?: SupportedLanguage;
  interfaceLanguage: SupportedLanguage;
  prompt: MultipleChoicePrompt;
  resultColors?: WorldResultColors;
  isKnown?: boolean;
  onAnswer: (answer: string) => void;
  onKnownChange?: (isKnown: boolean) => void;
  onNext: () => void;
  progressCompletedCount?: number;
  progressTotalCount?: number;
  cardSetName?: string;
  finishAction?: ReactNode;
  targetLanguage?: SupportedLanguage;
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
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack
            data-test={`multiple_choice_exercise__header_text__${prompt.cardId}`}
            spacing={1}
            sx={{ alignItems: 'flex-start', minWidth: 0 }}
          >
            <Typography
              component="h2"
              data-test={`multiple_choice_exercise__title__${prompt.cardId}`}
              variant="h6"
            >
              {t(interfaceLanguage, 'game')}: {t(interfaceLanguage, 'multipleChoice')}
            </Typography>
            <Stack
              data-test={`multiple_choice_exercise__metadata_row__${prompt.cardId}`}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {cardSetName && (
                <ExerciseCardSetChip
                  dataTest={`multiple_choice_exercise__card_set_chip__${prompt.cardId}`}
                  interfaceLanguage={interfaceLanguage}
                  sx={exerciseCardSetChipStyles}
                  cardSetName={cardSetName}
                />
              )}
              <ExerciseTargetLanguageChip
                dataTest={`multiple_choice_exercise__target_language_chip__${prompt.cardId}`}
                interfaceLanguage={interfaceLanguage}
                targetLanguage={targetLanguage}
              />
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
          </Stack>
          {finishAction}
        </Stack>
        <TranslationHintRow
          complementaryLanguage={complementaryLanguage}
          dataTest={`multiple_choice_exercise__prompt__${prompt.cardId}`}
          fallbackPrompt={prompt.prompt}
          hints={prompt.translationHints}
        />
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
                  resultColors,
                }),
              }}
            >
              {option}
            </Button>
          ))}
        </Stack>
        {isSubmitted && (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
                      bgcolor: resultColors.correct.main,
                      '&:hover': {
                        bgcolor: resultColors.correct.main,
                        boxShadow: 'none',
                      },
                    }
                  : {
                      bgcolor: resultColors.incorrect.soft,
                      border: `1px solid ${resultColors.incorrect.border}`,
                      color: resultColors.incorrect.text,
                      '&:hover': {
                        bgcolor: resultColors.incorrect.soft,
                        boxShadow: 'none',
                      },
                    }),
              }}
            >
              {isCorrect
                ? t(interfaceLanguage, 'correctResult')
                : t(interfaceLanguage, 'incorrect')}
            </Button>
            {onKnownChange && (
              <KnownCardToggleButton
                checked={isKnown}
                dataTest={`multiple_choice_exercise__known_button__${prompt.cardId}`}
                interfaceLanguage={interfaceLanguage}
                onChange={onKnownChange}
              />
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function getOptionStyles({
  isCorrectOption,
  isSelected,
  isSubmitted,
  resultColors,
}: {
  isCorrectOption: boolean;
  isSelected: boolean;
  isSubmitted: boolean;
  resultColors: WorldResultColors;
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
      bgcolor: resultColors.correct.soft,
      borderColor: resultColors.correct.border,
      color: '#203015',
      opacity: 1,
      WebkitTextFillColor: '#203015',
    };
  }

  if (isSelected) {
    return {
      bgcolor: resultColors.incorrect.soft,
      borderColor: resultColors.incorrect.border,
      color: resultColors.incorrect.text,
      opacity: 1,
      WebkitTextFillColor: resultColors.incorrect.text,
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

const exerciseCardSetChipStyles = {
  bgcolor: '#e7eefc',
  border: '1px solid rgba(68, 94, 150, 0.26)',
  color: '#203015',
  fontWeight: 850,
  height: 30,
};
