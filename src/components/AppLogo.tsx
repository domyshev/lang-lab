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

import { Box, Typography } from '@mui/material';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';
import { WorldId, resolveWorldId } from '../domain/worlds';

export function AppLogo({
  interfaceLanguage,
  onClick,
  worldId,
}: {
  interfaceLanguage: SupportedLanguage;
  onClick?: () => void;
  worldId?: WorldId;
}) {
  const resolvedWorldId = resolveWorldId(worldId);
  const isForest = resolvedWorldId === 'forest';

  return (
    <Box
      aria-label={t(interfaceLanguage, 'appName')}
      component="button"
      data-test="app_logo__button"
      onClick={onClick}
      type="button"
      sx={{
        alignItems: 'center',
        appearance: 'none',
        bgcolor: isForest ? '#f4fbeb' : '#f7ffe5',
        border: isForest
          ? '1px solid rgba(117, 168, 67, 0.24)'
          : '1px solid rgba(32, 48, 21, 0.16)',
        borderRadius: 2,
        boxShadow: '0 8px 18px rgba(32, 48, 21, 0.08)',
        cursor: 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        font: 'inherit',
        gap: 1,
        height: 52,
        lineHeight: 1,
        m: 0,
        minHeight: 52,
        minWidth: 250,
        overflow: 'hidden',
        pl: 1,
        pr: '35px',
        py: 0,
        position: 'relative',
        alignSelf: 'center',
        mt: 0,
        textAlign: 'left',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        '&:focus-visible': {
          outline: '3px solid rgba(32, 48, 21, 0.32)',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        aria-hidden="true"
        data-test="app_logo__legacy_leaf_hidden"
        sx={{
          bgcolor: 'rgba(156, 202, 86, 0.22)',
          borderBottomLeftRadius: '999px',
          borderBottomRightRadius: '999px',
          borderTopLeftRadius: 0,
          borderTopRightRadius: '999px',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 18% 100%)',
          display: 'none',
          height: 12,
          position: 'absolute',
          right: -8,
          top: -3,
          width: 58,
          zIndex: 0,
        }}
      />
      {isForest ? <ForestLogoMark /> : <FootballLogoMark />}
      <Typography
        component="span"
        data-test="app_logo__text"
        sx={{
          color: '#203015',
          fontSize: { xs: 18, sm: 22, md: 24 },
          fontWeight: 950,
          letterSpacing: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {t(interfaceLanguage, 'appName')}
      </Typography>
    </Box>
  );
}

function FootballLogoMark() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      data-test="app_logo__football_crest_svg"
      viewBox="0 0 44 50"
      sx={logoMarkSx('drop-shadow(0 4px 7px rgba(124, 21, 24, 0.18))')}
    >
      <defs>
        <clipPath id="app-logo-football-crest-clip">
          <path d="M22 2 39 7v16c0 11.5-7.3 19.2-17 24C12.3 42.2 5 34.5 5 23V7Z" />
        </clipPath>
      </defs>
      <path
        data-test="app_logo__crest_shield"
        d="M22 2 39 7v16c0 11.5-7.3 19.2-17 24C12.3 42.2 5 34.5 5 23V7Z"
        fill="#fffdf4"
        stroke="#7c1518"
        strokeWidth="2.4"
      />
      <g clipPath="url(#app-logo-football-crest-clip)">
        <rect width="44" height="13" fill="#c60b1e" />
        <rect y="13" width="44" height="19" fill="#ffc400" />
        <rect y="32" width="44" height="18" fill="#c60b1e" />
        <path
          d="M7 7h30M7 32h30M22 2v45"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.1"
        />
        <path
          d="M10 9c6 3 18 3 24 0"
          fill="none"
          stroke="rgba(32, 48, 21, 0.35)"
          strokeWidth="1.2"
        />
      </g>
      <circle
        data-test="app_logo__crest_ball"
        cx="22"
        cy="27"
        r="8"
        fill="#fffdf4"
        stroke="#203015"
        strokeWidth="1.5"
      />
      <path
        d="M22 19v16M14 27h16M16 21l12 12M28 21 16 33"
        stroke="#203015"
        strokeWidth="0.85"
        opacity="0.58"
      />
      <text
        x="22"
        y="15"
        fill="#203015"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fontWeight="900"
        letterSpacing="0"
        textAnchor="middle"
      >
        LL
      </text>
    </Box>
  );
}

function ForestLogoMark() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      data-test="app_logo__forest_leaf_svg"
      viewBox="0 0 44 50"
      sx={logoMarkSx('drop-shadow(0 4px 7px rgba(78, 122, 50, 0.18))')}
    >
      <rect
        x="3"
        y="5"
        width="38"
        height="38"
        rx="12"
        fill="#f7ffe5"
        stroke="#75a843"
        strokeWidth="2.4"
      />
      <path
        data-test="app_logo__forest_leaf"
        d="M8 27c12-18 27-21 31-12-3 14-18 23-31 12Z"
        fill="#9cca56"
        stroke="#203015"
        strokeWidth="1.8"
      />
      <path
        d="M12 26c7-2 15-6 24-11"
        fill="none"
        stroke="#f7ffe5"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <text
        x="22"
        y="36"
        fill="#203015"
        fontFamily="Arial, sans-serif"
        fontSize="8"
        fontWeight="900"
        letterSpacing="0"
        textAnchor="middle"
      >
        LL
      </text>
    </Box>
  );
}

function logoMarkSx(filter: string) {
  return {
    display: 'block',
    flexShrink: 0,
    filter,
    height: { xs: 32, sm: 40 },
    position: 'relative',
    transform: 'rotate(-2deg)',
    width: { xs: 34, sm: 42 },
    zIndex: 1,
  };
}
