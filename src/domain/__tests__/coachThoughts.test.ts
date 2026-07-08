import { describe, expect, it } from 'vitest';
import { coachThoughts, getCoachThought } from '../coachThoughts';
import { assistantCharacters } from '../assistants';
import { supportedLanguages } from '../languages';

describe('coachThoughts', () => {
  it('keeps localized character-specific standalone phrases for every assistant', () => {
    for (const assistant of assistantCharacters) {
      for (const language of supportedLanguages) {
        expect(coachThoughts[assistant.id][language]).toHaveLength(20);
        expect(new Set(coachThoughts[assistant.id][language]).size).toBe(20);
      }
    }
  });

  it('picks a stable thought from the provided seed', () => {
    expect(getCoachThought('ru', 7, 'studyTroll')).toBe(
      getCoachThought('ru', 7, 'studyTroll'),
    );
    expect(coachThoughts.studyTroll.ru).toContain(
      getCoachThought('ru', 7, 'studyTroll'),
    );
    expect(getCoachThought('ru', 7, 'studyTroll')).not.toBe(
      getCoachThought('ru', 7, 'webRunner'),
    );
  });

  it('keeps generated transition thoughts to one sentence', () => {
    for (const assistant of assistantCharacters) {
      for (const language of supportedLanguages) {
        for (const thought of coachThoughts[assistant.id][language]) {
          expect(thought.match(/\./g)).toHaveLength(1);
        }
      }
    }
  });

  it('does not combine two standalone character sayings into one thought', () => {
    expect(coachThoughts.studyTroll.ru).toContain(
      'Крепкая голова проходит даже через туман.',
    );
    expect(coachThoughts.studyTroll.ru).toContain(
      'У следующей попытки уже лучше опора.',
    );
    expect(coachThoughts.studyTroll.ru).not.toContain(
      'Крепкая голова проходит даже через туман: у следующей попытки уже лучше опора.',
    );

    expect(coachThoughts.studyTroll.en).not.toContain(
      'A sturdy mind keeps walking through fog: your next attempt has better footing.',
    );
    expect(coachThoughts.studyTroll.es).not.toContain(
      'Una cabeza firme cruza incluso la niebla: el siguiente intento ya pisa mejor.',
    );
  });
});
