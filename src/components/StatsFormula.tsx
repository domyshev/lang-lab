import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DragHandleRoundedIcon from '@mui/icons-material/DragHandleRounded';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

export function CountMetric({
  dataTestPrefix = 'count_metric',
  label,
  value,
}: {
  dataTestPrefix?: string;
  label: string;
  value: number;
}) {
  return (
    <Stack
      aria-label={`${label}: ${value}`}
      data-test={`${dataTestPrefix}__root`}
      direction="row"
      spacing={0.75}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ width: '100%' }}
    >
      <MetricLabel dataTest={`${dataTestPrefix}__label`}>{label}:</MetricLabel>
      <MetricChip
        ariaLabel={`${label} ${value}`}
        dataTest={`${dataTestPrefix}__value_chip`}
        label={value}
        tone="total"
      />
    </Stack>
  );
}

export function StatsFormula({
  correct,
  dataTestPrefix = 'stats_formula',
  incorrect,
  interfaceLanguage,
  showLabel = true,
  total,
  totalLabel,
}: {
  correct: number;
  dataTestPrefix?: string;
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
      data-test={`${dataTestPrefix}__root`}
      direction="row"
      spacing={0.75}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ width: '100%' }}
    >
      {showLabel && (
        <MetricLabel dataTest={`${dataTestPrefix}__label`}>
          {totalLabel}:
        </MetricLabel>
      )}
      <MetricChip
        ariaLabel={`${totalLabel}: ${total}`}
        dataTest={`${dataTestPrefix}__total_chip`}
        label={total}
        tone="total"
        tooltip={t(interfaceLanguage, 'totalAnsweredTooltip')}
      />
      <FormulaIcon dataTest={`${dataTestPrefix}__equals_icon`} label="=">
        <DragHandleRoundedIcon fontSize="inherit" />
      </FormulaIcon>
      <MetricChip
        ariaLabel={`${correctLabel}: ${correct}`}
        dataTest={`${dataTestPrefix}__correct_chip`}
        label={correct}
        tone="correct"
        tooltip={t(interfaceLanguage, 'correctAnsweredTooltip')}
      />
      <FormulaIcon dataTest={`${dataTestPrefix}__plus_icon`} label="+">
        <AddRoundedIcon fontSize="inherit" />
      </FormulaIcon>
      <MetricChip
        ariaLabel={`${incorrectLabel}: ${incorrect}`}
        dataTest={`${dataTestPrefix}__incorrect_chip`}
        label={incorrect}
        tone="incorrect"
        tooltip={t(interfaceLanguage, 'incorrectAnsweredTooltip')}
      />
    </Stack>
  );
}

function MetricLabel({
  children,
  dataTest,
}: {
  children: ReactNode;
  dataTest: string;
}) {
  return (
    <Typography
      component="span"
      data-test={dataTest}
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
  dataTest,
  label,
  tone,
  tooltip,
}: {
  ariaLabel: string;
  dataTest: string;
  label: number;
  tone: 'total' | 'correct' | 'incorrect';
  tooltip?: string;
}) {
  const chip = (
    <Chip
      aria-label={ariaLabel}
      data-test={dataTest}
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
  dataTest,
  label,
}: {
  children: ReactNode;
  dataTest: string;
  label: string;
}) {
  return (
    <Box
      aria-label={label}
      component="span"
      data-test={dataTest}
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
