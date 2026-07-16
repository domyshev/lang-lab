import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  AiRollbackConflict,
  AppliedAiOperation,
  PlannedAiOperation,
  findAiRollbackConflict,
} from '../domain/aiOperations';
import { t } from '../domain/i18n';
import { AiAgentFailure, runAiAssistant } from '../services/aiAssistantAgent';
import {
  OPENROUTER_AVAILABLE_MODELS,
  OPENROUTER_GPT_MODEL_ID,
  OPENROUTER_TRIAL_MODEL_ID,
  isOpenRouterTrialKey,
  loadOpenRouterKey,
  loadOpenRouterModel,
  removeOpenRouterKey,
  restoreOpenRouterTrialKey,
  saveOpenRouterModel,
  saveOpenRouterKey,
} from '../services/openRouterKeyStorage';
import { applyAiOperation, revertAiOperation } from '../store/aiAssistantActions';
import {
  appendAiMessage,
  cancelStagedAiOperation,
  clearAiChat,
  stageBlockedAiPreviewMessage,
  stageAiOperationMessage,
} from '../store/aiAssistantSlice';
import {
  loadServerCredentials,
  loadChatMessages,
  saveChatMessages,
} from '../services/serverSyncClient';
import { AppDispatch, RootState } from '../store/store';
import { AiChatPanel } from './ai/AiChatPanel';
import { AiConnectionPanel } from './ai/AiConnectionPanel';
import { AiOperationHistory } from './ai/AiOperationHistory';
import { ManualCardImportPanel } from './ManualCardImportPanel';

interface AiAssistantViewProps {
  collapsible?: boolean;
  dataTest?: string;
  embedded?: boolean;
  openSignal?: number;
  showManualImport?: boolean;
}

