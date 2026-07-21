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

import { RefObject, useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import type { OpenRouterModelOption } from '../../services/openRouterKeyStorage';

interface AiConnectionPanelProps {
  apiKey: string;
  inputRef: RefObject<HTMLInputElement>;
  isKeyVisible: boolean;
  language: SupportedLanguage;
  missingKey: boolean;
  modelId: string;
  modelOptions: ReadonlyArray<OpenRouterModelOption>;
  isSaveDisabled: boolean;
  onApiKeyChange: (value: string) => void;
  onDelete: () => void;
  onModelChange: (value: string) => void;
  onSave: () => void;
  onToggleVisibility: () => void;
}

const SETTINGS_MENU_VALUE = '__connection_settings__';

export function AiConnectionPanel({
  apiKey,
  inputRef,
  isKeyVisible,
  language,
  missingKey,
  modelId,
  modelOptions,
  isSaveDisabled,
  onApiKeyChange,
  onDelete,
  onModelChange,
  onSave,
  onToggleVisibility,
}: AiConnectionPanelProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpenRouterInfoOpen, setIsOpenRouterInfoOpen] = useState(false);
  const visibilityLabel = t(language, isKeyVisible ? 'aiHideKey' : 'aiShowKey');
  const selectedModel =
    modelOptions.find((option) => option.id === modelId) ?? modelOptions[0];

  useEffect(() => {
    if (missingKey) {
      setIsSettingsOpen(true);
    }
  }, [missingKey]);

  useEffect(() => {
    if (!missingKey || !isSettingsOpen) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => window.clearTimeout(focusTimer);
  }, [inputRef, isSettingsOpen, missingKey]);

  return (
    <Box
      data-test="ai_connection__model_menu"
      onClick={(event) => event.stopPropagation()}
      onFocus={(event) => event.stopPropagation()}
      sx={{ minWidth: 0 }}
    >
      <Stack
        data-test="ai_connection__model_row"
        direction="row"
        sx={{ alignItems: 'center', minWidth: 0 }}
      >
        <FormControl
          data-test="ai_connection__model_control"
          size="small"
          sx={{
            minWidth: 176,
            '& .MuiInputLabel-root': {
              fontSize: '0.8rem',
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
            },
            '& .MuiSelect-select': {
              minHeight: '0 !important',
              py: 0.45,
            },
          }}
        >
          <InputLabel id="ai-connection-model-label">
            {t(language, 'aiModelLabel')}
          </InputLabel>
          <Select
            data-test="ai_connection__model_select"
            label={t(language, 'aiModelLabel')}
            labelId="ai-connection-model-label"
            onChange={(event) => {
              const value = event.target.value;
              if (value === SETTINGS_MENU_VALUE) {
                setIsSettingsOpen(true);
                return;
              }
              onModelChange(value);
            }}
            renderValue={(selected) =>
              modelOptions.find((option) => option.id === selected)?.label ??
              String(selected)
            }
            value={modelId}
          >
            {modelOptions.map((option) => (
              <MenuItem
                data-test={`ai_connection__model_option__${option.id}`}
                key={option.id}
                value={option.id}
              >
                <Stack spacing={0.25} sx={{ minWidth: 230 }}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800 }}>
                    {option.label}
                  </Typography>
                  <Stack spacing={0.25}>
                    <ModelRatingRow
                      label={getSpeedLabel(language)}
                      value={option.speedRating}
                    />
                    <ModelRatingRow
                      label={getCostLabel(language)}
                      value={option.costRating}
                    />
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.72rem',
                        fontWeight: 650,
                        lineHeight: 1.25,
                      }}
                    >
                      {formatCompactContextLine(option, language)}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.72rem',
                        fontWeight: 650,
                        lineHeight: 1.25,
                      }}
                    >
                      {formatCompactPriceLine(option, language)}
                    </Typography>
                  </Stack>
                </Stack>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              data-test="ai_connection__settings_option"
              value={SETTINGS_MENU_VALUE}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t(language, 'aiConnectionSettings')}</ListItemText>
            </MenuItem>
          </Select>
        </FormControl>
        <Box data-test="ai_connection__openrouter_info_wrapper" sx={{ ml: '5px' }}>
          <Tooltip
            arrow
            disableInteractive={false}
            leaveDelay={240}
            onClose={() => setIsOpenRouterInfoOpen(false)}
            onOpen={() => setIsOpenRouterInfoOpen(true)}
            open={isOpenRouterInfoOpen}
            placement="bottom"
            slotProps={{
              arrow: {
                sx: {
                  color: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(29, 26, 43, 0.98)'
                      : 'rgba(255, 255, 255, 0.98)',
                },
              },
              popper: {
                ...({
                  'data-test': 'ai_connection__openrouter_info_popper',
                } as Record<string, string>),
                sx: {
                  pointerEvents: 'auto',
                },
              },
              tooltip: {
                ...({
                  'data-test': 'ai_connection__openrouter_info_tooltip',
                } as Record<string, string>),
                sx: {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(29, 26, 43, 0.98)'
                      : 'rgba(255, 255, 255, 0.98)',
                  border: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(246, 240, 255, 0.18)'
                      : '1px solid rgba(32, 48, 21, 0.14)',
                  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.16)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: 1.38,
                  maxWidth: 320,
                  pointerEvents: 'auto',
                  px: 1.75,
                  py: 1.2,
                  userSelect: 'text',
                },
              },
            }}
            title={
              <Stack
                spacing={0.75}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onMouseEnter={() => setIsOpenRouterInfoOpen(true)}
                sx={{
                  cursor: 'text',
                  userSelect: 'text',
                }}
              >
                {selectedModel ? (
                  <Stack data-test="ai_connection__selected_model_info" spacing={0.45}>
                    <Typography
                      data-test="ai_connection__selected_model_title"
                      sx={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.3 }}
                    >
                      {selectedModel.label}
                    </Typography>
                    <Stack
                      data-test="ai_connection__selected_model_body"
                      spacing={0.7}
                      sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.35 }}
                    >
                      <Typography
                        data-test="ai_connection__selected_model_description"
                        sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.35 }}
                      >
                        {selectedModel.descriptions[language]}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.35 }}>
                        {formatPriceLine(selectedModel, language)}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.35 }}>
                        {formatContextLine(selectedModel, language)}
                      </Typography>
                      <Stack spacing={0.35} sx={{ pt: 0.2 }}>
                        <ModelRatingRow
                          label={getSpeedLabel(language)}
                          value={selectedModel.speedRating}
                        />
                        <ModelRatingRow
                          label={getCostLabel(language)}
                          value={selectedModel.costRating}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                ) : null}
                <Typography
                  data-test="ai_connection__openrouter_info_title"
                  sx={{ fontSize: '14px', fontWeight: 850, lineHeight: 1.3 }}
                >
                  OpenRouter
                </Typography>
                <Typography
                  data-test="ai_connection__openrouter_info_body"
                  sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35 }}
                >
                  {getOpenRouterInfoText(language)}
                </Typography>
                <Typography
                  data-test="ai_connection__openrouter_info_link_line"
                  sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35, mt: 0.5 }}
                >
                  {getOpenRouterOpenSitePrefix(language)}{' '}
                  <Link
                    href="https://openrouter.ai/"
                    rel="noreferrer"
                    target="_blank"
                    sx={{
                      color: '#1877c9',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 850,
                      userSelect: 'text',
                    }}
                  >
                    OpenRouter
                  </Link>
                </Typography>
              </Stack>
            }
          >
            <IconButton
              aria-label={getOpenRouterInfoLabel(language)}
              data-test="ai_connection__openrouter_info_button"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.46)',
                border: '1px solid rgba(32, 48, 21, 0.14)',
                color: '#4c6650',
                height: 24,
                width: 24,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.78)',
                },
              }}
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

        <Dialog
          aria-labelledby="ai-connection-settings-title"
          data-test="ai_connection__settings_dialog"
          fullWidth
          maxWidth="sm"
          onClose={() => setIsSettingsOpen(false)}
          open={isSettingsOpen}
        >
          <DialogTitle
            data-test="ai_connection__settings_title"
            id="ai-connection-settings-title"
            sx={{
              alignItems: 'center',
              display: 'flex',
              fontWeight: 900,
              gap: 1,
              justifyContent: 'space-between',
            }}
          >
            <span>{t(language, 'aiConnectionSettings')}</span>
            <IconButton
              aria-label={t(language, 'close')}
              data-test="ai_connection__close_settings_button"
              onClick={() => setIsSettingsOpen(false)}
              size="small"
              sx={{ color: '#6f4fa6' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent data-test="ai_connection__settings_content">
            <Stack data-test="ai_connection__controls" spacing={1.25} sx={{ pt: 0.5 }}>
              <TextField
                data-test="ai_connection__key_field"
                error={missingKey}
                fullWidth
                inputRef={inputRef}
                label={t(language, 'aiApiKeyLabel')}
                onChange={(event) => onApiKeyChange(event.target.value)}
                size="small"
                type={isKeyVisible ? 'text' : 'password'}
                value={apiKey}
                helperText={missingKey ? t(language, 'aiMissingKey') : ' '}
                slotProps={{
                  htmlInput: { 'data-test': 'ai_connection__key_input' },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={visibilityLabel}>
                          <IconButton
                            aria-label={visibilityLabel}
                            data-test="ai_connection__visibility_button"
                            edge="end"
                            onClick={onToggleVisibility}
                            size="small"
                          >
                            {isKeyVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t(language, 'aiDeleteKey')}>
                          <span>
                            <IconButton
                              aria-label={t(language, 'aiDeleteKey')}
                              data-test="ai_connection__delete_button"
                              disabled={!apiKey}
                              onClick={onDelete}
                              edge="end"
                              sx={{ ml: 0.5 }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Alert data-test="ai_connection__storage_warning" severity="warning" sx={{ py: 0.5 }}>
                {t(language, 'aiLocalKeyWarning')}
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions
            data-test="ai_connection__key_actions"
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'flex-end',
              px: 3,
              pb: 2.5,
            }}
          >
            <Button
              data-test="ai_connection__save_button"
              disabled={isSaveDisabled}
              onClick={onSave}
              variant="contained"
              sx={{ minWidth: 104 }}
            >
              {t(language, 'aiSaveKey')}
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}

const RATING_SEGMENTS = 10;

function ModelRatingRow({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <Stack
      alignItems="center"
      data-test="ai_connection__model_rating_row"
      direction="row"
      spacing={0.65}
      sx={{ minHeight: 14 }}
    >
      <Typography
        component="span"
        sx={{
          color: 'text.secondary',
          fontSize: '0.72rem',
          fontWeight: 700,
          lineHeight: 1,
          minWidth: 42,
        }}
      >
        {label}
      </Typography>
      <RatingGauge value={value} />
      <Typography
        component="span"
        sx={{
          color: 'text.secondary',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          fontWeight: 700,
          lineHeight: 1,
          minWidth: 34,
        }}
      >
        {formatRating(value)}
      </Typography>
    </Stack>
  );
}

function RatingGauge({ value }: { value: number | undefined }) {
  const filled = value === undefined ? 0 : Math.max(0, Math.min(10, Math.round(value)));

  return (
    <Box
      aria-hidden="true"
      data-test="ai_connection__model_rating_gauge"
      sx={{
        display: 'flex',
        flexShrink: 0,
        gap: '1px',
        height: 13,
        width: 29,
      }}
    >
      {Array.from({ length: RATING_SEGMENTS }, (_, index) => (
        <Box
          component="span"
          key={index}
          sx={{
            bgcolor:
              index < filled
                ? 'rgba(40, 73, 44, 0.9)'
                : 'rgba(40, 73, 44, 0.18)',
            borderRadius: '1px',
            display: 'block',
            height: '100%',
            width: 2,
          }}
        />
      ))}
    </Box>
  );
}

function formatRating(value: number | undefined): string {
  if (value === undefined) {
    return 'n/a';
  }
  const bounded = Math.max(0, Math.min(10, Math.round(value)));
  return `${bounded}/10`;
}

function formatPriceLine(
  model: OpenRouterModelOption,
  language: SupportedLanguage,
): string {
  if (
    model.inputPricePerMillion === undefined ||
    model.outputPricePerMillion === undefined
  ) {
    return getUnknownPriceText(language);
  }

  return getPriceText(
    language,
    formatUsd(model.inputPricePerMillion),
    formatUsd(model.outputPricePerMillion),
  );
}

function formatCompactPriceLine(
  model: OpenRouterModelOption,
  language: SupportedLanguage,
): string {
  if (
    model.inputPricePerMillion === undefined ||
    model.outputPricePerMillion === undefined
  ) {
    return getUnknownPriceText(language);
  }

  return getCompactPriceText(
    language,
    formatUsd(model.inputPricePerMillion),
    formatUsd(model.outputPricePerMillion),
  );
}

function formatContextLine(
  model: OpenRouterModelOption,
  language: SupportedLanguage,
): string {
  if (model.contextTokens === undefined) {
    return getUnknownContextText(language);
  }

  const context = formatTokenCount(model.contextTokens);
  const output = model.maxOutputTokens
    ? ` ${getMaxOutputText(language, formatTokenCount(model.maxOutputTokens))}`
    : '';

  return `${getContextText(language, context)}${output}`;
}

function formatCompactContextLine(
  model: OpenRouterModelOption,
  language: SupportedLanguage,
): string {
  if (model.contextTokens === undefined) {
    return getUnknownContextText(language);
  }

  return getCompactContextText(language, formatTokenCount(model.contextTokens));
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  })}`;
}

function formatTokenCount(value: number): string {
  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(2))}M`;
  }
  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(1))}k`;
  }
  return String(value);
}

function getSpeedLabel(language: SupportedLanguage): string {
  const labels: Record<SupportedLanguage, string> = {
    en: 'Speed',
    es: 'Vel',
    ru: 'Скорость',
    uk: 'Швидкість',
  };

  return labels[language];
}

function getCostLabel(language: SupportedLanguage): string {
  const labels: Record<SupportedLanguage, string> = {
    en: 'Cost efficiency',
    es: 'Eficiencia',
    ru: 'Экономичность',
    uk: 'Економічність',
  };

  return labels[language];
}

function getPriceText(
  language: SupportedLanguage,
  inputPrice: string,
  outputPrice: string,
): string {
  const texts: Record<SupportedLanguage, string> = {
    en: `Price: ${inputPrice} input / ${outputPrice} output per 1M tokens.`,
    es: `Precio: ${inputPrice} entrada / ${outputPrice} salida por 1M tokens.`,
    ru: `Цена: ${inputPrice} input / ${outputPrice} output за 1M токенов.`,
    uk: `Ціна: ${inputPrice} input / ${outputPrice} output за 1M токенів.`,
  };

  return texts[language];
}

function getCompactPriceText(
  language: SupportedLanguage,
  inputPrice: string,
  outputPrice: string,
): string {
  const texts: Record<SupportedLanguage, string> = {
    en: `Cost: ${inputPrice}/${outputPrice} per 1M`,
    es: `Coste: ${inputPrice}/${outputPrice} por 1M`,
    ru: `Стоимость: ${inputPrice}/${outputPrice} за 1M`,
    uk: `Вартість: ${inputPrice}/${outputPrice} за 1M`,
  };

  return texts[language];
}

function getUnknownPriceText(language: SupportedLanguage): string {
  const texts: Record<SupportedLanguage, string> = {
    en: 'Price: check live OpenRouter data.',
    es: 'Precio: comprueba los datos actuales en OpenRouter.',
    ru: 'Цена: проверьте актуальные данные OpenRouter.',
    uk: 'Ціна: перевірте актуальні дані OpenRouter.',
  };

  return texts[language];
}

function getContextText(language: SupportedLanguage, context: string): string {
  const texts: Record<SupportedLanguage, string> = {
    en: `Context: ${context} tokens.`,
    es: `Contexto: ${context} tokens.`,
    ru: `Контекст: ${context} токенов.`,
    uk: `Контекст: ${context} токенів.`,
  };

  return texts[language];
}

function getCompactContextText(language: SupportedLanguage, context: string): string {
  const texts: Record<SupportedLanguage, string> = {
    en: `Context: ${context}`,
    es: `Contexto: ${context}`,
    ru: `Контекст: ${context}`,
    uk: `Контекст: ${context}`,
  };

  return texts[language];
}

function getUnknownContextText(language: SupportedLanguage): string {
  const texts: Record<SupportedLanguage, string> = {
    en: 'Context: check live OpenRouter data.',
    es: 'Contexto: comprueba los datos actuales en OpenRouter.',
    ru: 'Контекст: проверьте актуальные данные OpenRouter.',
    uk: 'Контекст: перевірте актуальні дані OpenRouter.',
  };

  return texts[language];
}

function getMaxOutputText(language: SupportedLanguage, output: string): string {
  const texts: Record<SupportedLanguage, string> = {
    en: `Max output: ${output}.`,
    es: `Salida max.: ${output}.`,
    ru: `Макс. output: ${output}.`,
    uk: `Макс. output: ${output}.`,
  };

  return texts[language];
}

function getOpenRouterInfoLabel(language: SupportedLanguage): string {
  const labels: Record<SupportedLanguage, string> = {
    en: 'About OpenRouter',
    es: 'Sobre OpenRouter',
    ru: 'Об OpenRouter',
    uk: 'Про OpenRouter',
  };

  return labels[language];
}

function getOpenRouterInfoText(language: SupportedLanguage): string {
  const texts: Record<SupportedLanguage, string> = {
    en: 'OpenRouter is the gateway Language Lab uses to send chat requests to the selected model. Save your own key in the connection settings before using the assistant.',
    es: 'OpenRouter es la puerta que Language Lab usa para enviar solicitudes del chat al modelo elegido. Guarda tu propia clave en los ajustes antes de usar el asistente.',
    ru: 'OpenRouter - это шлюз, через который Language Lab отправляет запросы чата в выбранную модель. Сохраните свой ключ в настройках подключения перед использованием ассистента.',
    uk: 'OpenRouter - це шлюз, через який Language Lab надсилає запити чату до вибраної моделі. Збережіть власний ключ у налаштуваннях підключення перед використанням асистента.',
  };

  return texts[language];
}

function getOpenRouterOpenSitePrefix(language: SupportedLanguage): string {
  const labels: Record<SupportedLanguage, string> = {
    en: 'Open site',
    es: 'Abrir sitio',
    ru: 'Открыть сайт',
    uk: 'Відкрити сайт',
  };

  return labels[language];
}
