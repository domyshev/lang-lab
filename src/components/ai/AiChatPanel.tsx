import type { KeyboardEvent } from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
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
import { getWorldAccent, resolveWorldId, type WorldId } from '../../domain/worlds';
import { AiAssistantMessage } from '../../store/aiAssistantSlice';
import { RootState } from '../../store/store';
import { PlannedAiOperation } from '../../domain/aiOperations';
import { AiBlockedOperationPreview } from './AiBlockedOperationPreview';
import { AiMarkdownMessage } from './AiMarkdownMessage';
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
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const worldAccent = getWorldAccent(worldId);
  const chatPalette = getAiChatPalette(worldId);
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
    if (event.key !== 'Enter' || event.shiftKey) {
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
        background: chatPalette.panelBackground,
        borderColor: chatPalette.panelBorderColor,
        boxShadow: chatPalette.panelShadow,
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
          sx={{
            background: chatPalette.messagesBackground,
            border: chatPalette.messagesBorder,
            borderRadius: 2,
            flex: 1,
            minHeight: 220,
            overflowY: 'auto',
            p: 1,
          }}
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
                  sx={{
                    borderColor: chatPalette.suggestionBorderColor,
                    borderRadius: 999,
                    color: worldAccent.dark,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: chatPalette.suggestionHoverBackground,
                      borderColor: chatPalette.suggestionHoverBorderColor,
                    },
                  }}
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
                    ? chatPalette.userMessageBackground
                    : chatPalette.assistantMessageBackground,
                border: '1px solid',
                borderColor: message.isError
                  ? '#e3a2a2'
                  : message.role === 'user'
                    ? chatPalette.userMessageBorderColor
                    : chatPalette.assistantMessageBorderColor,
                borderRadius: 2,
                boxShadow:
                  message.role === 'user'
                    ? chatPalette.userMessageShadow
                    : chatPalette.assistantMessageShadow,
                maxWidth: '88%',
                overflowWrap: 'anywhere',
                px: 1.5,
                py: 1,
              }}
            >
              {message.content && (
                <AiMarkdownMessage
                  content={message.content}
                  dataTest={`ai_chat__message_text__${message.id}`}
                />
              )}
              {message.operationPreview && (
                <Box sx={{ mt: message.content ? 1 : 0 }}>
                  <AiOperationPreview
                    blockingError={
                      message.previewStatus === 'pending' ? operationError : undefined
                    }
                    language={language}
                    onApply={onApplyOperation}
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
                    <ShortcutKey accent={worldAccent} palette={chatPalette}>
                      Enter
                    </ShortcutKey>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      /
                    </Typography>
                    <ShortcutKey accent={worldAccent} palette={chatPalette}>
                      Shift Enter
                    </ShortcutKey>
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
                        ? '1px solid rgba(142, 199, 239, 0.32)'
                        : '1px solid rgba(24, 119, 201, 0.18)',
                    borderRadius: 2,
                    boxShadow:
                      '0 16px 34px rgba(18, 60, 105, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.35) inset',
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
                  sx={chatPalette.sendButtonStyles}
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

function ShortcutKey({
  accent,
  children,
  palette,
}: {
  accent: ReturnType<typeof getWorldAccent>;
  children: string;
  palette: AiChatPalette;
}) {
  return (
    <Box
      component="span"
      sx={{
        bgcolor: palette.shortcutBackground,
        border: palette.shortcutBorder,
        borderRadius: 1.25,
        boxShadow: palette.shortcutShadow,
        color: accent.dark,
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
    'linear-gradient(135deg, rgba(198, 11, 30, 0.96) 0%, rgba(255, 196, 0, 0.94) 52%, rgba(233, 111, 18, 0.94) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.48)',
  boxShadow:
    '0 13px 26px rgba(126, 55, 12, 0.24), 0 5px 12px rgba(198, 11, 30, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.46)',
  color: '#fffdf7',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(178, 9, 27, 0.98) 0%, rgba(255, 206, 42, 0.96) 46%, rgba(239, 126, 26, 0.96) 100%)',
    boxShadow:
      '0 16px 30px rgba(126, 55, 12, 0.30), 0 7px 16px rgba(198, 11, 30, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(178, 126, 111, 0.44) 0%, rgba(237, 216, 159, 0.44) 55%, rgba(220, 177, 138, 0.48) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.62)',
  },
};

const forestAiSendButtonStyles = {
  background:
    'linear-gradient(135deg, rgba(91, 150, 54, 0.96) 0%, rgba(151, 204, 78, 0.92) 48%, rgba(59, 116, 46, 0.92) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.52)',
  boxShadow:
    '0 13px 26px rgba(58, 89, 40, 0.20), 0 5px 12px rgba(75, 122, 44, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.50)',
  color: '#fffdf7',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(79, 135, 48, 0.98) 0%, rgba(161, 212, 84, 0.96) 46%, rgba(69, 133, 50, 0.96) 100%)',
    boxShadow:
      '0 16px 30px rgba(58, 89, 40, 0.24), 0 7px 16px rgba(75, 122, 44, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.58)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(91, 150, 54, 0.34) 0%, rgba(203, 224, 176, 0.42) 55%, rgba(159, 196, 124, 0.40) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.64)',
  },
};

const starTrekAiSendButtonStyles = {
  background:
    'linear-gradient(135deg, rgba(16, 27, 77, 0.96) 0%, rgba(63, 136, 255, 0.94) 48%, rgba(243, 184, 51, 0.94) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.58)',
  boxShadow:
    '0 13px 26px rgba(16, 27, 77, 0.24), 0 5px 12px rgba(63, 136, 255, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.52)',
  color: '#f7fbff',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(11, 22, 70, 0.98) 0%, rgba(76, 150, 255, 0.96) 44%, rgba(255, 198, 72, 0.96) 100%)',
    boxShadow:
      '0 16px 30px rgba(16, 27, 77, 0.30), 0 7px 16px rgba(63, 136, 255, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.60)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(83, 95, 138, 0.44) 0%, rgba(173, 201, 239, 0.42) 55%, rgba(230, 203, 136, 0.42) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.66)',
  },
};

