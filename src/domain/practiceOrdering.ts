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

import { LanguageCard } from './cards';
import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export type CorrectStreakCooldownKey = 'three' | 'four' | 'fivePlus';
export type MissingAnswerDifficulty = 'easy' | 'medium' | 'hard';
export type MissingAnswerExerciseType = 'missingLetters' | 'missingWord';

export interface MissingAnswerDifficultySettings {
  difficulty: MissingAnswerDifficulty;
  visibleLetterPercentByDifficulty: Record<MissingAnswerDifficulty, number>;
}

export interface PracticeSettings {
  correctStreakCooldownMonths: Record<CorrectStreakCooldownKey, number>;
  missingAnswerSettings: Record<
    MissingAnswerExerciseType,
    MissingAnswerDifficultySettings
  >;
  newCardMixFrequencyPercent: number;
  recentMistakeRepeatFrequencyPercent: number;
}

export interface CardPracticeSummary {
  cardId: string;
  correct: number;
  incorrect: number;
  isCoolingDown: boolean;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  recentCorrectStreak: number;
  recentIncorrectCount: number;
  totalAttempts: number;
}

export const defaultPracticeSettings: PracticeSettings = {
  correctStreakCooldownMonths: {
    three: 0.5,
    four: 1,
    fivePlus: 2,
  },
  missingAnswerSettings: {
    missingLetters: {
      difficulty: 'medium',
      visibleLetterPercentByDifficulty: {
        easy: 60,
        medium: 50,
        hard: 0,
      },
    },
    missingWord: {
      difficulty: 'medium',
      visibleLetterPercentByDifficulty: {
        easy: 60,
        medium: 50,
        hard: 0,
      },
    },
  },
  newCardMixFrequencyPercent: 25,
  recentMistakeRepeatFrequencyPercent: 25,
};

const recentWindowSize = 5;

type PracticeEvent = {
  at: string;
  isCorrect: boolean;
};

export function getPracticeSettings(
  settings: PracticeSettings | undefined,
): PracticeSettings {
  return {
    correctStreakCooldownMonths: {
      ...defaultPracticeSettings.correctStreakCooldownMonths,
      ...(settings?.correctStreakCooldownMonths ?? {}),
    },
    missingAnswerSettings: {
      missingLetters: getMissingAnswerDifficultySettings(
        settings?.missingAnswerSettings?.missingLetters,
        defaultPracticeSettings.missingAnswerSettings.missingLetters,
      ),
      missingWord: getMissingAnswerDifficultySettings(
        settings?.missingAnswerSettings?.missingWord,
        defaultPracticeSettings.missingAnswerSettings.missingWord,
      ),
    },
    newCardMixFrequencyPercent:
      settings?.newCardMixFrequencyPercent ??
      defaultPracticeSettings.newCardMixFrequencyPercent,
    recentMistakeRepeatFrequencyPercent:
      settings?.recentMistakeRepeatFrequencyPercent ??
      defaultPracticeSettings.recentMistakeRepeatFrequencyPercent,
  };
}

export function getMissingAnswerVisibleLetterPercent(
  settings: PracticeSettings | undefined,
  exerciseType: MissingAnswerExerciseType,
): number {
  const exerciseSettings = getPracticeSettings(settings).missingAnswerSettings[
    exerciseType
  ];

  return exerciseSettings.visibleLetterPercentByDifficulty[
    exerciseSettings.difficulty
  ];
}

function getMissingAnswerDifficultySettings(
  settings: MissingAnswerDifficultySettings | undefined,
  fallback: MissingAnswerDifficultySettings,
): MissingAnswerDifficultySettings {
  const difficulty = isMissingAnswerDifficulty(settings?.difficulty)
    ? settings.difficulty
    : fallback.difficulty;

  return {
    difficulty,
    visibleLetterPercentByDifficulty: {
      easy: sanitizePercent(
        settings?.visibleLetterPercentByDifficulty?.easy ??
          fallback.visibleLetterPercentByDifficulty.easy,
      ),
      medium: sanitizePercent(
        settings?.visibleLetterPercentByDifficulty?.medium ??
          fallback.visibleLetterPercentByDifficulty.medium,
      ),
      hard: sanitizePercent(
        settings?.visibleLetterPercentByDifficulty?.hard ??
          fallback.visibleLetterPercentByDifficulty.hard,
      ),
    },
  };
}

