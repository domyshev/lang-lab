import { describe, expect, it } from 'vitest';
import {
  getCrosswordCellTone,
  getIncorrectCrosswordEntries,
} from '../crosswordResults';
import type { CrosswordPuzzle } from '../crossword';

const puzzle: CrosswordPuzzle = {
  mode: 'words',
  bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 },
  cells: [
    { row: 0, col: 0, solution: 'c', entryIds: ['cat'] },
    { row: 0, col: 1, solution: 'a', entryIds: ['cat'] },
    { row: 0, col: 2, solution: 't', entryIds: ['cat', 'tea'] },
    { row: 1, col: 2, solution: 'e', entryIds: ['tea'] },
    { row: 2, col: 2, solution: 'a', entryIds: ['tea'] },
  ],
  entries: [
    {
      cardId: 'cat',
      answer: 'cat',
      clue: 'ru: кот',
      row: 0,
      col: 0,
      direction: 'across',
    },
    {
      cardId: 'tea',
      answer: 'tea',
      clue: 'ru: чай',
      row: 0,
      col: 2,
      direction: 'down',
    },
  ],
};

describe('crosswordResults', () => {
  it('keeps a crossing cell correct when it belongs to a correct word', () => {
    const crossingCell = puzzle.cells[2];

    expect(
      getCrosswordCellTone(crossingCell, { cat: true, tea: false }),
    ).toBe('correct');
    expect(
      getCrosswordCellTone(crossingCell, { cat: false, tea: false }),
    ).toBe('incorrect');
    expect(getCrosswordCellTone(crossingCell, { cat: true })).toBe('correct');
    expect(getCrosswordCellTone(crossingCell, {})).toBeUndefined();
  });

  it('returns every incorrect entry crossing a cell', () => {
    expect(
      getIncorrectCrosswordEntries(puzzle.cells[2], puzzle, {
        cat: false,
        tea: false,
      }).map((entry) => entry.cardId),
    ).toEqual(['cat', 'tea']);
  });
});
