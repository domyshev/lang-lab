import { describe, expect, it } from 'vitest';
import { coachThoughts, getCoachThought } from '../coachThoughts';
import { supportedLanguages } from '../languages';

describe('coachThoughts', () => {
  it('keeps 100 localized playful phrases for each interface language', () => {
    for (const language of supportedLanguages) {
      expect(coachThoughts[language]).toHaveLength(100);
      expect(new Set(coachThoughts[language]).size).toBe(100);
    }
  });

  it('picks a stable thought from the provided seed', () => {
    expect(getCoachThought('ru', 7)).toBe(getCoachThought('ru', 7));
    expect(coachThoughts.ru).toContain(getCoachThought('ru', 7));
  });
});
