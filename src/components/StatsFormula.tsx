import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DragHandleRoundedIcon from '@mui/icons-material/DragHandleRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { footballResultColors } from '../domain/footballTheme';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';
import type { WorldResultColors } from '../domain/worlds';
import { CursorAnchoredTooltip, TooltipContent } from './CursorAnchoredTooltip';

export function CountMetric({
  dataTestPrefix = 'count_metric',
  inline = false,
  label,
  suffix,
  tooltip,
  value,
}: {
  dataTestPrefix?: string;
  inline?: boolean;
  label: string;
  suffix?: string;
  tooltip?: string;
  value: number;
}) {
  return (
    <Stack
      aria-label={`${label}: ${value}`}
      data-test={`${dataTestPrefix}__root`}
      sx={inline ? inlineMetricStyles : metricGridStyles}
    >
      <MetricLabel dataTest={`${dataTestPrefix}__label`}>{label}:</MetricLabel>
      <Box data-test={`${dataTestPrefix}__value_group`}>
        <MetricChip
          ariaLabel={`${label} ${value}`}
          dataTest={`${dataTestPrefix}__value_chip`}
          label={value}
          suffix={suffix}
          tone="total"
          tooltip={tooltip}
        />
      </Box>
    </Stack>
  );
}

export function StatsFormula({
  correct,
  correctTooltip,
  dataTestPrefix = 'stats_formula',
  incorrect,
  incorrectTooltip,
  inline = false,
  interfaceLanguage,
  labelDisplay,
  rootDataTest,
  resultColors = footballResultColors,
  resultDisplay = 'chips',
  totalDisplay = 'chip',
  totalTooltip,
  valueGroupJustify = 'flex-start',
  showLabel = true,
  total,
  totalLabel,
}: {
  correct: number;
  correctTooltip?: string;
  dataTestPrefix?: string;
  incorrect: number;
  incorrectTooltip?: string;
  inline?: boolean;
  interfaceLanguage: SupportedLanguage;
  labelDisplay?: ReactNode;
  rootDataTest?: string;
  resultColors?: WorldResultColors;
  resultDisplay?: 'chips' | 'text';
  totalDisplay?: 'chip' | 'plain' | 'plainWithSuffix';
  totalTooltip?: string;
  valueGroupJustify?: 'center' | 'flex-start';
  showLabel?: boolean;
  total: number;
  totalLabel: string;
}) {
  const correctLabel = t(interfaceLanguage, 'correct');
  const incorrectLabel = t(interfaceLanguage, 'incorrect');
  const hasCorrect = correct > 0;
  const hasIncorrect = incorrect > 0;
  const resultParts = [
    hasCorrect ? `${correctLabel} ${correct}` : undefined,
    hasIncorrect ? `${incorrectLabel} ${incorrect}` : undefined,
  ].filter((part): part is string => Boolean(part));
  const ariaLabel =
    resultParts.length > 0
      ? `${totalLabel}: ${total} = ${resultParts.join(' + ')}`
      : `${totalLabel}: ${total}`;

  return (
    <Stack
      aria-label={ariaLabel}
      data-test={rootDataTest ?? `${dataTestPrefix}__root`}
      sx={
        showLabel
          ? inline
            ? inlineMetricStyles
            : metricGridStyles
          : formulaRowStyles
      }
    >
      {showLabel && (
        <MetricLabel dataTest={`${dataTestPrefix}__label`}>
          {labelDisplay ?? `${totalLabel}:`}
        </MetricLabel>
      )}
      <Stack
        data-test={`${dataTestPrefix}__value_group`}
        direction={resultDisplay === 'text' ? 'column' : 'row'}
        spacing={0.75}
        alignItems={resultDisplay === 'text' ? 'flex-start' : 'center'}
        flexWrap="wrap"
        useFlexGap
        sx={{ justifyContent: valueGroupJustify }}
      >
        {totalDisplay === 'plain' || totalDisplay === 'plainWithSuffix' ? (
          <MetricPlainValue
            ariaLabel={`${totalLabel}: ${total}`}
            dataTest={`${dataTestPrefix}__total_value`}
            label={total}
            suffix={
              totalDisplay === 'plainWithSuffix'
                ? t(interfaceLanguage, 'metricAnsweredSuffix')
                : undefined
            }
            tooltip={totalTooltip ?? t(interfaceLanguage, 'totalAnsweredTooltip')}
          />
        ) : (
          <MetricChip
            ariaLabel={`${totalLabel}: ${total}`}
            dataTest={`${dataTestPrefix}__total_chip`}
            label={total}
            suffix={t(interfaceLanguage, 'metricAnsweredSuffix')}
            tone="total"
            tooltip={totalTooltip ?? t(interfaceLanguage, 'totalAnsweredTooltip')}
          />
        )}
        {resultDisplay === 'text' ? (
          <FormulaTextBreakdown
            correct={correct}
            dataTestPrefix={dataTestPrefix}
            incorrect={incorrect}
            interfaceLanguage={interfaceLanguage}
            resultColors={resultColors}
          />
        ) : (
          <>
            {resultParts.length > 0 && (
              <FormulaIcon dataTest={`${dataTestPrefix}__equals_icon`} label="=">
                <DragHandleRoundedIcon fontSize="inherit" />
              </FormulaIcon>
            )}
            {hasCorrect && (
              <MetricChip
                ariaLabel={`${correctLabel}: ${correct}`}
                dataTest={`${dataTestPrefix}__correct_chip`}
                label={correct}
                resultColors={resultColors}
                suffix={t(interfaceLanguage, 'metricCorrectSuffix')}
                tone="correct"
                tooltip={correctTooltip ?? t(interfaceLanguage, 'correctAnsweredTooltip')}
              />
            )}
            {hasCorrect && hasIncorrect && (
              <FormulaIcon dataTest={`${dataTestPrefix}__plus_icon`} label="+">
                <AddRoundedIcon fontSize="inherit" />
              </FormulaIcon>
            )}
            {hasIncorrect && (
              <MetricChip
                ariaLabel={`${incorrectLabel}: ${incorrect}`}
                dataTest={`${dataTestPrefix}__incorrect_chip`}
                label={incorrect}
                resultColors={resultColors}
                suffix={t(interfaceLanguage, 'metricIncorrectSuffix')}
                tone="incorrect"
                tooltip={incorrectTooltip ?? t(interfaceLanguage, 'incorrectAnsweredTooltip')}
              />
            )}
          </>
        )}
      </Stack>
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
        lineHeight: 1.25,
      }}
    >
      {children}
    </Typography>
  );
}

