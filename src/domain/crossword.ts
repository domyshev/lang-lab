import {
  LanguageCard,
  getCardAnswer,
  getTranslationHints,
  isPhraseValue,
  orderTranslationHints,
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

export function canCreateCrossword(input: {
  cards: LanguageCard[];
  complementaryLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}): boolean {
  const wordItems = getCrosswordWordItems(input.cards, input.targetLanguage);

  if (wordItems.length < 2) {
    return false;
  }

  return wordItems.some((item, index) =>
    wordItems
      .slice(index + 1)
      .some((other) => answersCanIntersect(item.answer, other.answer)),
  );
}

export function hasCrosswordIntersections(puzzle: CrosswordPuzzle): boolean {
  return puzzle.cells.some((cell) => cell.entryIds.length > 1);
}

export function createCrossword(input: {
  cards: LanguageCard[];
  complementaryLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}): CrosswordPuzzle {
  const wordItems = getCrosswordWordItems(input.cards, input.targetLanguage);
  const sortedWordItems = [...wordItems].sort(
    (left, right) =>
      getConnectivityScore(right, wordItems) -
      getConnectivityScore(left, wordItems),
  );

  if (sortedWordItems.length < 2) {
    return buildPuzzle('words', []);
  }

  const puzzle = buildPuzzle(
    'words',
    placeWordEntries(
      sortedWordItems,
      input.targetLanguage,
      input.complementaryLanguage,
    ),
  );

  return hasCrosswordIntersections(puzzle) ? puzzle : buildPuzzle('words', []);
}

function getCrosswordWordItems(
  cards: LanguageCard[],
  targetLanguage: SupportedLanguage,
): Array<{ card: LanguageCard; answer: string }> {
  return cards
    .map((card) => ({ card, answer: getCardAnswer(card, targetLanguage) }))
    .filter((item): item is { card: LanguageCard; answer: string } =>
      Boolean(item.answer),
    )
    .filter((item) => !isPhraseValue(item.answer));
}

function answersCanIntersect(left: string, right: string): boolean {
  return left.split('').some((leftLetter, leftIndex) =>
    right.split('').some((rightLetter, rightIndex) => {
      if (!lettersMatch(leftLetter, rightLetter)) {
        return false;
      }

      return leftIndex !== 0 || rightIndex !== 0;
    }),
  );
}

function placeWordEntries(
  items: Array<{ card: LanguageCard; answer: string }>,
  targetLanguage: SupportedLanguage,
  complementaryLanguage?: SupportedLanguage,
): CrosswordEntry[] {
  const entries: CrosswordEntry[] = [];

  items.forEach((item) => {
    if (entries.length >= 6) {
      return;
    }

    if (entries.length === 0) {
      entries.push(
        createEntry({
          card: item.card,
          answer: item.answer,
          complementaryLanguage,
          targetLanguage,
          row: 0,
          col: 0,
          direction: 'across',
        }),
      );
      return;
    }

    const placedEntry = placeEntry({
      existingEntries: entries,
      card: item.card,
      answer: item.answer,
      complementaryLanguage,
      targetLanguage,
    });

    if (placedEntry) {
      entries.push(placedEntry);
    }
  });

  return entries;
}

function placeEntry(input: {
  existingEntries: CrosswordEntry[];
  card: LanguageCard;
  answer: string;
  complementaryLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}): CrosswordEntry | undefined {
  const existingCells = getEntryCells(input.existingEntries);
  const candidates: Array<{
    row: number;
    col: number;
    direction: CrosswordEntry['direction'];
    intersections: number;
    area: number;
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
        const placement = getPlacementScore({
          answer: input.answer,
          direction,
          existingCells,
          row,
          col,
        });

        if (
          !placement ||
          input.existingEntries.some(
            (existingEntry) =>
              existingEntry.row === row && existingEntry.col === col,
          )
        ) {
          return [];
        }

        return [{ row, col, direction, ...placement }];
      }),
    ),
  );

  const candidate = candidates.sort(
    (left, right) =>
      right.intersections - left.intersections ||
      left.area - right.area ||
      Math.abs(left.row) + Math.abs(left.col) -
        (Math.abs(right.row) + Math.abs(right.col)),
  );

  if (candidate[0]) {
    return createEntry({
      card: input.card,
      answer: input.answer,
      complementaryLanguage: input.complementaryLanguage,
      targetLanguage: input.targetLanguage,
      row: candidate[0].row,
      col: candidate[0].col,
      direction: candidate[0].direction,
    });
  }

  return undefined;
}

