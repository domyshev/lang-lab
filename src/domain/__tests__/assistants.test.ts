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

  it('uses the current Russian character names', () => {
    expect(
      Object.fromEntries(
        assistantCharacters.map((assistant) => [
          assistant.id,
          assistant.name.ru,
        ]),
      ),
    ).toEqual({
      capeChampion: 'Касильяс-стена',
      greenPower: 'Рамос-капитан',
      studyTroll: 'Ямал-молния',
      trollMama: 'Иньеста-маэстро',
      webRunner: 'Хави-дирижер',
    });
  });
});