interface AiChatPalette {
  assistantMessageBackground: string;
  assistantMessageBorderColor: string;
  assistantMessageShadow: string;
  messagesBackground: string;
  messagesBorder: string;
  panelBackground: string;
  panelBorderColor: string;
  panelShadow: string;
  sendButtonStyles: typeof aiSendButtonStyles;
  shortcutBackground: string;
  shortcutBorder: string;
  shortcutShadow: string;
  suggestionBorderColor: string;
  suggestionHoverBackground: string;
  suggestionHoverBorderColor: string;
  userMessageBackground: string;
  userMessageBorderColor: string;
  userMessageShadow: string;
}

function getAiChatPalette(worldId: WorldId): AiChatPalette {
  if (worldId === 'forest') {
    return forestAiChatPalette;
  }

  if (worldId === 'starTrek') {
    return starTrekAiChatPalette;
  }

  return footballAiChatPalette;
}

const footballAiChatPalette: AiChatPalette = {
  assistantMessageBackground: '#fff8e2',
  assistantMessageBorderColor: 'rgba(233, 111, 18, 0.24)',
  assistantMessageShadow: '0 8px 18px rgba(233, 111, 18, 0.08)',
  messagesBackground:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 236, 188, 0.48) 100%)',
  messagesBorder: '1px solid rgba(198, 11, 30, 0.14)',
  panelBackground:
    'linear-gradient(145deg, rgba(255, 248, 217, 0.98) 0%, rgba(255, 232, 194, 0.95) 48%, rgba(255, 239, 211, 0.94) 100%)',
  panelBorderColor: 'rgba(198, 11, 30, 0.22)',
  panelShadow:
    '0 18px 42px rgba(126, 55, 12, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.76)',
  sendButtonStyles: aiSendButtonStyles,
  shortcutBackground: 'rgba(255, 196, 0, 0.16)',
  shortcutBorder: '1px solid rgba(198, 11, 30, 0.24)',
  shortcutShadow: '0 2px 0 rgba(126, 55, 12, 0.16)',
  suggestionBorderColor: 'rgba(198, 11, 30, 0.36)',
  suggestionHoverBackground: 'rgba(255, 196, 0, 0.16)',
  suggestionHoverBorderColor: '#c60b1e',
  userMessageBackground: '#fff0c8',
  userMessageBorderColor: 'rgba(198, 11, 30, 0.30)',
  userMessageShadow: '0 8px 18px rgba(126, 55, 12, 0.10)',
};

