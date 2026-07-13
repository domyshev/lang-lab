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
      'Фланг открыт, можно ускоряться.',
    );
    expect(coachThoughts.studyTroll.ru).toContain(
      'Сначала касание, потом рывок.',
    );
    expect(coachThoughts.studyTroll.ru).not.toContain(
      'Фланг открыт, можно ускоряться: сначала касание, потом рывок.',
    );

    expect(coachThoughts.studyTroll.en).not.toContain(
      'The wing is open, accelerate now: first touch, then sprint.',
    );
    expect(coachThoughts.studyTroll.es).not.toContain(
      'La banda esta abierta, acelera ahora: primero toque, luego carrera.',
    );
  });
});
