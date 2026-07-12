import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';
import { AiAssistantMessage } from '../../store/aiAssistantSlice';
import { PlannedAiOperation } from '../../domain/aiOperations';
import { AiBlockedOperationPreview } from './AiBlockedOperationPreview';
import { AiOperationPreview } from './AiOperationPreview';

interface AiChatPanelProps {
  draft: string;
  isThinking: boolean;
  language: SupportedLanguage;
  messages: AiAssistantMessage[];
  onCancel: () => void;
  onClear: () => void;
  onApplyOperation: (operation: PlannedAiOperation) => void;
  onCancelPreview: () => void;
  onDraftChange: (value: string) => void;
  onRetry: (prompt: string) => void;
  onSend: () => void;
  operationError?: string;
}

export function AiChatPanel({
  draft,
  isThinking,
  language,
  messages,
  onApplyOperation,
  onCancel,
  onCancelPreview,
  onClear,
  onDraftChange,
  onRetry,
  onSend,
  operationError,
}: AiChatPanelProps) {
  const suggestions = [
    ['create_set', t(language, 'aiSuggestionCreateSet')],
    ['find_weak_cards', t(language, 'aiSuggestionFindWeakCards')],
    ['add_vocabulary', t(language, 'aiSuggestionAddVocabulary')],
  ] as const;

  return (
    <Paper
      data-test="ai_chat__panel"
      variant="outlined"
      sx={{
        display: 'flex',
        height: { xs: 430, md: 560 },
        minHeight: 0,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack data-test="ai_chat__content" spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
        <Stack
          data-test="ai_chat__header"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography data-test="ai_chat__title" component="h3" variant="h6" fontWeight={800}>
            {t(language, 'aiChatTitle')}
          </Typography>
          <Tooltip title={t(language, 'aiClearChat')}>
            <span>
              <IconButton
                aria-label={t(language, 'aiClearChat')}
                data-test="ai_chat__clear_button"
                disabled={messages.length === 0}
                onClick={onClear}
                size="small"
              >
                <DeleteSweepOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack
          data-test="ai_chat__messages"
          spacing={1}
          sx={{ flex: 1, minHeight: 220, overflowY: 'auto' }}
        >
          {messages.length === 0 && !isThinking && (
            <Stack
              data-test="ai_chat__suggestions"
              direction="row"
              flexWrap="wrap"
              gap={1}
              justifyContent="center"
              sx={{ my: 'auto' }}
            >
              {suggestions.map(([id, label]) => (
                <Button
                  data-test={`ai_chat__suggestion__${id}`}
                  key={id}
                  onClick={() => onDraftChange(label)}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 999, textTransform: 'none' }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          )}
          {messages.map((message) => (
            <Box
              data-test={`ai_chat__message__${message.id}`}
              key={message.id}
              sx={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: message.isError
                  ? '#fff1f1'
                  : message.role === 'user'
                    ? '#e8f6fb'
                    : '#f4f6f8',
                border: '1px solid',
                borderColor: message.isError ? '#e3a2a2' : 'divider',
                borderRadius: 2,
                maxWidth: '88%',
                overflowWrap: 'anywhere',
                px: 1.5,
                py: 1,
              }}
            >
              {message.content && (
                <Typography data-test={`ai_chat__message_text__${message.id}`} whiteSpace="pre-wrap">
                  {message.content}
                </Typography>
              )}
              {message.operationPreview && (
                <Box sx={{ mt: message.content ? 1 : 0 }}>
                  <AiOperationPreview
                    blockingError={
                      message.previewStatus === 'pending' ? operationError : undefined
                    }
                    language={language}
                    onApply={() => onApplyOperation(message.operationPreview!)}
                    onCancel={onCancelPreview}
                    operation={message.operationPreview}
                    status={message.previewStatus ?? 'pending'}
                  />
                </Box>
              )}
              {message.blockedPreview && (
                <Box sx={{ mt: message.content ? 1 : 0 }}>
                  <AiBlockedOperationPreview
                    language={language}
                    onCancel={onCancelPreview}
                    preview={message.blockedPreview}
                    status={message.previewStatus ?? 'pending'}
                  />
                </Box>
              )}
              {message.retryPrompt && (
                <Button
                  data-test={`ai_chat__retry_button__${message.id}`}
                  onClick={() => onRetry(message.retryPrompt!)}
                  size="small"
                  startIcon={<ReplayIcon />}
                  sx={{ mt: 0.5 }}
                >
                  {t(language, 'aiRetry')}
                </Button>
              )}
            </Box>
          ))}
          {isThinking && (
            <Stack
              data-test="ai_chat__thinking"
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ color: 'text.secondary' }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2">{t(language, 'aiThinking')}</Typography>
            </Stack>
          )}
        </Stack>

        <Stack data-test="ai_chat__composer" direction="row" spacing={1} alignItems="flex-end">
          <TextField
            data-test="ai_chat__composer_field"
            fullWidth
            label={t(language, 'aiComposerLabel')}
            maxRows={6}
            minRows={2}
            multiline
            onChange={(event) => onDraftChange(event.target.value)}
            value={draft}
          />
          {isThinking ? (
            <Tooltip title={t(language, 'aiCancelRequest')}>
              <IconButton
                aria-label={t(language, 'aiCancelRequest')}
                data-test="ai_chat__cancel_button"
                onClick={onCancel}
                color="error"
                sx={{ height: 48, width: 48 }}
              >
                <CancelOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t(language, 'aiSendMessage')}>
              <span>
                <IconButton
                  aria-label={t(language, 'aiSendMessage')}
                  color="primary"
                  data-test="ai_chat__send_button"
                  disabled={!draft.trim()}
                  onClick={onSend}
                  sx={{ height: 48, width: 48 }}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
