import { RefObject } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
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
  onApiKeyChange: (value: string) => void;
  onDelete: () => void;
  onSave: () => void;
  onToggleVisibility: () => void;
}

export function AiConnectionPanel({
  apiKey,
  inputRef,
  isKeyVisible,
  language,
  missingKey,
  onApiKeyChange,
  onDelete,
  onSave,
  onToggleVisibility,
}: AiConnectionPanelProps) {
  const visibilityLabel = t(language, isKeyVisible ? 'aiHideKey' : 'aiShowKey');

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
          <Chip
            data-test="ai_connection__model_badge"
            label="DeepSeek V4 Flash"
            size="small"
            sx={{ bgcolor: '#e8f6fb', color: '#174e69', fontWeight: 800 }}
          />
        </Stack>

        <Stack
          data-test="ai_connection__controls"
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          spacing={1}
        >
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
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack data-test="ai_connection__key_actions" direction="row" spacing={1}>
            <Button
              data-test="ai_connection__save_button"
              onClick={onSave}
              variant="contained"
              sx={{ minWidth: 104 }}
            >
              {t(language, 'aiSaveKey')}
            </Button>
            <Tooltip title={t(language, 'aiDeleteKey')}>
              <span>
                <IconButton
                  aria-label={t(language, 'aiDeleteKey')}
                  data-test="ai_connection__delete_button"
                  disabled={!apiKey}
                  onClick={onDelete}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Alert data-test="ai_connection__storage_warning" severity="warning" sx={{ py: 0 }}>
          {t(language, 'aiLocalKeyWarning')}
        </Alert>
      </Stack>
    </Paper>
  );
}
