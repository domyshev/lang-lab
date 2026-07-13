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
      data-test="app_logo__button"
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
        flexShrink: 0,
        font: 'inherit',
        gap: 1,
        height: 52,
        lineHeight: 1,
        m: 0,
        minHeight: 52,
        minWidth: 250,
        overflow: 'hidden',
        pl: 1,
        pr: '35px',
        py: 0,
        position: 'relative',
        alignSelf: 'center',
        mt: 0,
        textAlign: 'left',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        '&:focus-visible': {
          outline: '3px solid rgba(32, 48, 21, 0.32)',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        aria-hidden="true"
        data-test="app_logo__legacy_leaf_hidden"
        sx={{
          bgcolor: 'rgba(156, 202, 86, 0.22)',
          borderBottomLeftRadius: '999px',
          borderBottomRightRadius: '999px',
          borderTopLeftRadius: 0,
          borderTopRightRadius: '999px',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 18% 100%)',
          display: 'none',
          height: 12,
          position: 'absolute',
          right: -8,
          top: -3,
          width: 58,
          zIndex: 0,
        }}
      />
      <Box
        component="svg"
        aria-hidden="true"
        data-test="app_logo__football_flag_svg"
        viewBox="0 0 72 32"
        sx={{
          display: 'block',
          height: 18,
          position: 'absolute',
          right: -5,
          top: 0,
          width: 44,
          zIndex: 0,
        }}
      >
        <path
          data-test="app_logo__football_flag_shadow"
          d="M4 5h55c6 0 10 5 10 11s-4 11-10 11H4Z"
          fill="rgba(124, 21, 24, 0.12)"
        />
        <clipPath id="app-logo-spain-flag">
          <path d="M4 4h56c6 0 10 5 10 12s-4 12-10 12H4Z" />
        </clipPath>
        <g clipPath="url(#app-logo-spain-flag)">
          <rect data-test="app_logo__flag_red_top" width="72" height="9" fill="#c60b1e" />
          <rect data-test="app_logo__flag_yellow" y="9" width="72" height="14" fill="#ffc400" />
          <rect data-test="app_logo__flag_red_bottom" y="23" width="72" height="9" fill="#c60b1e" />
        </g>
        <path
          d="M4 4h56c6 0 10 5 10 12s-4 12-10 12H4Z"
          fill="none"
          stroke="rgba(124, 21, 24, 0.28)"
          strokeWidth="1.4"
        />
        <circle
          data-test="app_logo__football_ball"
          cx="18"
          cy="16"
          r="7"
          fill="#fffdf4"
          stroke="#203015"
          strokeWidth="1.5"
        />
        <path
          d="M18 9v14M11 16h14M13 11l10 10M23 11 13 21"
          stroke="#203015"
          strokeWidth="0.9"
          opacity="0.48"
        />
      </Box>
      <Box
        aria-hidden="true"
        data-test="app_logo__letter_tile_grid"
        sx={{
          alignItems: 'center',
          bgcolor: '#ffffff',
          border: '1px solid rgba(32, 48, 21, 0.18)',
          borderRadius: 1.5,
          display: 'grid',
          gap: 0.25,
          gridTemplateColumns: 'repeat(2, 18px)',
          p: 0.4,
          position: 'relative',
          transform: 'rotate(-3deg)',
          zIndex: 1,
        }}
      >
        {logoLetters.map((item) => (
          <Box
            key={item.value}
            component="span"
            data-test={`app_logo__letter_tile__${item.testKey}`}
            sx={{
              alignItems: 'center',
              bgcolor: item.value === 'Я' ? '#dcefb1' : '#f0f7d7',
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
            {item.value}
          </Box>
        ))}
      </Box>
      <Typography
        component="span"
        data-test="app_logo__text"
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

const logoLetters = [
  { testKey: 'a', value: 'A' },
  { testKey: 'n_tilde', value: 'Ñ' },
  { testKey: 'ya', value: 'Я' },
  { testKey: 'b', value: 'B' },
];
