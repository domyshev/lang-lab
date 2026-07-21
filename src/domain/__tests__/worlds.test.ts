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
  defaultWorldId,
  getDefaultAssistantIdForWorld,
  getGameTileThemes,
  getPaletteForCardSet,
  getWorldAccent,
  getWorldDefinition,
  getWorldResultColors,
  resolveWorldId,
} from '../worlds';

describe('worlds', () => {
  it('keeps football as the default world for existing players', () => {
    expect(defaultWorldId).toBe('football');
    expect(resolveWorldId(undefined)).toBe('football');
    expect(resolveWorldId('forest')).toBe('forest');
    expect(resolveWorldId('mortalKombat')).toBe('mortalKombat');
    expect(resolveWorldId('starTrek')).toBe('starTrek');
    expect(resolveWorldId('unknown')).toBe('football');
  });

  it('provides distinct football and forest visual tokens', () => {
    expect(getWorldDefinition('football').label.ru).toBe('Футбол');
    expect(getWorldDefinition('forest').label.ru).toBe('Лесные эльфы');

    expect(getWorldAccent('football').main).toBe('#1877c9');
    expect(getWorldAccent('forest').main).toBe('#75a843');
    expect(getWorldResultColors('football').incorrect.main).toBe('#c60b1e');
    expect(getWorldResultColors('forest').incorrect.main).toBe('#d86b7c');
  });

  it('provides Mortal Kombat and Star Trek visual tokens', () => {
    expect(getWorldDefinition('mortalKombat').label.ru).toBe('Mortal Kombat');
    expect(getWorldDefinition('starTrek').label.ru).toBe('Star Trek');

    expect(getWorldAccent('mortalKombat').main).toBe('#d43f24');
    expect(getWorldAccent('starTrek').main).toBe('#3f88ff');
    expect(getWorldResultColors('mortalKombat').correct.main).toBe('#11a36a');
    expect(getWorldResultColors('starTrek').incorrect.main).toBe('#d94a64');
  });

  it('switches game and card-set palettes by world', () => {
    expect(getGameTileThemes('football').crossword.countryKey).toBe('spain');
    expect(getGameTileThemes('forest').crossword.countryKey).toBe('fern');
    expect(getGameTileThemes('mortalKombat').crossword.countryKey).toBe('mk-shirai');
    expect(getGameTileThemes('starTrek').crossword.countryKey).toBe('trek-command');
    expect(getGameTileThemes('forest').crossword.art).toBe('forestCrossword');

    expect(
      getPaletteForCardSet('all-cards', 'football', { isAllCards: true })
        .countryKey,
    ).toBe('spain');
    expect(
      getPaletteForCardSet('all-cards', 'forest', { isAllCards: true })
        .countryKey,
    ).toBe('moss');
    expect(
      getPaletteForCardSet('all-cards', 'mortalKombat', { isAllCards: true })
        .countryKey,
    ).toBe('mk-shirai');
    expect(
      getPaletteForCardSet('all-cards', 'starTrek', { isAllCards: true })
        .countryKey,
    ).toBe('trek-command');
  });

  it('has separate assistant defaults for each world', () => {
    expect(getDefaultAssistantIdForWorld('football')).toBe('studyTroll');
    expect(getDefaultAssistantIdForWorld('forest')).toBe('studyTroll');
    expect(getDefaultAssistantIdForWorld('mortalKombat')).toBe('studyTroll');
    expect(getDefaultAssistantIdForWorld('starTrek')).toBe('studyTroll');
  });
});
