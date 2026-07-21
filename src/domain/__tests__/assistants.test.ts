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

import { describe, expect, it } from 'vitest';
import {
  defaultAssistantId,
  getAssistantTooltip,
  getVisibleAssistantCharacters,
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

  it('exposes forest elves without the cinematic and round legacy assistants', () => {
    const forestAssistants = getVisibleAssistantCharacters('forest');

    expect(forestAssistants.map((assistant) => assistant.id)).toEqual([
      'studyTroll',
      'forestElf',
      'unicorn',
      'ladybug',
    ]);
    expect(
      Object.fromEntries(
        forestAssistants.map((assistant) => [assistant.id, assistant.name.ru]),
      ),
    ).toEqual({
      forestElf: 'Лесной эльф',
      ladybug: 'Смелая божья коровка',
      studyTroll: 'Веселый листочек',
      unicorn: 'Серебряный единорог',
    });
  });

  it('exposes four Mortal Kombat arena assistants', () => {
    const assistants = getVisibleAssistantCharacters('mortalKombat');

    expect(assistants.map((assistant) => assistant.id)).toEqual([
      'studyTroll',
      'greenPower',
      'webRunner',
      'capeChampion',
    ]);
    expect(
      Object.fromEntries(
        assistants.map((assistant) => [assistant.id, assistant.name.ru]),
      ),
    ).toEqual({
      capeChampion: 'Громовой монах',
      greenPower: 'Ледяной страж',
      studyTroll: 'Огненный ниндзя',
      webRunner: 'Теневая королева',
    });
  });

  it('exposes four Star Trek bridge assistants', () => {
    const assistants = getVisibleAssistantCharacters('starTrek');

    expect(assistants.map((assistant) => assistant.id)).toEqual([
      'studyTroll',
      'greenPower',
      'webRunner',
      'capeChampion',
    ]);
    expect(
      Object.fromEntries(
        assistants.map((assistant) => [assistant.id, assistant.name.ru]),
      ),
    ).toEqual({
      capeChampion: 'Штурман',
      greenPower: 'Научный офицер',
      studyTroll: 'Капитан звездолета',
      webRunner: 'Главный инженер',
    });
  });

  it('maps hidden legacy assistant ids to the default visible assistant', () => {
    expect(resolveAssistantId('trollMama')).toBe(defaultAssistantId);
    expect(resolveAssistantId('trollMama', 'forest')).toBe(defaultAssistantId);
    expect(resolveAssistantId('capeChampion', 'forest')).toBe(defaultAssistantId);
    expect(resolveAssistantId('greenPower', 'forest')).toBe(defaultAssistantId);
    expect(resolveAssistantId('webRunner', 'forest')).toBe(defaultAssistantId);
  });
});
