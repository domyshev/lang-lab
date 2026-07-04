import { Box, Typography } from '@mui/material';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

export function AppLogo({
  interfaceLanguage,
  onClick,
}: {
  interfaceLanguage: SupportedLanguage;
  onClick?: () => void;
}) {
  return (
    <Box
      aria-label={t(interfaceLanguage, 'appName')}
      component="button"
      onClick={onClick}
      type="button"
      sx={{
        alignItems: 'center',
        appearance: 'none',
        bgcolor: '#f7ffe5',
        border: '1px solid rgba(32, 48, 21, 0.16)',
        borderRadius: 2,
        boxShadow: '0 8px 18px rgba(32, 48, 21, 0.08)',
        cursor: 'pointer',
        display: 'inline-flex',
        font: 'inherit',
        gap: 1,
        lineHeight: 1,
        m: 0,
        overflow: 'hidden',
        px: 1,
        py: 0.65,
        position: 'relative',
        textAlign: 'left',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        '&:focus-visible': {
          outline: '3px solid rgba(32, 48, 21, 0.32)',
          outlineOffset: 2,
        },
        '&::after': {
          bgcolor: 'rgba(156, 202, 86, 0.22)',
          borderRadius: '999px',
          content: '""',
          height: 16,
          position: 'absolute',
          right: -8,
          top: -3,
          width: 54,
        },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          alignItems: 'center',
          bgcolor: '#ffffff',
          border: '1px solid rgba(32, 48, 21, 0.18)',
          borderRadius: 1.5,
          display: 'grid',
          gap: 0.25,
          gridTemplateColumns: 'repeat(2, 18px)',
          p: 0.4,
          transform: 'rotate(-3deg)',
        }}
      >
        {['A', 'Ñ', 'Я', 'B'].map((letter) => (
          <Box
            key={letter}
            component="span"
            sx={{
              alignItems: 'center',
              bgcolor: letter === 'Я' ? '#dcefb1' : '#f0f7d7',
              borderRadius: 0.75,
              color: '#203015',
              display: 'inline-flex',
              fontSize: 12,
              fontWeight: 900,
              height: 18,
              justifyContent: 'center',
              width: 18,
            }}
          >
            {letter}
          </Box>
        ))}
      </Box>
      <Typography
        component="span"
        sx={{
          color: '#203015',
          fontSize: { xs: 22, md: 24 },
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
