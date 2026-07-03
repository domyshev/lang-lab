import { useId } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import {
  languageFlags,
  languageLabels,
  SupportedLanguage,
  supportedLanguages,
} from '../domain/languages';
import { t } from '../domain/i18n';
import {
  setInterfaceLanguage,
  setTargetLanguage,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';

export function LanguageSelectors() {
  const dispatch = useDispatch<AppDispatch>();
  const interfaceLabelId = useId();
  const targetLabelId = useId();
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );

  const handleInterfaceChange = (
    event: SelectChangeEvent<SupportedLanguage>,
  ) => {
    dispatch(setInterfaceLanguage(event.target.value as SupportedLanguage));
  };

  const handleTargetChange = (event: SelectChangeEvent<SupportedLanguage>) => {
    dispatch(setTargetLanguage(event.target.value as SupportedLanguage));
  };

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ width: { xs: '100%', md: 'auto' } }}
    >
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
        <InputLabel id={interfaceLabelId}>
          {t(interfaceLanguage, 'interfaceLanguage')}
        </InputLabel>
        <Select
          labelId={interfaceLabelId}
          label={t(interfaceLanguage, 'interfaceLanguage')}
          value={interfaceLanguage}
          onChange={handleInterfaceChange}
          renderValue={(value) => (
            <LanguageLabel language={value as SupportedLanguage} />
          )}
        >
          {supportedLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              <LanguageLabel language={language} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
        <InputLabel id={targetLabelId}>
          {t(interfaceLanguage, 'targetLanguage')}
        </InputLabel>
        <Select
          labelId={targetLabelId}
          label={t(interfaceLanguage, 'targetLanguage')}
          value={targetLanguage}
          onChange={handleTargetChange}
          renderValue={(value) => (
            <LanguageLabel language={value as SupportedLanguage} />
          )}
        >
          {supportedLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              <LanguageLabel language={language} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

function LanguageLabel({ language }: { language: SupportedLanguage }) {
  return (
    <Stack
      component="span"
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <Box component="span" aria-hidden="true" sx={{ fontSize: 20 }}>
        {languageFlags[language]}
      </Box>
      <Typography component="span" noWrap>
        {languageLabels[language]}
      </Typography>
    </Stack>
  );
}
