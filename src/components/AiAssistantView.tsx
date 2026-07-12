import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AiRollbackConflict, AppliedAiOperation, findAiRollbackConflict } from '../domain/aiOperations';
import { t } from '../domain/i18n';
import { AiAgentFailure, runAiAssistant } from '../services/aiAssistantAgent';
import {
  loadOpenRouterKey,
  removeOpenRouterKey,
  saveOpenRouterKey,
} from '../services/openRouterKeyStorage';
import { applyAiOperation, revertAiOperation } from '../store/aiAssistantActions';
import {
  appendAiMessage,
  cancelStagedAiOperation,
  clearAiChat,
  stageBlockedAiPreview,
  stageAiOperation,
} from '../store/aiAssistantSlice';
import { AppDispatch, RootState } from '../store/store';
import { AiChatPanel } from './ai/AiChatPanel';
import { AiBlockedOperationPreview } from './ai/AiBlockedOperationPreview';
import { AiConnectionPanel } from './ai/AiConnectionPanel';
import { AiOperationHistory } from './ai/AiOperationHistory';
import { AiOperationPreview } from './ai/AiOperationPreview';
import { ManualCardImportPanel } from './ManualCardImportPanel';

export function AiAssistantView() {
  const dispatch = useDispatch<AppDispatch>();
  const keyStorageRef = useRef<Storage>(getOpenRouterStorage());
  const cards = useSelector((state: RootState) => state.cards.cards);
  const cardSets = useSelector((state: RootState) => state.cardSets.cardSets);
  const interfaceLanguage = useSelector((state: RootState) => state.app.interfaceLanguage);
  const { blockedPreview, messages, operationError, operations, stagedOperation } = useSelector(
    (state: RootState) => state.aiAssistant,
  );
  const [apiKey, setApiKey] = useState(() => loadOpenRouterKey(keyStorageRef.current));
  const [draft, setDraft] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  const [rollbackConflict, setRollbackConflict] = useState<AiRollbackConflict | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const sendPrompt = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || isThinking) {
        return;
      }
      const key = apiKey.trim();
      if (!key) {
        setMissingKey(true);
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
          userMessage: prompt,
          snapshot: { cards, cardSets, interfaceLanguage },
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        if (result.ok) {
          dispatch(
            appendAiMessage({
              id: createUiId('assistant-message'),
              role: 'assistant',
              content: result.content,
              createdAt: new Date().toISOString(),
            }),
          );
          if (result.stagedOperation) {
            dispatch(stageAiOperation(result.stagedOperation));
          }
          return;
        }
        if (result.blockedPreview) {
          dispatch(stageBlockedAiPreview(result.blockedPreview));
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
    [apiKey, cardSets, cards, dispatch, interfaceLanguage, isThinking],
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
  };

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
    <Stack data-test="ai_assistant__page" spacing={2.5}>
      <Typography data-test="ai_assistant__title" component="h2" variant="h5" fontWeight={900}>
        {t(interfaceLanguage, 'aiAssistantTitle')}
      </Typography>

      <AiConnectionPanel
        apiKey={apiKey}
        inputRef={keyInputRef}
        isKeyVisible={isKeyVisible}
        language={interfaceLanguage}
        missingKey={missingKey}
        onApiKeyChange={(value) => {
          setApiKey(value);
          if (value.trim()) setMissingKey(false);
        }}
        onDelete={() => {
          removeOpenRouterKey(keyStorageRef.current);
          setApiKey('');
          setIsKeyVisible(false);
        }}
        onSave={() => {
          saveOpenRouterKey(apiKey, keyStorageRef.current);
          const storedKey = loadOpenRouterKey(keyStorageRef.current);
          setApiKey(storedKey);
          setMissingKey(!storedKey);
        }}
        onToggleVisibility={() => setIsKeyVisible((visible) => !visible)}
      />

      <Box
        data-test="ai_assistant__workspace"
        sx={{
          alignItems: 'start',
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.65fr) minmax(280px, 1fr)' },
        }}
      >
        <Stack data-test="ai_assistant__chat_column" spacing={2} sx={{ minWidth: 0 }}>
          <AiChatPanel
            draft={draft}
            isThinking={isThinking}
            language={interfaceLanguage}
            messages={messages}
            onCancel={handleCancel}
            onClear={handleClearChat}
            onDraftChange={setDraft}
            onRetry={sendPrompt}
            onSend={() => void sendPrompt(draft)}
          />
          {stagedOperation && (
            <AiOperationPreview
              blockingError={operationError}
              language={interfaceLanguage}
              onApply={() =>
                dispatch(
                  applyAiOperation({
                    operation: stagedOperation,
                    appliedAt: new Date().toISOString(),
                  }),
                )
              }
              onCancel={() => dispatch(cancelStagedAiOperation())}
              operation={stagedOperation}
            />
          )}
          {blockedPreview && (
            <AiBlockedOperationPreview
              language={interfaceLanguage}
              onCancel={() => dispatch(cancelStagedAiOperation())}
              preview={blockedPreview}
            />
          )}
        </Stack>
        <AiOperationHistory
          conflict={rollbackConflict}
          language={interfaceLanguage}
          onCloseConflict={() => setRollbackConflict(null)}
          onRollback={handleRollback}
          operationError={operationError}
          operations={operations}
        />
      </Box>

      <ManualCardImportPanel />
    </Stack>
  );
}

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
