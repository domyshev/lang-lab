export function areAnswerCharactersEqual(
  actual: string,
  expected: string,
): boolean {
  return actual.toLocaleLowerCase() === expected.toLocaleLowerCase();
}

export function shouldStrikeAnswerCharacter({
  actual,
  expected,
  isIncorrect,
}: {
  actual: string;
  expected: string;
  isIncorrect: boolean;
}): boolean {
  return (
    isIncorrect &&
    Boolean(actual.trim()) &&
    !areAnswerCharactersEqual(actual, expected)
  );
}
