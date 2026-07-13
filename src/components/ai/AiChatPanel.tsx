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
import { getWorldAccent, resolveWorldId } from '../../domain/worlds';
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
  const isForestWorld = worldId === 'forest';
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
        background: isForestWorld
          ? 'linear-gradient(145deg, rgba(246, 255, 235, 0.96) 0%, rgba(250, 240, 255, 0.94) 55%, rgba(238, 250, 229, 0.94) 100%)'
          : 'linear-gradient(145deg, rgba(232, 244, 255, 0.96) 0%, rgba(245, 255, 247, 0.94) 54%, rgba(226, 241, 252, 0.94) 100%)',
        borderColor: isForestWorld
          ? 'rgba(169, 137, 223, 0.30)'
          : 'rgba(24, 119, 201, 0.22)',
        boxShadow:
          '0 18px 42px rgba(18, 60, 105, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
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
            background: isForestWorld
              ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.68) 0%, rgba(247, 239, 255, 0.46) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.64) 0%, rgba(232, 244, 255, 0.42) 100%)',
            border: isForestWorld
              ? '1px solid rgba(169, 137, 223, 0.16)'
              : '1px solid rgba(24, 119, 201, 0.12)',
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
                    borderColor: isForestWorld
                      ? 'rgba(169, 137, 223, 0.42)'
                      : 'rgba(24, 119, 201, 0.42)',
                    borderRadius: 999,
                    color: worldAccent.dark,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: isForestWorld
                        ? 'rgba(169, 137, 223, 0.10)'
                        : 'rgba(24, 119, 201, 0.08)',
                      borderColor: isForestWorld
                        ? '#a989df'
                        : worldAccent.main,
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
                    ? isForestWorld
                      ? '#f7efff'
                      : '#dff1ff'
                    : '#eef9f2',
                border: '1px solid',
                borderColor: message.isError
                  ? '#e3a2a2'
                  : message.role === 'user'
                    ? isForestWorld
                      ? 'rgba(169, 137, 223, 0.34)'
                      : 'rgba(24, 119, 201, 0.34)'
                    : 'rgba(47, 143, 58, 0.24)',
                borderRadius: 2,
                boxShadow:
                  message.role === 'user'
                    ? isForestWorld
                      ? '0 8px 18px rgba(52, 34, 79, 0.08)'
                      : '0 8px 18px rgba(18, 60, 105, 0.08)'
                    : '0 8px 18px rgba(47, 143, 58, 0.07)',
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
                    <ShortcutKey accent={worldAccent} isForest={isForestWorld}>
                      Enter
                    </ShortcutKey>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      /
                    </Typography>
                    <ShortcutKey accent={worldAccent} isForest={isForestWorld}>
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
                  sx={isForestWorld ? forestAiSendButtonStyles : aiSendButtonStyles}
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
  isForest,
}: {
  accent: ReturnType<typeof getWorldAccent>;
  children: string;
  isForest: boolean;
}) {
  return (
    <Box
      component="span"
      sx={{
        bgcolor: isForest ? 'rgba(169, 137, 223, 0.12)' : 'rgba(24, 119, 201, 0.10)',
        border: isForest
          ? '1px solid rgba(169, 137, 223, 0.24)'
          : '1px solid rgba(24, 119, 201, 0.22)',
        borderRadius: 1.25,
        boxShadow: '0 2px 0 rgba(18, 60, 105, 0.16)',
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
    'linear-gradient(135deg, rgba(24, 119, 201, 0.96) 0%, rgba(73, 167, 232, 0.92) 48%, rgba(47, 143, 58, 0.9) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.48)',
  boxShadow:
    '0 13px 26px rgba(18, 60, 105, 0.26), 0 5px 12px rgba(47, 143, 58, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.46)',
  color: '#fffdf7',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(18, 96, 168, 0.98) 0%, rgba(86, 180, 242, 0.96) 46%, rgba(61, 158, 73, 0.96) 100%)',
    boxShadow:
      '0 16px 30px rgba(18, 60, 105, 0.32), 0 7px 16px rgba(47, 143, 58, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(126, 155, 178, 0.48) 0%, rgba(198, 223, 237, 0.44) 55%, rgba(190, 222, 197, 0.48) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.62)',
  },
};

const forestAiSendButtonStyles = {
  background:
    'linear-gradient(135deg, rgba(169, 137, 223, 0.96) 0%, rgba(205, 181, 244, 0.92) 48%, rgba(117, 168, 67, 0.92) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.52)',
  boxShadow:
    '0 13px 26px rgba(52, 34, 79, 0.20), 0 5px 12px rgba(75, 122, 44, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.50)',
  color: '#fffdf7',
  height: 48,
  transition:
    'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  width: 48,
  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(150, 115, 208, 0.98) 0%, rgba(213, 190, 250, 0.96) 46%, rgba(128, 183, 72, 0.96) 100%)',
    boxShadow:
      '0 16px 30px rgba(52, 34, 79, 0.24), 0 7px 16px rgba(75, 122, 44, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.58)',
    filter: 'saturate(1.08)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background:
      'linear-gradient(135deg, rgba(169, 137, 223, 0.34) 0%, rgba(219, 210, 232, 0.42) 55%, rgba(159, 196, 124, 0.40) 100%)',
    boxShadow: 'none',
    color: 'rgba(255, 255, 255, 0.64)',
  },
};
