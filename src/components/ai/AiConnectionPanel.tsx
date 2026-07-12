import { RefObject, useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

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
    <Paper
      data-test="ai_connection__panel"
      variant="outlined"
      sx={{ borderColor: 'rgba(37, 118, 150, 0.24)', p: { xs: 1.5, sm: 2 } }}
    >
      <Stack data-test="ai_connection__content" spacing={1.25}>
        <Stack
          data-test="ai_connection__header"
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography data-test="ai_connection__title" component="h3" variant="h6" fontWeight={800}>
            {t(language, 'aiConnectionTitle')}
          </Typography>
          <FormControl data-test="ai_connection__model_control" size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="ai-connection-model-label">
              {t(language, 'aiModelLabel')}
            </InputLabel>
            <Select
              data-test="ai_connection__model_select"
              label={t(language, 'aiModelLabel')}
              labelId="ai-connection-model-label"
              onChange={(event) => onModelChange(event.target.value)}
              value={modelId}
            >
              {modelOptions.map((option) => (
                <MenuItem
                  data-test={`ai_connection__model_option__${option.id}`}
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            aria-label={t(language, 'aiConnectionSettings')}
            data-test="ai_connection__settings_button"
            onClick={() => setIsSettingsOpen(true)}
            sx={{
              border: '1px solid rgba(111, 79, 166, 0.28)',
              color: '#6f4fa6',
            }}
          >
            <SettingsOutlinedIcon />
          </IconButton>
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
      </Stack>
    </Paper>
  );
}
