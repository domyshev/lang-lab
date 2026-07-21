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

export type FootballCountryPalette = {
  accent: string;
  border: string;
  countryKey: string;
  foreground: string;
  gradient: string;
  label: string;
  soft: string;
};

export type FootballGameTileTheme = FootballCountryPalette & {
  art:
    | 'goal'
    | 'ball'
    | 'worldCup2026'
    | 'goalkeeper'
    | 'forestCrossword'
    | 'forestChoice'
    | 'forestLetters'
    | 'forestPhrase';
};

export const stadiumAccent = {
  border: '#8fc8f2',
  dark: '#123c69',
  light: '#e8f5ff',
  main: '#1877c9',
};

export const footballResultColors = {
  correct: {
    border: '#7fc77a',
    main: '#2f8f3a',
    soft: '#e8f7df',
    text: '#173f1f',
  },
  incorrect: {
    border: '#f39aa4',
    main: '#c60b1e',
    soft: '#fde8df',
    text: '#5a1118',
  },
};

export const footballCountryPalettes: FootballCountryPalette[] = [
  makePalette('spain', 'Spain', '#c60b1e', '#ffc400', '#7c1518', '#203015'),
  makePalette('portugal', 'Portugal', '#006b3f', '#c8102e', '#ffcc33', '#ffffff'),
  makePalette('england', 'England', '#ffffff', '#cf142b', '#1f4fa3', '#1f2937'),
  makePalette('germany', 'Germany', '#111111', '#dd0000', '#ffce00', '#fff8d6'),
  makePalette('brazil', 'Brazil', '#009b3a', '#ffdf00', '#002776', '#073b1a'),
  makePalette('argentina', 'Argentina', '#75aadb', '#ffffff', '#f6b40e', '#123c69'),
  makePalette('france', 'France', '#0055a4', '#ffffff', '#ef4135', '#10243d'),
  makePalette('italy', 'Italy', '#009246', '#ffffff', '#ce2b37', '#16351f'),
  makePalette('netherlands', 'Netherlands', '#ae1c28', '#ffffff', '#21468b', '#17233f'),
  makePalette('uruguay', 'Uruguay', '#6bc6e8', '#ffffff', '#fcd116', '#15364d'),
  makePalette('croatia', 'Croatia', '#f00000', '#ffffff', '#171796', '#261515'),
  makePalette('japan', 'Japan', '#ffffff', '#bc002d', '#f3f4f6', '#2f1b1f'),
  makePalette('morocco', 'Morocco', '#c1272d', '#006233', '#f4d35e', '#fff7df'),
  makePalette('mexico', 'Mexico', '#006847', '#ffffff', '#ce1126', '#173d2d'),
  makePalette('usa', 'USA', '#3c3b6e', '#ffffff', '#b22234', '#15152f'),
  makePalette('belgium', 'Belgium', '#000000', '#fae042', '#ed2939', '#fff4ba'),
  makePalette('denmark', 'Denmark', '#c60c30', '#ffffff', '#f6d3d9', '#2a1014'),
  makePalette('sweden', 'Sweden', '#006aa7', '#fecc00', '#70b7df', '#102f45'),
  makePalette('switzerland', 'Switzerland', '#d52b1e', '#ffffff', '#f4c6c1', '#351512'),
  makePalette('poland', 'Poland', '#ffffff', '#dc143c', '#ffd7df', '#2f1720'),
  makePalette('senegal', 'Senegal', '#00853f', '#fdef42', '#e31b23', '#173b20'),
  makePalette('ghana', 'Ghana', '#ce1126', '#fcd116', '#006b3f', '#1c2419'),
  makePalette('nigeria', 'Nigeria', '#008751', '#ffffff', '#9be7c2', '#113522'),
  makePalette('south-korea', 'South Korea', '#ffffff', '#c60c30', '#003478', '#15233c'),
  makePalette('australia', 'Australia', '#012169', '#ffcd00', '#00843d', '#ffffff'),
  makePalette('colombia', 'Colombia', '#fcd116', '#003893', '#ce1126', '#17233f'),
  makePalette('chile', 'Chile', '#0039a6', '#ffffff', '#d52b1e', '#17233f'),
  makePalette('serbia', 'Serbia', '#c6363c', '#0c4076', '#ffffff', '#fff3e0'),
  makePalette('scotland', 'Scotland', '#0065bd', '#ffffff', '#9ed0ff', '#102b44'),
  makePalette('wales', 'Wales', '#ffffff', '#d30731', '#00ad36', '#183a23'),
  makePalette('cameroon', 'Cameroon', '#007a5e', '#ce1126', '#fcd116', '#fff7d6'),
  makePalette('turkey', 'Turkey', '#e30a17', '#ffffff', '#f6b1b8', '#3b1115'),
];

export const gameTileThemes: Record<ExerciseType, FootballGameTileTheme> = {
  crossword: { ...footballCountryPalettes[0], art: 'goal' },
  multipleChoice: { ...footballCountryPalettes[1], art: 'ball' },
  missingLetters: { ...footballCountryPalettes[2], art: 'worldCup2026' },
  missingWord: { ...footballCountryPalettes[3], art: 'goalkeeper' },
};

export function getFootballPaletteForCardSet(
  cardSetId: string,
  options: { isAllCards?: boolean } = {},
): FootballCountryPalette {
  if (options.isAllCards) {
    return footballCountryPalettes[0];
  }
  const index = stableHash(cardSetId) % footballCountryPalettes.length;
  return footballCountryPalettes[index];
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
      `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.42) 0 15%, transparent 16%), ` +
      `linear-gradient(135deg, ${primary} 0%, ${secondary} 48%, ${tertiary} 100%)`,
    label,
    soft: secondary,
  };
}

function stableHash(value: string): number {
  return [...value].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 17);
}
