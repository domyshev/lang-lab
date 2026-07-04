import { Box } from '@mui/material';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

const correctBackground = 'rgb(235, 247, 225)';
const incorrectBackground = 'rgb(253, 235, 238)';

export function SplitWordStatsChip({
  correct,
  incorrect,
  interfaceLanguage,
  statsLabel,
}: {
  correct: number;
  incorrect: number;
  interfaceLanguage: SupportedLanguage;
  statsLabel?: string;
}) {
  const correctLabel = t(interfaceLanguage, 'correct');
  const incorrectLabel = t(interfaceLanguage, 'incorrect');
  const label = statsLabel ?? t(interfaceLanguage, 'wordStats');

  return (
    <Box
      aria-label={`${label}: ${correctLabel} ${correct}, ${incorrectLabel} ${incorrect}`}
      role="group"
      sx={{
        alignItems: 'stretch',
        border: '1px solid rgba(32, 48, 21, 0.18)',
        borderRadius: 1,
        display: 'inline-flex',
        height: 38,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: correctBackground,
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
          color: '#203015',
          display: 'inline-flex',
          fontSize: 17,
          fontWeight: 900,
          minWidth: 92,
          pl: 1.5,
          pr: 2.25,
        }}
      >
        {correctLabel}: {correct}
      </Box>
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: incorrectBackground,
          clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)',
          color: '#4a111b',
          display: 'inline-flex',
          fontSize: 17,
          fontWeight: 900,
          ml: -1.25,
          minWidth: 112,
          pl: 2.25,
          pr: 1.5,
        }}
      >
        {incorrectLabel}: {incorrect}
      </Box>
    </Box>
  );
}