function createEntry(input: {
  card: LanguageCard;
  answer: string;
  complementaryLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  row: number;
  col: number;
  direction: CrosswordEntry['direction'];
}): CrosswordEntry {
  const translationHints = getTranslationHints(input.card, input.targetLanguage);

  return {
    cardId: input.card.id,
    answer: input.answer,
    clue: orderTranslationHints(
      translationHints,
      input.complementaryLanguage ??
        translationHints[0]?.language ??
        input.targetLanguage,
    )
      .map((hint) => `${hint.language}: ${hint.value}`)
      .join(' / '),
    row: input.row,
    col: input.col,
    direction: input.direction,
  };
}

function getPlacementScore(input: {
  answer: string;
  direction: CrosswordEntry['direction'];
  existingCells: Map<string, CrosswordCell>;
  row: number;
  col: number;
}): { intersections: number; area: number } | undefined {
  let intersections = 0;

  const canPlace = input.answer.split('').every((letter, index) => {
    const row = input.direction === 'down' ? input.row + index : input.row;
    const col = input.direction === 'across' ? input.col + index : input.col;
    const existingCell = input.existingCells.get(toCellKey(row, col));

    if (!existingCell) {
      return hasRequiredCrosswordAir({
        col,
        direction: input.direction,
        existingCells: input.existingCells,
        row,
      });
    }

    if (!lettersMatch(existingCell.solution, letter)) {
      return false;
    }

    intersections += 1;
    return true;
  });

  if (
    !canPlace ||
    intersections === 0 ||
    hasExistingCellBeforeOrAfterWord(input)
  ) {
    return undefined;
  }

  const bounds = getBounds([
    ...Array.from(input.existingCells.values()),
    ...input.answer.split('').map((letter, index) => ({
      row: input.direction === 'down' ? input.row + index : input.row,
      col: input.direction === 'across' ? input.col + index : input.col,
      solution: letter,
      entryIds: [],
    })),
  ]);

  return {
    intersections,
    area:
      (bounds.maxRow - bounds.minRow + 1) *
      (bounds.maxCol - bounds.minCol + 1),
  };
}

function hasRequiredCrosswordAir(input: {
  col: number;
  direction: CrosswordEntry['direction'];
  existingCells: Map<string, CrosswordCell>;
  row: number;
}): boolean {
  const sideKeys =
    input.direction === 'across'
      ? [
          toCellKey(input.row - 1, input.col),
          toCellKey(input.row + 1, input.col),
        ]
      : [
          toCellKey(input.row, input.col - 1),
          toCellKey(input.row, input.col + 1),
        ];

  return sideKeys.every((key) => !input.existingCells.has(key));
}

function hasExistingCellBeforeOrAfterWord(input: {
  answer: string;
  direction: CrosswordEntry['direction'];
  existingCells: Map<string, CrosswordCell>;
  row: number;
  col: number;
}): boolean {
  const beforeKey =
    input.direction === 'across'
      ? toCellKey(input.row, input.col - 1)
      : toCellKey(input.row - 1, input.col);
  const afterKey =
    input.direction === 'across'
      ? toCellKey(input.row, input.col + input.answer.length)
      : toCellKey(input.row + input.answer.length, input.col);

  return (
    input.existingCells.has(beforeKey) || input.existingCells.has(afterKey)
  );
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

function getConnectivityScore(
  item: { answer: string },
  allItems: Array<{ answer: string }>,
): number {
  return allItems
    .filter((other) => other.answer !== item.answer)
    .reduce(
      (sum, other) => sum + countSharedLetters(item.answer, other.answer),
      0,
    );
}

function countSharedLetters(left: string, right: string): number {
  const leftLetters = new Set(normalizeLetters(left));
  return normalizeLetters(right).filter((letter) => leftLetters.has(letter))
    .length;
}

function normalizeLetters(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .split('')
    .filter((letter) => /[\p{L}]/u.test(letter));
}

function toCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}
