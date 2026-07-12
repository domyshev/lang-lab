import type { KeyboardEvent } from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
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
  height?: number | string | Record<string, number | string>;
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
  showHeader?: boolean;
}

export function AiChatPanel({
  draft,
  height = { xs: 430, md: 560 },
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
  showHeader = true,
}: AiChatPanelProps) {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const canSend = Boolean(draft.trim()) && !isThinking;
  const scrollSignature = useMemo(
    () =>
      messages
        .map((message) =>
          [
            message.id,
            message.content,
            message.isError ? 'error' : 'ok',
            message.previewStatus ?? '',
            message.operationPreview?.id ?? '',
            message.blockedPreview?.title ?? '',
            message.retryPrompt ?? '',
          ].join(':'),
        )
        .join('|'),
    [messages],
  );
  const suggestions = [
    ['create_set', t(language, 'aiSuggestionCreateSet')],
    ['find_weak_cards', t(language, 'aiSuggestionFindWeakCards')],
    ['add_vocabulary', t(language, 'aiSuggestionAddVocabulary')],
  ] as const;

  useLayoutEffect(() => {
    const messagesNode = messagesRef.current;
    if (!messagesNode) {
      return;
    }

    messagesNode.scrollTop = messagesNode.scrollHeight;
  }, [isThinking, scrollSignature]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) {
      return;
    }

    event.preventDefault();
    if (canSend) {
      onSend();
    }
  };

  return (
    <Paper
      data-test="ai_chat__panel"
      variant="outlined"
      sx={{
        display: 'flex',
        height,
        minHeight: 0,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack data-test="ai_chat__content" spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
        {showHeader && (
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
        )}

        <Stack
          data-test="ai_chat__messages"
          ref={messagesRef}
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

        <Stack data-test="ai_chat__composer" direction="row" spacing={1} alignItems="center">
          <TextField
            data-test="ai_chat__composer_field"
            fullWidth
            label={t(language, 'aiComposerLabel')}
            maxRows={6}
            minRows={2}
            multiline
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleComposerKeyDown}
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
            <Tooltip
              arrow
              title={
                <Stack data-test="ai_chat__send_tooltip_content" spacing={0.75}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                    {t(language, 'aiSendMessage')}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <ShortcutKey>⌘ Enter</ShortcutKey>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      /
                    </Typography>
                    <ShortcutKey>Ctrl Enter</ShortcutKey>
                  </Stack>
                </Stack>
              }
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
                  ...({ 'data-test': 'ai_chat__send_tooltip' } as Record<string, string>),
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
            >
              <span>
                <IconButton
                  aria-label={t(language, 'aiSendMessage')}
                  data-test="ai_chat__send_button"
                  disabled={!canSend}
                  onClick={onSend}
                  sx={aiSendButtonStyles}
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

function ShortcutKey({ children }: { children: string }) {
  return (
    <Box
      component="span"
      sx={{
        bgcolor: 'rgba(126, 87, 194, 0.10)',
        border: '1px solid rgba(126, 87, 194, 0.22)',
        borderRadius: 1.25,
        boxShadow: '0 2px 0 rgba(73, 49, 116, 0.16)',
        color: '#4b3475',
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: 0,
        lineHeight: 1,
        px: 0.85,
        py: 0.55,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

const aiSendButtonStyles = {
  background:
    'linear-gradient(135deg, rgba(126, 87, 194, 0.96) 0%, rgba(190, 132, 255, 0.9) 46%, rgba(255, 203, 112, 0.96) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.48)',
  boxShadow:
    '0 13px 26px rgba(94, 64, 160, 0.28), 0 5px 12px rgba(108, 135, 74, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.46)',
  color: '#fffdf7',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(113, 73, 187, 0.98) 0%, rgba(202, 146, 255, 0.95) 44%, rgba(255, 211, 126, 1) 100%)',
    boxShadow:
      '0 16px 30px rgba(94, 64, 160, 0.34), 0 7px 16px rgba(108, 135, 74, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(158, 149, 176, 0.48) 0%, rgba(217, 207, 232, 0.44) 55%, rgba(231, 218, 184, 0.48) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.62)',
  },
};
