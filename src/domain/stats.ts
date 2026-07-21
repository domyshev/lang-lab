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

export interface CardStats {
  cardId: string;
  targetLanguage: SupportedLanguage;
  attempts: number;
  correct: number;
  incorrect: number;
  hintsUsed: number;
  accuracy: number;
  recentMistakes: number;
  lastPracticedAt: string;
  stability: 'new' | 'weak' | 'unstable' | 'strong';
}

export function updateStatsFromAttempt(
  currentStats: CardStats[],
  attempt: ExerciseAttempt,
): CardStats[] {
  const next = currentStats.map((stat) => ({ ...stat }));
  const completedAt = attempt.completedAt ?? attempt.createdAt;

  Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
    let stat = next.find(
      (item) =>
        item.cardId === cardId &&
        item.targetLanguage === attempt.targetLanguage,
    );

    if (!stat) {
      stat = createEmptyStats(cardId, attempt.targetLanguage, completedAt);
      next.push(stat);
    }

    stat.attempts += 1;
    stat.correct += isCorrect ? 1 : 0;
    stat.incorrect += isCorrect ? 0 : 1;
    stat.hintsUsed += attempt.hintsUsed[cardId] ?? 0;
    stat.recentMistakes = isCorrect ? 0 : stat.recentMistakes + 1;
    stat.lastPracticedAt = completedAt;
    stat.accuracy = stat.correct / stat.attempts;
    stat.stability = classifyStability(stat);
  });

  return next;
}

function createEmptyStats(
  cardId: string,
  targetLanguage: SupportedLanguage,
  now: string,
): CardStats {
  return {
    cardId,
    targetLanguage,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    hintsUsed: 0,
    accuracy: 0,
    recentMistakes: 0,
    lastPracticedAt: now,
    stability: 'new',
  };
}

function classifyStability(stats: CardStats): CardStats['stability'] {
  if (stats.attempts < 2) {
    return 'new';
  }
  if (stats.recentMistakes >= 2 || stats.accuracy < 0.5) {
    return 'weak';
  }
  if (stats.accuracy < 0.8) {
    return 'unstable';
  }
  return 'strong';
}
