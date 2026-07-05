import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type {
  CSSProperties,
  Dispatch,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  SetStateAction,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MissingWordPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { RootState } from '../../store/store';

type SubmissionOutcome = 'correct' | 'incorrect' | 'memorize';

export function MissingWordExercise({
  prompt,
  onAnswer,
  onNext,
}: {
  prompt: MissingWordPrompt;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  const [letters, setLetters] = useState<Record<number, string>>({});
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] =
    useState<SubmissionOutcome | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const answerCharacters = prompt.expectedAnswer.split('');
  const editableIndexes = getEditableAnswerIndexes(answerCharacters);
  const answer = answerCharacters
    .map((character, index) =>
      character.trim() === ''
        ? character
        : editableIndexes.includes(index)
          ? (letters[index] ?? '')
          : character,
    )
    .join('');
  const isAnswerComplete = editableIndexes.every((index) =>
    Boolean(letters[index]?.trim()),
  );
  const isSubmitted = submittedAnswer !== null;
  const isCorrect = submissionOutcome === 'correct';
  const isMemorize = submissionOutcome === 'memorize';
  const resultTone = submissionOutcome;
  const sentenceParts = splitSentenceWithGap(prompt.sentenceWithGap);

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
    setSubmissionOutcome(null);
  }, [prompt.cardId, prompt.expectedAnswer, prompt.sentenceWithGap]);

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
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{t(interfaceLanguage, 'missingWord')}</Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          <SentenceText>{sentenceParts.before}</SentenceText>
          {renderAnswerCells({
            characters: answerCharacters,
            editableIndexes,
            inputRefs,
            isSubmitted,
            letters,
            resultTone,
            onCellKeyDown: handleCellKeyDown,
            setLetters,
          })}
          <SentenceText>{sentenceParts.after}</SentenceText>
        </Box>
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
        <Button
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

function SentenceText({ children }: { children: string }) {
  if (!children.trim()) {
    return null;
  }

  return (
    <Typography
      component="span"
      sx={{ fontSize: 22, lineHeight: '38px', whiteSpace: 'pre-wrap' }}
    >
      {children.trim()}
    </Typography>
  );
}

function renderAnswerCells({
  characters,
  editableIndexes,
  inputRefs,
  isSubmitted,
  letters,
  onCellKeyDown,
  resultTone,
  setLetters,
}: {
  characters: string[];
  editableIndexes: number[];
  inputRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
  isSubmitted: boolean;
  letters: Record<number, string>;
  onCellKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  resultTone: SubmissionOutcome | null;
  setLetters: Dispatch<SetStateAction<Record<number, string>>>;
}) {
  let inputIndex = 0;

  return characters.map((character, index) => {
    if (character.trim() === '') {
      return <AnswerSpace key={`space-${index}`} />;
    }

    if (!editableIndexes.includes(index)) {
      return (
        <Box
          key={`${character}-${index}`}
          component="span"
          style={getLetterCellInlineStyle(resultTone)}
          sx={letterCellStyles}
        >
          {character}
        </Box>
      );
    }

    inputIndex += 1;
    return (
      <Box
        key={`${character}-${index}`}
        component="input"
        aria-label={`Missing word letter ${inputIndex}`}
        disabled={isSubmitted}
        ref={(element: HTMLInputElement | null) => {
          inputRefs.current[index] = element;
        }}
        style={getLetterCellInlineStyle(resultTone)}
        value={letters[index] ?? ''}
        onKeyDown={onCellKeyDown}
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
    );
  });
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

function splitSentenceWithGap(sentenceWithGap: string): {
  before: string;
  after: string;
} {
  const [before = '', ...afterParts] = sentenceWithGap.split('_____');

  return {
    before,
    after: afterParts.join('_____'),
  };
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
    color: '#757575',
    opacity: 1,
    WebkitTextFillColor: '#757575',
  },
};

const typedLetterCellStyles = {
  ...letterCellStyles,
  color: '#5f6b57',
  WebkitTextFillColor: '#5f6b57',
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

function getEditableAnswerIndexes(characters: string[]): number[] {
  const editableIndexes: number[] = [];
  let indexInWord = 0;

  characters.forEach((character, index) => {
    if (character.trim() === '') {
      indexInWord = 0;
      return;
    }

    if (indexInWord % 2 === 1) {
      editableIndexes.push(index);
    }
    indexInWord += 1;
  });

  return editableIndexes;
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
