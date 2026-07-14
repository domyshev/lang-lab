import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
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
    (language) => language !== targetLanguage,
  );
  const orderedCompanionLanguageOptions = [
    ...companionLanguages.filter((language) =>
      companionLanguageOptions.includes(language),
    ),
    ...companionLanguageOptions.filter(
      (language) => !companionLanguages.includes(language),
    ),
  ];
  const selectedCompanionLanguageSet = new Set(companionLanguages);
  const isSettingsOpen = Boolean(settingsAnchor);

  const updateCompanionLanguages = (
    complementaryLanguages: SupportedLanguage[],
  ) => {
    dispatch(
      setComplementaryLanguagesForTarget({
        complementaryLanguages,
        targetLanguage,
      }),
    );
  };

  const moveCompanionLanguage = (
    language: SupportedLanguage,
    direction: -1 | 1,
  ) => {
    const currentIndex = companionLanguages.indexOf(language);
    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= companionLanguages.length
    ) {
      return;
    }

    const nextLanguages = [...companionLanguages];
    [nextLanguages[currentIndex], nextLanguages[nextIndex]] = [
      nextLanguages[nextIndex],
      nextLanguages[currentIndex],
    ];
    updateCompanionLanguages(nextLanguages);
  };

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
    updateCompanionLanguages(nextLanguages as SupportedLanguage[]);
  };

  return (
    <Stack
      data-test="language_selectors__root"
      direction="row"
      flexWrap="wrap"
      spacing={1}
      useFlexGap
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        width: { xs: '100%', md: 'auto' },
      }}
    >
      <Stack
        data-test="language_selectors__interface_language_group"
        direction="row"
        sx={{
          alignItems: 'center',
          flex: { xs: '1 1 100%', sm: '0 1 auto' },
          minWidth: 0,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        <FormControl
          data-test="language_selectors__interface_language_control"
          size="small"
          sx={{
            flex: { xs: '1 1 auto', sm: '0 0 auto' },
            minWidth: 0,
            width: { xs: 'auto', sm: 150 },
          }}
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
        <SelectorInfoIcon
          interfaceLanguage={interfaceLanguage}
          kind="interface"
          worldId={worldId}
        />
      </Stack>

      <Stack
        data-test="language_selectors__target_settings_group"
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          flex: { xs: '1 1 100%', sm: '1 1 auto', md: '0 0 auto' },
          flexShrink: 1,
          flexWrap: 'wrap',
          minWidth: 0,
          width: { xs: '100%', md: 'auto' },
        }}
      >
        <Stack
          data-test="language_selectors__target_language_group"
          direction="row"
          sx={{
            alignItems: 'center',
            flex: { xs: '1 1 100%', sm: '1 1 268px', md: '0 0 auto' },
            minWidth: 0,
          }}
        >
          <FormControl
            data-test="language_selectors__target_language_control"
            size="small"
            sx={{
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              minWidth: 0,
              width: { xs: 'auto', md: 224 },
            }}
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
          <SelectorInfoIcon
            interfaceLanguage={interfaceLanguage}
            kind="target"
            worldId={worldId}
          />
        </Stack>

        <Stack
          data-test="language_selectors__companion_languages_group"
          direction="row"
          sx={{
            alignItems: 'center',
            flex: { xs: '1 1 100%', sm: '1 1 268px', md: '0 0 auto' },
            minWidth: 0,
          }}
        >
          <FormControl
            data-test="language_selectors__companion_languages_control"
            size="small"
            sx={{
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              maxWidth: { xs: 'none', md: 224 },
              minWidth: 0,
              width: { xs: 'auto', md: 224 },
            }}
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
                  sx={{
                    alignItems: 'center',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
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
            {orderedCompanionLanguageOptions.map((language) => {
              const isSelected = companionLanguages.includes(language);
              const selectedIndex = companionLanguages.indexOf(language);
              return (
                <MenuItem
                  data-test={`language_selectors__companion_languages_option__${language}`}
                  key={language}
                  value={language}
                  sx={{ gap: 0.75, minWidth: 260 }}
                >
                  <Checkbox
                    checked={selectedCompanionLanguageSet.has(language)}
                    data-test={`language_selectors__companion_languages_option_checkbox__${language}`}
                    size="small"
                    sx={{ p: 0.25 }}
                  />
                  <LanguageLabel
                    dataTestPrefix={`language_selectors__companion_languages_option_label__${language}`}
                    language={language}
                  />
                  <Stack
                    data-test={`language_selectors__companion_languages_order_controls__${language}`}
                    direction="row"
                    spacing={0.25}
                    sx={{ ml: 'auto' }}
                  >
                    <IconButton
                      aria-label={`${t(interfaceLanguage, 'moveCompanionLanguageUp')}: ${languageLabels[language]}`}
                      data-test={`language_selectors__companion_languages_move_up__${language}`}
                      disabled={!isSelected || selectedIndex <= 0}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveCompanionLanguage(language, -1);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      size="small"
                    >
                      <KeyboardArrowUpRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`${t(interfaceLanguage, 'moveCompanionLanguageDown')}: ${languageLabels[language]}`}
                      data-test={`language_selectors__companion_languages_move_down__${language}`}
                      disabled={
                        !isSelected ||
                        selectedIndex === companionLanguages.length - 1
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        moveCompanionLanguage(language, 1);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      size="small"
                    >
                      <KeyboardArrowDownRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </MenuItem>
              );
            })}
            </Select>
          </FormControl>
          <SelectorInfoIcon
            interfaceLanguage={interfaceLanguage}
            kind="companion"
            worldId={worldId}
          />
        </Stack>

        <IconButton
          aria-label={t(interfaceLanguage, 'practiceSettings')}
          data-test="language_selectors__practice_settings_button"
          onClick={(event) => setSettingsAnchor(event.currentTarget)}
          sx={{
            border: '1px solid rgba(32, 48, 21, 0.22)',
            borderRadius: 1,
            color: '#203015',
            flexShrink: 0,
            height: 34,
            ml: { xs: 0, md: '10px' },
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
          sx={{ maxWidth: 'calc(100vw - 32px)', minWidth: 280, p: 2 }}
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
            sx={{ mb: '20px' }}
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
              renderValue={(value) => (
                <WorldLabel
                  dataTestPrefix="language_selectors__world_selected"
                  interfaceLanguage={interfaceLanguage}
                  world={resolveWorldId(value)}
                />
              )}
            >
              {worldIds.map((world) => (
                <MenuItem
                  data-test={`language_selectors__world_option__${world}`}
                  key={world}
                  value={world}
                >
                  <WorldLabel
                    dataTestPrefix={`language_selectors__world_option_label__${world}`}
                    interfaceLanguage={interfaceLanguage}
                    world={world}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography
            data-test="language_selectors__repeat_management_title"
            sx={{
              color: '#5c6f4a',
              fontSize: '0.88rem',
              fontWeight: 850,
              lineHeight: 1.2,
              mt: '15px',
            }}
          >
            {t(interfaceLanguage, 'repeatManagementTitle')}
          </Typography>
          {cooldownFields.map((field) => (
            <SettingsFieldRow
              infoKey={field.key}
              interfaceLanguage={interfaceLanguage}
              key={field.key}
              worldId={worldId}
            >
              <TextField
                data-test={`language_selectors__cooldown_input__${field.key}`}
                fullWidth
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
            </SettingsFieldRow>
          ))}
          <SettingsFieldRow
            infoKey="mistake_repeat_frequency"
            interfaceLanguage={interfaceLanguage}
            worldId={worldId}
          >
            <TextField
              data-test="language_selectors__mistake_repeat_frequency_input"
              fullWidth
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
          </SettingsFieldRow>
          <SettingsFieldRow
            infoKey="new_card_mix_frequency"
            interfaceLanguage={interfaceLanguage}
            worldId={worldId}
          >
            <TextField
              data-test="language_selectors__new_card_mix_frequency_input"
              fullWidth
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
          </SettingsFieldRow>
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

const readableTooltipSlotProps = {
  arrow: {
    sx: {
      color: (theme: any) =>
        theme.palette.mode === 'dark'
          ? 'rgba(29, 26, 43, 0.98)'
          : 'rgba(255, 255, 255, 0.98)',
    },
  },
  tooltip: {
    sx: {
      bgcolor: (theme: any) =>
        theme.palette.mode === 'dark'
          ? 'rgba(29, 26, 43, 0.98)'
          : 'rgba(255, 255, 255, 0.98)',
      border: (theme: any) =>
        theme.palette.mode === 'dark'
          ? '1px solid rgba(246, 240, 255, 0.18)'
          : '1px solid rgba(32, 48, 21, 0.14)',
      boxShadow: '0 12px 28px rgba(32, 48, 21, 0.16)',
      color: (theme: any) =>
        theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.38,
      maxWidth: 320,
      px: 1.75,
      py: 1.2,
    },
  },
};

type SelectorInfoKind = 'interface' | 'target' | 'companion';
type SettingsInfoKey =
  | CorrectStreakCooldownKey
  | 'mistake_repeat_frequency'
  | 'new_card_mix_frequency';

function SelectorInfoIcon({
  interfaceLanguage,
  kind,
  worldId,
}: {
  interfaceLanguage: SupportedLanguage;
  kind: SelectorInfoKind;
  worldId: WorldId;
}) {
  return (
    <Box
      data-test={`language_selectors__${selectorInfoDataKey[kind]}_info_wrapper`}
      sx={{ ml: '5px' }}
    >
      <Tooltip
        arrow
        placement="bottom"
        slotProps={{
          ...readableTooltipSlotProps,
          tooltip: {
            ...readableTooltipSlotProps.tooltip,
            ...({
              'data-test': `language_selectors__${selectorInfoDataKey[kind]}_info_tooltip`,
            } as Record<string, string>),
          },
        }}
        title={
          <Stack spacing={0.65}>
            <Typography
              data-test={`language_selectors__${selectorInfoDataKey[kind]}_info_tooltip_title`}
              sx={{ fontSize: '14px', fontWeight: 850, lineHeight: 1.3 }}
            >
              {getSelectorInfoTitle(interfaceLanguage, kind)}
            </Typography>
            {getSelectorInfoText(interfaceLanguage, kind).map((line, index) => (
              <Typography
                data-test={`language_selectors__${selectorInfoDataKey[kind]}_info_tooltip_line__${index}`}
                key={line}
                sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35 }}
              >
                {renderSelectorInfoLine(
                  line,
                  `language_selectors__${selectorInfoDataKey[kind]}_info_tooltip_line_source__${index}`,
                )}
              </Typography>
            ))}
          </Stack>
        }
      >
        <IconButton
          aria-label={getSelectorInfoLabel(interfaceLanguage, kind)}
          data-test={`language_selectors__${selectorInfoDataKey[kind]}_info_button`}
          size="small"
          sx={getInfoButtonSx(worldId)}
        >
          <InfoOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function renderSelectorInfoLine(
  line: string,
  sourceDataTest: string,
): ReactNode {
  const separator = ' -> ';
  const separatorIndex = line.indexOf(separator);

  if (separatorIndex < 0) {
    return line;
  }

  return (
    <>
      <Box
        component="span"
        data-test={sourceDataTest}
        sx={{ fontWeight: 850 }}
      >
        {line.slice(0, separatorIndex)}
      </Box>
      {line.slice(separatorIndex)}
    </>
  );
}

function SettingsFieldRow({
  children,
  infoKey,
  interfaceLanguage,
  worldId,
}: {
  children: ReactNode;
  infoKey: SettingsInfoKey;
  interfaceLanguage: SupportedLanguage;
  worldId: WorldId;
}) {
  return (
    <Stack
      data-test={`language_selectors__settings_field_row__${infoKey}`}
      direction="row"
      spacing={0.75}
      sx={{ alignItems: 'flex-start' }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <SettingsInfoIcon
        infoKey={infoKey}
        interfaceLanguage={interfaceLanguage}
        worldId={worldId}
      />
    </Stack>
  );
}

function SettingsInfoIcon({
  infoKey,
  interfaceLanguage,
  worldId,
}: {
  infoKey: SettingsInfoKey;
  interfaceLanguage: SupportedLanguage;
  worldId: WorldId;
}) {
  return (
    <Tooltip
      arrow
      placement="left"
      slotProps={{
        ...readableTooltipSlotProps,
        tooltip: {
          ...readableTooltipSlotProps.tooltip,
          ...({
            'data-test': `language_selectors__settings_info_tooltip__${infoKey}`,
          } as Record<string, string>),
        },
      }}
      title={
        <Stack spacing={0.65}>
          <Typography
            data-test={`language_selectors__settings_info_tooltip_title__${infoKey}`}
            sx={{ fontSize: '14px', fontWeight: 850, lineHeight: 1.3 }}
          >
            {getSettingsInfoTitle(interfaceLanguage, infoKey)}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35 }}>
            {getSettingsInfoText(interfaceLanguage, infoKey)}
          </Typography>
        </Stack>
      }
    >
      <IconButton
        aria-label={getSettingsInfoLabel(interfaceLanguage, infoKey)}
        data-test={`language_selectors__settings_info_button__${infoKey}`}
        size="small"
        sx={{ ...getInfoButtonSx(worldId), mt: '8px' }}
      >
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}

function getInfoButtonSx(worldId: WorldId) {
  const palette = getInfoButtonPalette(worldId);

  return {
    bgcolor: palette.bgcolor,
    border: palette.border,
    color: palette.color,
    height: 24,
    width: 24,
    '&:hover': {
      bgcolor: palette.hoverBgcolor,
    },
  };
}

function getInfoButtonPalette(worldId: WorldId) {
  switch (worldId) {
    case 'mortalKombat':
      return {
        bgcolor: 'rgba(255, 241, 214, 0.78)',
        border: '1px solid rgba(212, 63, 36, 0.28)',
        color: '#9e2b18',
        hoverBgcolor: 'rgba(255, 241, 214, 0.96)',
      };
    case 'starTrek':
      return {
        bgcolor: 'rgba(236, 246, 255, 0.82)',
        border: '1px solid rgba(63, 136, 255, 0.30)',
        color: '#255cc8',
        hoverBgcolor: 'rgba(236, 246, 255, 0.98)',
      };
    case 'football':
      return {
        bgcolor: 'rgba(255, 246, 181, 0.68)',
        border: '1px solid rgba(198, 11, 30, 0.22)',
        color: '#a45112',
        hoverBgcolor: 'rgba(255, 246, 181, 0.92)',
      };
    case 'forest':
    default:
      return {
        bgcolor: 'rgba(246, 255, 230, 0.76)',
        border: '1px solid rgba(91, 150, 54, 0.34)',
        color: '#386f2d',
        hoverBgcolor: 'rgba(246, 255, 230, 0.96)',
      };
  }
}

const selectorInfoDataKey: Record<SelectorInfoKind, string> = {
  companion: 'companion_languages',
  interface: 'interface_language',
  target: 'target_language',
};

function getSelectorInfoLabel(
  language: SupportedLanguage,
  kind: SelectorInfoKind,
): string {
  const labels: Record<SupportedLanguage, Record<SelectorInfoKind, string>> = {
    en: {
      companion: 'About hint languages',
      interface: 'About interface language',
      target: 'About target learning language',
    },
    es: {
      companion: 'Sobre los idiomas de pistas',
      interface: 'Sobre el idioma de interfaz',
      target: 'Sobre el idioma objetivo',
    },
    ru: {
      companion: 'О языках подсказок',
      interface: 'О языке интерфейса',
      target: 'О языке - цели изучения',
    },
    uk: {
      companion: 'Про мови підказок',
      interface: 'Про мову інтерфейсу',
      target: 'Про мову - ціль вивчення',
    },
  };

  return labels[language][kind];
}

function getSelectorInfoTitle(
  language: SupportedLanguage,
  kind: SelectorInfoKind,
): string {
  const titles: Record<SelectorInfoKind, string> = {
    companion: t(language, 'complementaryLanguage'),
    interface: t(language, 'interfaceLanguage'),
    target: t(language, 'targetLearningLanguage'),
  };

  return titles[kind];
}

function getSelectorInfoText(
  language: SupportedLanguage,
  kind: SelectorInfoKind,
): string[] {
  const texts: Record<SupportedLanguage, Record<SelectorInfoKind, string[]>> = {
    en: {
      interface: [
        'Interface language changes app labels, menus, and hints.',
        'It does not decide which language you practice in games.',
      ],
      target: [
        'This is the language you train and type answers in during games.',
        'Game statistics are tracked separately for every target language.',
      ],
      companion: [
        'Hint languages are shown as translation hints in games.',
        'Their order and selection are remembered separately for each target language.',
        'Defaults:',
        'English -> Русский, Español, Українська',
        'Русский -> English, Español, Українська',
        'Español -> Русский, English, Українська',
        'Українська -> Русский, English, Español',
      ],
    },
    es: {
      interface: [
        'El idioma de interfaz cambia textos, menus y pistas de la aplicacion.',
        'No decide que idioma practicas en los juegos.',
      ],
      target: [
        'Este es el idioma que entrenas y en el que escribes respuestas en los juegos.',
        'La estadistica se guarda por separado para cada idioma objetivo.',
      ],
      companion: [
        'Los idiomas de pistas aparecen como traducciones de ayuda en los juegos.',
        'El orden y la seleccion se recuerdan por separado para cada idioma objetivo.',
        'Por defecto:',
        'English -> Русский, Español, Українська',
        'Русский -> English, Español, Українська',
        'Español -> Русский, English, Українська',
        'Українська -> Русский, English, Español',
      ],
    },
    ru: {
      interface: [
        'Язык интерфейса меняет подписи, меню и подсказки приложения.',
        'Он не выбирает язык, который вы тренируете в играх.',
      ],
      target: [
        'Это язык, который вы тренируете и на котором вводите ответы в играх.',
        'Статистика игр ведется отдельно для каждого языка-цели.',
      ],
      companion: [
        'Языки подсказок показываются как переводы-подсказки в играх.',
        'Порядок и выбор запоминаются отдельно для каждого языка-цели.',
        'По умолчанию:',
        'English -> Русский, Español, Українська',
        'Русский -> English, Español, Українська',
        'Español -> Русский, English, Українська',
        'Українська -> Русский, English, Español',
      ],
    },
    uk: {
      interface: [
        'Мова інтерфейсу змінює підписи, меню та підказки застосунку.',
        'Вона не визначає мову, яку ви тренуєте в іграх.',
      ],
      target: [
        'Це мова, яку ви тренуєте і якою вводите відповіді в іграх.',
        'Статистика ігор ведеться окремо для кожної мови-цілі.',
      ],
      companion: [
        'Мови підказок показуються як переклади-підказки в іграх.',
        'Порядок і вибір запамʼятовуються окремо для кожної мови-цілі.',
        'За замовчуванням:',
        'English -> Русский, Español, Українська',
        'Русский -> English, Español, Українська',
        'Español -> Русский, English, Українська',
        'Українська -> Русский, English, Español',
      ],
    },
  };

  return texts[language][kind];
}

function getSettingsInfoLabel(
  language: SupportedLanguage,
  infoKey: SettingsInfoKey,
): string {
  const prefix: Record<SupportedLanguage, string> = {
    en: 'About setting',
    es: 'Sobre el ajuste',
    ru: 'О настройке',
    uk: 'Про налаштування',
  };

  return `${prefix[language]}: ${infoKey}`;
}

function getSettingsInfoTitle(
  language: SupportedLanguage,
  infoKey: SettingsInfoKey,
): string {
  const titles: Record<SettingsInfoKey, string> = {
    fivePlus: t(language, 'correctStreakCooldownFivePlus'),
    four: t(language, 'correctStreakCooldownFour'),
    three: t(language, 'correctStreakCooldownThree'),
    mistake_repeat_frequency: t(language, 'recentMistakeRepeatFrequency'),
    new_card_mix_frequency: t(language, 'newCardMixFrequency'),
  };

  return titles[infoKey];
}

function getSettingsInfoText(
  language: SupportedLanguage,
  infoKey: SettingsInfoKey,
): string {
  const texts: Record<SupportedLanguage, Record<SettingsInfoKey, string>> = {
    en: {
      fivePlus:
        'If a card was answered correctly 5 or more times in a row, this setting says how many months it can rest before returning to games.',
      four:
        'If a card was answered correctly 4 times in a row, this setting says how many months it waits before returning.',
      three:
        'If a card was answered correctly 3 times in a row, this setting says how many months it waits before returning.',
      mistake_repeat_frequency:
        'The higher the percent, the more often cards with recent mistakes rise in the game queue.',
      new_card_mix_frequency:
        'The higher the percent, the more often never-practiced cards are mixed into the queue.',
    },
    es: {
      fivePlus:
        'Si una tarjeta se respondio bien 5 o mas veces seguidas, este ajuste indica cuantos meses descansa antes de volver.',
      four:
        'Si una tarjeta se respondio bien 4 veces seguidas, este ajuste indica cuantos meses espera antes de volver.',
      three:
        'Si una tarjeta se respondio bien 3 veces seguidas, este ajuste indica cuantos meses espera antes de volver.',
      mistake_repeat_frequency:
        'Cuanto mayor sea el porcentaje, mas a menudo suben en la cola las tarjetas con errores recientes.',
      new_card_mix_frequency:
        'Cuanto mayor sea el porcentaje, mas a menudo se mezclan tarjetas nuevas en la cola.',
    },
    ru: {
      fivePlus:
        'Если карточка отвечена верно 5 и более раз подряд, настройка задает, сколько месяцев она отдыхает перед возвращением в игры.',
      four:
        'Если карточка отвечена верно 4 раза подряд, настройка задает, сколько месяцев она ждет перед возвращением.',
      three:
        'Если карточка отвечена верно 3 раза подряд, настройка задает, сколько месяцев она ждет перед возвращением.',
      mistake_repeat_frequency:
        'Чем выше процент, тем чаще карточки с последними ошибками поднимаются выше в очереди игр.',
      new_card_mix_frequency:
        'Чем выше процент, тем чаще в очередь добавляются новые карточки, которые еще не тренировались.',
    },
    uk: {
      fivePlus:
        'Якщо картку відповіли правильно 5 і більше разів поспіль, налаштування визначає, скільки місяців вона відпочиває перед поверненням в ігри.',
      four:
        'Якщо картку відповіли правильно 4 рази поспіль, налаштування визначає, скільки місяців вона чекає перед поверненням.',
      three:
        'Якщо картку відповіли правильно 3 рази поспіль, налаштування визначає, скільки місяців вона чекає перед поверненням.',
      mistake_repeat_frequency:
        'Що вищий відсоток, то частіше картки з останніми помилками піднімаються вище в черзі ігор.',
      new_card_mix_frequency:
        'Що вищий відсоток, то частіше в чергу додаються нові картки, які ще не тренувалися.',
    },
  };

  return texts[language][infoKey];
}

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

function WorldLabel({
  dataTestPrefix,
  interfaceLanguage,
  world,
}: {
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  world: WorldId;
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
      <WorldIcon dataTest={`${dataTestPrefix}__icon`} world={world} />
      <Typography
        component="span"
        data-test={`${dataTestPrefix}__name`}
        noWrap
        sx={{ fontSize: 14 }}
      >
        {worldDefinitions[world].label[interfaceLanguage]}
      </Typography>
    </Stack>
  );
}

function WorldIcon({
  dataTest,
  world,
}: {
  dataTest: string;
  world: WorldId;
}) {
  if (world === 'forest') {
    return (
      <Box
        component="span"
        aria-hidden="true"
        data-test={dataTest}
        sx={{ fontSize: 18, lineHeight: 1 }}
      >
        🍃
      </Box>
    );
  }

  if (world === 'mortalKombat') {
    return (
      <Box
        component="span"
        aria-hidden="true"
        data-test={dataTest}
        sx={{
          background:
            'radial-gradient(circle at 42% 40%, #ffb03a 0 24%, transparent 25%), linear-gradient(135deg, #260909 0%, #d43f24 100%)',
          border: '1px solid rgba(38, 9, 9, 0.56)',
          borderRadius: '50%',
          boxShadow:
            'inset -3px -3px 0 rgba(38, 9, 9, 0.28), inset 2px 2px 0 rgba(255, 255, 255, 0.34), 0 1px 3px rgba(95, 28, 22, 0.22)',
          display: 'inline-flex',
          flex: '0 0 auto',
          height: 20,
          overflow: 'hidden',
          position: 'relative',
          width: 20,
          '&::before': {
            background:
              'linear-gradient(140deg, transparent 0 30%, #fff1d6 31% 37%, transparent 38%), linear-gradient(35deg, transparent 0 48%, rgba(255,176,58,0.90) 49% 56%, transparent 57%)',
            content: '""',
            inset: 3,
            position: 'absolute',
          },
        }}
      />
    );
  }

  if (world === 'starTrek') {
    return (
      <Box
        component="span"
        aria-hidden="true"
        data-test={dataTest}
        sx={{
          background:
            'radial-gradient(circle at 50% 30%, #f3b833 0 18%, transparent 19%), linear-gradient(135deg, #101b4d 0%, #3f88ff 100%)',
          border: '1px solid rgba(16, 27, 77, 0.46)',
          borderRadius: '50%',
          boxShadow:
            'inset -3px -3px 0 rgba(16, 27, 77, 0.24), inset 2px 2px 0 rgba(255, 255, 255, 0.44), 0 1px 3px rgba(16, 27, 77, 0.20)',
          display: 'inline-flex',
          flex: '0 0 auto',
          height: 20,
          overflow: 'hidden',
          position: 'relative',
          width: 20,
          '&::before': {
            background:
              'linear-gradient(80deg, transparent 0 40%, #f7fbff 41% 49%, transparent 50%), linear-gradient(-80deg, transparent 0 40%, #f7fbff 41% 49%, transparent 50%)',
            content: '""',
            inset: 4,
            position: 'absolute',
          },
        }}
      />
    );
  }

  return (
    <Box
      component="span"
      aria-hidden="true"
      data-test={dataTest}
      sx={{
        bgcolor: '#ffc400',
        background:
          'linear-gradient(180deg, #c60b1e 0 28%, #ffc400 28% 72%, #c60b1e 72% 100%)',
        border: '1px solid rgba(109, 18, 22, 0.46)',
        borderRadius: '50%',
        boxShadow:
          'inset -3px -3px 0 rgba(109, 18, 22, 0.20), inset 2px 2px 0 rgba(255, 255, 255, 0.46), 0 1px 3px rgba(95, 28, 22, 0.20)',
        display: 'inline-flex',
        flex: '0 0 auto',
        height: 20,
        overflow: 'hidden',
        position: 'relative',
        width: 20,
        '&::before': {
          background:
            'radial-gradient(circle at center, transparent 0 36%, rgba(255,255,255,0.72) 37% 43%, transparent 44%), linear-gradient(40deg, transparent 0 45%, rgba(255,255,255,0.58) 46% 50%, transparent 51%), linear-gradient(-40deg, transparent 0 45%, rgba(255,255,255,0.48) 46% 50%, transparent 51%)',
          content: '""',
          inset: 3,
          opacity: 0.78,
          position: 'absolute',
        },
      }}
    />
  );
}
