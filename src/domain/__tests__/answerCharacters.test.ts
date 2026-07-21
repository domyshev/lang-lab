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
import {
  areAnswerCharactersEqual,
  shouldStrikeAnswerCharacter,
} from '../answerCharacters';

describe('answerCharacters', () => {
  it('compares answer characters without case sensitivity', () => {
    expect(areAnswerCharactersEqual('Ñ', 'ñ')).toBe(true);
    expect(areAnswerCharactersEqual('x', 't')).toBe(false);
  });

  it('strikes only a non-empty incorrect submitted character', () => {
    expect(
      shouldStrikeAnswerCharacter({
        actual: 'x',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(true);
    expect(
      shouldStrikeAnswerCharacter({
        actual: 't',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(false);
    expect(
      shouldStrikeAnswerCharacter({
        actual: '',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(false);
    expect(
      shouldStrikeAnswerCharacter({
        actual: 'x',
        expected: 't',
        isIncorrect: false,
      }),
    ).toBe(false);
  });
});
