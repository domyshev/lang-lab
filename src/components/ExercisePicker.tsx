import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { ExerciseType } from '../domain/exercises';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import {
  GameWarningTooltipContent,
  gameWarningTooltipStyles,
} from './GameWarningTooltip';

const exerciseOptions: Array<{
  type: ExerciseType;
  labelKey: Parameters<typeof t>[1];
  accent: string;
  background: string;
}> = [
  {
    type: 'crossword',
    labelKey: 'crossword',
    accent: '#c60b1e',
    background:
      'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.64) 0 12%, transparent 13%), radial-gradient(circle at 78% 20%, rgba(255,196,0,0.40) 0 15%, transparent 16%), linear-gradient(135deg, #ffc400 0%, #ff7a36 42%, #c60b1e 100%)',
  },
  {
    type: 'multipleChoice',
    labelKey: 'multipleChoice',
    accent: '#7c1518',
    background:
      'radial-gradient(circle at 80% 18%, rgba(255,255,255,0.58) 0 13%, transparent 14%), radial-gradient(circle at 14% 82%, rgba(255,196,0,0.34) 0 13%, transparent 14%), linear-gradient(135deg, #ffe15d 0%, #ff9d2e 46%, #c60b1e 100%)',
  },
  {
    type: 'missingLetters',
    labelKey: 'missingLetters',
    accent: '#f4b000',
    background:
      'radial-gradient(circle at 20% 76%, rgba(255,255,255,0.55) 0 11%, transparent 12%), radial-gradient(circle at 78% 28%, rgba(198,11,30,0.20) 0 13%, transparent 14%), linear-gradient(135deg, #fff06a 0%, #ffc400 44%, #f15b3a 100%)',
  },
  {
    type: 'missingWord',
    labelKey: 'missingWord',
    accent: '#c60b1e',
    background:
      'radial-gradient(circle at 78% 76%, rgba(255,255,255,0.56) 0 12%, transparent 13%), radial-gradient(circle at 22% 18%, rgba(198,11,30,0.20) 0 15%, transparent 16%), linear-gradient(135deg, #fff1a8 0%, #ffc400 45%, #d9272f 100%)',
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
            const tileAccent = isDisabled ? disabledTileAccent : option.accent;
            const tileBackground = isDisabled
              ? disabledTileBackground
              : option.background;
            const tileButton = (
              <ToggleButton
                aria-label={optionLabel}
                data-test={`exercise_picker__option__${option.type}`}
                disabled={isDisabled}
                key={option.type}
                style={{ backgroundImage: tileBackground }}
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
                    borderColor: tileAccent,
                    boxShadow: `0 0 0 2px ${tileAccent}33`,
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
                <GameTileArt
                  accent={tileAccent}
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
  dataTest,
  type,
}: {
  accent: string;
  dataTest: string;
  type: ExerciseType;
}) {
  if (type === 'crossword') {
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

  if (type === 'multipleChoice') {
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
        <circle cx="188" cy="34" r="30" fill={accent} opacity="0.14" />
        <text x="188" y="45" textAnchor="middle" fontSize="42" fontWeight="900" fill={accent} opacity="0.5">?</text>
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

  if (type === 'missingLetters') {
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