export function MetricChip({
  ariaLabel,
  dataTest,
  label,
  resultColors = footballResultColors,
  suffix,
  tone,
  tooltip,
}: {
  ariaLabel: string;
  dataTest: string;
  label: number;
  resultColors?: WorldResultColors;
  suffix?: string;
  tone: 'total' | 'correct' | 'incorrect';
  tooltip?: string;
}) {
  const chip = (
    <Chip
      aria-label={ariaLabel}
      data-test={dataTest}
      label={
        <Box
          component="span"
          data-test={`${dataTest}__label`}
          sx={{
            alignItems: 'baseline',
            display: 'inline-flex',
          }}
        >
          <Box
            component="span"
            data-test={`${dataTest}__number`}
            sx={{ fontSize: 13, lineHeight: 1 }}
          >
            {label}
          </Box>
          {suffix && (
            <Box
              component="span"
              data-test={`${dataTest}__suffix`}
              sx={{
                fontSize: 10,
                fontWeight: 800,
                lineHeight: 1,
                ml: 0.5,
                textTransform: 'lowercase',
              }}
            >
              {` ${suffix}`}
            </Box>
          )}
        </Box>
      }
      variant="outlined"
      sx={
        tone === 'correct'
          ? getCorrectChipStyles(resultColors)
          : tone === 'incorrect'
            ? getIncorrectChipStyles(resultColors)
            : totalChipStyles
      }
    />
  );

  return tooltip ? (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTest}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      title={
        <TooltipContent sx={metricTooltipContentStyles}>
          {tooltip}
        </TooltipContent>
      }
      transitionTimeout={0}
      tooltipSx={metricTooltipStyles}
    >
      {chip}
    </CursorAnchoredTooltip>
  ) : (
    chip
  );
}

