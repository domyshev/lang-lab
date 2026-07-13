import { Chip, Stack, Typography } from '@mui/material';
import type { SupportedLanguage } from '../../domain/languages';
import { footballResultColors } from '../../domain/footballTheme';
import { t } from '../../domain/i18n';
import type { WorldResultColors } from '../../domain/worlds';
import { CursorAnchoredTooltip } from '../CursorAnchoredTooltip';

export type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

export function RecentAnswersChip({
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  resultColors = footballResultColors,
  subject,
}: {
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: RecentCardResult[];
  resultColors?: WorldResultColors;
  subject: string;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTestPrefix}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      transitionTimeout={0}
      tooltipSx={recentAnswersTooltipStyles}
      title={
        <Stack data-test={`${dataTestPrefix}__recent_tooltip`} spacing={0.75}>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_title`}
            sx={{ color: '#203015', fontSize: 14, fontWeight: 850 }}
          >
            {t(interfaceLanguage, 'recentAnswersTitle')}
          </Typography>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_subject`}
            sx={{
              color: 'rgba(32, 48, 21, 0.68)',
              fontSize: 11,
              fontWeight: 750,
              lineHeight: 1.25,
            }}
          >
            {subject}
          </Typography>
          <Stack data-test={`${dataTestPrefix}__recent_results`} spacing={0.5}>
            {recentResults.slice(0, 10).map((result, index) => (
              <Stack
                data-test={`${dataTestPrefix}__recent_result__${index}`}
                direction="row"
                key={`${result.occurredAt}-${index}`}
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Chip
                  data-test={`${dataTestPrefix}__recent_result_chip__${index}`}
                  label={t(
                    interfaceLanguage,
                    result.isCorrect
                      ? 'metricCorrectSuffix'
                      : 'metricIncorrectSuffix',
                  )}
                  size="small"
                  sx={{
                    bgcolor: result.isCorrect
                      ? resultColors.correct.soft
                      : resultColors.incorrect.soft,
                    border: '1px solid',
                    borderColor: result.isCorrect
                      ? resultColors.correct.border
                      : resultColors.incorrect.border,
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 24,
                  }}
                />
                <Typography
                  data-test={`${dataTestPrefix}__recent_result_date__${index}`}
                  sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}
                >
                  {formatAttemptDate(result.occurredAt)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      }
    >
      <Chip
        component="button"
        data-test={`${dataTestPrefix}__recent_stats_chip`}
        label={t(interfaceLanguage, 'recentAnswerStatsChip')}
        size="small"
        type="button"
        variant="outlined"
        sx={{
          alignSelf: 'flex-start',
          bgcolor: 'rgba(123, 95, 196, 0.06)',
          borderColor: 'rgba(123, 95, 196, 0.34)',
          color: '#4b3a70',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 800,
          height: 28,
          '&:focus-visible': {
            outline: '3px solid #111111',
            outlineOffset: 2,
          },
        }}
      />
    </CursorAnchoredTooltip>
  );
}

export function formatAttemptDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    `${padDatePart(date.getMonth() + 1)}/${padDatePart(
      date.getDate(),
    )}/${date.getFullYear()}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  ].join(' ');
}

const recentAnswersTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  p: 1.25,
};

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}
