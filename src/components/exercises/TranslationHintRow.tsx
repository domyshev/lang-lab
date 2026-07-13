import { Box, Stack, Typography } from '@mui/material';
import { orderTranslationHints, TranslationHint } from '../../domain/cards';
import { SupportedLanguage } from '../../domain/languages';

export function TranslationHintRow({
  complementaryLanguage,
  complementaryLanguages,
  dataTest,
  fallbackPrompt,
  hints,
}: {
  complementaryLanguage?: SupportedLanguage;
  complementaryLanguages?: SupportedLanguage[];
  dataTest: string;
  fallbackPrompt: string;
  hints: TranslationHint[];
}) {
  if (hints.length === 0) {
    return (
      <Typography data-test={dataTest} sx={fallbackHintStyles}>
        {fallbackPrompt}
      </Typography>
    );
  }

  const preferredLanguages =
    complementaryLanguages ??
    (complementaryLanguage ? [complementaryLanguage] : [hints[0].language]);
  const orderedHints = orderTranslationHints(hints, preferredLanguages);
  const [primaryHint, ...secondaryHints] = orderedHints;
  const hintPartDataTest = dataTest.replace('__prompt__', '__prompt_hint__');

  return (
    <Stack
      data-test={dataTest}
      spacing={0.75}
      sx={{ alignItems: 'flex-start' }}
    >
      {primaryHint && (
        <Box
          data-test={`${hintPartDataTest}__primary`}
          sx={primaryTranslationHintStyles}
        >
          <Box
            component="span"
            data-test={`${hintPartDataTest}__primary_language_code`}
            sx={languageCodeStyles}
          >
            {primaryHint.language}:
          </Box>{' '}
          {primaryHint.value}
        </Box>
      )}
      {secondaryHints.length > 0 && (
        <Stack
          data-test={`${hintPartDataTest}__secondary_row`}
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}
          useFlexGap
        >
          {secondaryHints.map((hint) => (
            <Box
              component="span"
              data-test={`${hintPartDataTest}__secondary__${hint.language}`}
              key={`${hint.language}:${hint.value}`}
              sx={secondaryTranslationHintStyles}
            >
              <Box
                component="span"
                data-test={`${hintPartDataTest}__secondary_language_code__${hint.language}`}
                sx={secondaryLanguageCodeStyles}
              >
                {hint.language}:
              </Box>{' '}
              {hint.value}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

const fallbackHintStyles = {
  color: '#2b2b2b',
  fontSize: 18,
  lineHeight: 1.35,
};

const primaryTranslationHintStyles = {
  bgcolor: '#f2f7df',
  border: '1px solid rgba(112, 143, 70, 0.42)',
  borderRadius: '14px',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.78), 0 8px 18px rgba(75, 93, 44, 0.10)',
  color: '#203015',
  display: 'inline-flex',
  fontSize: { xs: 19, sm: 21 },
  fontWeight: 850,
  lineHeight: 1.28,
  px: 1.25,
  py: 0.55,
};

const secondaryTranslationHintStyles = {
  color: '#4f5a49',
  display: 'inline-flex',
  fontSize: { xs: 17, sm: 18 },
  fontWeight: 650,
  lineHeight: 1.3,
};

const languageCodeStyles = {
  color: '#5b6b47',
  fontWeight: 900,
  mr: 0.5,
};

const secondaryLanguageCodeStyles = {
  color: '#6b7468',
  fontWeight: 800,
  mr: 0.5,
};
