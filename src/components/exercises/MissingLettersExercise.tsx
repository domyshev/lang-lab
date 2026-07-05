import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { MissingLettersPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

type SubmissionOutcome = 'correct' | 'incorrect' | 'memorize';

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
  const isAnswerComplete = maskedCharacters.every(
    (character, index) => character !== '_' || Boolean(letters[index]?.trim()),
  );
  const isSubmitted = submittedAnswer !== null;
  const isCorrect = submissionOutcome === 'correct';
  const isMemorize = submissionOutcome === 'memorize';
  const resultTone = submissionOutcome;

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
    setSubmissionOutcome(null);
  }, [prompt.cardId, prompt.maskedAnswer]);

  function handleSubmitOrNext(eventDetail = 1) {
    if (isSubmitted) {
      if (eventDetail > 1) {
        return;
      }
      onNext();
      return;
    }

    if (!isAnswerComplete) {
      setSubmittedAnswer(answer);
      setSubmissionOutcome('memorize');
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
        <Typography
          data-test={`missing_letters_exercise__title__${prompt.cardId}`}
          variant="h6"
        >
          {t(interfaceLanguage, 'missingLetters')}
        </Typography>
        <Typography data-test={`missing_letters_exercise__prompt__${prompt.cardId}`}>
          {prompt.prompt}
        </Typography>
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
                style={getLetterCellInlineStyle(resultTone)}
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
                style={getLetterCellInlineStyle(resultTone)}
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
                  style={getLetterCellInlineStyle('correct')}
                  sx={letterCellStyles}
                >
                  {character}
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
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
                  bgcolor: '#2f7d32',
                  '&:hover': { bgcolor: '#276b2a', boxShadow: 'none' },
                }
              : {}),
            ...(submissionOutcome === 'incorrect'
              ? {
                  bgcolor: '#fdebee',
                  border: '1px solid #f2a7b4',
                  color: '#9f1239',
                  '&:hover': { bgcolor: '#fbdde3', boxShadow: 'none' },
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

function getLetterCellInlineStyle(
  resultTone: SubmissionOutcome | null,
): CSSProperties | undefined {
  if (!resultTone) {
    return undefined;
  }

  return {
    backgroundColor:
      resultTone === 'correct'
        ? 'rgb(235, 247, 225)'
        : resultTone === 'memorize'
          ? 'rgb(255, 243, 205)'
          : 'rgb(253, 235, 238)',
    borderColor:
      resultTone === 'correct'
        ? '#8fc773'
        : resultTone === 'memorize'
          ? '#f2cf66'
          : '#f2a7b4',
    color: 'rgb(117, 117, 117)',
    WebkitTextFillColor: 'rgb(117, 117, 117)',
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
