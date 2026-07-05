import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { CSSProperties, MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { IncompleteAnswerWarning } from '../IncompleteAnswerWarning';
import { MissingLettersPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

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
  const [warningPulse, setWarningPulse] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
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
  const isCorrect =
    submittedAnswer !== null &&
    normalizeAnswer(submittedAnswer) === normalizeAnswer(prompt.expectedAnswer);
  const resultTone = isSubmitted ? (isCorrect ? 'correct' : 'incorrect') : null;

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
    setIsWarningVisible(false);
  }, [prompt.cardId, prompt.maskedAnswer]);

  useEffect(() => {
    if (!isWarningVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsWarningVisible(false);
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [isWarningVisible, warningPulse]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          {t(interfaceLanguage, 'missingLetters')}
        </Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={1} alignItems="center">
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {maskedCharacters.map((character, index) =>
              character === '_' ? (
                <Box
                  key={index}
                  component="input"
                  aria-label={`Missing letter ${index + 1}`}
                  disabled={isSubmitted}
                  ref={(element: HTMLInputElement | null) => {
                    inputRefs.current[index] = element;
                  }}
                  style={getLetterCellInlineStyle(resultTone)}
                  value={letters[index] ?? ''}
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
                  sx={letterCellStyles}
                />
              ) : (
                <Box
                  key={index}
                  component="span"
                  style={getLetterCellInlineStyle(resultTone)}
                  sx={letterCellStyles}
                >
                  {character}
                </Box>
              ),
            )}
          </Stack>
          <IncompleteAnswerWarning
            label={t(interfaceLanguage, 'fillAllGapsWarning')}
            pulseKey={warningPulse}
            visible={isWarningVisible}
          />
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
              {prompt.expectedAnswer.split('').map((character, index) => (
                <Box
                  key={`${character}-${index}`}
                  component="span"
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
          variant="contained"
          startIcon={
            isSubmitted ? (
              isCorrect ? (
                <EmojiEventsOutlinedIcon />
              ) : (
                <ErrorOutlineIcon />
              )
            ) : undefined
          }
          onClick={() => {
            if (isSubmitted) {
              onNext();
              return;
            }

            if (!isAnswerComplete) {
              setWarningPulse((value) => value + 1);
              setIsWarningVisible(true);
              return;
            }

            setSubmittedAnswer(answer);
            onAnswer(answer);
          }}
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
            ...(isSubmitted && !isCorrect
              ? {
                  bgcolor: '#fdebee',
                  border: '1px solid #f2a7b4',
                  color: '#9f1239',
                  '&:hover': { bgcolor: '#fbdde3', boxShadow: 'none' },
                }
              : {}),
          }}
        >
          {!isSubmitted
            ? t(interfaceLanguage, 'submit')
            : isCorrect
              ? t(interfaceLanguage, 'correctResult')
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
