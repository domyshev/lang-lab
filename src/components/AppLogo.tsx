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
        font: 'inherit',
        gap: 1,
        height: 52,
        lineHeight: 1,
        m: 0,
        minHeight: 52,
        overflow: 'hidden',
        px: 1,
        py: 0,
        position: 'relative',
        alignSelf: 'center',
        mt: { xs: 2.5, md: 0 },
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
        data-test="app_logo__tree_leaf_svg"
        viewBox="0 0 64 28"
        sx={{
          display: 'block',
          height: 17.6,
          position: 'absolute',
          right: -8,
          top: 3,
          width: 44.8,
          zIndex: 0,
        }}
      >
        <path
          data-test="app_logo__tree_leaf_shape"
          d="M 4 15 C 21 0, 43 0, 60 14 C 44 30, 21 29, 4 15 Z"
          fill="rgba(156, 202, 86, 0.30)"
          stroke="rgba(96, 132, 46, 0.26)"
          strokeWidth="1.4"
        />
        <path
          data-test="app_logo__tree_leaf_main_vein"
          d="M 8 15 C 23 12, 39 11, 58 14"
          fill="none"
          stroke="rgba(69, 98, 31, 0.34)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          data-test="app_logo__tree_leaf_vein_top_left"
          d="M 25 12 C 22 9, 20 7, 17 5"
          fill="none"
          stroke="rgba(69, 98, 31, 0.20)"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          data-test="app_logo__tree_leaf_vein_bottom_left"
          d="M 31 12 C 28 16, 25 19, 21 22"
          fill="none"
          stroke="rgba(69, 98, 31, 0.20)"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          data-test="app_logo__tree_leaf_vein_top_right"
          d="M 40 12 C 37 9, 34 6, 30 4"
          fill="none"
          stroke="rgba(69, 98, 31, 0.18)"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          data-test="app_logo__tree_leaf_vein_bottom_right"
          d="M 46 13 C 42 17, 38 20, 34 23"
          fill="none"
          stroke="rgba(69, 98, 31, 0.18)"
          strokeLinecap="round"
          strokeWidth="1"
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
