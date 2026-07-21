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

import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import {
  canCreateCrossword,
  createCrossword,
  hasCrosswordIntersections,
} from '../crossword';

function card(id: string, answer: string): LanguageCard {
  return {
    id,
    translations: {
      en: answer,
      ru: `ru-${answer}`,
    },
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  };
}

describe('createCrossword', () => {
  it('uses up to six single-word cards', () => {
    const result = createCrossword({
      cards: [
        card('1', 'airport'),
        card('2', 'ticket'),
        card('3', 'train'),
        card('4', 'station'),
        card('5', 'hotel'),
        card('6', 'map'),
        card('7', 'bus'),
      ],
      targetLanguage: 'en',
    });

    expect(result.entries).toHaveLength(6);
    expect(result.mode).toBe('words');
  });

  it('places words on an intersecting crossword grid', () => {
    const result = createCrossword({
      cards: [
        card('1', 'train'),
        card('2', 'rain'),
        card('3', 'tire'),
        card('4', 'near'),
      ],
      targetLanguage: 'en',
    });

    const occupiedCells = result.entries.flatMap((entry) =>
      entry.answer.split('').map((letter, index) => ({
        cardId: entry.cardId,
        key:
          entry.direction === 'across'
            ? `${entry.row}:${entry.col + index}`
            : `${entry.row + index}:${entry.col}`,
        letter,
      })),
    );
    const intersections = occupiedCells.filter((cell, index) =>
      occupiedCells.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.key === cell.key &&
          other.cardId !== cell.cardId &&
          other.letter.toLocaleLowerCase() === cell.letter.toLocaleLowerCase(),
      ),
    );

    expect(intersections.length).toBeGreaterThan(0);
    expect(result.cells.some((cell) => cell.entryIds.length > 1)).toBe(true);
    expect(new Set(result.entries.map((entry) => entry.direction)).size).toBe(2);
    expectParallelEntriesToHaveAir(result.entries);
  });

  it('does not start an across and down word from the same cell', () => {
    const result = createCrossword({
      cards: [card('1', 'cat'), card('2', 'car'), card('3', 'art')],
      targetLanguage: 'en',
    });

    const startKeys = result.entries.map((entry) => `${entry.row}:${entry.col}`);

    expect(new Set(startKeys).size).toBe(startKeys.length);
  });

  it('puts the complementary language first in clues', () => {
    const result = createCrossword({
      cards: [
        {
          ...card('1', 'train'),
          translations: { en: 'train', ru: 'поезд', es: 'tren' },
        },
        {
          ...card('2', 'rain'),
          translations: { en: 'rain', ru: 'дождь', es: 'lluvia' },
        },
      ],
      complementaryLanguage: 'es',
      targetLanguage: 'en',
    });

    expect(result.entries[0].clue.startsWith('es:')).toBe(true);
  });

  it('does not use a phrase card as a crossword fallback', () => {
    const result = createCrossword({
      cards: [card('1', 'I would like a ticket'), card('2', 'airport')],
      targetLanguage: 'en',
    });

    expect(result.entries).toHaveLength(0);
    expect(result.mode).toBe('words');
    expect(
      canCreateCrossword({
        cards: [card('1', 'I would like a ticket'), card('2', 'airport')],
        targetLanguage: 'en',
      }),
    ).toBe(false);
  });

  it('prefers a real word crossword when a card set also contains phrases', () => {
    const result = createCrossword({
      cards: [
        card('phrase', 'I would like a ticket'),
        card('1', 'train'),
        card('2', 'rain'),
        card('3', 'tire'),
      ],
      targetLanguage: 'en',
    });

    expect(result.mode).toBe('words');
    expect(result.entries.map((entry) => entry.answer)).not.toContain(
      'I would like a ticket',
    );
    expect(result.entries.length).toBeGreaterThan(1);
  });

  it('does not build a crossword when words cannot intersect', () => {
    const result = createCrossword({
      cards: [card('1', 'abc'), card('2', 'def'), card('3', 'jkl')],
      targetLanguage: 'en',
    });

    expect(result.entries).toHaveLength(0);
    expect(hasCrosswordIntersections(result)).toBe(false);
    expect(
      canCreateCrossword({
        cards: [card('1', 'abc'), card('2', 'def'), card('3', 'jkl')],
        targetLanguage: 'en',
      }),
    ).toBe(false);
  });

  it('reports that a real intersecting crossword can be created', () => {
    expect(
      canCreateCrossword({
        cards: [card('1', 'train'), card('2', 'rain'), card('3', 'near')],
        targetLanguage: 'en',
      }),
    ).toBe(true);
  });
});

function expectParallelEntriesToHaveAir(
  entries: ReturnType<typeof createCrossword>['entries'],
) {
  entries.forEach((entry, index) => {
    entries.slice(index + 1).forEach((other) => {
      if (entry.direction !== other.direction) {
        return;
      }

      if (entry.direction === 'across') {
        const rowGap = Math.abs(entry.row - other.row);
        const spansOverlap =
          entry.col <= other.col + other.answer.length - 1 &&
          other.col <= entry.col + entry.answer.length - 1;

        if (spansOverlap) {
          expect(rowGap).toBeGreaterThanOrEqual(2);
        }
        return;
      }

      const colGap = Math.abs(entry.col - other.col);
      const spansOverlap =
        entry.row <= other.row + other.answer.length - 1 &&
        other.row <= entry.row + entry.answer.length - 1;

      if (spansOverlap) {
        expect(colGap).toBeGreaterThanOrEqual(2);
      }
    });
  });
}
