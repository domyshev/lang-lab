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

export type WorldId = 'football' | 'forest' | 'mortalKombat' | 'starTrek';

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
      en: 'Forest Elves',
      ru: 'Лесные эльфы',
      es: 'Elfos del bosque',
      uk: 'Лісові ельфи',
    },
  },
  mortalKombat: {
    defaultAssistantId: 'studyTroll',
    id: 'mortalKombat',
    label: {
      en: 'Mortal Kombat',
      ru: 'Mortal Kombat',
      es: 'Mortal Kombat',
      uk: 'Mortal Kombat',
    },
  },
  starTrek: {
    defaultAssistantId: 'studyTroll',
    id: 'starTrek',
    label: {
      en: 'Star Trek',
      ru: 'Star Trek',
      es: 'Star Trek',
      uk: 'Star Trek',
    },
  },
};

export const worldIds: WorldId[] = [
  'forest',
  'football',
  'mortalKombat',
  'starTrek',
];

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

export const forestLilacAccent = {
  border: 'rgba(169, 137, 223, 0.52)',
  dark: '#34224f',
  glow: 'rgba(169, 137, 223, 0.18)',
  light: '#fff7ff',
  main: '#a989df',
  mid: '#d8bcff',
  soft: 'rgba(169, 137, 223, 0.055)',
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

export const mortalKombatAccent: WorldAccent = {
  border: '#ffb03a',
  dark: '#260909',
  light: '#fff1d6',
  main: '#d43f24',
};

export const mortalKombatResultColors: WorldResultColors = {
  correct: {
    border: '#73d8a5',
    main: '#11a36a',
    soft: '#e9fff4',
    text: '#073b27',
  },
  incorrect: {
    border: '#f0a07f',
    main: '#d43f24',
    soft: '#fff1eb',
    text: '#5b1208',
  },
};

export const starTrekAccent: WorldAccent = {
  border: '#93d6ff',
  dark: '#101b4d',
  light: '#ecf6ff',
  main: '#3f88ff',
};

export const starTrekResultColors: WorldResultColors = {
  correct: {
    border: '#91dcc1',
    main: '#39b982',
    soft: '#ebfff7',
    text: '#103f31',
  },
  incorrect: {
    border: '#f0a4b5',
    main: '#d94a64',
    soft: '#fff1f4',
    text: '#591524',
  },
};

const mortalKombatPalettes: FootballCountryPalette[] = [
  makePalette('mk-shirai', 'Shirai Ryu', '#1a1010', '#d43f24', '#ffb03a', '#fff1d6'),
  makePalette('mk-lin-kuei', 'Lin Kuei', '#071426', '#1f7ed0', '#7fe8ff', '#ecf8ff'),
  makePalette('mk-thunder', 'Thunder Temple', '#1c1230', '#6f52d9', '#f1cf62', '#fff8db'),
  makePalette('mk-outworld', 'Outworld Jade', '#102218', '#158060', '#d4b94b', '#f6ffe6'),
  makePalette('mk-netherrealm', 'Netherrealm', '#19070c', '#821c35', '#ff6b35', '#fff0e4'),
  makePalette('mk-edenia', 'Edenia', '#1a1230', '#8255c7', '#f4a9d8', '#fff7ff'),
];

const starTrekPalettes: FootballCountryPalette[] = [
  makePalette('trek-command', 'Command Gold', '#101b4d', '#f3b833', '#3f88ff', '#f7fbff'),
  makePalette('trek-science', 'Science Blue', '#071b35', '#2478c8', '#78d9ff', '#f2fbff'),
  makePalette('trek-engineering', 'Engineering Red', '#230d18', '#c93a4d', '#f0a24a', '#fff5ee'),
  makePalette('trek-voyager', 'Voyager', '#171a3a', '#6d78d8', '#9ee7ff', '#f4fbff'),
  makePalette('trek-nebula', 'Nebula', '#1c1430', '#8a5bd8', '#54d8c4', '#f8f5ff'),
  makePalette('trek-delta', 'Delta Silver', '#182233', '#8da2b8', '#f3c746', '#ffffff'),
];

const mortalKombatGameTileThemes: Record<ExerciseType, FootballGameTileTheme> = {
  crossword: { ...mortalKombatPalettes[0], art: 'goal' },
  multipleChoice: { ...mortalKombatPalettes[1], art: 'ball' },
  missingLetters: { ...mortalKombatPalettes[2], art: 'worldCup2026' },
  missingWord: { ...mortalKombatPalettes[3], art: 'goalkeeper' },
};

const starTrekGameTileThemes: Record<ExerciseType, FootballGameTileTheme> = {
  crossword: { ...starTrekPalettes[0], art: 'goal' },
  multipleChoice: { ...starTrekPalettes[1], art: 'ball' },
  missingLetters: { ...starTrekPalettes[2], art: 'worldCup2026' },
  missingWord: { ...starTrekPalettes[3], art: 'goalkeeper' },
};

export function resolveWorldId(value: unknown): WorldId {
  return worldIds.includes(value as WorldId) ? (value as WorldId) : defaultWorldId;
}

export function getWorldDefinition(value: unknown): WorldDefinition {
  return worldDefinitions[resolveWorldId(value)];
}

export function getWorldAccent(value: unknown): WorldAccent {
  switch (resolveWorldId(value)) {
    case 'forest':
      return forestAccent;
    case 'mortalKombat':
      return mortalKombatAccent;
    case 'starTrek':
      return starTrekAccent;
    case 'football':
    default:
      return stadiumAccent;
  }
}

export function getWorldResultColors(value: unknown): WorldResultColors {
  switch (resolveWorldId(value)) {
    case 'forest':
      return forestResultColors;
    case 'mortalKombat':
      return mortalKombatResultColors;
    case 'starTrek':
      return starTrekResultColors;
    case 'football':
    default:
      return footballResultColors;
  }
}

export function getGameTileThemes(
  value: unknown,
): Record<ExerciseType, FootballGameTileTheme> {
  switch (resolveWorldId(value)) {
    case 'forest':
      return forestGameTileThemes;
    case 'mortalKombat':
      return mortalKombatGameTileThemes;
    case 'starTrek':
      return starTrekGameTileThemes;
    case 'football':
    default:
      return footballGameTileThemes;
  }
}

export function getPaletteForCardSet(
  cardSetId: string,
  value: unknown,
  options: { isAllCards?: boolean } = {},
): FootballCountryPalette {
  const worldId = resolveWorldId(value);

  if (worldId === 'forest') {
    return getPaletteFromWorldPalettes(cardSetId, forestPalettes, options);
  }

  if (worldId === 'mortalKombat') {
    return getPaletteFromWorldPalettes(cardSetId, mortalKombatPalettes, options);
  }

  if (worldId === 'starTrek') {
    return getPaletteFromWorldPalettes(cardSetId, starTrekPalettes, options);
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

function getPaletteFromWorldPalettes(
  cardSetId: string,
  palettes: FootballCountryPalette[],
  options: { isAllCards?: boolean },
): FootballCountryPalette {
  if (options.isAllCards) {
    return palettes[0];
  }

  return palettes[stableHash(cardSetId) % palettes.length];
}

function stableHash(value: string): number {
  return [...value].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 17);
}
