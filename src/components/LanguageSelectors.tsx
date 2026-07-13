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
import type { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AssistantId,
  defaultAssistantId,
  getAssistantTooltip,
  resolveAssistantId,
  visibleAssistantCharacters,
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
  getComplementaryLanguages,
  setCorrectStreakCooldownMonths,
  setAssistantId,
  setComplementaryLanguageForTarget,
  setInterfaceLanguage,
  setNewCardMixFrequencyPercent,
  setRecentMistakeRepeatFrequencyPercent,
  setTargetLanguage,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';
import { CursorAnchoredTooltip, TooltipContent } from './CursorAnchoredTooltip';

export function LanguageSelectors() {
  const dispatch = useDispatch<AppDispatch>();
  const assistantLabelId = useId();
  const complementaryLabelPrefix = useId();
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
  const storedComplementaryLanguages = useSelector(
    (state: RootState) => state.app.complementaryLanguages,
  );
  const practiceSettings = getPracticeSettings(storedPracticeSettings);
  const complementaryLanguages = getComplementaryLanguages(
    storedComplementaryLanguages,
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

  const handleComplementaryLanguageChange =
    (target: SupportedLanguage) =>
    (event: SelectChangeEvent<SupportedLanguage>) => {
      dispatch(
        setComplementaryLanguageForTarget({
          complementaryLanguage: event.target.value as SupportedLanguage,
          targetLanguage: target,
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
        data-test="language_selectors__assistant_control"
        size="small"
        sx={{ minWidth: 86 }}
      >
        <InputLabel
          data-test="language_selectors__assistant_label"
          id={assistantLabelId}
        >
          {t(interfaceLanguage, 'assistant')}
        </InputLabel>
        <Select
          data-test="language_selectors__assistant_select"
          labelId={assistantLabelId}
          label={t(interfaceLanguage, 'assistant')}
          value={assistantId}
          onChange={(event: SelectChangeEvent<AssistantId>) =>
            dispatch(setAssistantId(event.target.value as AssistantId))
          }
          renderValue={(value) => {
            const tooltip = getAssistantTooltip(value, interfaceLanguage);
            return (
              <AssistantSelectorTooltip
                arrowDataTest={`language_selectors__assistant_selected_tooltip_arrow__${value}`}
                tooltip={tooltip}
              >
                <Box
                  component="span"
                  data-test={`language_selectors__assistant_selected_icon__${value}`}
                  sx={{ display: 'inline-flex', mx: 'auto' }}
                >
                  <AssistantStickerIcon
                    ariaLabel={tooltip}
                    assistantId={value}
                    dataTest={`language_selectors__assistant_selected_sticker__${value}`}
                    size={30}
                  />
                </Box>
              </AssistantSelectorTooltip>
            );
          }}
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
          {visibleAssistantCharacters.map((assistant) => (
            <MenuItem
              data-test={`language_selectors__assistant_option__${assistant.id}`}
              key={assistant.id}
              aria-label={getAssistantTooltip(assistant.id, interfaceLanguage)}
              value={assistant.id}
              sx={{ justifyContent: 'center' }}
            >
              <AssistantSelectorTooltip
                arrowDataTest={`language_selectors__assistant_option_tooltip_arrow__${assistant.id}`}
                tooltip={getAssistantTooltip(assistant.id, interfaceLanguage)}
              >
                <Box
                  component="span"
                  data-test={`language_selectors__assistant_option_icon__${assistant.id}`}
                  sx={{ display: 'inline-flex' }}
                >
                  <AssistantStickerIcon
                    ariaLabel={getAssistantTooltip(
                      assistant.id,
                      interfaceLanguage,
                    )}
                    assistantId={assistant.id}
                    dataTest={`language_selectors__assistant_option_sticker__${assistant.id}`}
                    size={36}
                  />
                </Box>
              </AssistantSelectorTooltip>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
            {t(interfaceLanguage, 'targetLanguage')}
          </InputLabel>
          <Select
            data-test="language_selectors__target_language_select"
            labelId={targetLabelId}
            label={t(interfaceLanguage, 'targetLanguage')}
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
          <Stack
            data-test="language_selectors__complementary_language_settings"
            spacing={1}
          >
            <Typography
              data-test="language_selectors__complementary_language_title"
              fontSize={14}
              fontWeight={900}
              sx={{ color: '#5f6b59' }}
            >
              {t(interfaceLanguage, 'complementaryLanguage')}
            </Typography>
            <Stack
              data-test="language_selectors__complementary_language_controls"
              sx={{ gap: 1.5 }}
            >
              {supportedLanguages.map((target) => {
                const label = getComplementaryLanguageFieldLabel(
                  interfaceLanguage,
                  target,
                );
                const labelId = `${complementaryLabelPrefix}-${target}`;
                return (
                  <FormControl
                    data-test={`language_selectors__complementary_language_control__${target}`}
                    key={target}
                    size="small"
                    fullWidth
                  >
                    <InputLabel
                      data-test={`language_selectors__complementary_language_label__${target}`}
                      id={labelId}
                    >
                      {label}
                    </InputLabel>
                    <Select
                      data-test={`language_selectors__complementary_language_select__${target}`}
                      labelId={labelId}
                      label={label}
                      value={complementaryLanguages[target]}
                      onChange={handleComplementaryLanguageChange(target)}
                      renderValue={(value) => (
                        <LanguageLabel
                          dataTestPrefix={`language_selectors__complementary_language_selected__${target}`}
                          language={value as SupportedLanguage}
                        />
                      )}
                    >
                      {supportedLanguages
                        .filter((language) => language !== target)
                        .map((language) => (
                          <MenuItem
                            data-test={`language_selectors__complementary_language_option__${target}__${language}`}
                            key={language}
                            value={language}
                          >
                            <LanguageLabel
                              dataTestPrefix={`language_selectors__complementary_language_option_label__${target}__${language}`}
                              language={language}
                            />
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                );
              })}
            </Stack>
          </Stack>
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

function getComplementaryLanguageFieldLabel(
  interfaceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
): string {
  if (interfaceLanguage === 'ru') {
    return `Дополняющий язык для ${languageLabels[targetLanguage]}`;
  }

  if (interfaceLanguage === 'es') {
    return `Idioma complementario para ${languageLabels[targetLanguage]}`;
  }

  return `Complementary language for ${languageLabels[targetLanguage]}`;
}

function AssistantSelectorTooltip({
  arrowDataTest,
  children,
  tooltip,
}: {
  arrowDataTest: string;
  children: ReactElement;
  tooltip: string;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={arrowDataTest}
      closeOnOtherOpen
      placement="left"
      title={
        <TooltipContent sx={assistantTooltipContentStyles}>
          {tooltip}
        </TooltipContent>
      }
      tooltipSx={assistantTooltipStyles}
    >
      {children}
    </CursorAnchoredTooltip>
  );
}

const assistantTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.16)',
  boxShadow: '0 10px 24px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 280,
  px: 1.25,
  py: 1,
};

const assistantTooltipContentStyles = {
  bgcolor: '#ffffff',
  color: '#203015',
  fontSize: 14,
  lineHeight: 1.35,
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
