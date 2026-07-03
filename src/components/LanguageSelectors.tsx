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
  AssistantId,
  assistantCharacters,
  defaultAssistantId,
  resolveAssistantId,
} from '../domain/assistants';
import {
  languageFlags,
  languageLabels,
  SupportedLanguage,
  supportedLanguages,
} from '../domain/languages';
import { t } from '../domain/i18n';
import {
  setAssistantId,
  setInterfaceLanguage,
  setTargetLanguage,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';

export function LanguageSelectors() {
  const dispatch = useDispatch<AppDispatch>();
  const assistantLabelId = useId();
  const interfaceLabelId = useId();
  const targetLabelId = useId();
  const assistantId = useSelector((state: RootState) =>
    resolveAssistantId(state.app.assistantId ?? defaultAssistantId),
  );
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
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 86 } }}>
        <InputLabel id={assistantLabelId}>
          {t(interfaceLanguage, 'assistant')}
        </InputLabel>
        <Select
          labelId={assistantLabelId}
          label={t(interfaceLanguage, 'assistant')}
          value={assistantId}
          onChange={(event: SelectChangeEvent<AssistantId>) =>
            dispatch(setAssistantId(event.target.value as AssistantId))
          }
          renderValue={(value) => (
            <AssistantStickerIcon
              ariaLabel={t(interfaceLanguage, 'selectedAssistant')}
              assistantId={value}
              size={30}
              sx={{ mx: 'auto' }}
            />
          )}
          sx={{
            '& .MuiSelect-select': {
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              py: 0.25,
            },
          }}
        >
          {assistantCharacters.map((assistant) => (
            <MenuItem
              key={assistant.id}
              aria-label={assistant.label}
              value={assistant.id}
              sx={{ justifyContent: 'center' }}
            >
              <AssistantStickerIcon
                ariaLabel={assistant.label}
                assistantId={assistant.id}
                size={36}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
