import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export function getRepeatedPracticeCount({
  attempts,
  cardId,
  targetLanguage,
}: {
  attempts: ExerciseAttempt[];
  cardId: string;
  targetLanguage: SupportedLanguage;
}): number {
  const incorrectStreak = countLatestIncorrectStreak({
    attempts,
    cardId,
    targetLanguage,
  });

  if (incorrectStreak >= 2) {
    return 4;
  }

  if (incorrectStreak === 1) {
    return 2;
  }

  return 1;
}

export function aggregateRepeatedPracticeAnswers({
  answers,
  expectedAnswer,
}: {
  answers: string[];
  expectedAnswer: string;
}): { answer: string; isCorrect: boolean } {
  const correctCount = answers.filter(
    (answer) => normalizeAnswer(answer) === normalizeAnswer(expectedAnswer),
  ).length;
  const isCorrect = correctCount > answers.length / 2;

  return {
    answer: isCorrect
      ? expectedAnswer
      : answers.find(
          (answer) =>
            normalizeAnswer(answer) !== normalizeAnswer(expectedAnswer),
        ) ?? answers[answers.length - 1] ?? '',
    isCorrect,
  };
}

function countLatestIncorrectStreak({
  attempts,
  cardId,
  targetLanguage,
}: {
  attempts: ExerciseAttempt[];
  cardId: string;
  targetLanguage: SupportedLanguage;
}): number {
  const events = attempts
    .filter(
      (attempt) =>
        attempt.targetLanguage === targetLanguage &&
        Object.prototype.hasOwnProperty.call(attempt.correctness, cardId),
    )
    .map((attempt) => ({
      at: attempt.completedAt ?? attempt.createdAt,
      isCorrect: Boolean(attempt.correctness[cardId]),
    }))
    .sort((left, right) => left.at.localeCompare(right.at));

  let incorrectStreak = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].isCorrect) {
      break;
    }
    incorrectStreak += 1;
  }

  return incorrectStreak;
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
