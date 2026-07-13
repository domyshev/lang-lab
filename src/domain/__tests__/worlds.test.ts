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

  it('switches game and card-set palettes by world', () => {
    expect(getGameTileThemes('football').crossword.countryKey).toBe('spain');
    expect(getGameTileThemes('forest').crossword.countryKey).toBe('fern');
    expect(getGameTileThemes('forest').crossword.art).toBe('forestCrossword');

    expect(
      getPaletteForCardSet('all-cards', 'football', { isAllCards: true })
        .countryKey,
    ).toBe('spain');
    expect(
      getPaletteForCardSet('all-cards', 'forest', { isAllCards: true })
        .countryKey,
    ).toBe('moss');
  });

  it('has separate assistant defaults for each world', () => {
    expect(getDefaultAssistantIdForWorld('football')).toBe('studyTroll');
    expect(getDefaultAssistantIdForWorld('forest')).toBe('studyTroll');
  });
});
