import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import {
  ChangeEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CrosswordCell,
  CrosswordEntry,
  CrosswordPuzzle,
} from '../../domain/crossword';
import { shouldStrikeAnswerCharacter } from '../../domain/answerCharacters';
import {
  getCrosswordCellTone,
  getIncorrectCrosswordEntries,
} from '../../domain/crosswordResults';
import type { CrosswordAttemptSnapshot } from '../../domain/exercises';
import { footballResultColors } from '../../domain/footballTheme';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import type { WorldResultColors } from '../../domain/worlds';
import { CursorAnchoredTooltip } from '../CursorAnchoredTooltip';
import { GameWarningIcon, GameWarningTooltip } from '../GameWarningTooltip';
import {
  ExerciseProgressChip,
  ExerciseCardSetChip,
  ExerciseTargetLanguageChip,
} from './ExerciseCardSetChip';

export type CrosswordDraftState = {
  answers: Record<string, string>;
  answeredCardIds: string[];
  cellValues: Record<string, string>;
  filledEntryCount: number;
  hasAnyLetters: boolean;
};

export function CrosswordExercise({
  interfaceLanguage = 'en',
  onDraftChange,
  puzzle,
  recentResultsByCardId = {},
  resultColors = footballResultColors,
  cardSetName,
  finishAction,
  targetLanguage = 'en',
  onFinish,
  onSubmit,
}: {
  interfaceLanguage?: SupportedLanguage;
  onDraftChange?: (state: CrosswordDraftState) => void;
  puzzle: CrosswordPuzzle;
  recentResultsByCardId?: Record<
    string,
    Array<{ isCorrect: boolean; occurredAt: string }>
  >;
  resultColors?: WorldResultColors;
  cardSetName?: string;
  finishAction?: ReactNode;
  targetLanguage?: SupportedLanguage;
  onFinish?: () => void;
  onSubmit: (
    answers: Record<string, string>,
    snapshot: CrosswordAttemptSnapshot,
  ) => void;
}) {
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] =
    useState<Record<string, string> | null>(null);
  const activeEntryIdRef = useRef<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const puzzleKey = useMemo(
    () =>
      puzzle.entries
        .map(
          (entry) =>
            `${entry.cardId}:${entry.row}:${entry.col}:${entry.direction}:${entry.answer}`,
        )
        .join('|'),
    [puzzle.entries],
  );
  const cellMap = new Map(
    puzzle.cells.map((cell) => [toCellKey(cell.row, cell.col), cell]),
  );
  const entryMap = new Map(puzzle.entries.map((entry) => [entry.cardId, entry]));
  const startEntryNumbers = useMemo(
    () =>
      new Map(
        puzzle.entries.map((entry, index) => [
          toCellKey(entry.row, entry.col),
          { entry, number: index + 1 },
        ]),
      ),
    [puzzle.entries],
  );
  const rows = range(puzzle.bounds.minRow, puzzle.bounds.maxRow);
  const cols = range(puzzle.bounds.minCol, puzzle.bounds.maxCol);
  const draftState = useMemo(
    () => getCrosswordDraftState(puzzle, cellValues),
    [cellValues, puzzle],
  );
  const submittedCorrectness = useMemo(() => {
    if (!submittedAnswers) {
      return {};
    }

    return Object.fromEntries(
      puzzle.entries
        .filter((entry) =>
          Object.prototype.hasOwnProperty.call(submittedAnswers, entry.cardId),
        )
        .map((entry) => [
          entry.cardId,
          normalizeAnswer(submittedAnswers[entry.cardId] ?? '') ===
            normalizeAnswer(entry.answer),
        ]),
    );
  }, [puzzle.entries, submittedAnswers]);
  const filledEntryCount = draftState.filledEntryCount;
  const hasSubmittedAnswers = Boolean(submittedAnswers);
  const isSubmitDisabled = !hasSubmittedAnswers && filledEntryCount === 0;

  useEffect(() => {
    setCellValues({});
    setSubmittedAnswers(null);
    activeEntryIdRef.current = null;
  }, [puzzleKey]);

  useEffect(() => {
    onDraftChange?.(draftState);
  }, [draftState, onDraftChange]);

  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return;
    }

    if (submittedAnswers) {
      onFinish?.();
      return;
    }

    const answers = draftState.answers;
    const snapshot: CrosswordAttemptSnapshot = {
      puzzle,
      cellValues: { ...cellValues },
    };
    setSubmittedAnswers(answers);
    onSubmit(answers, snapshot);
  };

  const handleCellChange = (
    event: ChangeEvent<HTMLInputElement>,
    cell: CrosswordCell,
  ) => {
    const key = toCellKey(cell.row, cell.col);
    const value = event.target.value.slice(-1);
    const nextCellValues = {
      ...cellValues,
      [key]: value,
    };
    setCellValues(nextCellValues);

    if (!value) {
      return;
    }

    const activeEntry = getActiveEntryForCell(
      cell,
      puzzle.entries,
      entryMap,
      activeEntryIdRef.current,
    );
    activeEntryIdRef.current = activeEntry?.cardId ?? null;

    const nextKey = activeEntry
      ? getNextEmptyCellKey(cell, activeEntry, nextCellValues)
      : undefined;
    if (nextKey) {
      inputRefs.current[nextKey]?.focus();
    }
  };

  const handleCellFocus = (cell: CrosswordCell) => {
    const activeEntry = activeEntryIdRef.current
      ? entryMap.get(activeEntryIdRef.current)
      : undefined;

    if (activeEntry && cell.entryIds.includes(activeEntry.cardId)) {
      return;
    }

    activeEntryIdRef.current =
      getActiveEntryForCell(cell, puzzle.entries, entryMap, null)?.cardId ??
      null;
  };

  return (
    <Paper
      data-test="crossword_exercise__panel"
      sx={{ p: 2, position: 'relative' }}
    >
      <Stack data-test="crossword_exercise__content" spacing={2}>
        <Stack
          data-test="crossword_exercise__header"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack
            data-test="crossword_exercise__header_text"
            spacing={1}
            sx={{ alignItems: 'flex-start', minWidth: 0 }}
          >
            <Typography
              component="h2"
              data-test="crossword_exercise__title"
              variant="h6"
            >
              {t(interfaceLanguage, 'game')}: {t(interfaceLanguage, 'crossword')}
            </Typography>
            <ExerciseTargetLanguageChip
              dataTest="crossword_exercise__target_language_chip"
              interfaceLanguage={interfaceLanguage}
              targetLanguage={targetLanguage}
            />
            <Stack
              data-test="crossword_exercise__metadata_row"
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {cardSetName && (
                <ExerciseCardSetChip
                  dataTest="crossword_exercise__card_set_chip"
                  interfaceLanguage={interfaceLanguage}
                  sx={crosswordCardSetChipStyles}
                  cardSetName={cardSetName}
                />
              )}
              <ExerciseProgressChip
                completed={filledEntryCount}
                dataTest="crossword_exercise__progress_chip"
                interfaceLanguage={interfaceLanguage}
                total={puzzle.entries.length}
              />
            </Stack>
          </Stack>
        </Stack>

        {finishAction && (
          <Box
            data-test="crossword_exercise__finish_action_slot"
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              zIndex: 2,
              '@media (max-width: 899.95px)': {
                justifyContent: 'flex-start',
                mt: -0.5,
              },
            }}
          >
            {finishAction}
          </Box>
        )}

        <Box
          data-test="crossword_exercise__grid"
          sx={{
            display: 'grid',
            gap: 0.5,
            gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
            maxWidth: `min(100%, ${cols.length * 38}px)`,
            overflow: 'visible',
            pl: 2.75,
            pt: 2.75,
            width: '100%',
            mx: 'auto',
          }}
        >
          {rows.flatMap((row) =>
            cols.map((col) => {
              const key = toCellKey(row, col);
              const cell = cellMap.get(key);
              const displayRow = row - puzzle.bounds.minRow + 1;
              const displayCol = col - puzzle.bounds.minCol + 1;

              if (!cell || /\s/.test(cell.solution)) {
                return (
                  <Box
                    data-test={`crossword_exercise__empty_cell__${displayRow}_${displayCol}`}
                    key={key}
                    sx={emptyCellStyles}
                  />
                );
              }

              const startEntryNumber = startEntryNumbers.get(key);
              const rawCellValue = cellValues[key] ?? '';
              const cellTone = getCrosswordCellTone(
                cell,
                submittedCorrectness,
              );
              const isInIncompleteSubmittedEntry = submittedAnswers
                ? cell.entryIds.some((entryId) => {
                    const entry = entryMap.get(entryId);
                    return entry
                      ? !isSubmittedEntryComplete(
                          entry,
                          submittedAnswers[entryId] ?? '',
                        )
                      : false;
                  })
                : false;
              const ghostValue =
                hasSubmittedAnswers &&
                !rawCellValue.trim() &&
                (!cellTone || isInIncompleteSubmittedEntry)
                  ? cell.solution
                  : '';
              const displayCellValue = rawCellValue || ghostValue;
              const isGhostValue = Boolean(ghostValue);
              const incorrectEntries = submittedAnswers
                ? getIncorrectCrosswordEntries(
                    cell,
                    puzzle,
                    submittedCorrectness,
                  )
                : [];

              const cellInput = (
                <Box
                  key={key}
                  data-test={`crossword_exercise__cell_shell__${displayRow}_${displayCol}`}
                  sx={letterCellShellStyles}
                >
                  {startEntryNumber && (
                    <Tooltip
                      arrow
                      placement="top-start"
                      slotProps={{
                        popper: {
                          modifiers: [
                            { name: 'offset', options: { offset: [0, 5] } },
                          ],
                        },
                        tooltip: {
                          ...({
                            'data-test': 'crossword_exercise__clue_tooltip',
                          } as Record<string, string>),
                          sx: (theme) => ({
                            bgcolor:
                              theme.palette.mode === 'dark'
                                ? '#1f2933'
                                : '#ffffff',
                            border:
                              theme.palette.mode === 'dark'
                                ? '1px solid rgba(255, 255, 255, 0.18)'
                                : '1px solid rgba(32, 48, 21, 0.14)',
                            boxShadow:
                              theme.palette.mode === 'dark'
                                ? '0 14px 30px rgba(0, 0, 0, 0.32)'
                                : '0 14px 30px rgba(32, 48, 21, 0.14)',
                            color:
                              theme.palette.mode === 'dark'
                                ? '#f8fafc'
                                : '#203015',
                            maxWidth: 280,
                            p: 1.25,
                          }),
                        },
                        arrow: {
                          sx: (theme) => ({
                            color:
                              theme.palette.mode === 'dark'
                                ? '#1f2933'
                                : '#ffffff',
                            '&:before': {
                              border:
                                theme.palette.mode === 'dark'
                                  ? '1px solid rgba(255, 255, 255, 0.18)'
                                  : '1px solid rgba(32, 48, 21, 0.14)',
                            },
                          }),
                        },
                      }}
                      title={
                        <Stack spacing={0.5}>
                          <Typography
                            sx={{
                              color: '#2f7d9b',
                              fontSize: 14,
                              fontWeight: 900,
                              lineHeight: 1.2,
                            }}
                          >
                            {t(interfaceLanguage, 'question')}
                          </Typography>
                          <Typography sx={{ fontSize: 14, lineHeight: 1.35 }}>
                            {startEntryNumber.entry.clue}
                          </Typography>
                        </Stack>
                      }
                    >
                      <Box
                        aria-label={`Question ${startEntryNumber.number}`}
                        component="button"
                        data-test={`crossword_exercise__clue_number__${startEntryNumber.entry.cardId}`}
                        onClick={() => {
                          activeEntryIdRef.current =
                            startEntryNumber.entry.cardId;
                          inputRefs.current[key]?.focus();
                        }}
                        sx={getClueNumberStyles(
                          startEntryNumber.entry.direction,
                        )}
                        type="button"
                      >
                        {startEntryNumber.number}
                      </Box>
                    </Tooltip>
                  )}
                  <Box
                    component="input"
                    aria-label={`Crossword cell ${displayRow} ${displayCol}`}
                    data-test={`crossword_exercise__input_cell__${displayRow}_${displayCol}`}
                    value={displayCellValue}
                    onChange={(event) => handleCellChange(event, cell)}
                    onFocus={() => handleCellFocus(cell)}
                    disabled={hasSubmittedAnswers}
                    maxLength={1}
                    ref={(element: HTMLInputElement | null) => {
                      inputRefs.current[key] = element;
                    }}
                    sx={letterCellStyles}
                    style={{
                      ...getSubmittedCellStyle(cellTone, resultColors),
                      ...(isGhostValue ? ghostCellStyle : {}),
                      textDecorationLine: shouldStrikeAnswerCharacter({
                        actual: rawCellValue,
                        expected: cell.solution,
                        isIncorrect: cellTone === 'incorrect',
                      })
                        ? 'line-through'
                        : 'none',
                      textDecorationThickness: '2px',
                    }}
                  />
                </Box>
              );

              if (submittedAnswers && incorrectEntries.length > 0) {
                return (
                  <CorrectionTooltip
                    dataTestPrefix={`crossword_exercise__correction__${displayRow}_${displayCol}`}
                    entries={incorrectEntries}
                    interfaceLanguage={interfaceLanguage}
                    key={key}
                    recentResultsByCardId={recentResultsByCardId}
                    resultColors={resultColors}
                  >
                    {cellInput}
                  </CorrectionTooltip>
                );
              }

              return cellInput;
            }),
          )}
        </Box>

        <Stack
          data-test="crossword_exercise__submit_row"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Button
            data-test="crossword_exercise__submit_button"
            variant="contained"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            startIcon={
              hasSubmittedAnswers ? (
                <EmojiEventsOutlinedIcon data-test="crossword_exercise__completed_button_icon" />
              ) : undefined
            }
            sx={{ alignSelf: 'flex-start' }}
          >
            {hasSubmittedAnswers
              ? t(interfaceLanguage, 'completedResult')
              : t(interfaceLanguage, 'submitCrossword')}
          </Button>
          {isSubmitDisabled && (
            <GameWarningTooltip
              anchorDataTest="crossword_exercise__submit_warning_anchor"
              arrowDataTest="crossword_exercise__submit_warning_tooltip_arrow"
              iconDataTest="crossword_exercise__submit_warning_tooltip_icon"
              messages={[t(interfaceLanguage, 'crosswordSubmitNeedsCompletedWord')]}
            >
              <GameWarningIcon dataTest="crossword_exercise__submit_warning_icon" />
            </GameWarningTooltip>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function CorrectionTooltip({
  children,
  dataTestPrefix,
  entries,
  interfaceLanguage,
  recentResultsByCardId,
  resultColors,
}: {
  children: ReactElement;
  dataTestPrefix: string;
  entries: CrosswordEntry[];
  interfaceLanguage: SupportedLanguage;
  recentResultsByCardId: Record<
    string,
    Array<{ isCorrect: boolean; occurredAt: string }>
  >;
  resultColors: WorldResultColors;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTestPrefix}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      popperDataTest={`${dataTestPrefix}__popper`}
      preventOverflow
      transitionTimeout={0}
      tooltipStyle={recentAnswersTooltipViewportStyle}
      tooltipSx={recentAnswersTooltipStyles}
      title={
        <Stack data-test={`${dataTestPrefix}__tooltip`} spacing={1.25}>
          {entries.map((entry) => (
            <Stack
              alignItems="center"
              data-test={`${dataTestPrefix}__entry__${encodeURIComponent(entry.cardId)}`}
              key={entry.cardId}
              spacing={0.75}
            >
              <AnswerCells
                dataTestPrefix={`${dataTestPrefix}__entry__${encodeURIComponent(
                  entry.cardId,
                )}__answer`}
                resultColors={resultColors}
                value={entry.answer}
              />
              <RecentResultsBlock
                dataTestPrefix={`${dataTestPrefix}__entry__${encodeURIComponent(
                  entry.cardId,
                )}`}
                interfaceLanguage={interfaceLanguage}
                recentResults={recentResultsByCardId[entry.cardId]?.slice(0, 10) ?? []}
                resultColors={resultColors}
              />
            </Stack>
          ))}
        </Stack>
      }
    >
      {children}
    </CursorAnchoredTooltip>
  );
}

function RecentResultsBlock({
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  resultColors,
}: {
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: Array<{ isCorrect: boolean; occurredAt: string }>;
  resultColors: WorldResultColors;
}) {
  return (
    <Stack data-test={`${dataTestPrefix}__recent`} spacing={0.5}>
      <Typography
        data-test={`${dataTestPrefix}__recent_title`}
        sx={{
          color: '#203015',
          fontSize: 14,
          fontWeight: 850,
          mt: '10px',
        }}
      >
        {t(interfaceLanguage, 'recentAnswersTitle')}
      </Typography>
      <Stack data-test={`${dataTestPrefix}__recent_results`} spacing={0.5}>
        {recentResults.map((result, index) => (
          <Stack
            data-test={`${dataTestPrefix}__recent_result__${index}`}
            direction="row"
            key={`${result.occurredAt}-${index}`}
            spacing={0.75}
            sx={{ alignItems: 'center' }}
          >
            <Chip
              data-test={`${dataTestPrefix}__recent_result_chip__${index}`}
              label={t(
                interfaceLanguage,
                result.isCorrect ? 'metricCorrectSuffix' : 'metricIncorrectSuffix',
              )}
              size="small"
              sx={recentResultChipStyles(result.isCorrect, resultColors)}
            />
            <Typography
              data-test={`${dataTestPrefix}__recent_result_date__${index}`}
              sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}
            >
              {formatAttemptDate(result.occurredAt)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function AnswerCells({
  dataTestPrefix,
  resultColors,
  value,
}: {
  dataTestPrefix: string;
  resultColors: WorldResultColors;
  value: string;
}) {
  return (
    <Stack
      aria-label={value}
      data-test={dataTestPrefix}
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      spacing={0.5}
      useFlexGap
    >
      {value.split('').map((character, index) =>
        character.trim() === '' ? (
          <Box
            aria-hidden="true"
            component="span"
            data-test={`${dataTestPrefix}__space__${index}`}
            key={`space-${index}`}
            sx={correctionAnswerSpaceStyles}
          />
        ) : (
          <Box
            component="span"
            data-test={`${dataTestPrefix}__cell__${index}`}
            key={`${character}-${index}`}
            sx={getCorrectionAnswerCellStyles(resultColors)}
          >
            {character}
          </Box>
        ),
      )}
    </Stack>
  );
}

function toCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function getFilledEntryCount(
  puzzle: CrosswordPuzzle,
  cellValues: Record<string, string>,
): number {
  return puzzle.entries.filter((entry) =>
    entry.answer.split('').every((character, index) => {
      if (/\s/.test(character)) {
        return true;
      }

      const row = entry.direction === 'down' ? entry.row + index : entry.row;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      return Boolean(cellValues[toCellKey(row, col)]?.trim());
    }),
  ).length;
}

function getCrosswordDraftState(
  puzzle: CrosswordPuzzle,
  cellValues: Record<string, string>,
): CrosswordDraftState {
  const answers = getCrosswordAnswers(puzzle, cellValues);
  const answeredCardIds = puzzle.entries
    .filter((entry) => isEntryFilled(entry, cellValues))
    .map((entry) => entry.cardId);

  return {
    answers,
    answeredCardIds,
    cellValues: { ...cellValues },
    filledEntryCount: answeredCardIds.length,
    hasAnyLetters: Object.values(cellValues).some((value) =>
      Boolean(value.trim()),
    ),
  };
}

function getCrosswordAnswers(
  puzzle: CrosswordPuzzle,
  cellValues: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    puzzle.entries.map((entry) => [entry.cardId, getEntryAnswer(entry, cellValues)]),
  );
}

function getEntryAnswer(
  entry: CrosswordEntry,
  cellValues: Record<string, string>,
): string {
  return entry.answer
    .split('')
    .map((character, index) => {
      if (/\s/.test(character)) {
        return character;
      }

      const row = entry.direction === 'down' ? entry.row + index : entry.row;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      return cellValues[toCellKey(row, col)] ?? '';
    })
    .join('');
}

function isEntryFilled(
  entry: CrosswordEntry,
  cellValues: Record<string, string>,
): boolean {
  return entry.answer.split('').every((character, index) => {
    if (/\s/.test(character)) {
      return true;
    }

    const row = entry.direction === 'down' ? entry.row + index : entry.row;
    const col = entry.direction === 'across' ? entry.col + index : entry.col;
    return Boolean(cellValues[toCellKey(row, col)]?.trim());
  });
}

function isSubmittedEntryComplete(entry: CrosswordEntry, answer: string): boolean {
  return entry.answer.split('').every((character, index) => {
    if (/\s/.test(character)) {
      return true;
    }

    return Boolean(answer[index]?.trim());
  });
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function getSubmittedCellStyle(
  tone: 'correct' | 'incorrect' | undefined,
  resultColors: WorldResultColors,
): { backgroundColor?: string; borderColor?: string } {
  if (tone === 'correct') {
    return {
      backgroundColor: resultColors.correct.soft,
      borderColor: resultColors.correct.border,
    };
  }

  if (tone === 'incorrect') {
    return {
      backgroundColor: resultColors.incorrect.soft,
      borderColor: resultColors.incorrect.border,
    };
  }

  return {};
}

function formatAttemptDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    `${padDatePart(date.getMonth() + 1)}/${padDatePart(
      date.getDate(),
    )}/${date.getFullYear()}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  ].join(' ');
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function getActiveEntryForCell(
  cell: CrosswordCell,
  entries: CrosswordEntry[],
  entryMap: Map<string, CrosswordEntry>,
  activeEntryId: string | null,
): CrosswordEntry | undefined {
  const activeEntry = activeEntryId ? entryMap.get(activeEntryId) : undefined;
  if (activeEntry && cell.entryIds.includes(activeEntry.cardId)) {
    return activeEntry;
  }

  const startEntry = entries.find(
    (entry) => entry.row === cell.row && entry.col === cell.col,
  );

  return (
    startEntry ?? cell.entryIds.map((entryId) => entryMap.get(entryId)).find(Boolean)
  );
}

function getNextEmptyCellKey(
  cell: CrosswordCell,
  entry: CrosswordEntry,
  cellValues: Record<string, string>,
): string | undefined {
  const index =
    entry.direction === 'across' ? cell.col - entry.col : cell.row - entry.row;

  for (let nextIndex = index + 1; nextIndex < entry.answer.length; nextIndex += 1) {
    const key =
      entry.direction === 'across'
        ? toCellKey(entry.row, entry.col + nextIndex)
        : toCellKey(entry.row + nextIndex, entry.col);

    if (!cellValues[key]?.trim()) {
      return key;
    }
  }

  return undefined;
}

const letterCellShellStyles = {
  aspectRatio: '1 / 1',
  minWidth: 0,
  position: 'relative',
  width: '100%',
};

const letterCellStyles = {
  alignItems: 'center',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  display: 'inline-flex',
  fontSize: 20,
  fontWeight: 800,
  aspectRatio: '1 / 1',
  height: 'auto',
  justifyContent: 'center',
  lineHeight: 1,
  minWidth: 0,
  p: 0,
  textAlign: 'center',
  textTransform: 'lowercase',
  width: '100%',
};

function getClueNumberStyles(direction: CrosswordEntry['direction']) {
  return {
    ...clueNumberBaseStyles,
    ...(direction === 'across'
      ? {
          left: -20,
          top: '50%',
          transform: 'translateY(-50%)',
        }
      : {
          left: '50%',
          top: -20,
          transform: 'translateX(-50%)',
        }),
  };
}

const clueNumberBaseStyles = {
  alignItems: 'center',
  appearance: 'none',
  bgcolor: '#f5d66b',
  border: '1px solid rgba(119, 86, 0, 0.24)',
  borderRadius: '50%',
  color: '#203015',
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: 9,
  fontWeight: 950,
  height: 15,
  justifyContent: 'center',
  lineHeight: 1,
  m: 0,
  p: 0,
  position: 'absolute',
  width: 15,
  zIndex: 1,
};

const emptyCellStyles = {
  aspectRatio: '1 / 1',
  minWidth: 0,
  width: '100%',
};

const ghostCellStyle = {
  backgroundColor: 'transparent',
  color: 'rgba(32, 48, 21, 0.38)',
};

function getCorrectionAnswerCellStyles(resultColors: WorldResultColors) {
  return {
    alignItems: 'center',
    bgcolor: resultColors.correct.soft,
    border: `1px solid ${resultColors.correct.border}`,
    borderRadius: 1,
    color: '#203015',
    display: 'inline-flex',
    fontSize: 20,
    fontWeight: 800,
    height: 34,
    justifyContent: 'center',
    lineHeight: 1,
    textTransform: 'lowercase',
    width: 34,
  };
}

const correctionAnswerSpaceStyles = {
  display: 'inline-flex',
  height: 34,
  width: 34,
};

function recentResultChipStyles(
  isCorrect: boolean,
  resultColors: WorldResultColors,
) {
  return {
    bgcolor: isCorrect
      ? resultColors.correct.soft
      : resultColors.incorrect.soft,
    border: '1px solid',
    borderColor: isCorrect
      ? resultColors.correct.border
      : resultColors.incorrect.border,
    color: '#111111',
    fontSize: 12,
    fontWeight: 800,
    height: 24,
  };
}

const crosswordCardSetChipStyles = {
  bgcolor: '#f2f3f1',
  border: '1px solid rgba(32, 48, 21, 0.18)',
  color: '#203015',
  cursor: 'default',
  fontWeight: 850,
  height: 30,
};

const recentAnswersTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 'min(520px, calc(100vw - 32px))',
  p: 1.25,
};

const recentAnswersTooltipViewportStyle = {
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
} as const;
