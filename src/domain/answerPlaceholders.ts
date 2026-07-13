export const MISSING_ANSWER_CHARACTER = '_';

export function isMissingAnswerCharacter(character: string): boolean {
  return character === MISSING_ANSWER_CHARACTER;
}
