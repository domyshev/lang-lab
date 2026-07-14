import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  ReactNode,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { shouldStrikeAnswerCharacter } from '../../domain/answerCharacters';
import { MISSING_ANSWER_CHARACTER } from '../../domain/answerPlaceholders';
import { MissingLettersPrompt } from '../../domain/exercises';
import { footballResultColors } from '../../domain/footballTheme';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import type { WorldResultColors } from '../../domain/worlds';
import { KnownCardToggleButton } from '../KnownCardToggleButton';
import {
  ExerciseProgressChip,
  ExerciseRepeatChip,
  ExerciseCardSetChip,
  ExerciseTargetLanguageChip,
} from './ExerciseCardSetChip';
import { TranslationHintRow } from './TranslationHintRow';

type SubmissionOutcome = 'correct' | 'incorrect' | 'memorize';

export function MissingLettersExercise({
  interfaceLanguage,
  isRepeatedPrompt = false,
  complementaryLanguage,
  complementaryLanguages,
  onNext,
  onMemorizeResult,
  progressCompletedCount,
  progressTotalCount,
  promptStatsAction,
  prompt,
  repeatProgress,
  resultColors = footballResultColors,
  onAnswer,
  isKnown = false,
  onKnownChange,
  cardSetName,
  finishAction,
  targetLanguage = 'en',
}: {
  interfaceLanguage: SupportedLanguage;
  isRepeatedPrompt?: boolean;
  complementaryLanguage?: SupportedLanguage;
  complementaryLanguages?: SupportedLanguage[];
  prompt: MissingLettersPrompt;
  repeatProgress?: { current: number; total: number };
  onAnswer: (answer: string) => void;
  isKnown?: boolean;
  onKnownChange?: (isKnown: boolean) => void;
  onMemorizeResult?: () => void;
  onNext: () => void;
  progressCompletedCount?: number;
  progressTotalCount?: number;
  promptStatsAction?: ReactNode;
  cardSetName?: string;
  finishAction?: ReactNode;
  resultColors?: WorldResultColors;
  targetLanguage?: SupportedLanguage;
}) {
  const [letters, setLetters] = useState<Record<number, string>>({});
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] =
    useState<SubmissionOutcome | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const maskedCharacters = prompt.maskedAnswer.split('');
  const editableIndexes = maskedCharacters.flatMap((character, index) =>
    character === '_' ? [index] : [],
  );
  const answer = maskedCharacters
    .map((character, index) =>
      character === '_' ? (letters[index] ?? '') : character,
    )
    .join('');
  const submittedAnswerValue = maskedCharacters
    .map((character, index) =>
      character === '_'
        ? letters[index]?.trim()
          ? letters[index]
          : MISSING_ANSWER_CHARACTER
        : character,
    )
    .join('');
  const isAnswerComplete = maskedCharacters.every(
    (character, index) => character !== '_' || Boolean(letters[index]?.trim()),
  );
  const isSubmitted = submittedAnswer !== null;
  const isCorrect = submissionOutcome === 'correct';
  const isMemorize = submissionOutcome === 'memorize';
  const resultTone = submissionOutcome;
  const promptActions =
    promptStatsAction || (isSubmitted && onKnownChange) ? (
      <Stack
        data-test={`missing_letters_exercise__prompt_actions__${prompt.cardId}`}
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', ml: '5px' }}
      >
        {promptStatsAction}
        {isSubmitted && onKnownChange && (
          <KnownCardToggleButton
            checked={isKnown}
            dataTest={`missing_letters_exercise__known_button__${prompt.cardId}`}
            interfaceLanguage={interfaceLanguage}
            onChange={onKnownChange}
          />
        )}
      </Stack>
    ) : undefined;

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
    setSubmissionOutcome(null);
  }, [prompt.cardId, prompt.maskedAnswer]);

  useEffect(() => {
    const firstEditableIndex = editableIndexes[0];
    if (firstEditableIndex === undefined) {
      return;
    }

    inputRefs.current[firstEditableIndex]?.focus();
  }, [prompt.cardId, prompt.maskedAnswer]);

  useEffect(() => {
    if (!isSubmitted) {
      return undefined;
    }

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) {
        return;
      }

      event.preventDefault();
      onNext();
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isSubmitted, onNext]);

  function handleSubmitOrNext(eventDetail = 1) {
    if (isSubmitted) {
      if (eventDetail > 1) {
        return;
      }
      onNext();
      return;
    }

    if (!isAnswerComplete) {
      setSubmittedAnswer(submittedAnswerValue);
      setSubmissionOutcome('memorize');
      onAnswer(submittedAnswerValue);
      onMemorizeResult?.();
      return;
    }

    setSubmittedAnswer(answer);
    setSubmissionOutcome(
      normalizeAnswer(answer) === normalizeAnswer(prompt.expectedAnswer)
        ? 'correct'
        : 'incorrect',
    );
    onAnswer(answer);
  }

  function handleCellKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }

    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();
    handleSubmitOrNext();
  }

  return (
    <Paper
      data-test={`missing_letters_exercise__panel__${prompt.cardId}`}
      sx={{ p: 2 }}
    >
      <Stack
        data-test={`missing_letters_exercise__content__${prompt.cardId}`}
        spacing={2}
      >
        <Stack
          data-test={`missing_letters_exercise__header__${prompt.cardId}`}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack
            data-test={`missing_letters_exercise__header_text__${prompt.cardId}`}
            spacing={1}
            sx={{ alignItems: 'flex-start', minWidth: 0 }}
          >
            <Typography
              component="h2"
              data-test={`missing_letters_exercise__title__${prompt.cardId}`}
              variant="h6"
            >
              {t(interfaceLanguage, 'game')}: {t(interfaceLanguage, 'missingLetters')}
            </Typography>
            <ExerciseTargetLanguageChip
              dataTest={`missing_letters_exercise__target_language_chip__${prompt.cardId}`}
              interfaceLanguage={interfaceLanguage}
              targetLanguage={targetLanguage}
            />
            <Stack
              data-test={`missing_letters_exercise__metadata_row__${prompt.cardId}`}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {cardSetName && (
                <ExerciseCardSetChip
                  dataTest={`missing_letters_exercise__card_set_chip__${prompt.cardId}`}
                  interfaceLanguage={interfaceLanguage}
                  sx={exerciseCardSetChipStyles}
                  cardSetName={cardSetName}
                />
              )}
              {progressCompletedCount !== undefined &&
                progressTotalCount !== undefined && (
                  <ExerciseProgressChip
                    completed={progressCompletedCount}
                    dataTest={`missing_letters_exercise__progress_chip__${prompt.cardId}`}
                    interfaceLanguage={interfaceLanguage}
                    total={progressTotalCount}
                  />
                )}
            </Stack>
          </Stack>
          {finishAction}
        </Stack>
        <Stack
          data-test={`missing_letters_exercise__prompt_row__${prompt.cardId}`}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <TranslationHintRow
            complementaryLanguage={complementaryLanguage}
            complementaryLanguages={complementaryLanguages}
            dataTest={`missing_letters_exercise__prompt__${prompt.cardId}`}
            fallbackPrompt={prompt.prompt}
            hints={prompt.translationHints}
            trailingAction={promptActions}
          />
          {isRepeatedPrompt && (
            <ExerciseRepeatChip
              dataTest={`missing_letters_exercise__repeat_chip__${prompt.cardId}`}
              interfaceLanguage={interfaceLanguage}
              repeatProgress={repeatProgress}
            />
          )}
        </Stack>
        {prompt.definitionHint && (
          <Typography data-test={`missing_letters_exercise__definition_hint__${prompt.cardId}`}>
            {prompt.definitionHint}
          </Typography>
        )}
        <Stack
          data-test={`missing_letters_exercise__answer_cells__${prompt.cardId}`}
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
        >
          {maskedCharacters.map((character, index) =>
            character === '_' ? (
              <Box
                key={index}
                component="input"
                aria-label={`Missing letter ${index + 1}`}
                data-test={`missing_letters_exercise__input_cell__${prompt.cardId}__${index}`}
                disabled={isSubmitted}
                ref={(element: HTMLInputElement | null) => {
                  inputRefs.current[index] = element;
                }}
                style={getSubmittedInputCellStyle({
                  actual: letters[index] ?? '',
                  expected: prompt.expectedAnswer[index] ?? '',
                  resultColors,
                  resultTone,
                })}
                value={letters[index] ?? ''}
                onKeyDown={handleCellKeyDown}
                onChange={(event) => {
                  const nextValue = event.target.value.slice(-1);
                  setLetters((current) => ({
                    ...current,
                    [index]: nextValue,
                  }));
                  if (nextValue) {
                    focusNextEditableInput({
                      currentIndex: index,
                      editableIndexes,
                      inputRefs,
                    });
                  }
                }}
                sx={typedLetterCellStyles}
              />
            ) : (
              <Box
                key={index}
                component="span"
                data-test={`missing_letters_exercise__fixed_cell__${prompt.cardId}__${index}`}
                style={getLetterCellInlineStyle(resultTone, resultColors)}
                sx={letterCellStyles}
              >
                {character}
              </Box>
            ),
          )}
        </Stack>
        {isSubmitted && !isCorrect && (
          <Stack
            data-test={`missing_letters_exercise__correct_answer_block__${prompt.cardId}`}
            spacing={0.75}
          >
            <Typography
              data-test={`missing_letters_exercise__correct_answer_label__${prompt.cardId}`}
              variant="overline"
            >
              {t(interfaceLanguage, 'correctAnswer')}
            </Typography>
            <Stack
              aria-label={`${t(interfaceLanguage, 'correctAnswer')}: ${
                prompt.expectedAnswer
              }`}
              data-test={`missing_letters_exercise__correct_answer_cells__${prompt.cardId}`}
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
            >
              {prompt.expectedAnswer.split('').map((character, index) => (
                <Box
                  key={`${character}-${index}`}
                  component="span"
                  data-test={`missing_letters_exercise__correct_answer_cell__${prompt.cardId}__${index}`}
                  style={getLetterCellInlineStyle(
                    'correct',
                    resultColors,
                    'strong',
                  )}
                  sx={letterCellStyles}
                >
                  {character}
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            data-test={`missing_letters_exercise__submit_or_next_button__${prompt.cardId}`}
            variant="contained"
            startIcon={
              isSubmitted && !isMemorize ? (
                isCorrect ? (
                  <EmojiEventsOutlinedIcon />
                ) : (
                  <ErrorOutlineIcon />
                )
              ) : undefined
            }
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              handleSubmitOrNext(event.detail)
            }
            style={
              submissionOutcome === 'memorize'
                ? {
                    backgroundColor: 'rgb(255, 243, 205)',
                    border: '1px solid #f2cf66',
                    color: '#5f4400',
                  }
                : undefined
            }
            sx={{
              alignSelf: 'flex-start',
              boxShadow: 'none',
              height: 40,
              minWidth: 148,
              ...(isSubmitted && isCorrect
                ? {
                    bgcolor: resultColors.correct.main,
                    '&:hover': {
                      bgcolor: resultColors.correct.main,
                      boxShadow: 'none',
                    },
                  }
                : {}),
              ...(submissionOutcome === 'incorrect'
                ? {
                    bgcolor: resultColors.incorrect.soft,
                    border: `1px solid ${resultColors.incorrect.border}`,
                    color: resultColors.incorrect.text,
                    '&:hover': {
                      bgcolor: resultColors.incorrect.soft,
                      boxShadow: 'none',
                    },
                  }
                : {}),
              ...(submissionOutcome === 'memorize'
                ? {
                    bgcolor: 'rgb(255, 243, 205)',
                    border: '1px solid #f2cf66',
                    color: '#5f4400',
                    '&:hover': {
                      bgcolor: 'rgb(255, 236, 168)',
                      boxShadow: 'none',
                    },
                  }
                : {}),
            }}
          >
            {!isSubmitted
              ? t(interfaceLanguage, 'submit')
              : isCorrect
                ? t(interfaceLanguage, 'correctResult')
                : isMemorize
                  ? t(interfaceLanguage, 'memorizeResult')
                  : t(interfaceLanguage, 'incorrect')}
          </Button>
        </Stack>
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
  color: '#5f6b57',
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
    color: '#757575',
    opacity: 1,
    WebkitTextFillColor: '#757575',
  },
};

const typedLetterCellStyles = {
  ...letterCellStyles,
  color: '#203015',
  WebkitTextFillColor: '#203015',
};

const exerciseCardSetChipStyles = {
  bgcolor: '#f2f3f1',
  border: '1px solid rgba(32, 48, 21, 0.18)',
  color: '#203015',
  fontWeight: 850,
  height: 30,
};

function getLetterCellInlineStyle(
  resultTone: SubmissionOutcome | null,
  resultColors: WorldResultColors,
  textTone: 'muted' | 'strong' = 'muted',
): CSSProperties | undefined {
  if (!resultTone) {
    return undefined;
  }

  return {
    backgroundColor:
      resultTone === 'correct'
        ? resultColors.correct.soft
        : resultTone === 'memorize'
          ? 'rgb(255, 243, 205)'
          : resultColors.incorrect.soft,
    borderColor:
      resultTone === 'correct'
        ? resultColors.correct.border
        : resultTone === 'memorize'
          ? '#f2cf66'
          : resultColors.incorrect.border,
    color: textTone === 'strong' ? '#203015' : 'rgb(117, 117, 117)',
    WebkitTextFillColor:
      textTone === 'strong' ? '#203015' : 'rgb(117, 117, 117)',
    textDecorationLine: 'none',
  };
}

function getSubmittedInputCellStyle({
  actual,
  expected,
  resultColors,
  resultTone,
}: {
  actual: string;
  expected: string;
  resultColors: WorldResultColors;
  resultTone: SubmissionOutcome | null;
}): CSSProperties {
  return {
    ...getLetterCellInlineStyle(resultTone, resultColors),
    textDecorationLine: shouldStrikeAnswerCharacter({
      actual,
      expected,
      isIncorrect: resultTone === 'incorrect',
    })
      ? 'line-through'
      : 'none',
    textDecorationThickness: '2px',
  };
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function focusNextEditableInput({
  currentIndex,
  editableIndexes,
  inputRefs,
}: {
  currentIndex: number;
  editableIndexes: number[];
  inputRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
}) {
  const currentPosition = editableIndexes.indexOf(currentIndex);
  const nextIndex = editableIndexes[currentPosition + 1];
  if (nextIndex === undefined) {
    return;
  }

  inputRefs.current[nextIndex]?.focus();
}
