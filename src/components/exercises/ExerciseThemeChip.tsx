import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Box, Chip } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef } from 'react';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

type ExerciseThemeChipProps = {
  clickable?: boolean;
  dataTest: string;
  interfaceLanguage: SupportedLanguage;
  onClick?: ChipProps['onClick'];
  sx?: SxProps<Theme>;
  themeName: string;
} & Omit<ChipProps, 'clickable' | 'label' | 'onClick' | 'sx'>;

export const ExerciseThemeChip = forwardRef<
  HTMLDivElement,
  ExerciseThemeChipProps
>(function ExerciseThemeChip(
  {
    clickable = false,
    dataTest,
    interfaceLanguage,
    onClick,
    sx,
    themeName,
    ...chipProps
  },
  ref,
) {
  return (
    <Chip
      {...chipProps}
      clickable={clickable}
      data-test={dataTest}
      label={
        <Box
          component="span"
          data-test={`${dataTest}__label`}
          sx={{ alignItems: 'baseline', display: 'inline-flex' }}
        >
          <Box
            component="span"
            data-test={`${dataTest}__prefix`}
            sx={{
              fontSize: 11,
              fontWeight: 750,
              lineHeight: 1,
              opacity: 0.72,
              whiteSpace: 'pre',
            }}
          >
            {t(interfaceLanguage, 'themeChipPrefix')}:{' '}
          </Box>
          <Box
            component="span"
            data-test={`${dataTest}__name`}
            sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1 }}
          >
            {themeName}
          </Box>
        </Box>
      }
      onClick={onClick}
      ref={ref}
      sx={sx}
    />
  );
});

export function ExerciseProgressChip({
  completed,
  dataTest,
  interfaceLanguage,
  total,
}: {
  completed: number;
  dataTest: string;
  interfaceLanguage: SupportedLanguage;
  total: number;
}) {
  return (
    <Chip
      data-test={dataTest}
      label={
        <Box
          component="span"
          data-test={`${dataTest}__label`}
          sx={{ display: 'inline' }}
        >
          <Box
            component="span"
            data-test={`${dataTest}__completed`}
            sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1 }}
          >
            {completed}
          </Box>
          {' '}
          <Box
            component="span"
            data-test={`${dataTest}__completed_label`}
            sx={{ fontSize: 11, fontWeight: 750, lineHeight: 1 }}
          >
            {t(interfaceLanguage, 'metricCompletedSuffix')}
          </Box>
          {' '}
          <Box
            component="span"
            data-test={`${dataTest}__separator`}
            sx={{ fontSize: 12, fontWeight: 750, lineHeight: 1, opacity: 0.65 }}
          >
            /
          </Box>
          {' '}
          <Box
            component="span"
            data-test={`${dataTest}__total`}
            sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1 }}
          >
            {total}
          </Box>
          {' '}
          <Box
            component="span"
            data-test={`${dataTest}__total_label`}
            sx={{ fontSize: 11, fontWeight: 750, lineHeight: 1 }}
          >
            {t(interfaceLanguage, 'metricTotalSuffix')}
          </Box>
        </Box>
      }
      variant="outlined"
      sx={{
        bgcolor: 'transparent',
        borderColor: 'rgba(32, 48, 21, 0.52)',
        color: '#203015',
        fontWeight: 850,
        height: 30,
        ml: 1,
        '& .MuiChip-label': {
          px: 1.25,
        },
      }}
    />
  );
}

export function ExerciseRepeatChip({
  dataTest,
  interfaceLanguage,
}: {
  dataTest: string;
  interfaceLanguage: SupportedLanguage;
}) {
  return (
    <Chip
      data-test={dataTest}
      icon={
        <AutorenewIcon
          data-test={`${dataTest.replace('__repeat_chip__', '__repeat_icon__')}`}
          sx={{ fontSize: '16px !important' }}
        />
      }
      label={t(interfaceLanguage, 'repeatPrompt')}
      size="small"
      sx={{
        bgcolor: '#f3ecff',
        border: '1px solid #8f6be8',
        color: '#5e3fc0',
        fontSize: 12,
        fontWeight: 850,
        height: 28,
        letterSpacing: 0,
        textTransform: 'lowercase',
        '& .MuiChip-icon': {
          color: '#5e3fc0',
          ml: 0.75,
        },
        '& .MuiChip-label': {
          px: 0.85,
        },
      }}
      variant="outlined"
    />
  );
}
