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

export function maskAnswerByVisibleLetterPercent(
  answer: string,
  visibleLetterPercent: number,
): string {
  const visibleIndexes = getVisibleLetterIndexes(answer, visibleLetterPercent);

  return answer
    .split('')
    .map((character, index) => {
      if (!isLetter(character)) {
        return character;
      }

      return visibleIndexes.has(index) ? character : '_';
    })
    .join('');
}

export function getEditableAnswerIndexesByVisibleLetterPercent(
  characters: string[],
  visibleLetterPercent: number,
): number[] {
  const visibleIndexes = getVisibleLetterIndexes(
    characters.join(''),
    visibleLetterPercent,
  );

  return characters.flatMap((character, index) =>
    isLetter(character) && !visibleIndexes.has(index) ? [index] : [],
  );
}

function getVisibleLetterIndexes(
  answer: string,
  visibleLetterPercent: number,
): Set<number> {
  if (sanitizePercent(visibleLetterPercent) === 50) {
    return getAlternatingVisibleLetterIndexes(answer);
  }

  const letterIndexes = answer
    .split('')
    .flatMap((character, index) => (isLetter(character) ? [index] : []));

  if (letterIndexes.length <= 1) {
    return new Set();
  }

  const visibleCount = Math.min(
    letterIndexes.length - 1,
    Math.max(
      0,
      Math.ceil((letterIndexes.length * sanitizePercent(visibleLetterPercent)) / 100),
    ),
  );

  if (visibleCount === 0) {
    return new Set();
  }

  return new Set(
    Array.from({ length: visibleCount }, (_, index) => {
      const position = Math.floor(
        ((index + 1) * letterIndexes.length) / (visibleCount + 1),
      );
      return letterIndexes[position];
    }),
  );
}

function getAlternatingVisibleLetterIndexes(answer: string): Set<number> {
  const visibleIndexes = new Set<number>();
  let indexInWord = 0;

  answer.split('').forEach((character, index) => {
    if (character.trim() === '') {
      indexInWord = 0;
      return;
    }
    if (!isLetter(character)) {
      return;
    }
    if (indexInWord % 2 === 0) {
      visibleIndexes.add(index);
    }
    indexInWord += 1;
  });

  return visibleIndexes;
}

function isLetter(character: string): boolean {
  return /^\p{L}$/u.test(character);
}

function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}
