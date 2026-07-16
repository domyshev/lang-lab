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
  Dispatch,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  ReactNode,
  SetStateAction,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { shouldStrikeAnswerCharacter } from '../../domain/answerCharacters';
import { MISSING_ANSWER_CHARACTER } from '../../domain/answerPlaceholders';
import { MissingWordPrompt } from '../../domain/exercises';
import { footballResultColors } from '../../domain/footballTheme';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import type { WorldResultColors } from '../../domain/worlds';
import { RootState } from '../../store/store';
import { KnownCardToggleButton } from '../KnownCardToggleButton';
import {
  ExerciseProgressChip,
  ExerciseRepeatChip,
  ExerciseCardSetChip,
  ExerciseTargetLanguageChip,
} from './ExerciseCardSetChip';
import { TranslationHintRow } from './TranslationHintRow';

type SubmissionOutcome = 'correct' | 'incorrect' | 'memorize';

export function MissingWordExercise({
  complementaryLanguage,
  complementaryLanguages,
  definitions,
  disableAdditionalHints,
  isRepeatedPrompt = false,
  prompt,
  repeatProgress,
  resultColors = footballResultColors,
  onAnswer,
  isKnown = false,
  onKnownChange,
  onMemorizeResult,
  onNext,
  progressCompletedCount,
  progressTotalCount,
  promptStatsAction,
  cardSetName,
  finishAction,
  targetLanguage = 'en',
}: {
  complementaryLanguage?: SupportedLanguage;
  complementaryLanguages?: SupportedLanguage[];
  definitions?: Partial<Record<SupportedLanguage, string>>;
  disableAdditionalHints?: boolean;
  isRepeatedPrompt?: boolean;
  prompt: MissingWordPrompt;
  repeatProgress?: { current: number; total: number };
  resultColors?: WorldResultColors;
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
  targetLanguage?: SupportedLanguage;
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
  const submittedAnswerValue = answerCharacters
    .map((character, index) =>
      character.trim() === ''
        ? character
        : editableIndexes.includes(index)
          ? letters[index]?.trim()
            ? letters[index]
            : MISSING_ANSWER_CHARACTER
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
  const promptActions =
    promptStatsAction || (isSubmitted && onKnownChange) ? (
      <Stack
        data-test={`missing_word_exercise__prompt_actions__${prompt.cardId}`}
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', ml: '5px' }}
      >
        {promptStatsAction}
        {isSubmitted && onKnownChange && (
          <KnownCardToggleButton
            checked={isKnown}
            dataTest={`missing_word_exercise__known_button__${prompt.cardId}`}
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
  }, [prompt.cardId, prompt.expectedAnswer, prompt.sentenceWithGap]);

  useEffect(() => {
    const firstEditableIndex = editableIndexes[0];
    if (firstEditableIndex === undefined) {
      return;
    }

    inputRefs.current[firstEditableIndex]?.focus();
  }, [prompt.cardId, prompt.expectedAnswer, prompt.sentenceWithGap]);

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
      data-test={`missing_word_exercise__panel__${prompt.cardId}`}
      sx={{ p: 2 }}
    >
      <Stack
        data-test={`missing_word_exercise__content__${prompt.cardId}`}
        spacing={2}
      >
        <Stack
          data-test={`missing_word_exercise__header__${prompt.cardId}`}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack
            data-test={`missing_word_exercise__header_text__${prompt.cardId}`}
            spacing={1}
            sx={{ alignItems: 'flex-start', minWidth: 0 }}
          >
            <Typography
              component="h2"
              data-test={`missing_word_exercise__title__${prompt.cardId}`}
              variant="h6"
            >
              {t(interfaceLanguage, 'game')}: {t(interfaceLanguage, 'missingWord')}
            </Typography>
            <ExerciseTargetLanguageChip
              dataTest={`missing_word_exercise__target_language_chip__${prompt.cardId}`}
              interfaceLanguage={interfaceLanguage}
              targetLanguage={targetLanguage}
            />
            <Stack
              data-test={`missing_word_exercise__metadata_row__${prompt.cardId}`}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {cardSetName && (
                <ExerciseCardSetChip
                  dataTest={`missing_word_exercise__card_set_chip__${prompt.cardId}`}
                  interfaceLanguage={interfaceLanguage}
                  sx={exerciseCardSetChipStyles}
                  cardSetName={cardSetName}
                />
              )}
              {progressCompletedCount !== undefined &&
                progressTotalCount !== undefined && (
                  <ExerciseProgressChip
                    completed={progressCompletedCount}
                    dataTest={`missing_word_exercise__progress_chip__${prompt.cardId}`}
                    interfaceLanguage={interfaceLanguage}
                    total={progressTotalCount}
                  />
                )}
            </Stack>
          </Stack>
          {finishAction}
        </Stack>
        <Stack
          data-test={`missing_word_exercise__prompt_row__${prompt.cardId}`}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <TranslationHintRow
            activeHintLanguage={activeHintLanguage}
            activeDefinitionLanguage={activeDefinitionLanguage}
            complementaryLanguage={complementaryLanguage}
            complementaryLanguages={complementaryLanguages}
            dataTest={`missing_word_exercise__prompt__${prompt.cardId}`}
            definitions={definitions}
            definitionHint={prompt.definitionHint}
            disableAdditionalHints={disableAdditionalHints}
            fallbackPrompt={prompt.prompt}
            hints={prompt.translationHints}
            onHintLanguageChange={onHintLanguageChange}
            onDefinitionLanguageChange={onDefinitionLanguageChange}
            trailingAction={promptActions}
          />
          {isRepeatedPrompt && (
            <ExerciseRepeatChip
              dataTest={`missing_word_exercise__repeat_chip__${prompt.cardId}`}
              interfaceLanguage={interfaceLanguage}
              repeatProgress={repeatProgress}
            />
          )}
        </Stack>
        {prompt.definitionHint && !definitions && (
          <Typography data-test={`missing_word_exercise__definition_hint__${prompt.cardId}`}>
            {prompt.definitionHint}
          </Typography>
        )}
        <Box
          data-test={`missing_word_exercise__sentence__${prompt.cardId}`}
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          <SentenceText dataTest={`missing_word_exercise__sentence_before__${prompt.cardId}`}>
            {sentenceParts.before}
          </SentenceText>
          {renderAnswerCells({
            characters: answerCharacters,
            dataTestPrefix: `missing_word_exercise__answer_cells__${prompt.cardId}`,
            editableIndexes,
            inputRefs,
            isSubmitted,
            letters,
            resultColors,
            resultTone,
            onCellKeyDown: handleCellKeyDown,
            setLetters,
          })}
          <SentenceText dataTest={`missing_word_exercise__sentence_after__${prompt.cardId}`}>
            {sentenceParts.after}
          </SentenceText>
        </Box>
        {isSubmitted && !isCorrect && (
          <Stack
            data-test={`missing_word_exercise__correct_answer_block__${prompt.cardId}`}
            spacing={0.75}
          >
            <Typography
              data-test={`missing_word_exercise__correct_answer_label__${prompt.cardId}`}
              variant="overline"
            >
              {t(interfaceLanguage, 'correctAnswer')}
            </Typography>
            <Stack
              aria-label={`${t(interfaceLanguage, 'correctAnswer')}: ${
                prompt.expectedAnswer
              }`}
              data-test={`missing_word_exercise__correct_answer_cells__${prompt.cardId}`}
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
            >
              {prompt.expectedAnswer.split('').map((character, index) =>
                character.trim() === '' ? (
                  <AnswerSpace
                    dataTest={`missing_word_exercise__correct_answer_space__${prompt.cardId}__${index}`}
                    key={`correct-space-${index}`}
                  />
                ) : (
                  <Box
                    key={`correct-${character}-${index}`}
                    component="span"
                    data-test={`missing_word_exercise__correct_answer_cell__${prompt.cardId}__${index}`}
                    style={getLetterCellInlineStyle(
                      'correct',
                      resultColors,
                      'strong',
                    )}
                    sx={letterCellStyles}
                  >
                    {character}
                  </Box>
                ),
              )}
            </Stack>
          </Stack>
        )}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            data-test={`missing_word_exercise__submit_or_next_button__${prompt.cardId}`}
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

function SentenceText({
  children,
  dataTest,
}: {
  children: string;
  dataTest: string;
}) {
  if (!children.trim()) {
    return null;
  }

  return (
    <Typography
      component="span"
      data-test={dataTest}
      sx={{ fontSize: 22, lineHeight: '38px', whiteSpace: 'pre-wrap' }}
    >
      {children.trim()}
    </Typography>
  );
}

function renderAnswerCells({
  characters,
  dataTestPrefix,
  editableIndexes,
  inputRefs,
  isSubmitted,
  letters,
  onCellKeyDown,
  resultColors,
  resultTone,
  setLetters,
}: {
  characters: string[];
  dataTestPrefix: string;
  editableIndexes: number[];
  inputRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
  isSubmitted: boolean;
  letters: Record<number, string>;
  onCellKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  resultColors: WorldResultColors;
  resultTone: SubmissionOutcome | null;
  setLetters: Dispatch<SetStateAction<Record<number, string>>>;
}) {
  let inputIndex = 0;

  return characters.map((character, index) => {
    if (character.trim() === '') {
      return (
        <AnswerSpace
          dataTest={`${dataTestPrefix}__space__${index}`}
          key={`space-${index}`}
        />
      );
    }

    if (!editableIndexes.includes(index)) {
      return (
        <Box
        key={`${character}-${index}`}
        component="span"
        data-test={`${dataTestPrefix}__fixed_cell__${index}`}
        style={getLetterCellInlineStyle(resultTone, resultColors)}
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
      data-test={`${dataTestPrefix}__input_cell__${index}`}
      disabled={isSubmitted}
        ref={(element: HTMLInputElement | null) => {
          inputRefs.current[index] = element;
        }}
        style={getSubmittedInputCellStyle({
          actual: letters[index] ?? '',
          expected: characters[index] ?? '',
          resultColors,
          resultTone,
        })}
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

function AnswerSpace({ dataTest }: { dataTest: string }) {
  return (
    <Box
      aria-hidden="true"
      component="span"
      data-test={dataTest}
      sx={{ display: 'inline-flex', height: 38, width: 38 }}
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

function getEditableAnswerIndexes(characters: string[]): number[] {
  const editableIndexes: number[] = [];
  let indexInWord = 0;

  characters.forEach((character, index) => {
    if (character.trim() === '') {
      indexInWord = 0;
      return;
    }

    if (!isLetter(character)) {
      return;
    }

    if (indexInWord % 2 === 1) {
      editableIndexes.push(index);
    }
    indexInWord += 1;
  });

  return editableIndexes;
}

function isLetter(character: string): boolean {
  return /^\p{L}$/u.test(character);
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
