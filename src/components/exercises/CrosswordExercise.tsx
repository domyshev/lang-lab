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
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import {
  CursorAnchoredTooltip,
  TooltipContent,
} from '../CursorAnchoredTooltip';
import { ExerciseProgressChip, ExerciseThemeChip } from './ExerciseThemeChip';

export function CrosswordExercise({
  interfaceLanguage = 'en',
  onThemeOpen,
  puzzle,
  recentResultsByCardId = {},
  themeName,
  onFinish,
  onSubmit,
}: {
  interfaceLanguage?: SupportedLanguage;
  onThemeOpen?: () => void;
  puzzle: CrosswordPuzzle;
  recentResultsByCardId?: Record<
    string,
    Array<{ isCorrect: boolean; occurredAt: string }>
  >;
  themeName?: string;
  onFinish?: () => void;
  onSubmit: (answers: Record<string, string>) => void;
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
  const filledEntryCount = getFilledEntryCount(puzzle, cellValues);
  const hasSubmittedAnswers = Boolean(submittedAnswers);

  useEffect(() => {
    setCellValues({});
    setSubmittedAnswers(null);
    activeEntryIdRef.current = null;
  }, [puzzleKey]);

  const handleSubmit = () => {
    if (submittedAnswers) {
      onFinish?.();
      return;
    }

    const answers = Object.fromEntries(
      puzzle.entries.map((entry) => [
        entry.cardId,
        entry.answer
          .split('')
          .map((character, index) => {
            if (/\s/.test(character)) {
              return character;
            }

            const row =
              entry.direction === 'down' ? entry.row + index : entry.row;
            const col =
              entry.direction === 'across' ? entry.col + index : entry.col;
            return cellValues[toCellKey(row, col)] ?? '';
          })
          .join(''),
      ]),
    );
    setSubmittedAnswers(answers);
    onSubmit(answers);
  };

  const handleCellChange = (
    event: ChangeEvent<HTMLInputElement>,
    cell: CrosswordCell,
  ) => {
    const key = toCellKey(cell.row, cell.col);
    const value = event.target.value.slice(-1);
    setCellValues((current) => ({
      ...current,
      [key]: value,
    }));

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

    const nextKey = activeEntry ? getNextCellKey(cell, activeEntry) : undefined;
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
    <Paper data-test="crossword_exercise__panel" sx={{ p: 2 }}>
      <Stack data-test="crossword_exercise__content" spacing={2}>
        <Stack
          data-test="crossword_exercise__header"
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Typography
            component="h2"
            data-test="crossword_exercise__title"
            variant="h6"
          >
            {t(interfaceLanguage, 'crossword')}
          </Typography>
          {themeName && (
            <CursorAnchoredTooltip
              arrowDataTest="crossword_exercise__theme_chip_tooltip_arrow"
              leaveDelay={0}
              title={
                <TooltipContent sx={crosswordThemeTooltipContentStyles}>
                  {t(interfaceLanguage, 'crosswordThemeCardsTooltip')}
                </TooltipContent>
              }
              tooltipSx={crosswordThemeTooltipStyles}
            >
              <ExerciseThemeChip
                clickable={Boolean(onThemeOpen)}
                dataTest="crossword_exercise__theme_chip"
                interfaceLanguage={interfaceLanguage}
                onClick={onThemeOpen}
                sx={crosswordThemeChipStyles}
                themeName={themeName}
              />
            </CursorAnchoredTooltip>
          )}
          <ExerciseProgressChip
            completed={filledEntryCount}
            dataTest="crossword_exercise__progress_chip"
            interfaceLanguage={interfaceLanguage}
            total={puzzle.entries.length}
          />
        </Stack>

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
              const cellTone = getSubmittedCellTone({
                cell,
                entryMap,
                submittedAnswers,
              });
              const tooltipEntry = getActiveEntryForCell(
                cell,
                puzzle.entries,
                entryMap,
                activeEntryIdRef.current,
              );

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
                        sx={clueNumberStyles}
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
                    value={cellValues[key] ?? ''}
                    onChange={(event) => handleCellChange(event, cell)}
                    onFocus={() => handleCellFocus(cell)}
                    disabled={hasSubmittedAnswers}
                    maxLength={1}
                    ref={(element: HTMLInputElement | null) => {
                      inputRefs.current[key] = element;
                    }}
                    sx={letterCellStyles}
                    style={getSubmittedCellStyle(cellTone)}
                  />
                </Box>
              );

              if (submittedAnswers && tooltipEntry) {
                return (
                  <RecentAnswersTooltip
                    dataTestPrefix={`crossword_exercise__cell_recent__${displayRow}_${displayCol}`}
                    interfaceLanguage={interfaceLanguage}
                    key={key}
                    recentResults={
                      recentResultsByCardId[tooltipEntry.cardId]?.slice(0, 10) ??
                      []
                    }
                    subject={tooltipEntry.answer}
                  >
                    {cellInput}
                  </RecentAnswersTooltip>
                );
              }

              return cellInput;
            }),
          )}
        </Box>

        <Button
          data-test="crossword_exercise__submit_button"
          variant="contained"
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
      </Stack>
    </Paper>
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function RecentAnswersTooltip({
  children,
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  subject,
}: {
  children: ReactElement;
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: Array<{ isCorrect: boolean; occurredAt: string }>;
  subject: string;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTestPrefix}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      transitionTimeout={0}
      tooltipSx={recentAnswersTooltipStyles}
      title={
        <Stack data-test={`${dataTestPrefix}__recent_tooltip`} spacing={0.75}>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_title`}
            sx={{ color: '#203015', fontSize: 14, fontWeight: 850 }}
          >
            {t(interfaceLanguage, 'recentAnswersTitle')}
          </Typography>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_subject`}
            sx={{
              color: 'rgba(32, 48, 21, 0.68)',
              fontSize: 11,
              fontWeight: 750,
              lineHeight: 1.25,
            }}
          >
            {subject}
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
                    result.isCorrect
                      ? 'metricCorrectSuffix'
                      : 'metricIncorrectSuffix',
                  )}
                  size="small"
                  sx={{
                    bgcolor: result.isCorrect
                      ? 'rgb(235, 247, 225)'
                      : 'rgb(253, 235, 238)',
                    border: '1px solid',
                    borderColor: result.isCorrect ? '#8fc773' : '#f2a7b4',
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 24,
                  }}
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
      }
    >
      {children}
    </CursorAnchoredTooltip>
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

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function getSubmittedCellTone({
  cell,
  entryMap,
  submittedAnswers,
}: {
  cell: CrosswordCell;
  entryMap: Map<string, CrosswordEntry>;
  submittedAnswers: Record<string, string> | null;
}): 'correct' | 'incorrect' | undefined {
  if (!submittedAnswers) {
    return undefined;
  }

  const entryResults = cell.entryIds.map((entryId) => {
    const entry = entryMap.get(entryId);
    return entry
      ? normalizeAnswer(submittedAnswers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer)
      : false;
  });

  if (entryResults.some((isCorrect) => !isCorrect)) {
    return 'incorrect';
  }

  return entryResults.length > 0 ? 'correct' : undefined;
}

