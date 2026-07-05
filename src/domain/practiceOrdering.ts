import { LanguageCard } from './cards';
import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export type CorrectStreakCooldownKey = 'three' | 'four' | 'fivePlus';

export interface PracticeSettings {
  correctStreakCooldownMonths: Record<CorrectStreakCooldownKey, number>;
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
  newCardMixFrequencyPercent: 25,
  recentMistakeRepeatFrequencyPercent: 25,
};

const recentWindowSize = 5;

export function getPracticeSettings(
  settings: PracticeSettings | undefined,
): PracticeSettings {
  return {
    correctStreakCooldownMonths: {
      ...defaultPracticeSettings.correctStreakCooldownMonths,
      ...(settings?.correctStreakCooldownMonths ?? {}),
    },
    newCardMixFrequencyPercent:
      settings?.newCardMixFrequencyPercent ??
      defaultPracticeSettings.newCardMixFrequencyPercent,
    recentMistakeRepeatFrequencyPercent:
      settings?.recentMistakeRepeatFrequencyPercent ??
      defaultPracticeSettings.recentMistakeRepeatFrequencyPercent,
  };
}

export function summarizeCardPractice(input: {
  attempts: ExerciseAttempt[];
  cardId: string;
  now: string;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): CardPracticeSummary {
  const settings = getPracticeSettings(input.settings);
  const events = input.attempts
    .filter(
      (attempt) =>
        attempt.targetLanguage === input.targetLanguage &&
        Object.prototype.hasOwnProperty.call(attempt.correctness, input.cardId),
    )
    .map((attempt) => ({
      at: attempt.completedAt ?? attempt.createdAt,
      isCorrect: attempt.correctness[input.cardId],
    }))
    .sort((left, right) => left.at.localeCompare(right.at));

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
  now: string;
  seed: number;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): LanguageCard[] {
  const summaries = input.cards.map((card) => ({
    card,
    summary: summarizeCardPractice({
      attempts: input.attempts,
      cardId: card.id,
      now: input.now,
      settings: input.settings,
      targetLanguage: input.targetLanguage,
    }),
  }));
  const dueCards = summaries.filter((item) => !item.summary.isCoolingDown);
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
