import { RefObject, useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
                    slotProps={{
                      arrow: {
                        sx: {
                          color: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(29, 26, 43, 0.98)'
                              : 'rgba(255, 255, 255, 0.98)',
                        },
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
                              ? '1px solid rgba(211, 188, 255, 0.28)'
                              : '1px solid rgba(92, 66, 142, 0.18)',
                          borderRadius: 2,
                          boxShadow:
                            '0 16px 34px rgba(67, 45, 103, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.35) inset',
                          color: (theme) =>
                            theme.palette.mode === 'dark' ? '#f6efff' : '#22331f',
                          fontSize: '14px',
                          maxWidth: 280,
                          px: 1.5,
                          py: 1.1,
                        },
                      },
                    }}
                    title={
                      <Typography sx={{ fontSize: '14px', fontWeight: 700 }}>
                        {t(language, 'aiModelRequiresOwnKey')}
                      </Typography>
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
