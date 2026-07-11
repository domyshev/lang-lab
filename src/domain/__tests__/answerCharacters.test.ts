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
