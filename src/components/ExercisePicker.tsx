import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useSelector } from 'react-redux';
import { ExerciseType } from '../domain/exercises';
import { FootballGameTileTheme } from '../domain/footballTheme';
import { t } from '../domain/i18n';
import {
  getGameTileThemes,
  getWorldAccent,
  resolveWorldId,
} from '../domain/worlds';
import { RootState } from '../store/store';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import {
  GameWarningTooltipContent,
  gameWarningTooltipStyles,
} from './GameWarningTooltip';

const exerciseOptions: Array<{
  type: ExerciseType;
  labelKey: Parameters<typeof t>[1];
}> = [
  {
    type: 'crossword',
    labelKey: 'crossword',
  },
  {
    type: 'multipleChoice',
    labelKey: 'multipleChoice',
  },
  {
    type: 'missingLetters',
    labelKey: 'missingLetters',
  },
  {
    type: 'missingWord',
    labelKey: 'missingWord',
  },
];

const disabledTileAccent = '#73786d';
const disabledTileBackground =
  'radial-gradient(circle at 20% 76%, rgba(255,255,255,0.50) 0 11%, transparent 12%), linear-gradient(135deg, #f2f3ee 0%, #d9ddd2 48%, #b8beb2 100%)';

export function ExercisePicker({
  disabledExerciseTypes = {},
  disabledExerciseTooltips = {},
  selectedExerciseType,
  onPick,
}: {
  disabledExerciseTypes?: Partial<Record<ExerciseType, boolean>>;
  disabledExerciseTooltips?: Partial<Record<ExerciseType, string>>;
  selectedExerciseType: ExerciseType | null;
  onPick: (exerciseType: ExerciseType) => void;
}) {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const gameTileThemes = getGameTileThemes(worldId);
  const worldAccent = getWorldAccent(worldId);

  return (
    <Box data-test="exercise_picker__panel">
      <Stack data-test="exercise_picker__content" spacing={1.5}>
        <ToggleButtonGroup
          data-test="exercise_picker__tiles"
          value={selectedExerciseType}
          exclusive
          onChange={(_, value: ExerciseType | null) => {
            if (value) {
              onPick(value);
            }
          }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            columnGap: 1.25,
            rowGap: 1.25,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid rgba(32, 48, 21, 0.16)',
              borderRadius: 1.5,
              m: 0,
              overflow: 'hidden',
            },
          }}
        >
          {exerciseOptions.map((option) => {
            const optionLabel = t(interfaceLanguage, option.labelKey);
            const isDisabled = Boolean(disabledExerciseTypes[option.type]);
            const disabledTooltip = disabledExerciseTooltips[option.type];
            const theme = gameTileThemes[option.type];
            const tileAccent = isDisabled ? disabledTileAccent : theme.accent;
            const tileBackground = isDisabled
              ? disabledTileBackground
              : theme.gradient;
            const isSelected = selectedExerciseType === option.type;
            const tileButton = (
              <ToggleButton
                aria-label={optionLabel}
                data-football-country={theme.countryKey}
                data-test={`exercise_picker__option__${option.type}`}
                disabled={isDisabled}
                key={option.type}
                style={{
                  backgroundImage: tileBackground,
                  ...(isSelected
                    ? {
                        boxShadow:
                          `0 0 0 3px #fffdf4, 0 0 0 7px ${worldAccent.dark}, 0 18px 36px rgba(18, 60, 105, 0.30)`,
                      }
                    : {}),
                }}
                value={option.type}
                sx={{
                  alignItems: 'stretch',
                  background: tileBackground,
                  color: '#203015',
                  display: 'flex',
                  filter: isDisabled ? 'grayscale(1)' : 'none',
                  height: 184,
                  justifyContent: 'stretch',
                  p: 0,
                  position: 'relative',
                  textAlign: 'left',
                  textTransform: 'none',
                  transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
                  width: '100%',
                  '&:hover': {
                    background: tileBackground,
                    boxShadow: '0 16px 30px rgba(218, 131, 36, 0.18)',
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-selected': {
                    background: tileBackground,
                    borderColor: '#fffdf4',
                    boxShadow:
                      `0 0 0 3px #fffdf4, 0 0 0 7px ${worldAccent.dark}, 0 18px 36px rgba(18, 60, 105, 0.30)`,
                    transform: 'translateY(-2px)',
                  },
                  '&.Mui-selected:hover': {
                    background: tileBackground,
                  },
                  '&.Mui-disabled': {
                    background: tileBackground,
                    color: '#203015',
                    opacity: 1,
                  },
                }}
              >
                {isSelected && (
                  <Box
                    data-test={`exercise_picker__option_selected_badge__${option.type}`}
                    sx={{
                      alignItems: 'center',
                      bgcolor: '#fffdf4',
                      border: `2px solid ${worldAccent.dark}`,
                      borderRadius: '999px',
                      boxShadow: '0 10px 22px rgba(18, 60, 105, 0.26)',
                      color: worldAccent.dark,
                      display: 'inline-flex',
                      height: 38,
                      justifyContent: 'center',
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      width: 38,
                      zIndex: 2,
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 28 }} />
                  </Box>
                )}
                <GameTileArt
                  accent={tileAccent}
                  art={theme.art}
                  dataTest={`exercise_picker__option_art__${option.type}`}
                  type={option.type}
                />
                <Box
                  data-test={`exercise_picker__option_overlay__${option.type}`}
                  sx={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 52%, rgba(255,255,255,0.48) 100%)',
                    inset: 0,
                    position: 'absolute',
                  }}
                />
                <Typography
                  data-test={`exercise_picker__option_label__${option.type}`}
                  sx={{
                    alignSelf: 'flex-end',
                    backdropFilter: 'blur(18px)',
                    background: 'linear-gradient(135deg, #fffdf4 0%, #fff0c8 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.82)',
                    borderRadius: '999px',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 22px rgba(83, 58, 20, 0.18)',
                    color: '#203015',
                    display: 'inline-flex',
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1.15,
                    m: 1.5,
                    maxWidth: 'calc(100% - 24px)',
                    px: 1.5,
                    py: 0.85,
                    position: 'relative',
                    WebkitBackdropFilter: 'blur(18px)',
                    width: 'fit-content',
                    zIndex: 1,
                  }}
                >
                  {optionLabel}
                </Typography>
              </ToggleButton>
            );

            if (isDisabled && disabledTooltip) {
              return (
                <CursorAnchoredTooltip
                  arrowDataTest={`exercise_picker__option_tooltip_arrow__${option.type}`}
                  closeOnOtherOpen
                  key={option.type}
                  title={
                    <GameWarningTooltipContent
                      iconDataTest={`exercise_picker__disabled_tooltip_icon__${option.type}`}
                      messages={[disabledTooltip]}
                    />
                  }
                  tooltipSx={gameWarningTooltipStyles}
                >
                  <Box
                    data-test={`exercise_picker__option_tooltip_anchor__${option.type}`}
                    sx={{
                      borderRadius: 1.5,
                      display: 'flex',
                      height: 184,
                      minWidth: 0,
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    {tileButton}
                  </Box>
                </CursorAnchoredTooltip>
              );
            }

            return tileButton;
          })}
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
}

