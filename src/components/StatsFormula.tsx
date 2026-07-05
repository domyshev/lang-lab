import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DragHandleRoundedIcon from '@mui/icons-material/DragHandleRounded';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

export function CountMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Stack
      aria-label={`${label}: ${value}`}
      direction="row"
      spacing={0.75}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ width: '100%' }}
    >
      <MetricLabel>{label}:</MetricLabel>
      <MetricChip ariaLabel={`${label} ${value}`} label={value} tone="total" />
    </Stack>
  );
}

export function StatsFormula({
  correct,
  incorrect,
  interfaceLanguage,
  showLabel = true,
  total,
  totalLabel,
}: {
  correct: number;
  incorrect: number;
  interfaceLanguage: SupportedLanguage;
  showLabel?: boolean;
  total: number;
  totalLabel: string;
}) {
  const correctLabel = t(interfaceLanguage, 'correct');
  const incorrectLabel = t(interfaceLanguage, 'incorrect');

  return (
    <Stack
      aria-label={`${totalLabel}: ${total} = ${correct} + ${incorrect}`}
      direction="row"
      spacing={0.75}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ width: '100%' }}
    >
      {showLabel && <MetricLabel>{totalLabel}:</MetricLabel>}
      <MetricChip
        ariaLabel={`${totalLabel}: ${total}`}
        label={total}
        tone="total"
        tooltip={t(interfaceLanguage, 'totalAnsweredTooltip')}
      />
      <FormulaIcon label="=">
        <DragHandleRoundedIcon fontSize="inherit" />
      </FormulaIcon>
      <MetricChip
        ariaLabel={`${correctLabel}: ${correct}`}
        label={correct}
        tone="correct"
        tooltip={t(interfaceLanguage, 'correctAnsweredTooltip')}
      />
      <FormulaIcon label="+">
        <AddRoundedIcon fontSize="inherit" />
      </FormulaIcon>
      <MetricChip
        ariaLabel={`${incorrectLabel}: ${incorrect}`}
        label={incorrect}
        tone="incorrect"
        tooltip={t(interfaceLanguage, 'incorrectAnsweredTooltip')}
      />
    </Stack>
  );
}

function MetricLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="span"
      sx={{
        color: '#203015',
        fontSize: 16,
        fontWeight: 800,
        lineHeight: '38px',
      }}
    >
      {children}
    </Typography>
  );
}

function MetricChip({
  ariaLabel,
  label,
  tone,
  tooltip,
}: {
  ariaLabel: string;
  label: number;
  tone: 'total' | 'correct' | 'incorrect';
  tooltip?: string;
}) {
  const chip = (
    <Chip
      aria-label={ariaLabel}
      label={label}
      variant="outlined"
      sx={
        tone === 'correct'
          ? correctChipStyles
          : tone === 'incorrect'
            ? incorrectChipStyles
            : totalChipStyles
      }
    />
  );

  return tooltip ? <Tooltip title={tooltip}>{chip}</Tooltip> : chip;
}

function FormulaIcon({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Box
      aria-label={label}
      component="span"
      sx={{
        alignItems: 'center',
        alignSelf: 'center',
        color: 'text.secondary',
        display: 'inline-flex',
        fontSize: 18,
        height: 38,
        justifyContent: 'center',
        width: 24,
      }}
    >
      {children}
    </Box>
  );
}

const formulaChipBaseStyles = {
  borderRadius: 1,
  fontSize: 16,
  fontWeight: 900,
  height: 38,
  minWidth: 42,
  '& .MuiChip-label': {
    px: 1.35,
  },
};

const totalChipStyles = {
  ...formulaChipBaseStyles,
  borderColor: '#203015',
  color: '#203015',
};

const correctChipStyles = {
  ...formulaChipBaseStyles,
  bgcolor: 'rgb(235, 247, 225)',
  borderColor: '#8fc773',
  color: '#111111',
};

const incorrectChipStyles = {
  ...formulaChipBaseStyles,
  bgcolor: 'rgb(253, 235, 238)',
  borderColor: '#f2a7b4',
  color: '#111111',
};
