import { describe, expect, it } from 'vitest';
import {
  defaultAssistantId,
  getAssistantTooltip,
  resolveAssistantId,
  visibleAssistantCharacters,
  visibleAssistantIds,
} from '../assistants';
import { supportedLanguages } from '../languages';

describe('assistantCharacters', () => {
  it('has localized names and learning superpowers for every visible assistant', () => {
    for (const assistant of visibleAssistantCharacters) {
      for (const language of supportedLanguages) {
        const tooltip = getAssistantTooltip(assistant.id, language);

        expect(assistant.name[language]).toBeTruthy();
        expect(assistant.superpower[language]).toBeTruthy();
        expect(tooltip).toContain(assistant.name[language]);
        expect(tooltip).toContain(assistant.superpower[language]);
      }
    }
  });

  it('uses real Ukrainian assistant copy instead of Russian fallback text', () => {
    for (const assistant of visibleAssistantCharacters) {
      expect(assistant.name.uk).not.toBe(assistant.name.ru);
      expect(assistant.motto.uk).not.toBe(assistant.motto.ru);
      expect(assistant.description.uk).not.toBe(assistant.description.ru);
      expect(assistant.superpower.uk).not.toBe(assistant.superpower.ru);
      expect(assistant.abilities.uk).not.toEqual(assistant.abilities.ru);
    }
  });

  it('exposes four visible football-country assistants', () => {
    expect(visibleAssistantIds).toEqual([
      'studyTroll',
      'greenPower',
      'webRunner',
      'capeChampion',
    ]);
    expect(
      Object.fromEntries(
        visibleAssistantCharacters.map((assistant) => [
          assistant.id,
          assistant.name.ru,
        ]),
      ),
    ).toEqual({
      capeChampion: 'Немецкий сейвер',
      greenPower: 'Португальский бомбардир',
      studyTroll: 'Испанский вингер',
      webRunner: 'Английский капитан',
    });
  });

  it('maps the hidden legacy assistant id to the default visible assistant', () => {
    expect(resolveAssistantId('trollMama')).toBe(defaultAssistantId);
  });
});
