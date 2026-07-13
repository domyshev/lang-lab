import { Box } from '@mui/material';
import { footballResultColors } from '../domain/footballTheme';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';
import type { WorldResultColors } from '../domain/worlds';

export function SplitWordStatsChip({
  correct,
  dataTestPrefix = 'split_word_stats_chip',
  incorrect,
  interfaceLanguage,
  resultColors = footballResultColors,
  size = 'default',
  statsLabel,
}: {
  correct: number;
  dataTestPrefix?: string;
  incorrect: number;
  interfaceLanguage: SupportedLanguage;
  resultColors?: WorldResultColors;
  size?: 'default' | 'compact';
  statsLabel?: string;
}) {
  const correctLabel = t(interfaceLanguage, 'correct');
  const incorrectLabel = t(interfaceLanguage, 'incorrect');
  const label = statsLabel ?? t(interfaceLanguage, 'wordStats');
  const isCompact = size === 'compact';

  return (
    <Box
      aria-label={`${label}: ${correctLabel} ${correct}, ${incorrectLabel} ${incorrect}`}
      data-test={`${dataTestPrefix}__root`}
      role="group"
      sx={{
        alignItems: 'stretch',
        border: '1px solid rgba(32, 48, 21, 0.18)',
        borderRadius: 1,
        display: 'inline-flex',
        alignSelf: 'flex-start',
        height: isCompact ? 30 : 38,
        maxWidth: '100%',
        overflow: 'hidden',
        width: 'fit-content',
      }}
    >
      <Box
        data-test={`${dataTestPrefix}__correct_segment`}
        sx={{
          alignItems: 'center',
          bgcolor: resultColors.correct.soft,
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
          color: '#203015',
          display: 'inline-flex',
          fontSize: isCompact ? 13 : 17,
          fontWeight: 900,
          minWidth: isCompact ? 70 : 92,
          pl: isCompact ? 1 : 1.5,
          pr: isCompact ? 1.75 : 2.25,
        }}
      >
        {correctLabel}: {correct}
      </Box>
      <Box
        data-test={`${dataTestPrefix}__incorrect_segment`}
        sx={{
          alignItems: 'center',
          bgcolor: resultColors.incorrect.soft,
          clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)',
          color: resultColors.incorrect.text,
          display: 'inline-flex',
          fontSize: isCompact ? 13 : 17,
          fontWeight: 900,
          ml: -1.25,
          minWidth: isCompact ? 82 : 112,
          pl: isCompact ? 1.75 : 2.25,
          pr: isCompact ? 1 : 1.5,
        }}
      >
        {incorrectLabel}: {incorrect}
      </Box>
    </Box>
  );
}
