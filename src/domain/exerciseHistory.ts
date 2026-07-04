import { ExerciseAttempt, ExerciseType } from './exercises';
import { SupportedLanguage } from './languages';

export interface ExerciseHistorySummary {
  id: string;
  exerciseType: ExerciseType;
  themeId: string;
  targetLanguage: SupportedLanguage;
  createdAt: string;
  completedAt?: string;
  attempts: ExerciseAttempt[];
  total: number;
  correct: number;
  incorrect: number;
}

const legacySessionGapMs = 45 * 60 * 1000;

export function summarizeExerciseHistory(
  attempts: ExerciseAttempt[],
): ExerciseHistorySummary[] {
  const summaries = new Map<string, ExerciseHistorySummary>();
  const lastLegacySummaryByKey = new Map<
    string,
    { summaryId: string; completedAt: string }
  >();

  [...attempts]
    .sort(
      (left, right) =>
        Date.parse(left.completedAt ?? left.createdAt) -
        Date.parse(right.completedAt ?? right.createdAt),
    )
    .forEach((attempt) => {
      const id = getSummaryId(attempt, lastLegacySummaryByKey);
      const existing = summaries.get(id);
      const totals = countAttemptAnswers(attempt);

      if (!existing) {
        summaries.set(id, {
          id,
          exerciseType: attempt.exerciseType,
          themeId: attempt.themeId,
          targetLanguage: attempt.targetLanguage,
          createdAt: attempt.createdAt,
          completedAt: attempt.completedAt,
          attempts: [attempt],
          total: totals.total,
          correct: totals.correct,
          incorrect: totals.incorrect,
        });
        return;
      }

      existing.attempts.push(attempt);
      existing.total += totals.total;
      existing.correct += totals.correct;
      existing.incorrect += totals.incorrect;
      if (Date.parse(attempt.createdAt) < Date.parse(existing.createdAt)) {
        existing.createdAt = attempt.createdAt;
      }
      if (
        !existing.completedAt ||
        Date.parse(attempt.completedAt ?? attempt.createdAt) >
          Date.parse(existing.completedAt)
      ) {
        existing.completedAt = attempt.completedAt ?? attempt.createdAt;
      }
    });

  return [...summaries.values()].sort(
    (left, right) =>
      Date.parse(right.completedAt ?? right.createdAt) -
      Date.parse(left.completedAt ?? left.createdAt),
  );
}

function getSummaryId(
  attempt: ExerciseAttempt,
  lastLegacySummaryByKey: Map<string, { summaryId: string; completedAt: string }>,
): string {
  if (attempt.exerciseSessionId) {
    return attempt.exerciseSessionId;
  }

  const key = [
    attempt.targetLanguage,
    attempt.themeId,
    attempt.exerciseType,
  ].join(':');
  const completedAt = attempt.completedAt ?? attempt.createdAt;
  const previous = lastLegacySummaryByKey.get(key);
  const shouldJoinPrevious =
    previous &&
    Date.parse(completedAt) - Date.parse(previous.completedAt) <=
      legacySessionGapMs;
  const summaryId = shouldJoinPrevious
    ? previous.summaryId
    : `legacy-${attempt.id}`;

  lastLegacySummaryByKey.set(key, { summaryId, completedAt });

  return summaryId;
}

function countAttemptAnswers(attempt: ExerciseAttempt) {
  const values = Object.values(attempt.correctness);
  const correct = values.filter(Boolean).length;

  return {
    total: values.length,
    correct,
    incorrect: values.length - correct,
  };
}