const forestAiChatPalette: AiChatPalette = {
  assistantMessageBackground: '#eef9f2',
  assistantMessageBorderColor: 'rgba(47, 143, 58, 0.24)',
  assistantMessageShadow: '0 8px 18px rgba(47, 143, 58, 0.07)',
  messagesBackground:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.70) 0%, rgba(239, 251, 228, 0.52) 100%)',
  messagesBorder: '1px solid rgba(91, 150, 54, 0.16)',
  panelBackground:
    'linear-gradient(145deg, rgba(246, 255, 235, 0.96) 0%, rgba(239, 251, 228, 0.94) 55%, rgba(232, 247, 221, 0.94) 100%)',
  panelBorderColor: 'rgba(91, 150, 54, 0.26)',
  panelShadow:
    '0 18px 42px rgba(58, 89, 40, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
  sendButtonStyles: forestAiSendButtonStyles,
  shortcutBackground: 'rgba(91, 150, 54, 0.12)',
  shortcutBorder: '1px solid rgba(91, 150, 54, 0.26)',
  shortcutShadow: '0 2px 0 rgba(58, 89, 40, 0.16)',
  suggestionBorderColor: 'rgba(91, 150, 54, 0.42)',
  suggestionHoverBackground: 'rgba(91, 150, 54, 0.10)',
  suggestionHoverBorderColor: '#75a843',
  userMessageBackground: '#edf9e8',
  userMessageBorderColor: 'rgba(91, 150, 54, 0.34)',
  userMessageShadow: '0 8px 18px rgba(58, 89, 40, 0.08)',
};

const starTrekAiChatPalette: AiChatPalette = {
  assistantMessageBackground: '#f5f9ff',
  assistantMessageBorderColor: 'rgba(63, 136, 255, 0.22)',
  assistantMessageShadow: '0 8px 18px rgba(16, 27, 77, 0.08)',
  messagesBackground:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(226, 239, 255, 0.58) 100%)',
  messagesBorder: '1px solid rgba(63, 136, 255, 0.18)',
  panelBackground:
    'linear-gradient(145deg, rgba(236, 246, 255, 0.98) 0%, rgba(218, 232, 255, 0.95) 46%, rgba(255, 232, 194, 0.90) 100%)',
  panelBorderColor: 'rgba(63, 136, 255, 0.30)',
  panelShadow:
    '0 18px 42px rgba(16, 27, 77, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.78)',
  sendButtonStyles: starTrekAiSendButtonStyles,
  shortcutBackground: 'rgba(63, 136, 255, 0.14)',
  shortcutBorder: '1px solid rgba(63, 136, 255, 0.28)',
  shortcutShadow: '0 2px 0 rgba(16, 27, 77, 0.16)',
  suggestionBorderColor: 'rgba(63, 136, 255, 0.38)',
  suggestionHoverBackground: 'rgba(243, 184, 51, 0.18)',
  suggestionHoverBorderColor: '#3f88ff',
  userMessageBackground: '#eaf2ff',
  userMessageBorderColor: 'rgba(63, 136, 255, 0.32)',
  userMessageShadow: '0 8px 18px rgba(16, 27, 77, 0.10)',
};
