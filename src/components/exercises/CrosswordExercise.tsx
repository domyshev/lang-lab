import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { CrosswordPuzzle } from '../../domain/crossword';

export function CrosswordExercise({
  puzzle,
  onSubmit,
}: {
  puzzle: CrosswordPuzzle;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const cellMap = new Map(
    puzzle.cells.map((cell) => [toCellKey(cell.row, cell.col), cell]),
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

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Crossword</Typography>
        <Typography>
          {puzzle.mode === 'phrase'
            ? 'Single phrase challenge'
            : 'Up to 6 words from the selected theme'}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 0.5,
            gridTemplateColumns: `repeat(${cols.length}, 36px)`,
            overflowX: 'auto',
            width: 'max-content',
            maxWidth: '100%',
          }}
        >
          {rows.flatMap((row) =>
            cols.map((col) => {
              const key = toCellKey(row, col);
              const cell = cellMap.get(key);
              const displayRow = row - puzzle.bounds.minRow + 1;
              const displayCol = col - puzzle.bounds.minCol + 1;

              if (!cell || /\s/.test(cell.solution)) {
                return <Box key={key} sx={emptyCellStyles} />;
              }

              return (
                <Box
                  key={key}
                  component="input"
                  aria-label={`Crossword cell ${displayRow} ${displayCol}`}
                  value={cellValues[key] ?? ''}
                  onChange={(event) =>
                    setCellValues((current) => ({
                      ...current,
                      [key]: event.target.value.slice(-1),
                    }))
                  }
                  maxLength={1}
                  sx={letterCellStyles}
                />
              );
            }),
          )}
        </Box>

        <Stack spacing={0.75}>
          {puzzle.entries.map((entry, index) => (
            <Typography key={entry.cardId} color="text.secondary">
              {index + 1}. {entry.direction} - {entry.clue || 'Answer'}
            </Typography>
          ))}
        </Stack>

        <Button variant="contained" onClick={handleSubmit}>
          Submit crossword
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

const letterCellStyles = {
  alignItems: 'center',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  display: 'inline-flex',
  fontSize: 20,
  fontWeight: 800,
  height: 36,
  justifyContent: 'center',
  lineHeight: 1,
  p: 0,
  textAlign: 'center',
  textTransform: 'lowercase',
  width: 36,
};

const emptyCellStyles = {
  height: 36,
  width: 36,
};
