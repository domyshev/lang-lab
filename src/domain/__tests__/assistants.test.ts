import { describe, expect, it } from 'vitest';
import { assistantCharacters, getAssistantTooltip } from '../assistants';
import { supportedLanguages } from '../languages';

describe('assistantCharacters', () => {
  it('has localized names and learning superpowers for every assistant', () => {
    for (const assistant of assistantCharacters) {
      for (const language of supportedLanguages) {
        const tooltip = getAssistantTooltip(assistant.id, language);

        expect(assistant.name[language]).toBeTruthy();
        expect(assistant.superpower[language]).toBeTruthy();
        expect(tooltip).toContain(assistant.name[language]);
        expect(tooltip).toContain(assistant.superpower[language]);
      }
    }
  });
});
