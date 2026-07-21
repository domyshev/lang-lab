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