function isMissingAnswerDifficulty(
  value: string | undefined,
): value is MissingAnswerDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function sanitizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function summarizeCardPractice(input: {
  attempts: ExerciseAttempt[];
  cardId: string;
  now: string;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): CardPracticeSummary {
  const events = input.attempts
    .filter(
      (attempt) =>
        attempt.targetLanguage === input.targetLanguage &&
        Object.prototype.hasOwnProperty.call(attempt.correctness, input.cardId),
    )
    .map((attempt) => ({
      at: attempt.completedAt ?? attempt.createdAt,
      isCorrect: Boolean(attempt.correctness[input.cardId]),
    }))
    .sort((left, right) => left.at.localeCompare(right.at));

  return summarizePracticeEvents({
    cardId: input.cardId,
    events,
    now: input.now,
    settings: input.settings,
  });
}

export function summarizePracticeByCardId(input: {
  attempts: ExerciseAttempt[];
  now: string;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): Map<string, CardPracticeSummary> {
  const eventsByCardId = new Map<string, PracticeEvent[]>();

  input.attempts
    .filter((attempt) => attempt.targetLanguage === input.targetLanguage)
    .forEach((attempt) => {
      Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
        const events = eventsByCardId.get(cardId) ?? [];
        events.push({
          at: attempt.completedAt ?? attempt.createdAt,
          isCorrect: Boolean(isCorrect),
        });
        eventsByCardId.set(cardId, events);
      });
    });

  return new Map(
    Array.from(eventsByCardId.entries()).map(([cardId, events]) => [
      cardId,
      summarizePracticeEvents({
        cardId,
        events: events.sort((left, right) => left.at.localeCompare(right.at)),
        now: input.now,
        settings: input.settings,
      }),
    ]),
  );
}

function summarizePracticeEvents(input: {
  cardId: string;
  events: PracticeEvent[];
  now: string;
  settings: PracticeSettings | undefined;
}): CardPracticeSummary {
  const settings = getPracticeSettings(input.settings);
  const events = input.events;
  const correct = events.filter((event) => event.isCorrect).length;
  const incorrect = events.length - correct;
  const recentEvents = events.slice(-recentWindowSize);
  const recentIncorrectCount = recentEvents.filter(
    (event) => !event.isCorrect,
  ).length;
  const recentCorrectStreak = countRecentCorrectStreak(events);
  const lastPracticedAt = events[events.length - 1]?.at;
  const cooldownMonths = getCooldownMonths(recentCorrectStreak, settings);
  const nextReviewAt =
    lastPracticedAt && cooldownMonths > 0
      ? addMonths(lastPracticedAt, cooldownMonths)
      : undefined;

  return {
    cardId: input.cardId,
    correct,
    incorrect,
    isCoolingDown: Boolean(nextReviewAt && input.now < nextReviewAt),
    lastPracticedAt,
    nextReviewAt,
    recentCorrectStreak,
    recentIncorrectCount,
    totalAttempts: events.length,
  };
}

