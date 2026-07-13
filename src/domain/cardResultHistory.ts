import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

export function createRecentResultsByCardId({
  attempts,
  limit,
  targetLanguage,
}: {
  attempts: ExerciseAttempt[];
  limit: number;
  targetLanguage: SupportedLanguage;
}): Map<string, RecentCardResult[]> {
  const resultsByCardId = new Map<string, RecentCardResult[]>();

  [...attempts]
    .filter((attempt) => attempt.targetLanguage === targetLanguage)
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? right.createdAt) -
        Date.parse(left.completedAt ?? left.createdAt),
    )
    .forEach((attempt) => {
      Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
        const results = resultsByCardId.get(cardId) ?? [];
        if (results.length >= limit) {
          return;
        }

        results.push({
          isCorrect: Boolean(isCorrect),
          occurredAt: attempt.completedAt ?? attempt.createdAt,
        });
        resultsByCardId.set(cardId, results);
      });
    });

  return resultsByCardId;
}