export function AiAssistantView({
  collapsible = true,
  dataTest = 'ai_assistant__page',
  embedded = false,
  openSignal,
  showManualImport = true,
}: AiAssistantViewProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const storeRef = useStore();
  const keyStorageRef = useRef<Storage>(getOpenRouterStorage());
  const cards = useSelector((state: RootState) => state.cards.cards);
  const cardSets = useSelector((state: RootState) => state.cardSets.cardSets);
  const attempts = useSelector((state: RootState) => state.attempts.attempts);
  const cardStats = useSelector((state: RootState) => state.stats.cardStats);
  const interfaceLanguage = useSelector((state: RootState) => state.app.interfaceLanguage);
  const { blockedPreview, messages, operationError, operations, stagedOperation } = useSelector(
    (state: RootState) => state.aiAssistant,
  );
  const [apiKey, setApiKey] = useState(() => loadOpenRouterKey(keyStorageRef.current));
  const [savedApiKey, setSavedApiKey] = useState(() =>
    loadOpenRouterKey(keyStorageRef.current),
  );
  const [modelId, setModelId] = useState(() => loadOpenRouterModel(keyStorageRef.current));
  const [draft, setDraft] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [rollbackConflict, setRollbackConflict] = useState<AiRollbackConflict | null>(null);
  const [isChatSynced, setIsChatSynced] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serverCredentials = useMemo(() => {
    try {
      return loadServerCredentials();
    } catch {
      return { apiKey: '', endpoint: '' };
    }
  }, []);

  useEffect(() => {
    if (!serverCredentials.apiKey || isChatSynced) {
      return;
    }

    setIsChatSynced(true);
    loadChatMessages(serverCredentials).then((loadedMessages) => {
      if (loadedMessages.length === 0) {
        return;
      }

      dispatch(clearAiChat());
      for (const message of loadedMessages) {
        dispatch(appendAiMessage(message));
      }
    }).catch(() => {
      // Silently ignore server errors on chat load
    });
  }, [serverCredentials, dispatch, isChatSynced]);

  useEffect(() => {
    if (!serverCredentials.apiKey || messages.length === 0) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveChatMessages({
        apiKey: serverCredentials.apiKey,
        endpoint: serverCredentials.endpoint,
        messages,
      }).catch(() => {
        // Silently ignore server errors on chat save
      });
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, serverCredentials]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (openSignal === undefined) {
      return;
    }

    setIsChatExpanded(true);
  }, [openSignal]);

  const isTrialKeySelected = isOpenRouterTrialKey(savedApiKey);

  useEffect(() => {
    if (!isTrialKeySelected || modelId !== OPENROUTER_GPT_MODEL_ID) {
      return;
    }

    saveOpenRouterModel(OPENROUTER_TRIAL_MODEL_ID, keyStorageRef.current);
    setModelId(OPENROUTER_TRIAL_MODEL_ID);
  }, [isTrialKeySelected, modelId]);

  const sendPrompt = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || isThinking) {
        return;
      }
      const key = apiKey.trim();
      if (!key) {
        setMissingKey(true);
        setIsKeyVisible(true);
        keyInputRef.current?.focus();
        return;
      }

      setMissingKey(false);
      setDraft('');
      const createdAt = new Date().toISOString();
      dispatch(
        appendAiMessage({
          id: createUiId('user-message'),
          role: 'user',
          content: prompt,
          createdAt,
        }),
      );

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsThinking(true);
      try {
        const result = await runAiAssistant({
          apiKey: key,
          modelId,
          userMessage: prompt,
          chatHistory: messages.map(({ role, content }) => ({ role, content })),
          snapshot: { attempts, cards, cardSets, cardStats, interfaceLanguage },
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        if (result.ok) {
          if (result.stagedOperation) {
            dispatch(
              stageAiOperationMessage({
                operation: result.stagedOperation,
                message: {
                  id: createUiId('assistant-message'),
                  role: 'assistant',
                  content: stripAiOperationVerbalConfirmation(result.content),
                  createdAt: new Date().toISOString(),
                  operationPreview: result.stagedOperation,
                  previewStatus: 'pending',
                },
              }),
            );
          } else {
            dispatch(
              appendAiMessage({
                id: createUiId('assistant-message'),
                role: 'assistant',
                content: result.content,
                createdAt: new Date().toISOString(),
              }),
            );
          }
          return;
        }
        if (result.blockedPreview) {
          dispatch(
            stageBlockedAiPreviewMessage({
              preview: result.blockedPreview,
              message: {
                id: createUiId('assistant-blocked-preview'),
                role: 'assistant',
                content: failureMessage(interfaceLanguage, result.failure),
                createdAt: new Date().toISOString(),
                blockedPreview: result.blockedPreview,
                previewStatus: 'pending',
                isError: true,
                retryPrompt: prompt,
              },
            }),
          );
          return;
        }
        if (result.failure.kind !== 'cancelled') {
          appendSafeError(
            dispatch,
            failureMessage(interfaceLanguage, result.failure),
            prompt,
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          appendSafeError(
            dispatch,
            t(interfaceLanguage, 'aiErrorNetwork'),
            prompt,
          );
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsThinking(false);
        }
      }
    },
    [
      apiKey,
      attempts,
      cardSets,
      cardStats,
      cards,
      dispatch,
      interfaceLanguage,
      isThinking,
      messages,
      modelId,
    ],
  );

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsThinking(false);
  };

  const handleClearChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsThinking(false);
    dispatch(clearAiChat());
    if (serverCredentials.apiKey) {
      saveChatMessages({
        apiKey: serverCredentials.apiKey,
        endpoint: serverCredentials.endpoint,
        messages: [],
      }).catch(() => {});
    }
  };

  const handleConfirmClearChat = () => {
    handleClearChat();
    setIsClearChatDialogOpen(false);
  };

  const handleApplyOperation = (operation: PlannedAiOperation) => {
    const operationCountBefore =
      (storeRef.getState() as RootState).aiAssistant.operations.length;
    dispatch(
      applyAiOperation({
        operation,
        appliedAt: new Date().toISOString(),
      }),
    );
    const operationsAfter = (storeRef.getState() as RootState).aiAssistant.operations;
    if (
      operationsAfter.length <= operationCountBefore ||
      operationsAfter[0]?.id !== operation.id
    ) {
      return;
    }
    dispatch(
      appendAiMessage({
        id: createUiId('assistant-operation-applied'),
        role: 'assistant',
        content: t(interfaceLanguage, 'aiChangesAppliedMessage'),
        createdAt: new Date().toISOString(),
      }),
    );
  };

  const displayedMessages = useMemo(() => {
    const result = [...messages];
    if (
      stagedOperation &&
      !result.some((message) => message.operationPreview?.id === stagedOperation.id)
    ) {
      result.push({
        id: `staged-operation-${stagedOperation.id}`,
        role: 'assistant',
        content: '',
        createdAt: stagedOperation.createdAt,
        operationPreview: stagedOperation,
        previewStatus: 'pending',
      });
    }
    if (
      blockedPreview &&
      !result.some((message) => message.blockedPreview === blockedPreview)
    ) {
      result.push({
        id: `blocked-preview-${blockedPreview.title ?? 'operation'}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        blockedPreview,
        previewStatus: 'pending',
      });
    }
    return result;
  }, [blockedPreview, messages, stagedOperation]);

  const handleRollback = (operation: AppliedAiOperation) => {
    const operationIndex = operations.findIndex(
      (candidate) => candidate.id === operation.id,
    );
    const conflict = findAiRollbackConflict({
      operation,
      cards,
      cardSets,
      laterOperations: operations
        .slice(0, operationIndex)
        .filter((candidate) => candidate.status === 'applied'),
    });
    if (conflict) {
      setRollbackConflict(conflict);
      return;
    }
    dispatch(
      revertAiOperation({
        operationId: operation.id,
        revertedAt: new Date().toISOString(),
      }),
    );
  };

  return (
    <Stack
      data-test={dataTest}
      spacing={embedded ? 1.5 : 2.5}
      sx={embedded ? { maxWidth: 760, minHeight: 0, mx: 'auto', width: '100%' } : undefined}
    >
      {!embedded && (
        <Typography data-test="ai_assistant__title" component="h2" variant="h5" fontWeight={900}>
          {t(interfaceLanguage, 'aiAssistantTitle')}
        </Typography>
      )}

      <Box
        data-test="ai_assistant__workspace"
        sx={{
          minHeight: 0,
          width: '100%',
        }}
      >
        {collapsible ? (
        <Accordion
          data-test="ai_assistant__chat_accordion"
          disableGutters
          expanded={isChatExpanded}
          onChange={(_, isExpanded) => setIsChatExpanded(isExpanded)}
          sx={{
            bgcolor: '#fff',
            border: '1px solid rgba(40, 60, 34, 0.12)',
            borderRadius: '12px !important',
            boxShadow: '0 10px 24px rgba(32, 45, 26, 0.08)',
            overflow: 'hidden',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            component="div"
            data-test="ai_assistant__chat_summary"
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 56,
              px: { xs: 1.5, sm: 2 },
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1,
                my: 1,
              },
            }}
          >
            <Stack
              data-test="ai_assistant__chat_summary_content"
              sx={{
                alignItems: 'center',
                display: 'grid',
                gap: 1,
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                },
                minWidth: 0,
                width: '100%',
              }}
            >
              <Typography
                data-test="ai_chat__title"
                component="h3"
                variant="h6"
                fontWeight={800}
                sx={{ minWidth: 0 }}
              >
                {t(interfaceLanguage, 'aiChatTitle')}
              </Typography>
              <AiConnectionPanel
                apiKey={apiKey}
                inputRef={keyInputRef}
                isKeyVisible={isKeyVisible}
                isRestoreTrialAvailable={!isOpenRouterTrialKey(savedApiKey)}
                isSaveDisabled={apiKey.trim() === savedApiKey.trim()}
                isTrialKeySelected={isTrialKeySelected}
                language={interfaceLanguage}
                missingKey={missingKey}
                modelId={modelId}
                modelOptions={OPENROUTER_AVAILABLE_MODELS}
                onApiKeyChange={(value) => {
                  setApiKey(value);
                  if (value.trim()) setMissingKey(false);
                }}
                onDelete={() => {
                  removeOpenRouterKey(keyStorageRef.current);
                  setApiKey('');
                  setSavedApiKey('');
                  setIsKeyVisible(false);
                }}
                onModelChange={(value) => {
                  if (isTrialKeySelected && value === OPENROUTER_GPT_MODEL_ID) {
                    return;
                  }
                  saveOpenRouterModel(value, keyStorageRef.current);
                  setModelId(loadOpenRouterModel(keyStorageRef.current));
                }}
                onRestoreTrial={() => {
                  restoreOpenRouterTrialKey(keyStorageRef.current);
                  const storedKey = loadOpenRouterKey(keyStorageRef.current);
                  setApiKey(storedKey);
                  setSavedApiKey(storedKey);
                  setMissingKey(false);
                }}
                onSave={() => {
                  saveOpenRouterKey(apiKey, keyStorageRef.current);
                  const storedKey = loadOpenRouterKey(keyStorageRef.current);
                  setApiKey(storedKey);
                  setSavedApiKey(storedKey);
                  setMissingKey(!storedKey);
                }}
                onToggleVisibility={() => setIsKeyVisible((visible) => !visible)}
              />
              <Stack
                data-test="ai_assistant__chat_summary_actions"
                direction="row"
                alignItems="center"
                spacing={0.5}
                onClick={(event) => event.stopPropagation()}
                onFocus={(event) => event.stopPropagation()}
                sx={{ justifySelf: 'end', mr: '20px' }}
              >
                <Tooltip title={t(interfaceLanguage, 'aiHistoryTitle')}>
                  <IconButton
                    aria-label={t(interfaceLanguage, 'aiHistoryTitle')}
                    data-test="ai_assistant__operation_history_button"
                    onClick={() => setIsHistoryOpen(true)}
                    size="small"
                    sx={chatHeaderActionButtonSx}
                  >
                    <HistoryIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t(interfaceLanguage, 'aiClearChat')}>
                  <span>
                    <IconButton
                      aria-label={t(interfaceLanguage, 'aiClearChat')}
                      data-test="ai_chat__clear_button"
                      disabled={displayedMessages.length === 0}
                      onClick={() => setIsClearChatDialogOpen(true)}
                      size="small"
                      sx={chatHeaderActionButtonSx}
                    >
                      <DeleteSweepOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </AccordionSummary>
          <AccordionDetails
            data-test="ai_assistant__chat_details"
            sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pt: 0 }}
          >
            <Stack data-test="ai_assistant__chat_details_content" spacing={1}>
              <AiChatPanel
                draft={draft}
                height={400}
                isThinking={isThinking}
                language={interfaceLanguage}
                messages={displayedMessages}
                operationError={operationError}
                onApplyOperation={handleApplyOperation}
                onCancel={handleCancel}
                onClear={handleClearChat}
                onCancelPreview={() => dispatch(cancelStagedAiOperation())}
                onDraftChange={setDraft}
                onRetry={sendPrompt}
                onSend={() => void sendPrompt(draft)}
                showHeader={false}
              />
              <Box
                data-test="ai_assistant__collapse_chat_action_row"
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  mt: '5px',
                }}
              >
                <Button
                  data-test="ai_assistant__collapse_chat_button"
                  onClick={() => setIsChatExpanded(false)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(91, 76, 115, 0.36)',
                    borderRadius: 999,
                    color: 'rgba(91, 76, 115, 0.88)',
                    fontWeight: 800,
                    px: 2,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(118, 90, 151, 0.08)',
                      borderColor: 'rgba(91, 76, 115, 0.52)',
                    },
                  }}
                >
                  {t(interfaceLanguage, 'aiCollapseChat')}
                </Button>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
        ) : (
          <Paper
            data-test="ai_assistant__chat_surface"
            variant="outlined"
            sx={{
              bgcolor: '#fff',
              border: '1px solid rgba(40, 60, 34, 0.12)',
              borderRadius: 3,
              boxShadow: '0 10px 24px rgba(32, 45, 26, 0.08)',
              overflow: 'hidden',
            }}
          >
            <Box
              data-test="ai_assistant__chat_header"
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1.5,
              }}
            >
              <Stack
                data-test="ai_assistant__chat_summary_content"
                sx={{
                  alignItems: 'center',
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    sm: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                  },
                  minWidth: 0,
                  width: '100%',
                }}
              >
                <Typography
                  data-test="ai_chat__title"
                  component="h3"
                  variant="h6"
                  fontWeight={800}
                  sx={{ minWidth: 0 }}
                >
                  {t(interfaceLanguage, 'aiChatTitle')}
                </Typography>
                <AiConnectionPanel
                  apiKey={apiKey}
                  inputRef={keyInputRef}
                  isKeyVisible={isKeyVisible}
                  isRestoreTrialAvailable={!isOpenRouterTrialKey(savedApiKey)}
                  isSaveDisabled={apiKey.trim() === savedApiKey.trim()}
                  isTrialKeySelected={isTrialKeySelected}
                  language={interfaceLanguage}
                  missingKey={missingKey}
                  modelId={modelId}
                  modelOptions={OPENROUTER_AVAILABLE_MODELS}
                  onApiKeyChange={(value) => {
                    setApiKey(value);
                    if (value.trim()) setMissingKey(false);
                  }}
                  onDelete={() => {
                    removeOpenRouterKey(keyStorageRef.current);
                    setApiKey('');
                    setSavedApiKey('');
                    setIsKeyVisible(false);
                  }}
                  onModelChange={(value) => {
                    if (isTrialKeySelected && value === OPENROUTER_GPT_MODEL_ID) {
                      return;
                    }
                    saveOpenRouterModel(value, keyStorageRef.current);
                    setModelId(loadOpenRouterModel(keyStorageRef.current));
                  }}
                  onRestoreTrial={() => {
                    restoreOpenRouterTrialKey(keyStorageRef.current);
                    const storedKey = loadOpenRouterKey(keyStorageRef.current);
                    setApiKey(storedKey);
                    setSavedApiKey(storedKey);
                    setMissingKey(false);
                  }}
                  onSave={() => {
                    saveOpenRouterKey(apiKey, keyStorageRef.current);
                    const storedKey = loadOpenRouterKey(keyStorageRef.current);
                    setApiKey(storedKey);
                    setSavedApiKey(storedKey);
                    setMissingKey(!storedKey);
                  }}
                  onToggleVisibility={() => setIsKeyVisible((visible) => !visible)}
                />
                <Stack
                  data-test="ai_assistant__chat_summary_actions"
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ justifySelf: 'end', mr: '20px' }}
                >
                  <Tooltip title={t(interfaceLanguage, 'aiHistoryTitle')}>
                    <IconButton
                      aria-label={t(interfaceLanguage, 'aiHistoryTitle')}
                      data-test="ai_assistant__operation_history_button"
                      onClick={() => setIsHistoryOpen(true)}
                      size="small"
                      sx={chatHeaderActionButtonSx}
                    >
                      <HistoryIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t(interfaceLanguage, 'aiClearChat')}>
                    <span>
                      <IconButton
                        aria-label={t(interfaceLanguage, 'aiClearChat')}
                        data-test="ai_chat__clear_button"
                        disabled={displayedMessages.length === 0}
                        onClick={() => setIsClearChatDialogOpen(true)}
                        size="small"
                        sx={chatHeaderActionButtonSx}
                      >
                        <DeleteSweepOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
            <Box
              data-test="ai_assistant__chat_details"
              sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pt: 0 }}
            >
              <Stack data-test="ai_assistant__chat_details_content" spacing={1}>
                <AiChatPanel
                  draft={draft}
                  height={400}
                  isThinking={isThinking}
                  language={interfaceLanguage}
                  messages={displayedMessages}
                  operationError={operationError}
                  onApplyOperation={handleApplyOperation}
                  onCancel={handleCancel}
                  onClear={handleClearChat}
                  onCancelPreview={() => dispatch(cancelStagedAiOperation())}
                  onDraftChange={setDraft}
                  onRetry={sendPrompt}
                  onSend={() => void sendPrompt(draft)}
                  showHeader={false}
                />
              </Stack>
            </Box>
          </Paper>
        )}

        <Dialog
          aria-labelledby="ai-operation-history-dialog-title"
          data-test="ai_assistant__operation_history_dialog"
          fullWidth
          maxWidth="sm"
          onClose={() => setIsHistoryOpen(false)}
          open={isHistoryOpen}
        >
          <DialogTitle
            data-test="ai_assistant__operation_history_dialog_title"
            id="ai-operation-history-dialog-title"
            sx={{ fontWeight: 900 }}
          >
            {t(interfaceLanguage, 'aiHistoryTitle')}
          </DialogTitle>
          <DialogContent
            data-test="ai_assistant__operation_history_dialog_content"
            sx={{
              height: { xs: '70vh', sm: 560 },
              minHeight: 0,
              overflow: 'hidden',
              pt: 1,
            }}
          >
            <AiOperationHistory
              conflict={rollbackConflict}
              containerSx={{ border: 0, height: '100%', p: 0 }}
              language={interfaceLanguage}
              onCloseConflict={() => setRollbackConflict(null)}
              onRollback={handleRollback}
              operationError={operationError}
              operations={operations}
              showHeader={false}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          aria-labelledby="ai-clear-chat-dialog-title"
          data-test="ai_assistant__clear_chat_dialog"
          fullWidth
          maxWidth="xs"
          onClose={() => setIsClearChatDialogOpen(false)}
          open={isClearChatDialogOpen}
        >
          <DialogTitle
            data-test="ai_assistant__clear_chat_dialog_title"
            id="ai-clear-chat-dialog-title"
            sx={{ fontWeight: 900 }}
          >
            {t(interfaceLanguage, 'aiClearChatDialogTitle')}
          </DialogTitle>
          <DialogContent data-test="ai_assistant__clear_chat_dialog_content">
            <DialogContentText data-test="ai_assistant__clear_chat_dialog_body">
              {t(interfaceLanguage, 'aiClearChatDialogBody')}
            </DialogContentText>
          </DialogContent>
          <DialogActions
            data-test="ai_assistant__clear_chat_dialog_actions"
            sx={{ px: 3, pb: 2.5 }}
          >
            <Button
              color="error"
              data-test="ai_assistant__clear_chat_erase_button"
              onClick={handleConfirmClearChat}
              variant="contained"
            >
              {t(interfaceLanguage, 'aiEraseChat')}
            </Button>
            <Button
              data-test="ai_assistant__clear_chat_cancel_button"
              onClick={() => setIsClearChatDialogOpen(false)}
              variant="outlined"
            >
              {t(interfaceLanguage, 'cancel')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {showManualImport && <ManualCardImportPanel />}
    </Stack>
  );
}

const chatHeaderActionButtonSx = {
  color: 'rgba(91, 76, 115, 0.82)',
  height: 29,
  minHeight: 29,
  transition: 'background-color 160ms ease, color 160ms ease',
  width: 29,
  '&:hover': {
    bgcolor: 'rgba(118, 90, 151, 0.09)',
    color: 'rgba(82, 62, 108, 0.94)',
  },
  '&.Mui-disabled': {
    color: 'rgba(91, 76, 115, 0.42)',
  },
};

function appendSafeError(
  dispatch: AppDispatch,
  content: string,
  retryPrompt: string,
) {
  dispatch(
    appendAiMessage({
      id: createUiId('assistant-error'),
      role: 'assistant',
      content,
      createdAt: new Date().toISOString(),
      isError: true,
      retryPrompt,
    }),
  );
}

function failureMessage(
  language: RootState['app']['interfaceLanguage'],
  failure: AiAgentFailure,
): string {
  if (failure.kind === 'transport') {
    switch (failure.error.kind) {
      case 'invalid-key':
        return t(language, 'aiErrorInvalidKey');
      case 'credits':
        return t(language, 'aiErrorCredits');
      case 'rate-limit':
        return t(language, 'aiErrorRateLimit');
      case 'provider':
        return `${t(language, 'aiErrorProvider')} ${failure.message}`;
      case 'network':
        return t(language, 'aiErrorNetwork');
      case 'malformed-json':
      case 'malformed-response':
        return t(language, 'aiErrorSchema');
      case 'cancelled':
        return t(language, 'aiRequestFailed');
    }
  }
  switch (failure.kind) {
    case 'invalid-proposal':
      return t(language, 'aiErrorSchema');
    case 'unknown-tool':
    case 'invalid-tool-arguments':
      return t(language, 'aiErrorTool');
    case 'loop-limit':
      return t(language, 'aiErrorLoop');
    case 'empty-response':
      return t(language, 'aiErrorProvider');
    case 'cancelled':
      return t(language, 'aiRequestFailed');
  }
}

const aiOperationVerbalConfirmationPatterns = [
  /\b(confirm|approve|accept)\b.*\b(chat|message|reply|say|type|write|text)\b/i,
  /\b(reply|say|type|write|text)\b.*\b(confirm|approve|accept|yes|ok)\b/i,
  /\bplease\b.*\b(confirm|approve|accept)\b/i,
  /\bwould you like\b.*\b(apply|proceed|confirm|approve)\b/i,
  /\bif you want\b.*\b(apply|proceed|confirm|approve)\b/i,
  /подтверд/i,
  /напиш(?:и|ите).*(?:да|ок|подтверж|примен)/i,
  /ответ(?:ь|ьте).*(?:да|ок|подтверж|примен)/i,
  /если хотите.*(?:примен|подтверж)/i,
  /confirma|confirmar|confirmes|aprobar|aprueba/i,
];

function stripAiOperationVerbalConfirmation(content: string): string {
  return content
    .split(/\n/)
    .map((line) => stripAiOperationVerbalConfirmationLine(line))
    .filter((line, index, lines) => line.trim() || hasNeighborText(lines, index))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripAiOperationVerbalConfirmationLine(line: string): string {
  return splitLineIntoSentences(line)
    .filter(
      (sentence) =>
        !aiOperationVerbalConfirmationPatterns.some((pattern) =>
          pattern.test(sentence),
        ),
    )
    .join(' ')
    .trim();
}

function splitLineIntoSentences(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) {
    return [''];
  }

  return (
    trimmed.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)?.map((part) =>
      part.trim(),
    ) ?? [trimmed]
  );
}

function hasNeighborText(lines: string[], index: number): boolean {
  return Boolean(lines[index - 1]?.trim() || lines[index + 1]?.trim());
}

function createUiId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const unavailableStorage: Storage = {
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  length: 0,
  removeItem: () => undefined,
  setItem: () => undefined,
};

function getOpenRouterStorage(): Storage {
  try {
    return window.localStorage ?? unavailableStorage;
  } catch {
    return unavailableStorage;
  }
}
