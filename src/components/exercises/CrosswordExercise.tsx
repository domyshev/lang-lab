import { Box, Button, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  CrosswordCell,
  CrosswordEntry,
  CrosswordPuzzle,
} from '../../domain/crossword';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

export function CrosswordExercise({
  interfaceLanguage = 'en',
  puzzle,
  themeName,
  onSubmit,
}: {
  interfaceLanguage?: SupportedLanguage;
  puzzle: CrosswordPuzzle;
  themeName?: string;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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

  const handleSubmit = () => {
    onSubmit(
      Object.fromEntries(
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
      ),
    );
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

    const nextKey = getNextCellKey(cell, puzzle.entries, entryMap);
    if (nextKey) {
      inputRefs.current[nextKey]?.focus();
    }
  };

  return (
    <Paper data-test="crossword_exercise__panel" sx={{ p: 2 }}>
      <Stack data-test="crossword_exercise__content" spacing={2}>
        <Typography
          component="h2"
          data-test="crossword_exercise__title"
          variant="h6"
        >
          {t(interfaceLanguage, 'crossword')}
        </Typography>
        {themeName && (
          <Typography data-test="crossword_exercise__theme_name">
            {t(interfaceLanguage, 'crosswordThemeLabel')} "{themeName}"
          </Typography>
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
                        onClick={() => inputRefs.current[key]?.focus()}
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
                    maxLength={1}
                    ref={(element: HTMLInputElement | null) => {
                      inputRefs.current[key] = element;
                    }}
                    sx={letterCellStyles}
                  />
                </Box>
              );

              return cellInput;
            }),
          )}
        </Box>

        <Button
          data-test="crossword_exercise__submit_button"
          variant="contained"
          onClick={handleSubmit}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t(interfaceLanguage, 'submitCrossword')}
        </Button>
      </Stack>
    </Paper>
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function toCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function getNextCellKey(
  cell: CrosswordCell,
  entries: CrosswordEntry[],
  entryMap: Map<string, CrosswordEntry>,
): string | undefined {
  const startEntry = entries.find(
    (entry) => entry.row === cell.row && entry.col === cell.col,
  );
  const entry =
    startEntry ??
    cell.entryIds.map((entryId) => entryMap.get(entryId)).find(Boolean);

  if (!entry) {
    return undefined;
  }

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
