import {
  LanguageCard,
  getCardAnswer,
  getTranslationHints,
  isPhraseValue,
} from './cards';
import { SupportedLanguage } from './languages';

export interface CrosswordEntry {
  cardId: string;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordCell {
  row: number;
  col: number;
  solution: string;
  entryIds: string[];
}

export interface CrosswordBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export interface CrosswordPuzzle {
  mode: 'words' | 'phrase';
  entries: CrosswordEntry[];
  cells: CrosswordCell[];
  bounds: CrosswordBounds;
}

export function createCrossword(input: {
  cards: LanguageCard[];
  targetLanguage: SupportedLanguage;
}): CrosswordPuzzle {
  const eligible = input.cards
    .map((card) => ({ card, answer: getCardAnswer(card, input.targetLanguage) }))
    .filter((item): item is { card: LanguageCard; answer: string } =>
      Boolean(item.answer),
    );

  const phrase = eligible.find((item) => isPhraseValue(item.answer));
  if (phrase) {
    return buildPuzzle('phrase', [
      createEntry({
        card: phrase.card,
        answer: phrase.answer,
        targetLanguage: input.targetLanguage,
        row: 0,
        col: 0,
        direction: 'across',
      }),
    ]);
  }

  const entries = eligible.slice(0, 6).reduce<CrosswordEntry[]>(
    (currentEntries, item, index) => {
      if (index === 0) {
        return [
          createEntry({
            card: item.card,
            answer: item.answer,
            targetLanguage: input.targetLanguage,
            row: 0,
            col: 0,
            direction: 'across',
          }),
        ];
      }

      return [
        ...currentEntries,
        placeEntry({
          existingEntries: currentEntries,
          card: item.card,
          answer: item.answer,
          targetLanguage: input.targetLanguage,
          fallbackIndex: index,
        }),
      ];
    },
    [],
  );

  return buildPuzzle('words', entries);
}

function placeEntry(input: {
  existingEntries: CrosswordEntry[];
  card: LanguageCard;
  answer: string;
  targetLanguage: SupportedLanguage;
  fallbackIndex: number;
}): CrosswordEntry {
  const existingCells = getEntryCells(input.existingEntries);
  const candidates: Array<{
    row: number;
    col: number;
    direction: CrosswordEntry['direction'];
  }> = input.existingEntries.flatMap((entry) =>
    entry.answer.split('').flatMap((existingLetter, existingIndex) =>
      input.answer.split('').flatMap((newLetter, newIndex) => {
        if (!lettersMatch(existingLetter, newLetter)) {
          return [];
        }

        const existingRow =
          entry.direction === 'across'
            ? entry.row
            : entry.row + existingIndex;
        const existingCol =
          entry.direction === 'across'
            ? entry.col + existingIndex
            : entry.col;
        const direction: CrosswordEntry['direction'] =
          entry.direction === 'across' ? 'down' : 'across';
        const row =
          direction === 'down' ? existingRow - newIndex : existingRow;
        const col =
          direction === 'across' ? existingCol - newIndex : existingCol;

        return [{ row, col, direction }];
      }),
    ),
  );

  const candidate = candidates.find((item) =>
    canPlaceWord({
      answer: input.answer,
      direction: item.direction,
      existingCells,
      row: item.row,
      col: item.col,
    }),
  );

  if (candidate) {
    return createEntry({
      card: input.card,
      answer: input.answer,
      targetLanguage: input.targetLanguage,
      row: candidate.row,
      col: candidate.col,
      direction: candidate.direction,
    });
  }

  return createEntry({
    card: input.card,
    answer: input.answer,
    targetLanguage: input.targetLanguage,
    row: input.fallbackIndex * 2,
    col: 0,
    direction: input.fallbackIndex % 2 === 0 ? 'across' : 'down',
  });
}

function createEntry(input: {
  card: LanguageCard;
  answer: string;
  targetLanguage: SupportedLanguage;
  row: number;
  col: number;
  direction: CrosswordEntry['direction'];
}): CrosswordEntry {
  return {
    cardId: input.card.id,
    answer: input.answer,
    clue: getTranslationHints(input.card, input.targetLanguage)
      .map((hint) => `${hint.language}: ${hint.value}`)
      .join(' / '),
    row: input.row,
    col: input.col,
    direction: input.direction,
  };
}

function canPlaceWord(input: {
  answer: string;
  direction: CrosswordEntry['direction'];
  existingCells: Map<string, CrosswordCell>;
  row: number;
  col: number;
}): boolean {
  let intersections = 0;

  return input.answer.split('').every((letter, index) => {
    const row = input.direction === 'down' ? input.row + index : input.row;
    const col = input.direction === 'across' ? input.col + index : input.col;
    const existingCell = input.existingCells.get(toCellKey(row, col));

    if (!existingCell) {
      return true;
    }

    if (!lettersMatch(existingCell.solution, letter)) {
      return false;
    }

    intersections += 1;
    return true;
  }) && intersections > 0;
}

function buildPuzzle(
  mode: CrosswordPuzzle['mode'],
  entries: CrosswordEntry[],
): CrosswordPuzzle {
  const cells = Array.from(getEntryCells(entries).values()).sort(
    (left, right) => left.row - right.row || left.col - right.col,
  );

  return {
    mode,
    entries,
    cells,
    bounds: getBounds(cells),
  };
}

function getEntryCells(entries: CrosswordEntry[]): Map<string, CrosswordCell> {
  const cells = new Map<string, CrosswordCell>();

  entries.forEach((entry) => {
    entry.answer.split('').forEach((letter, index) => {
      const row = entry.direction === 'down' ? entry.row + index : entry.row;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      const key = toCellKey(row, col);
      const existingCell = cells.get(key);

      if (existingCell) {
        existingCell.entryIds.push(entry.cardId);
        return;
      }

      cells.set(key, {
        row,
        col,
        solution: letter,
        entryIds: [entry.cardId],
      });
    });
  });

  return cells;
}

function getBounds(cells: CrosswordCell[]): CrosswordBounds {
  if (cells.length === 0) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  return {
    minRow: Math.min(...cells.map((cell) => cell.row)),
    maxRow: Math.max(...cells.map((cell) => cell.row)),
    minCol: Math.min(...cells.map((cell) => cell.col)),
    maxCol: Math.max(...cells.map((cell) => cell.col)),
  };
}

function lettersMatch(left: string, right: string): boolean {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

function toCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}