export function orderCardsForMissingLettersPractice(input: {
  attempts: ExerciseAttempt[];
  cards: LanguageCard[];
  includeCoolingDown?: boolean;
  now: string;
  seed: number;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): LanguageCard[] {
  const summariesByCardId = summarizePracticeByCardId({
    attempts: input.attempts,
    now: input.now,
    settings: input.settings,
    targetLanguage: input.targetLanguage,
  });
  const summaries = input.cards.map((card) => ({
    card,
    summary:
      summariesByCardId.get(card.id) ??
      summarizePracticeEvents({
        cardId: card.id,
        events: [],
        now: input.now,
        settings: input.settings,
      }),
  }));
  const dueCards = input.includeCoolingDown
    ? summaries
    : summaries.filter((item) => !item.summary.isCoolingDown);
  const recentMistakeCards = dueCards
    .filter(
      (item) =>
        item.summary.totalAttempts > 0 && item.summary.recentIncorrectCount > 0,
    )
    .sort(
      (left, right) =>
        right.summary.recentIncorrectCount - left.summary.recentIncorrectCount ||
        seededRank(left.card.id, input.seed) - seededRank(right.card.id, input.seed),
    );
  const newCards = shuffleBySeed(
    dueCards
      .filter((item) => item.summary.totalAttempts === 0)
      .map((item) => item.card),
    input.seed,
  );
  const practicedWithoutRecentMistakes = shuffleBySeed(
    dueCards
      .filter(
        (item) =>
          item.summary.totalAttempts > 0 &&
          item.summary.recentIncorrectCount === 0,
      )
      .map((item) => item.card),
    input.seed,
  );

  return buildFrequencyMixedQueue({
    newCards,
    practicedWithoutRecentMistakes,
    recentMistakeCards: recentMistakeCards.map((item) => item.card),
    seed: input.seed,
    settings: getPracticeSettings(input.settings),
  });
}

function buildFrequencyMixedQueue({
  newCards,
  practicedWithoutRecentMistakes,
  recentMistakeCards,
  seed,
  settings,
}: {
  newCards: LanguageCard[];
  practicedWithoutRecentMistakes: LanguageCard[];
  recentMistakeCards: LanguageCard[];
  seed: number;
  settings: PracticeSettings;
}): LanguageCard[] {
  if (recentMistakeCards.length === 0) {
    return [...newCards, ...practicedWithoutRecentMistakes];
  }

  const baseCount =
    recentMistakeCards.length +
    newCards.length +
    practicedWithoutRecentMistakes.length;
  const repeatSlots = Math.floor(
    (baseCount * settings.recentMistakeRepeatFrequencyPercent) / 100,
  );
  const earlyNewSlots =
    settings.newCardMixFrequencyPercent > 0
      ? Math.max(
          1,
          Math.floor((baseCount * settings.newCardMixFrequencyPercent) / 100),
        )
      : 0;
  const repeatCards = cycleCards(recentMistakeCards, repeatSlots, seed);
  const earlyNewCards = newCards.slice(0, earlyNewSlots);
  const laterNewCards = newCards.slice(earlyNewSlots);
  const queue: LanguageCard[] = [];
  const separators = [...earlyNewCards, ...practicedWithoutRecentMistakes];

  pushCard(queue, recentMistakeCards[0]);
  for (const card of repeatCards) {
    pushAvoidingImmediateRepeat(queue, card, separators);
  }

  for (const card of [
    ...recentMistakeCards.slice(1),
    ...earlyNewCards,
    ...practicedWithoutRecentMistakes,
    ...laterNewCards,
  ]) {
    pushUniqueCard(queue, card);
  }

  return queue;
}

function cycleCards(
  cards: LanguageCard[],
  count: number,
  seed: number,
): LanguageCard[] {
  if (cards.length === 0 || count <= 0) {
    return [];
  }

  const orderedCards = shuffleBySeed(cards, seed);
  return Array.from(
    { length: count },
    (_, index) => orderedCards[index % orderedCards.length],
  );
}

function pushAvoidingImmediateRepeat(
  queue: LanguageCard[],
  card: LanguageCard,
  separators: LanguageCard[],
) {
  if (queue[queue.length - 1]?.id !== card.id) {
    pushCard(queue, card);
    return;
  }

  const separator = separators.find(
    (candidate) =>
      candidate.id !== card.id && !queue.some((item) => item.id === candidate.id),
  );
  if (separator) {
    pushCard(queue, separator);
  }

  if (queue[queue.length - 1]?.id !== card.id) {
    pushCard(queue, card);
  }
}

function pushCard(queue: LanguageCard[], card: LanguageCard | undefined) {
  if (!card) {
    return;
  }

  queue.push(card);
}

function pushUniqueCard(queue: LanguageCard[], card: LanguageCard | undefined) {
  if (!card || queue.some((item) => item.id === card.id)) {
    return;
  }

  queue.push(card);
}

function countRecentCorrectStreak(
  events: Array<{ isCorrect: boolean }>,
): number {
  let streak = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (!events[index].isCorrect) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function getCooldownMonths(
  streak: number,
  settings: PracticeSettings,
): number {
  if (streak >= 5) {
    return settings.correctStreakCooldownMonths.fivePlus;
  }
  if (streak >= 4) {
    return settings.correctStreakCooldownMonths.four;
  }
  if (streak >= 3) {
    return settings.correctStreakCooldownMonths.three;
  }
  return 0;
}

function addMonths(dateIso: string, months: number): string {
  const date = new Date(dateIso);
  const wholeMonths = Math.trunc(months);
  const fractionalMonths = months - wholeMonths;

  date.setUTCMonth(date.getUTCMonth() + wholeMonths);
  if (fractionalMonths > 0) {
    date.setUTCDate(date.getUTCDate() + Math.round(fractionalMonths * 30));
  }

  return date.toISOString();
}

function shuffleBySeed(cards: LanguageCard[], seed: number): LanguageCard[] {
  return [...cards].sort(
    (left, right) => seededRank(left.id, seed) - seededRank(right.id, seed),
  );
}

function seededRank(value: string, seed: number): number {
  let hash = 0;
  const source = `${value}:${seed}`;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return hash;
}
