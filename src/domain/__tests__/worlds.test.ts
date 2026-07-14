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