function GameTileArt({
  accent,
  art,
  dataTest,
  type,
}: {
  accent: string;
  art: FootballGameTileTheme['art'];
  dataTest: string;
  type: ExerciseType;
}) {
  if (art === 'forestCrossword') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M28 118 C70 72 119 118 168 62 C190 38 214 32 232 36" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.22" />
        <g data-test={`exercise_picker__art_forest_crossword__${type}`}>
          {[
            [32, 24, 'L'],
            [68, 24, 'E'],
            [104, 24, 'S'],
            [68, 60, 'A'],
            [68, 96, 'F'],
            [104, 60, 'Я'],
            [140, 60, 'Ñ'],
          ].map(([x, y, letter]) => (
            <g key={`${x}-${y}-${letter}`}>
              <rect x={Number(x)} y={Number(y)} width="32" height="32" rx="9" fill="#fffdf4" stroke={accent} strokeWidth="2.4" opacity="0.94" />
              <text x={Number(x) + 16} y={Number(y) + 23} textAnchor="middle" fontSize="17" fontWeight="900" fill="#203015">{letter}</text>
            </g>
          ))}
        </g>
        <path d="M174 34 C184 12 213 14 220 36 C207 52 184 56 174 34 Z" fill={accent} opacity="0.28" />
        <path d="M180 36 C192 32 204 28 216 20" stroke="#fffdf4" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
      </Box>
    );
  }

  if (art === 'forestChoice') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M24 96 C62 58 102 114 142 78 C172 50 198 64 224 42" fill="none" stroke={accent} strokeWidth="11" strokeLinecap="round" opacity="0.22" />
        {[
          [34, 32, '#ffffff', 'A'],
          [54, 70, '#eef9e8', 'B'],
          [74, 108, '#fff8d8', 'C'],
        ].map(([x, y, fill, letter]) => (
          <g key={`${x}-${y}-${letter}`}>
            <rect x={Number(x)} y={Number(y)} width="134" height="30" rx="11" fill={String(fill)} stroke={accent} strokeWidth="2" opacity="0.95" />
            <circle cx={Number(x) + 17} cy={Number(y) + 15} r="8" fill={accent} opacity="0.24" />
            <text x={Number(x) + 17} y={Number(y) + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill="#203015">{letter}</text>
            <path d={`M${Number(x) + 40} ${Number(y) + 15} H${Number(x) + 114}`} stroke="#203015" strokeWidth="4" strokeLinecap="round" opacity="0.18" />
          </g>
        ))}
        <g data-test={`exercise_picker__art_forest_choice__${type}`} transform="translate(190 38)">
          <path d="M0 26 C-8 -6 28 -16 36 12 C24 32 8 38 0 26 Z" fill={accent} opacity="0.32" />
          <path d="M6 24 C14 18 22 10 31 0" stroke="#fffdf4" strokeWidth="3" strokeLinecap="round" />
        </g>
      </Box>
    );
  }

  if (art === 'forestLetters') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M34 42 C70 18 104 24 132 50 C160 78 190 60 216 34" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" opacity="0.2" />
        {[
          [30, 62, 'm', true],
          [70, 62, '', false],
          [110, 62, 's', true],
          [150, 62, '', false],
          [190, 62, 's', true],
        ].map(([x, y, letter, filled]) => (
          <g key={`${x}-${letter}`}>
            <rect x={Number(x)} y={Number(y)} width="32" height="38" rx="10" fill={filled ? '#ffffff' : '#fff7df'} stroke={accent} strokeWidth="2.2" opacity="0.96" />
            {filled ? (
              <text x={Number(x) + 16} y={Number(y) + 27} textAnchor="middle" fontSize="20" fontWeight="900" fill="#203015">{letter}</text>
            ) : (
              <path d={`M${Number(x) + 9} ${Number(y) + 21} H${Number(x) + 23}`} stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
            )}
          </g>
        ))}
        <path data-test={`exercise_picker__art_forest_letters__${type}`} d="M184 28 C192 6 224 8 230 32 C214 48 192 50 184 28 Z" fill={accent} opacity="0.3" />
      </Box>
    );
  }

  if (art === 'forestPhrase') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M28 50 H126 M28 82 H90 M132 82 H212 M28 114 H188" stroke="#203015" strokeWidth="8" strokeLinecap="round" opacity="0.14" />
        <rect x="92" y="64" width="50" height="34" rx="11" fill="#fffdf4" stroke={accent} strokeWidth="2.5" opacity="0.95" />
        <path d="M104 81 H130" stroke={accent} strokeWidth="5" strokeLinecap="round" />
        <g data-test={`exercise_picker__art_forest_phrase__${type}`} transform="translate(174 42)">
          <path d="M-26 36 C-22 4 4 -10 30 4 C48 14 54 34 48 52 C22 44 -2 44 -26 36 Z" fill={accent} opacity="0.3" />
          <path d="M-4 40 H22 L28 82 H-10 Z" fill="#fff7df" stroke={accent} strokeWidth="3" opacity="0.8" />
          <circle cx="-2" cy="18" r="5" fill="#fffdf4" opacity="0.85" />
          <circle cx="22" cy="20" r="5" fill="#fffdf4" opacity="0.85" />
        </g>
      </Box>
    );
  }

  if (art === 'goal') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M24 120 C70 86 112 132 166 88 C196 64 214 70 238 52" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.22" />
        <g data-test={`exercise_picker__art_goal__${type}`} opacity="0.36">
          <rect x="154" y="34" width="62" height="42" rx="4" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M166 34v42M178 34v42M190 34v42M202 34v42M154 48h62M154 62h62" stroke={accent} strokeWidth="1.8" />
        </g>
        {[
          [28, 18, 'A'],
          [68, 18, 'Ñ'],
          [108, 18, 'Я'],
          [68, 58, 'B'],
          [108, 58, 'E'],
          [148, 58, 'S'],
          [108, 98, 'T'],
        ].map(([x, y, letter]) => (
          <g key={`${x}-${y}-${letter}`}>
            <rect x={Number(x)} y={Number(y)} width="34" height="34" rx="7" fill="#ffffff" stroke={accent} strokeWidth="2" opacity="0.92" />
            <text x={Number(x) + 17} y={Number(y) + 24} textAnchor="middle" fontSize="18" fontWeight="900" fill="#203015">{letter}</text>
          </g>
        ))}
        <circle cx="195" cy="30" r="18" fill={accent} opacity="0.16" />
        <path d="M183 33 L203 22 L210 30 L190 42 Z" fill={accent} opacity="0.32" />
      </Box>
    );
  }

  if (art === 'ball') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <g data-test={`exercise_picker__art_ball__${type}`} transform="translate(176 32)">
          <circle r="26" fill="#fffdf4" stroke={accent} strokeWidth="4" />
          <path d="M0-15 13-5 8 12H-8l-5-17Z" fill={accent} opacity="0.78" />
          <path d="M0-26v11M0 15v11M-25 0h12M13 0h12" stroke="#203015" strokeWidth="2" opacity="0.34" />
        </g>
        {[
          [30, 28, '#ffffff', 'A'],
          [48, 66, '#fdf0f4', 'B'],
          [66, 104, '#eef9e8', 'C'],
        ].map(([x, y, fill, letter]) => (
          <g key={`${x}-${y}-${letter}`}>
            <rect x={Number(x)} y={Number(y)} width="128" height="30" rx="9" fill={String(fill)} stroke={accent} strokeWidth="2" opacity="0.95" />
            <circle cx={Number(x) + 17} cy={Number(y) + 15} r="8" fill={accent} opacity="0.24" />
            <text x={Number(x) + 17} y={Number(y) + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill="#203015">{letter}</text>
            <path d={`M${Number(x) + 38} ${Number(y) + 15} H${Number(x) + 108}`} stroke="#203015" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
          </g>
        ))}
        <path d="M198 92 l8 13 15 2 -11 10 3 15 -15 -7 -14 7 3 -15 -11 -10 15 -2z" fill={accent} opacity="0.28" />
      </Box>
    );
  }

  if (art === 'worldCup2026') {
    return (
      <Box
        aria-hidden="true"
        component="svg"
        data-test={dataTest}
        focusable="false"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        sx={tileArtStyles}
      >
        <rect width="240" height="150" fill="transparent" />
        <path d="M34 42 C70 18 106 28 130 52 C154 76 190 62 214 36" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" opacity="0.18" />
        <circle
          cx="132"
          cy="32"
          data-test={`exercise_picker__art_wc2026__${type}`}
          fill="#ffffff"
          opacity="0.72"
          r="16"
        />
        <path
          d="M118 32 C124 25 140 25 146 32 C140 39 124 39 118 32Z"
          fill={accent}
          opacity="0.28"
        />
        <path
          d="M132 16 V48 M116 32 H148"
          stroke={accent}
          strokeLinecap="round"
          strokeWidth="3"
          opacity="0.22"
        />
        {[
          [30, 60, 'h', true],
          [70, 60, '', false],
          [110, 60, 'n', true],
          [150, 60, '', false],
          [190, 60, 'e', true],
        ].map(([x, y, letter, filled]) => (
          <g key={`${x}-${letter}`}>
            <rect x={Number(x)} y={Number(y)} width="32" height="38" rx="8" fill={filled ? '#ffffff' : '#fff7df'} stroke={accent} strokeWidth="2" opacity="0.96" />
            {filled ? (
              <text x={Number(x) + 16} y={Number(y) + 27} textAnchor="middle" fontSize="20" fontWeight="900" fill="#203015">{letter}</text>
            ) : (
              <path d={`M${Number(x) + 9} ${Number(y) + 21} H${Number(x) + 23}`} stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
            )}
          </g>
        ))}
        <circle cx="192" cy="32" r="14" fill={accent} opacity="0.24" />
        <path d="M192 21 V43 M181 32 H203" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.42" />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden="true"
      component="svg"
      data-test={dataTest}
      focusable="false"
      viewBox="0 0 240 150"
      preserveAspectRatio="none"
      sx={tileArtStyles}
    >
      <rect width="240" height="150" fill="transparent" />
      <path d="M30 46 H122 M30 78 H84 M140 78 H210 M30 110 H190" stroke="#203015" strokeWidth="8" strokeLinecap="round" opacity="0.16" />
      <rect x="88" y="58" width="48" height="34" rx="10" fill="#ffffff" stroke={accent} strokeWidth="2.5" opacity="0.95" />
      <path d="M100 75 H124" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <g data-test={`exercise_picker__art_goalkeeper__${type}`} transform="translate(174 42)" opacity="0.72">
        <circle cx="0" cy="-18" r="10" fill={accent} />
        <path d="M-6-8 10 8 2 34 -16 28Z" fill={accent} />
        <path d="M-10-2 -38-20M8 0 34-18M-8 28 -28 48M2 34 24 48" stroke={accent} strokeWidth="8" strokeLinecap="round" />
      </g>
      <path d="M152 34 C178 30 202 48 210 76 C218 104 190 124 160 114 C134 106 126 78 138 56 C142 46 146 39 152 34Z" fill={accent} opacity="0.18" />
      <path d="M166 58 H196 M156 78 H204 M166 98 H190" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    </Box>
  );
}

const tileArtStyles = {
  height: '100%',
  inset: 0,
  position: 'absolute',
  width: '100%',
};
