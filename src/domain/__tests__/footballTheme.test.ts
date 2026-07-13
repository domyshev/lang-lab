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
