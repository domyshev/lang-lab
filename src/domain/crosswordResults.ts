import type { CrosswordCell, CrosswordEntry, CrosswordPuzzle } from './crossword';

export type CrosswordCellTone = 'correct' | 'incorrect' | undefined;

export function getCrosswordCellTone(
  cell: CrosswordCell,
  correctness: Record<string, boolean>,
): CrosswordCellTone {
  const results = cell.entryIds
    .filter((entryId) =>
      Object.prototype.hasOwnProperty.call(correctness, entryId),
    )
    .map((entryId) => correctness[entryId]);

  if (results.some((isCorrect) => isCorrect)) {
    return 'correct';
  }

  return results.length > 0 ? 'incorrect' : undefined;
}

export function getIncorrectCrosswordEntries(
  cell: CrosswordCell,
  puzzle: CrosswordPuzzle,
  correctness: Record<string, boolean>,
): CrosswordEntry[] {
  const entryById = new Map(
    puzzle.entries.map((entry) => [entry.cardId, entry]),
  );

  return cell.entryIds
    .filter((entryId) => correctness[entryId] === false)
    .map((entryId) => entryById.get(entryId))
    .filter((entry): entry is CrosswordEntry => Boolean(entry));
}
