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
