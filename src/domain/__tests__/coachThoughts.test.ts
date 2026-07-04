import { describe, expect, it } from 'vitest';
import { coachThoughts, getCoachThought } from '../coachThoughts';
import { assistantCharacters } from '../assistants';
import { supportedLanguages } from '../languages';

describe('coachThoughts', () => {
  it('keeps 100 localized character-specific phrases for every assistant', () => {
    for (const assistant of assistantCharacters) {
      for (const language of supportedLanguages) {
        expect(coachThoughts[assistant.id][language]).toHaveLength(100);
        expect(new Set(coachThoughts[assistant.id][language]).size).toBe(100);
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
});
