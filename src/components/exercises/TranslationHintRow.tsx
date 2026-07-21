// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { orderTranslationHints, type TranslationHint } from '../../domain/cards';
import { type SupportedLanguage } from '../../domain/languages';

export function TranslationHintRow({
  activeHintLanguage,
  activeDefinitionLanguage,
  complementaryLanguage,
  complementaryLanguages,
  dataTest,
  definitions,
  definitionHint,
  disableAdditionalHints,
  fallbackPrompt,
  hints,
  onHintLanguageChange,
  onDefinitionLanguageChange,
  trailingAction,
}: {
  activeHintLanguage?: SupportedLanguage;
  activeDefinitionLanguage?: SupportedLanguage;
  complementaryLanguage?: SupportedLanguage;
  complementaryLanguages?: SupportedLanguage[];
  dataTest: string;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  definitionHint?: string;
  disableAdditionalHints?: boolean;
  fallbackPrompt: string;
  hints: TranslationHint[];
  onHintLanguageChange?: (language: SupportedLanguage) => void;
  onDefinitionLanguageChange?: (language: SupportedLanguage) => void;
  trailingAction?: ReactNode;
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
  const visibleHints = complementaryLanguages
    ? hints.filter((hint) => complementaryLanguages.includes(hint.language))
    : hints;
  const orderedHints = orderTranslationHints(visibleHints, preferredLanguages);
  const hintPartDataTest = dataTest.replace('__prompt__', '__prompt_hint__');

  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const hintsKeyRef = useRef('');
  const hintsKey = orderedHints.map((h) => `${h.language}:${h.value}`).join('|');

  useEffect(() => {
    if (hintsKey !== hintsKeyRef.current) {
      hintsKeyRef.current = hintsKey;
      if (activeHintLanguage) {
        const langIndex = orderedHints.findIndex(
          (h) => h.language === activeHintLanguage,
        );
        setActiveHintIndex(langIndex >= 0 ? langIndex : 0);
      } else {
        setActiveHintIndex(0);
      }
    }
  }, [hintsKey, activeHintLanguage, orderedHints]);

  const currentPrimaryHint =
    orderedHints.length > 0
      ? orderedHints[activeHintIndex % orderedHints.length]
      : undefined;

  const handleSwitchHint = useCallback(() => {
    const nextIndex = (activeHintIndex + 1) % orderedHints.length;
    setActiveHintIndex(nextIndex);
    onHintLanguageChange?.(orderedHints[nextIndex].language);
  }, [activeHintIndex, onHintLanguageChange, orderedHints]);

  const secondaryHints = orderedHints.filter(
    (_, i) => i !== activeHintIndex % orderedHints.length,
  );

  const definitionLanguages = useMemo(() => {
    if (!definitions) {
      return [];
    }
    const availableLanguages = (Object.keys(definitions) as SupportedLanguage[]).filter(
      (lang) => definitions[lang],
    );
    return [
      ...preferredLanguages.filter((language) =>
        availableLanguages.includes(language),
      ),
      ...availableLanguages.filter(
        (language) => !preferredLanguages.includes(language),
      ),
    ];
  }, [definitions, preferredLanguages]);
  const [activeDefinitionIndex, setActiveDefinitionIndex] = useState(0);
  const defsKeyRef = useRef('');
  const defsKey = definitionLanguages.join('|');

  useEffect(() => {
    if (defsKey !== defsKeyRef.current) {
      defsKeyRef.current = defsKey;
      if (activeDefinitionLanguage) {
        const langIndex = definitionLanguages.indexOf(activeDefinitionLanguage);
        setActiveDefinitionIndex(langIndex >= 0 ? langIndex : 0);
      } else {
        setActiveDefinitionIndex(0);
      }
    }
  }, [defsKey, activeDefinitionLanguage, definitionLanguages]);

  const currentDefinition =
    definitionLanguages.length > 0
      ? definitions?.[definitionLanguages[activeDefinitionIndex % definitionLanguages.length]]
      : undefined;

  const handleSwitchDefinition = useCallback(() => {
    const nextIndex = (activeDefinitionIndex + 1) % definitionLanguages.length;
    setActiveDefinitionIndex(nextIndex);
    onDefinitionLanguageChange?.(definitionLanguages[nextIndex]);
  }, [activeDefinitionIndex, definitionLanguages, onDefinitionLanguageChange]);

  return (
    <Stack
      data-test={dataTest}
      spacing={0.75}
      sx={{ alignItems: 'flex-start' }}
    >
      {currentPrimaryHint && (
        <Stack
          data-test={`${hintPartDataTest}__primary_row`}
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          useFlexGap
        >
          <Box
            data-test={`${hintPartDataTest}__primary`}
            sx={primaryTranslationHintStyles}
          >
            <Box
              component="span"
              data-test={`${hintPartDataTest}__primary_language_code`}
              sx={languageCodeStyles}
            >
              {formatHintLanguageCode(currentPrimaryHint.language)}:
            </Box>{' '}
            {currentPrimaryHint.value}
          </Box>
          {orderedHints.length > 1 && !disableAdditionalHints && (
            <IconButton
              data-test={`${hintPartDataTest}__switcher`}
              onClick={handleSwitchHint}
              size="small"
              sx={{
                border: '1px solid rgba(91, 107, 71, 0.30)',
                borderRadius: '50%',
                color: '#5b6b47',
                height: 26,
                minHeight: 26,
                minWidth: 26,
                ml: '10px',
                mr: '10px',
                p: 0.3,
                width: 26,
                '&:hover': {
                  bgcolor: 'rgba(91, 107, 71, 0.10)',
                  borderColor: 'rgba(91, 107, 71, 0.56)',
                },
              }}
            >
              <SyncAltOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          )}
          {trailingAction}
        </Stack>
      )}
      {secondaryHints.length > 0 && !disableAdditionalHints && (
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
                {formatHintLanguageCode(hint.language)}:
              </Box>{' '}
              {hint.value}
            </Box>
          ))}
        </Stack>
      )}
      {currentDefinition && (
        <Stack
          data-test={`${hintPartDataTest}__definition_row`}
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          useFlexGap
        >
          <Typography
            data-test={`${hintPartDataTest}__definition`}
            sx={definitionHintStyles}
          >
            {currentDefinition}
          </Typography>
          {definitionLanguages.length > 1 && (
            <IconButton
              data-test={`${hintPartDataTest}__definition_switcher`}
              onClick={handleSwitchDefinition}
              size="small"
              sx={{
                border: '1px solid rgba(91, 107, 71, 0.30)',
                borderRadius: '50%',
                color: '#5b6b47',
                height: 26,
                minHeight: 26,
                minWidth: 26,
                mr: '20px',
                p: 0.3,
                width: 26,
                '&:hover': {
                  bgcolor: 'rgba(91, 107, 71, 0.10)',
                  borderColor: 'rgba(91, 107, 71, 0.56)',
                },
              }}
            >
              <SyncAltOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          )}
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

function formatHintLanguageCode(language: SupportedLanguage): string {
  return language === 'uk' ? 'ukr' : language;
}

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

const definitionHintStyles = {
  color: '#4f5a49',
  fontSize: { xs: 17, sm: 18 },
  fontWeight: 650,
  lineHeight: 1.3,
};