function getSubmittedCellStyle(
  tone: 'correct' | 'incorrect' | undefined,
): { backgroundColor?: string; borderColor?: string } {
  if (tone === 'correct') {
    return { backgroundColor: 'rgb(235, 247, 225)', borderColor: '#8fc773' };
  }

  if (tone === 'incorrect') {
    return { backgroundColor: 'rgb(253, 235, 238)', borderColor: '#f2a7b4' };
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

function getNextCellKey(
  cell: CrosswordCell,
  entry: CrosswordEntry,
): string | undefined {
  const index =
    entry.direction === 'across' ? cell.col - entry.col : cell.row - entry.row;
  const nextIndex = index + 1;
  if (nextIndex >= entry.answer.length) {
    return undefined;
  }

  return entry.direction === 'across'
    ? toCellKey(entry.row, entry.col + nextIndex)
    : toCellKey(entry.row + nextIndex, entry.col);
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

const clueNumberStyles = {
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
  left: -18,
  lineHeight: 1,
  m: 0,
  p: 0,
  position: 'absolute',
  top: -18,
  width: 15,
  zIndex: 1,
};

const emptyCellStyles = {
  aspectRatio: '1 / 1',
  minWidth: 0,
  width: '100%',
};

const crosswordThemeChipStyles = {
  bgcolor: '#e7eefc',
  border: '1px solid rgba(68, 94, 150, 0.26)',
  color: '#203015',
  cursor: 'pointer',
  fontWeight: 850,
  height: 30,
  '&:hover': {
    bgcolor: '#d9e5fb',
  },
};

const crosswordThemeTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 280,
  px: 1.25,
  py: 1,
};

const crosswordThemeTooltipContentStyles = {
  color: '#203015',
  display: 'inline-block',
  fontSize: 14,
  lineHeight: 1.35,
};

const recentAnswersTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 280,
  p: 1.25,
};
