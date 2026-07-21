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

import { ExerciseAttempt, ExerciseType } from './exercises';
import { SupportedLanguage } from './languages';

export interface ExerciseHistorySummary {
  id: string;
  exerciseType: ExerciseType;
  cardSetId: string;
  targetLanguage: SupportedLanguage;
  createdAt: string;
  completedAt?: string;
  exerciseCompletedAt?: string;
  isExerciseCompleted: boolean;
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
          cardSetId: attempt.cardSetId,
          targetLanguage: attempt.targetLanguage,
          createdAt: attempt.createdAt,
          completedAt: attempt.completedAt,
          exerciseCompletedAt: attempt.isExerciseCompleted
            ? attempt.completedAt ?? attempt.createdAt
            : undefined,
          isExerciseCompleted: Boolean(attempt.isExerciseCompleted),
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
      if (attempt.isExerciseCompleted) {
        existing.isExerciseCompleted = true;
        existing.exerciseCompletedAt = attempt.completedAt ?? attempt.createdAt;
      }
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
    attempt.cardSetId,
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
