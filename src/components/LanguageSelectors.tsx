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
  getComplementaryLanguagesForTarget,
  setCorrectStreakCooldownMonths,
  setAssistantId,
  setComplementaryLanguagesForTarget,
  setInterfaceLanguage,
  setNewCardMixFrequencyPercent,
  setRecentMistakeRepeatFrequencyPercent,
  setTargetLanguage,
  setWorldId,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import {
  WorldId,
  getDefaultAssistantIdForWorld,
  resolveWorldId,
  worldDefinitions,
  worldIds,
} from '../domain/worlds';

export function LanguageSelectors() {
  const dispatch = useDispatch<AppDispatch>();
  const companionLabelId = useId();
  const interfaceLabelId = useId();
  const targetLabelId = useId();
  const worldLabelId = useId();
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
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
  const storedComplementaryLanguages = useSelector(
    (state: RootState) => state.app.complementaryLanguages,
  );
  const practiceSettings = getPracticeSettings(storedPracticeSettings);
  const companionLanguages = getComplementaryLanguagesForTarget(
    storedComplementaryLanguages,
    targetLanguage,
    interfaceLanguage,
  );
  const companionLanguageOptions = supportedLanguages.filter(
    (language) => language !== targetLanguage && language !== interfaceLanguage,
  );
  const isSettingsOpen = Boolean(settingsAnchor);

  const handleInterfaceChange = (
    event: SelectChangeEvent<SupportedLanguage>,
  ) => {
    dispatch(setInterfaceLanguage(event.target.value as SupportedLanguage));
  };

  const handleTargetChange = (event: SelectChangeEvent<SupportedLanguage>) => {
    dispatch(setTargetLanguage(event.target.value as SupportedLanguage));
  };

  const handleWorldChange = (event: SelectChangeEvent<WorldId>) => {
    const nextWorldId = resolveWorldId(event.target.value);
    dispatch(setWorldId(nextWorldId));
    dispatch(setAssistantId(getDefaultAssistantIdForWorld(nextWorldId)));
  };

  const handleCompanionLanguagesChange = (
    event: SelectChangeEvent<typeof companionLanguages>,
  ) => {
    const rawValue = event.target.value;
    const nextLanguages =
      typeof rawValue === 'string'
        ? rawValue.split(',')
        : rawValue;
    dispatch(
      setComplementaryLanguagesForTarget({
        complementaryLanguages: nextLanguages as SupportedLanguage[],
        targetLanguage,
      }),
    );
  };

  return (
    <Stack
      data-test="language_selectors__root"
      direction="row"
      flexWrap="wrap"
      spacing={1}
      useFlexGap
      sx={{
        alignItems: 'center',
        width: { xs: '100%', md: 'auto' },
      }}
    >
      <FormControl
        data-test="language_selectors__interface_language_control"
        size="small"
        sx={{ minWidth: { xs: 138, sm: 150 } }}
      >
        <InputLabel
          data-test="language_selectors__interface_language_label"
          id={interfaceLabelId}
        >
          {t(interfaceLanguage, 'interfaceLanguage')}
        </InputLabel>
        <Select
          data-test="language_selectors__interface_language_select"
          labelId={interfaceLabelId}
          label={t(interfaceLanguage, 'interfaceLanguage')}
          value={interfaceLanguage}
          onChange={handleInterfaceChange}
          renderValue={(value) => (
            <LanguageLabel
              dataTestPrefix="language_selectors__interface_language_selected"
              language={value as SupportedLanguage}
            />
          )}
          sx={compactSelectSx}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              data-test={`language_selectors__interface_language_option__${language}`}
              key={language}
              value={language}
            >
              <LanguageLabel
                dataTestPrefix={`language_selectors__interface_language_option_label__${language}`}
                language={language}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack
        data-test="language_selectors__target_settings_group"
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        <FormControl
          data-test="language_selectors__target_language_control"
          size="small"
          sx={{ minWidth: { xs: 118, sm: 138 } }}
        >
          <InputLabel
            data-test="language_selectors__target_language_label"
            id={targetLabelId}
          >
            {t(interfaceLanguage, 'targetLearningLanguages')}
          </InputLabel>
          <Select
            data-test="language_selectors__target_language_select"
            labelId={targetLabelId}
            label={t(interfaceLanguage, 'targetLearningLanguages')}
            value={targetLanguage}
            onChange={handleTargetChange}
            renderValue={(value) => (
              <LanguageLabel
                dataTestPrefix="language_selectors__target_language_selected"
                language={value as SupportedLanguage}
              />
            )}
            sx={compactSelectSx}
          >
            {supportedLanguages.map((language) => (
              <MenuItem
                data-test={`language_selectors__target_language_option__${language}`}
                key={language}
                value={language}
              >
                <LanguageLabel
                  dataTestPrefix={`language_selectors__target_language_option_label__${language}`}
                  language={language}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          data-test="language_selectors__companion_languages_control"
          size="small"
          sx={{ minWidth: { xs: 168, sm: 196 } }}
        >
          <InputLabel
            data-test="language_selectors__companion_languages_label"
            id={companionLabelId}
          >
            {t(interfaceLanguage, 'complementaryLanguage')}
          </InputLabel>
          <Select
            data-test="language_selectors__companion_languages_select"
            labelId={companionLabelId}
            label={t(interfaceLanguage, 'complementaryLanguage')}
            multiple
            value={companionLanguages}
            onChange={handleCompanionLanguagesChange}
            renderValue={(value) => (
              <Stack
                component="span"
                data-test="language_selectors__companion_languages_selected__root"
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', minWidth: 0 }}
              >
                {(value as SupportedLanguage[]).map((language) => (
                  <LanguageLabel
                    dataTestPrefix={`language_selectors__companion_languages_selected__${language}`}
                    key={language}
                    language={language}
                  />
                ))}
              </Stack>
            )}
            sx={compactSelectSx}
          >
            {companionLanguageOptions.map((language) => {
              const isSelected = companionLanguages.includes(language);
              const isDisabled = !isSelected && companionLanguages.length >= 2;
              return (
                <MenuItem
                  data-test={`language_selectors__companion_languages_option__${language}`}
                  disabled={isDisabled}
                  key={language}
                  value={language}
                >
                  <LanguageLabel
                    dataTestPrefix={`language_selectors__companion_languages_option_label__${language}`}
                    language={language}
                  />
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <IconButton
          aria-label={t(interfaceLanguage, 'practiceSettings')}
          data-test="language_selectors__practice_settings_button"
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
      </Stack>
      <Menu
        anchorEl={settingsAnchor}
        data-test="language_selectors__practice_settings_menu"
        open={isSettingsOpen}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <Stack
          data-test="language_selectors__practice_settings_panel"
          spacing={1.5}
          sx={{ minWidth: 280, p: 2 }}
        >
          <Typography
            data-test="language_selectors__practice_settings_title"
            fontWeight={900}
          >
            {t(interfaceLanguage, 'practiceSettings')}
          </Typography>
          <FormControl
            data-test="language_selectors__world_control"
            size="small"
            fullWidth
          >
            <InputLabel
              data-test="language_selectors__world_label"
              id={worldLabelId}
            >
              {t(interfaceLanguage, 'appWorld')}
            </InputLabel>
            <Select
              data-test="language_selectors__world_select"
              label={t(interfaceLanguage, 'appWorld')}
              labelId={worldLabelId}
              value={worldId}
              onChange={handleWorldChange}
            >
              {worldIds.map((world) => (
                <MenuItem
                  data-test={`language_selectors__world_option__${world}`}
                  key={world}
                  value={world}
                >
                  {worldDefinitions[world].label[interfaceLanguage]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {cooldownFields.map((field) => (
            <TextField
              data-test={`language_selectors__cooldown_input__${field.key}`}
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
          <TextField
            data-test="language_selectors__mistake_repeat_frequency_input"
            label={t(interfaceLanguage, 'recentMistakeRepeatFrequency')}
            size="small"
            type="number"
            value={practiceSettings.recentMistakeRepeatFrequencyPercent}
            onChange={(event) =>
              dispatch(
                setRecentMistakeRepeatFrequencyPercent(
                  Number(event.target.value),
                ),
              )
            }
            inputProps={{
              max: 100,
              min: 0,
              step: 5,
            }}
            helperText={t(interfaceLanguage, 'frequencyPercent')}
          />
          <TextField
            data-test="language_selectors__new_card_mix_frequency_input"
            label={t(interfaceLanguage, 'newCardMixFrequency')}
            size="small"
            type="number"
            value={practiceSettings.newCardMixFrequencyPercent}
            onChange={(event) =>
              dispatch(
                setNewCardMixFrequencyPercent(Number(event.target.value)),
              )
            }
            inputProps={{
              max: 100,
              min: 0,
              step: 5,
            }}
            helperText={t(interfaceLanguage, 'frequencyPercent')}
          />
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

function LanguageLabel({
  dataTestPrefix,
  language,
}: {
  dataTestPrefix: string;
  language: SupportedLanguage;
}) {
  return (
    <Stack
      data-test={`${dataTestPrefix}__root`}
      component="span"
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <Box
        component="span"
        aria-hidden="true"
        data-test={`${dataTestPrefix}__flag`}
        sx={{ fontSize: 18 }}
      >
        {languageFlags[language]}
      </Box>
      <Typography
        component="span"
        data-test={`${dataTestPrefix}__name`}
        noWrap
        sx={{ fontSize: 14 }}
      >
        {languageLabels[language]}
      </Typography>
    </Stack>
  );
}
