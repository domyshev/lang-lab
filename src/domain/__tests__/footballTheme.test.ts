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
  footballCountryPalettes,
  footballResultColors,
  gameTileThemes,
  getFootballPaletteForCardSet,
  stadiumAccent,
} from '../footballTheme';

describe('footballTheme', () => {
  it('maps each game to a distinct football country theme', () => {
    expect(gameTileThemes.crossword.countryKey).toBe('spain');
    expect(gameTileThemes.multipleChoice.countryKey).toBe('portugal');
    expect(gameTileThemes.missingLetters.countryKey).toBe('england');
    expect(gameTileThemes.missingWord.countryKey).toBe('germany');
  });

  it('provides at least thirty football country palettes', () => {
    expect(footballCountryPalettes.length).toBeGreaterThanOrEqual(30);
    expect(footballCountryPalettes.map((palette) => palette.countryKey)).toEqual(
      expect.arrayContaining([
        'spain',
        'portugal',
        'england',
        'germany',
        'brazil',
        'argentina',
      ]),
    );
  });

  it('assigns stable football palettes to card sets', () => {
    const first = getFootballPaletteForCardSet('love-set');
    const second = getFootballPaletteForCardSet('love-set');
    const different = getFootballPaletteForCardSet('family-set');

    expect(first.countryKey).toBe(second.countryKey);
    expect(first.gradient).toBe(second.gradient);
    expect(different.countryKey).not.toBe('');
  });

  it('keeps all cards on the Spain World Cup palette', () => {
    expect(
      getFootballPaletteForCardSet('all-cards', { isAllCards: true }).countryKey,
    ).toBe('spain');
  });

  it('uses stadium blue instead of the old purple accent', () => {
    expect(stadiumAccent.main).toBe('#1877c9');
    expect(stadiumAccent.dark).toBe('#123c69');
  });

  it('uses football grass and Spain red for result states', () => {
    expect(footballResultColors.correct.main).toBe('#2f8f3a');
    expect(footballResultColors.incorrect.main).toBe('#c60b1e');
  });
});
