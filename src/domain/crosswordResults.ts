// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
