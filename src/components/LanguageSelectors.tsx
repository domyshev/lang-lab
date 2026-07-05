import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useId, useState } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
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
  CorrectStreakCooldownKey,
  getPracticeSettings,
} from '../domain/practiceOrdering';
import {
  setCorrectStreakCooldownMonths,
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
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const assistantId = useSelector((state: RootState) =>
    resolveAssistantId(state.app.assistantId ?? defaultAssistantId),
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const storedPracticeSettings = useSelector(
    (state: RootState) => state.app.practiceSettings,
  );
  const practiceSettings = getPracticeSettings(storedPracticeSettings);
  const isSettingsOpen = Boolean(settingsAnchor);

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
      direction="row"
      flexWrap="wrap"
      spacing={1}
      useFlexGap
      sx={{
        alignItems: 'center',
        width: { xs: '100%', md: 'auto' },
      }}
    >
      <FormControl size="small" sx={{ minWidth: 86 }}>
        <InputLabel id={assistantLabelId}>
          {t(interfaceLanguage, 'assistant')}
        </InputLabel>
        <Select
          data-testid="assistant-select"
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
            ...compactSelectSx,
            '& .MuiSelect-select': {
              ...compactSelectSx['& .MuiSelect-select'],
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
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

      <FormControl size="small" sx={{ minWidth: { xs: 138, sm: 150 } }}>
        <InputLabel id={interfaceLabelId}>
          {t(interfaceLanguage, 'interfaceLanguage')}
        </InputLabel>
        <Select
          data-testid="interface-language-select"
          labelId={interfaceLabelId}
          label={t(interfaceLanguage, 'interfaceLanguage')}
          value={interfaceLanguage}
          onChange={handleInterfaceChange}
          renderValue={(value) => (
            <LanguageLabel language={value as SupportedLanguage} />
          )}
          sx={compactSelectSx}
        >
          {supportedLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              <LanguageLabel language={language} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: { xs: 118, sm: 138 } }}>
        <InputLabel id={targetLabelId}>
          {t(interfaceLanguage, 'targetLanguage')}
        </InputLabel>
        <Select
          data-testid="target-language-select"
          labelId={targetLabelId}
          label={t(interfaceLanguage, 'targetLanguage')}
          value={targetLanguage}
          onChange={handleTargetChange}
          renderValue={(value) => (
            <LanguageLabel language={value as SupportedLanguage} />
          )}
          sx={compactSelectSx}
        >
          {supportedLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              <LanguageLabel language={language} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton
        aria-label={t(interfaceLanguage, 'practiceSettings')}
        onClick={(event) => setSettingsAnchor(event.currentTarget)}
        sx={{
          border: '1px solid rgba(32, 48, 21, 0.22)',
          borderRadius: 1,
          color: '#203015',
          height: 34,
          width: 34,
        }}
      >
        <SettingsOutlinedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={settingsAnchor}
        open={isSettingsOpen}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <Stack spacing={1.5} sx={{ minWidth: 280, p: 2 }}>
          <Typography fontWeight={900}>
            {t(interfaceLanguage, 'practiceSettings')}
          </Typography>
          {cooldownFields.map((field) => (
            <TextField
              key={field.key}
              label={t(interfaceLanguage, field.labelKey)}
              size="small"
              type="number"
              value={
                practiceSettings.correctStreakCooldownMonths[field.key]
              }
              onChange={(event) =>
                dispatch(
                  setCorrectStreakCooldownMonths({
                    months: Number(event.target.value),
                    streak: field.key,
                  }),
                )
              }
              inputProps={{
                min: 0,
                step: 0.5,
              }}
              helperText={t(interfaceLanguage, 'cooldownMonths')}
            />
          ))}
        </Stack>
      </Menu>
    </Stack>
  );
}

const cooldownFields: Array<{
  key: CorrectStreakCooldownKey;
  labelKey:
    | 'correctStreakCooldownFivePlus'
    | 'correctStreakCooldownFour'
    | 'correctStreakCooldownThree';
}> = [
  { key: 'fivePlus', labelKey: 'correctStreakCooldownFivePlus' },
  { key: 'four', labelKey: 'correctStreakCooldownFour' },
  { key: 'three', labelKey: 'correctStreakCooldownThree' },
];

const compactSelectSx = {
  height: 34,
  '& .MuiSelect-select': {
    alignItems: 'center',
    display: 'flex',
    minHeight: 'unset',
    py: 0.25,
  },
};

function LanguageLabel({ language }: { language: SupportedLanguage }) {
  return (
    <Stack
      component="span"
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <Box component="span" aria-hidden="true" sx={{ fontSize: 18 }}>
        {languageFlags[language]}
      </Box>
      <Typography component="span" noWrap sx={{ fontSize: 14 }}>
        {languageLabels[language]}
      </Typography>
    </Stack>
  );
}
