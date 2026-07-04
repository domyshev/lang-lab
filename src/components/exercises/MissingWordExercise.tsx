import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IncompleteAnswerWarning } from '../IncompleteAnswerWarning';
import { MissingWordPrompt } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import { RootState } from '../../store/store';

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
  const [warningPulse, setWarningPulse] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const answerCharacters = prompt.expectedAnswer.split('');
  const answer = answerCharacters
    .map((character, index) =>
      character.trim() === '' ? character : (letters[index] ?? ''),
    )
    .join('');
  const isAnswerComplete = answerCharacters.every(
    (character, index) =>
      character.trim() === '' || Boolean(letters[index]?.trim()),
  );
  const isSubmitted = submittedAnswer !== null;
  const isCorrect =
    submittedAnswer !== null &&
    normalizeAnswer(submittedAnswer) === normalizeAnswer(prompt.expectedAnswer);
  const resultTone = isSubmitted ? (isCorrect ? 'correct' : 'incorrect') : null;
  const sentenceParts = splitSentenceWithGap(prompt.sentenceWithGap);

  useEffect(() => {
    setLetters({});
    setSubmittedAnswer(null);
    setIsWarningVisible(false);
  }, [prompt.cardId, prompt.expectedAnswer, prompt.sentenceWithGap]);

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
        <Typography variant="h6">{t(interfaceLanguage, 'missingWord')}</Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={1} alignItems="center">
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
              isSubmitted,
              letters,
              resultTone,
              setLetters,
            })}
            <SentenceText>{sentenceParts.after}</SentenceText>
          </Box>
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
  isSubmitted,
  letters,
  resultTone,
  setLetters,
}: {
  characters: string[];
  isSubmitted: boolean;
  letters: Record<number, string>;
  resultTone: 'correct' | 'incorrect' | null;
  setLetters: Dispatch<SetStateAction<Record<number, string>>>;
}) {
  let inputIndex = 0;

  return characters.map((character, index) => {
    if (character.trim() === '') {
      return <AnswerSpace key={`space-${index}`} />;
    }

    inputIndex += 1;
    return (
      <Box
        key={`${character}-${index}`}
        component="input"
        aria-label={`Missing word letter ${inputIndex}`}
        disabled={isSubmitted}
        style={getLetterCellInlineStyle(resultTone)}
        value={letters[index] ?? ''}
        onChange={(event) =>
          setLetters((current) => ({
            ...current,
            [index]: event.target.value.slice(-1),
          }))
        }
        sx={letterCellStyles}
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
