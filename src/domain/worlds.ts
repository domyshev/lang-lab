import type { ExerciseType } from './exercises';
import type {
  FootballCountryPalette,
  FootballGameTileTheme,
} from './footballTheme';
import {
  footballCountryPalettes,
  footballResultColors,
  gameTileThemes as footballGameTileThemes,
  getFootballPaletteForCardSet,
  stadiumAccent,
} from './footballTheme';
import type { SupportedLanguage } from './languages';
import type { AssistantId } from './assistants';

export type WorldId = 'football' | 'forest';

export type WorldAccent = typeof stadiumAccent;
export type WorldResultColors = typeof footballResultColors;

export interface WorldDefinition {
  defaultAssistantId: AssistantId;
  id: WorldId;
  label: Record<SupportedLanguage, string>;
}

export const defaultWorldId: WorldId = 'football';

export const worldDefinitions: Record<WorldId, WorldDefinition> = {
  football: {
    defaultAssistantId: 'studyTroll',
    id: 'football',
    label: {
      en: 'Football',
      ru: 'Футбол',
      es: 'Futbol',
      uk: 'Футбол',
    },
  },
  forest: {
    defaultAssistantId: 'studyTroll',
    id: 'forest',
    label: {
      en: 'Forest',
      ru: 'Лес',
      es: 'Bosque',
      uk: 'Ліс',
    },
  },
};

export const worldIds: WorldId[] = ['football', 'forest'];

export const forestAccent: WorldAccent = {
  border: '#b6d38a',
  dark: '#2f4d24',
  light: '#f4fbeb',
  main: '#75a843',
};

export const forestResultColors: WorldResultColors = {
  correct: {
    border: '#9fcb78',
    main: '#5d9a48',
    soft: '#edf8e4',
    text: '#24451c',
  },
  incorrect: {
    border: '#efadbb',
    main: '#d86b7c',
    soft: '#fff0f3',
    text: '#6a2130',
  },
};

const forestPalettes: FootballCountryPalette[] = [
  makePalette('moss', 'Moss', '#cfe9a4', '#9cca56', '#7fbf7b', '#203015'),
  makePalette('fern', 'Fern', '#dff2c4', '#7bbf83', '#4f8e5b', '#203015'),
  makePalette('berry', 'Berry', '#fff0f3', '#f2a7b4', '#d86b7c', '#4a2030'),
  makePalette('creek', 'Creek', '#e7f7ef', '#9ddbc2', '#65a8c9', '#1f4452'),
  makePalette('sunleaf', 'Sunleaf', '#fff8d8', '#f5d66a', '#91c96b', '#3f4b1f'),
  makePalette('mushroom', 'Mushroom', '#fff3e6', '#e7b98c', '#9d7250', '#3c2b20'),
  makePalette('pine', 'Pine', '#e7f3de', '#6fa96a', '#315b39', '#f7ffe5'),
  makePalette('moon', 'Moon', '#f4f0ff', '#c8b7f0', '#7b6bb3', '#2f244c'),
];

const forestGameTileThemes: Record<ExerciseType, FootballGameTileTheme> = {
  crossword: { ...forestPalettes[1], art: 'forestCrossword' },
  multipleChoice: { ...forestPalettes[3], art: 'forestChoice' },
  missingLetters: { ...forestPalettes[0], art: 'forestLetters' },
  missingWord: { ...forestPalettes[2], art: 'forestPhrase' },
};

export function resolveWorldId(value: unknown): WorldId {
  return value === 'forest' || value === 'football'
    ? value
    : defaultWorldId;
}

export function getWorldDefinition(value: unknown): WorldDefinition {
  return worldDefinitions[resolveWorldId(value)];
}

export function getWorldAccent(value: unknown): WorldAccent {
  return resolveWorldId(value) === 'forest' ? forestAccent : stadiumAccent;
}

export function getWorldResultColors(value: unknown): WorldResultColors {
  return resolveWorldId(value) === 'forest'
    ? forestResultColors
    : footballResultColors;
}

export function getGameTileThemes(
  value: unknown,
): Record<ExerciseType, FootballGameTileTheme> {
  return resolveWorldId(value) === 'forest'
    ? forestGameTileThemes
    : footballGameTileThemes;
}

export function getPaletteForCardSet(
  cardSetId: string,
  value: unknown,
  options: { isAllCards?: boolean } = {},
): FootballCountryPalette {
  if (resolveWorldId(value) === 'forest') {
    if (options.isAllCards) {
      return forestPalettes[0];
    }
    return forestPalettes[stableHash(cardSetId) % forestPalettes.length];
  }

  return getFootballPaletteForCardSet(cardSetId, options);
}

export function getDefaultAssistantIdForWorld(value: unknown): AssistantId {
  return getWorldDefinition(value).defaultAssistantId;
}

function makePalette(
  countryKey: string,
  label: string,
  primary: string,
  secondary: string,
  tertiary: string,
  foreground: string,
): FootballCountryPalette {
  return {
    accent: tertiary,
    border: primary,
    countryKey,
    foreground,
    gradient:
      `radial-gradient(circle at 22% 24%, rgba(255,255,255,0.45) 0 17%, transparent 18%), ` +
      `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, ${tertiary} 100%)`,
    label,
    soft: secondary,
  };
}

function stableHash(value: string): number {
  return [...value].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 17);
}