export function MetricPlainValue({
  ariaLabel,
  dataTest,
  label,
  suffix,
  tooltip,
}: {
  ariaLabel: string;
  dataTest: string;
  label: number;
  suffix?: string;
  tooltip?: string;
}) {
  const value = (
    <Typography
      aria-label={ariaLabel}
      component="span"
      data-test={dataTest}
      sx={{
        color: '#203015',
        cursor: tooltip ? 'help' : 'default',
        display: 'inline-flex',
        fontSize: 42,
        fontWeight: 950,
        letterSpacing: 0,
        lineHeight: 0.95,
      }}
    >
      <Box
        component="span"
        data-test={`${dataTest}__label`}
        sx={{
          alignItems: 'baseline',
          display: 'inline-flex',
          gap: suffix ? 0.65 : 0,
        }}
      >
        <Box
          component="span"
          data-test={`${dataTest}__number`}
          sx={{ fontSize: 42, lineHeight: 0.95 }}
        >
          {label}
        </Box>
        {suffix && (
          <Box
            component="span"
            data-test={`${dataTest}__suffix`}
            sx={{
              fontSize: 16,
              fontWeight: 900,
              lineHeight: 1,
              textTransform: 'lowercase',
            }}
          >
            {` ${suffix}`}
          </Box>
        )}
      </Box>
    </Typography>
  );

  return tooltip ? (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTest}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      title={
        <TooltipContent sx={metricTooltipContentStyles}>
          {tooltip}
        </TooltipContent>
      }
      transitionTimeout={0}
      tooltipSx={metricTooltipStyles}
    >
      {value}
    </CursorAnchoredTooltip>
  ) : (
    value
  );
}

function FormulaTextBreakdown({
  correct,
  dataTestPrefix,
  incorrect,
  interfaceLanguage,
  resultColors,
}: {
  correct: number;
  dataTestPrefix: string;
  incorrect: number;
  interfaceLanguage: SupportedLanguage;
  resultColors: WorldResultColors;
}) {
  if (correct <= 0 && incorrect <= 0) {
    return null;
  }

  return (
    <Typography
      data-test={`${dataTestPrefix}__breakdown`}
      sx={{
        color: '#203015',
        fontSize: 16,
        fontWeight: 850,
        lineHeight: 1.25,
      }}
    >
      {correct > 0 && (
        <Box
          component="span"
          data-test={`${dataTestPrefix}__correct_text`}
          sx={{ color: resultColors.correct.border }}
        >
          {correct} {t(interfaceLanguage, 'metricCorrectSuffix')}
        </Box>
      )}
      {correct > 0 && incorrect > 0 ? (
        <Box
          component="span"
          data-test={`${dataTestPrefix}__plus_text`}
          sx={{ color: 'rgba(32, 48, 21, 0.62)' }}
        >
          {' + '}
        </Box>
      ) : null}
      {incorrect > 0 && (
        <Box
          component="span"
          data-test={`${dataTestPrefix}__incorrect_text`}
          sx={{ color: resultColors.incorrect.border }}
        >
          {incorrect} {t(interfaceLanguage, 'metricIncorrectSuffix')}
        </Box>
      )}
    </Typography>
  );
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
    alignItems: 'baseline',
    display: 'inline-flex',
    px: 1.35,
  },
};

const metricGridStyles = {
  alignItems: 'center',
  columnGap: 0.75,
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 1fr)',
  rowGap: 0.75,
  width: '100%',
};

const inlineMetricStyles = {
  alignItems: 'center',
  display: 'inline-flex',
  flexWrap: 'wrap',
  gap: 0.75,
  width: 'auto',
};

const formulaRowStyles = {
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 0.75,
  width: '100%',
};

const totalChipStyles = {
  ...formulaChipBaseStyles,
  borderColor: '#203015',
  color: '#203015',
};

function getCorrectChipStyles(resultColors: WorldResultColors) {
  return {
    ...formulaChipBaseStyles,
    bgcolor: resultColors.correct.soft,
    borderColor: resultColors.correct.border,
    color: '#111111',
  };
}

function getIncorrectChipStyles(resultColors: WorldResultColors) {
  return {
    ...formulaChipBaseStyles,
    bgcolor: resultColors.incorrect.soft,
    borderColor: resultColors.incorrect.border,
    color: '#111111',
  };
}

const metricTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.16)',
  boxShadow: '0 10px 24px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  fontSize: 14,
  lineHeight: 1.35,
  maxWidth: 280,
  px: 1.25,
  py: 1,
};

const metricTooltipContentStyles = {
  bgcolor: '#ffffff',
  color: '#203015',
  display: 'inline-block',
  fontSize: 14,
  lineHeight: 1.35,
};
