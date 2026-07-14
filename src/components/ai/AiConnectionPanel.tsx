import { RefObject, useEffect, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
import { OPENROUTER_GPT_MODEL_ID } from '../../services/openRouterKeyStorage';

interface AiConnectionPanelProps {
  apiKey: string;
  inputRef: RefObject<HTMLInputElement>;
  isKeyVisible: boolean;
  language: SupportedLanguage;
  missingKey: boolean;
  modelId: string;
  modelOptions: ReadonlyArray<{ id: string; label: string }>;
  isRestoreTrialAvailable: boolean;
  isSaveDisabled: boolean;
  isTrialKeySelected: boolean;
  onApiKeyChange: (value: string) => void;
  onDelete: () => void;
  onModelChange: (value: string) => void;
  onRestoreTrial: () => void;
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
  isRestoreTrialAvailable,
  isSaveDisabled,
  isTrialKeySelected,
  onApiKeyChange,
  onDelete,
  onModelChange,
  onRestoreTrial,
  onSave,
  onToggleVisibility,
}: AiConnectionPanelProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpenRouterInfoOpen, setIsOpenRouterInfoOpen] = useState(false);
  const visibilityLabel = t(language, isKeyVisible ? 'aiHideKey' : 'aiShowKey');

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
              if (isTrialKeySelected && value === OPENROUTER_GPT_MODEL_ID) {
                return;
              }
              onModelChange(value);
            }}
            value={modelId}
          >
            {modelOptions.map((option) => {
              const isLocked = isTrialKeySelected && option.id === OPENROUTER_GPT_MODEL_ID;

              return (
                <MenuItem
                  data-test={`ai_connection__model_option__${option.id}`}
                  disabled={isLocked}
                  key={option.id}
                  sx={
                    isLocked
                      ? {
                          cursor: 'not-allowed',
                          opacity: 0.46,
                          pointerEvents: 'auto',
                          '&.Mui-disabled': {
                            opacity: 0.46,
                            pointerEvents: 'auto',
                          },
                        }
                      : undefined
                  }
                  value={option.id}
                >
                  {isLocked ? (
                    <Tooltip
                      arrow
                      placement="left"
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
                            'data-test': 'ai_connection__locked_model_tooltip_popper',
                          } as Record<string, string>),
                          modifiers: [
                            {
                              name: 'flip',
                              enabled: false,
                            },
                          ],
                        },
                        tooltip: {
                          ...({
                            'data-test': 'ai_connection__locked_model_tooltip',
                          } as Record<string, string>),
                          sx: {
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(29, 26, 43, 0.98)'
                                : 'rgba(255, 255, 255, 0.98)',
                            border: (theme) =>
                              theme.palette.mode === 'dark'
                                ? '1px solid rgba(239, 210, 116, 0.34)'
                                : '1px solid rgba(166, 113, 216, 0.24)',
                            borderRadius: 2.5,
                            boxShadow:
                              '0 18px 38px rgba(67, 45, 103, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.48) inset',
                            color: (theme) =>
                              theme.palette.mode === 'dark' ? '#f9f0ff' : '#33402d',
                            fontSize: '14px',
                            maxWidth: 280,
                            px: 1.75,
                            py: 1.25,
                          },
                        },
                      }}
                      title={
                        <Stack spacing={0.75}>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <Box
                              aria-hidden="true"
                              data-test="ai_connection__locked_model_tooltip_badge"
                              sx={{
                                alignItems: 'center',
                                background:
                                  'linear-gradient(135deg, #fff0a8 0%, #f0dcff 100%)',
                                border: '1px solid rgba(128, 78, 204, 0.22)',
                                borderRadius: 999,
                                color: '#6845b8',
                                display: 'inline-flex',
                                fontSize: 11,
                                fontWeight: 850,
                                gap: 0.35,
                                letterSpacing: '0.02em',
                                px: 0.9,
                                py: 0.25,
                                textTransform: 'uppercase',
                              }}
                            >
                              <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                              OpenRouter
                            </Box>
                          </Stack>
                          <Typography
                            data-test="ai_connection__locked_model_tooltip_body"
                            sx={{
                              color: (theme) =>
                                theme.palette.mode === 'dark' ? '#efe5ff' : '#4b5745',
                              fontSize: '14px',
                              fontWeight: 500,
                              lineHeight: 1.35,
                            }}
                          >
                            {t(language, 'aiModelRequiresOwnKey')}
                          </Typography>
                        </Stack>
                      }
                    >
                      <Box
                        data-test={`ai_connection__model_option__${option.id}__locked_content`}
                        sx={{ pointerEvents: 'auto', width: '100%' }}
                      >
                        {option.label}
                      </Box>
                    </Tooltip>
                  ) : (
                    option.label
                  )}
                </MenuItem>
              );
            })}
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
              {isTrialKeySelected && (
                <Alert
                  data-test="ai_connection__trial_key_notice"
                  severity="info"
                  sx={{ py: 0.5 }}
                >
                  {t(language, 'aiBuiltInKeyNotice')}
                </Alert>
              )}
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
              justifyContent: 'space-between',
              px: 3,
              pb: 2.5,
            }}
          >
            <Button
              data-test="ai_connection__restore_trial_button"
              disabled={!isRestoreTrialAvailable}
              onClick={onRestoreTrial}
              variant="outlined"
            >
              {t(language, 'aiRestoreTrialKey')}
            </Button>
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
    en: 'OpenRouter is the gateway Language Lab uses to send chat requests to the selected model. You can use the built-in limited key or save your own key in the connection settings.',
    es: 'OpenRouter es la puerta que Language Lab usa para enviar solicitudes del chat al modelo elegido. Puedes usar la clave integrada limitada o guardar tu propia clave en los ajustes.',
    ru: 'OpenRouter - это шлюз, через который Language Lab отправляет запросы чата в выбранную модель. Можно пользоваться встроенным ключом с лимитом или сохранить свой ключ в настройках подключения.',
    uk: 'OpenRouter - це шлюз, через який Language Lab надсилає запити чату до вибраної моделі. Можна користуватися вбудованим ключем з лімітом або зберегти власний ключ у налаштуваннях.',
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
