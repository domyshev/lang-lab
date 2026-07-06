import {
  CardSnapshot,
  LanguageCard,
  getCardAnswer,
  getDefinitionHint,
  getTranslationHints,
  isCardEligibleForTarget,
  isPhraseValue,
} from './cards';
import { SupportedLanguage } from './languages';

export type ExerciseType =
  | 'crossword'
  | 'multipleChoice'
  | 'missingLetters'
  | 'missingWord';

export interface ExercisePrompt {
  cardId: string;
  prompt: string;
  expectedAnswer: string;
  translationHints: Array<{ language: SupportedLanguage; value: string }>;
  definitionHint?: string;
}

export interface ExerciseAttempt {
  id: string;
  exerciseSessionId?: string;
  exerciseType: ExerciseType;
  themeId: string;
  targetLanguage: SupportedLanguage;
  createdAt: string;
  completedAt?: string;
  cardSnapshots: CardSnapshot[];
  prompts: ExercisePrompt[];
  answers: Record<string, string>;
  correctness: Record<string, boolean>;
  hintsUsed: Record<string, number>;
  isExerciseCompleted?: boolean;
  weightedScore?: number;
  coachComment?: string;
}

export interface MultipleChoicePrompt extends ExercisePrompt {
  options: string[];
}

export interface MissingLettersPrompt extends ExercisePrompt {
  maskedAnswer: string;
}

export interface MissingWordPrompt extends ExercisePrompt {
  sentenceWithGap: string;
}

export function getEligibleCardsForTarget(
  cards: LanguageCard[],
  targetLanguage: SupportedLanguage,
): LanguageCard[] {
  return cards.filter((card) => isCardEligibleForTarget(card, targetLanguage));
}

export function createBasePrompt(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
): ExercisePrompt {
  const expectedAnswer = getCardAnswer(card, targetLanguage);
  if (!expectedAnswer) {
    throw new Error(`Card ${card.id} has no answer for ${targetLanguage}.`);
  }

  const translationHints = getTranslationHints(card, targetLanguage);
  return {
    cardId: card.id,
    prompt: translationHints
      .map((hint) => `${hint.language}: ${hint.value}`)
      .join(' / '),
    expectedAnswer,
    translationHints,
    definitionHint: getDefinitionHint(card, targetLanguage),
  };
}

export function createMultipleChoicePrompt(input: {
  card: LanguageCard;
  distractorCards: LanguageCard[];
  targetLanguage: SupportedLanguage;
}): MultipleChoicePrompt {
  const base = createBasePrompt(input.card, input.targetLanguage);
  const distractors = input.distractorCards
    .map((card) => getCardAnswer(card, input.targetLanguage))
    .filter((answer): answer is string => Boolean(answer))
    .filter((answer) => answer !== base.expectedAnswer)
    .slice(0, 2);

  return {
    ...base,
    options: shuffleStable([base.expectedAnswer, ...distractors]).slice(0, 3),
  };
}

export function createMissingLettersPrompt(input: {
  card: LanguageCard;
  targetLanguage: SupportedLanguage;
}): MissingLettersPrompt | undefined {
  const base = createBasePrompt(input.card, input.targetLanguage);
  if (isPhraseValue(base.expectedAnswer)) {
    return undefined;
  }

  return {
    ...base,
    maskedAnswer: maskAnswer(base.expectedAnswer),
  };
}

export function createMissingWordPrompt(input: {
  card: LanguageCard;
  targetLanguage: SupportedLanguage;
}): MissingWordPrompt | undefined {
  const base = createBasePrompt(input.card, input.targetLanguage);
  if (!isPhraseValue(base.expectedAnswer)) {
    return undefined;
  }

  const example = input.card.examples?.[input.targetLanguage]?.find((item) =>
    item.sentence.includes(item.answer),
  );

  return {
    ...base,
    sentenceWithGap: example
      ? example.sentence.replace(example.answer, '_____')
      : '_____',
    expectedAnswer: example?.answer ?? base.expectedAnswer,
  };
}

function maskAnswer(answer: string): string {
  let shouldMask = true;
  return answer
    .split('')
    .map((char) => {
      if (!/[A-Za-zА-Яа-яЁёÁÉÍÓÚÜÑáéíóúüñ]/.test(char)) {
        return char;
      }
      shouldMask = !shouldMask;
      return shouldMask ? '_' : char;
    })
    .join('');
}

function shuffleStable(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}
