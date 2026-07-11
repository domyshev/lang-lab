import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppliedAiOperation, PlannedAiOperation } from '../../domain/aiOperations';
import type { SupportedLanguage } from '../../domain/languages';
import { AiAgentResult, runAiAssistant } from '../../services/aiAssistantAgent';
import {
  OPENROUTER_KEY_STORAGE_KEY,
  saveOpenRouterKey,
} from '../../services/openRouterKeyStorage';
import { appendAiMessage, stageAiOperation } from '../../store/aiAssistantSlice';
import { rootReducer } from '../../store/store';
import { AiAssistantView } from '../AiAssistantView';

vi.mock('../../services/aiAssistantAgent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/aiAssistantAgent')>();
  return { ...actual, runAiAssistant: vi.fn() };
});

const mockedRunAiAssistant = vi.mocked(runAiAssistant);
const now = '2026-07-11T20:00:00.000Z';

function createOperation(id = 'operation-1'): PlannedAiOperation {
  return {
    id,
    title: 'Travel vocabulary',
    summary: 'Adds a travel word and updates a set.',
    userPrompt: 'Add a travel word',
    modelId: 'deepseek/deepseek-v4-flash',
    createdAt: now,
    createdCards: [
      {
        id: `${id}-card`,
        translations: { en: 'platform', ru: 'платформа', es: 'anden' },
        createdAt: now,
        updatedAt: now,
      },
    ],
    updatedCards: [],
    createdCardSets: [],
    updatedCardSets: [],
    duplicateProcessingHistory: [],
    pendingDuplicates: [],
    previewCounts: {
      createdCards: 1,
      updatedCards: 2,
      pendingDuplicates: 3,
      createdCardSets: 4,
      renamedCardSets: 5,
      membershipAdditions: 6,
      membershipRemovals: 7,
    },
  };
}

function createAppliedOperation(
  id = 'operation-1',
  appliedAt = now,
): AppliedAiOperation {
  return {
    ...createOperation(id),
    appliedAt,
    status: 'applied',
  };
}

function renderView({
  language = 'en',
  messages = [],
  operations = [],
  cards,
  stagedOperation,
  operationError,
}: {
  language?: SupportedLanguage;
  messages?: ReturnType<typeof rootReducer>['aiAssistant']['messages'];
  operations?: AppliedAiOperation[];
  cards?: ReturnType<typeof rootReducer>['cards']['cards'];
  stagedOperation?: PlannedAiOperation;
  operationError?: string;
} = {}) {
  const initial = rootReducer(undefined, { type: 'test/init' });
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      app: { ...initial.app, interfaceLanguage: language },
      cards: {
        ...initial.cards,
        ...(cards ? { cards } : {}),
      },
      aiAssistant: {
        messages,
        operations,
        ...(stagedOperation ? { stagedOperation } : {}),
        ...(operationError ? { operationError } : {}),
      },
    },
  });

  render(
    <Provider store={store}>
      <AiAssistantView />
    </Provider>,
  );

  return store;
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
  window.localStorage.clear();
  mockedRunAiAssistant.mockReset();
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('AiAssistantView connection', () => {
  it('loads a saved key masked and identifies the fixed model', () => {
    saveOpenRouterKey('sk-saved-secret');
    renderView();

    expect(screen.getByLabelText('OpenRouter API key')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('OpenRouter API key')).toHaveValue('sk-saved-secret');
    expect(screen.getByText('DeepSeek V4 Flash')).toBeInTheDocument();
    expect(screen.getByText(/unencrypted in this browser/i)).toBeInTheDocument();
  });

  it('shows, saves, and deletes the key through explicit controls', async () => {
    const user = userEvent.setup();
    renderView();
    const keyInput = screen.getByLabelText('OpenRouter API key');

    await user.type(keyInput, '  sk-new-secret  ');
    await user.click(screen.getByRole('button', { name: 'Show API key' }));
    expect(keyInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide API key' }));
    expect(keyInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Save key' }));
    expect(window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe('sk-new-secret');

    await user.click(screen.getByRole('button', { name: 'Delete key' }));
    expect(keyInput).toHaveValue('');
    expect(window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBeNull();
  });

  it('focuses the key input and skips the service when sending without a key', async () => {
    const user = userEvent.setup();
    renderView();
    await user.type(screen.getByLabelText('Message the AI assistant'), 'Help me study');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByLabelText('OpenRouter API key')).toHaveFocus();
    expect(mockedRunAiAssistant).not.toHaveBeenCalled();
  });
});

describe('AiAssistantView chat', () => {
  it.each([
    [
      'en' as const,
      [
        'Create a travel card set',
        'Find my weakest cards',
        'Add vocabulary to my library',
      ],
      'Message the AI assistant',
    ],
    [
      'ru' as const,
      [
        'Создай набор для путешествий',
        'Найди мои самые сложные карточки',
        'Добавь слова в мою библиотеку',
      ],
      'Сообщение AI-ассистенту',
    ],
    [
      'es' as const,
      [
        'Crea un conjunto para viajar',
        'Encuentra mis tarjetas mas dificiles',
        'Anade vocabulario a mi biblioteca',
      ],
      'Mensaje para el asistente de IA',
    ],
  ])(
    'fills the %s composer from empty-state suggestions without sending',
    async (language, suggestions, composerLabel) => {
      const user = userEvent.setup();
      const store = renderView({ language });

      for (const suggestion of suggestions) {
        expect(screen.getByRole('button', { name: suggestion })).toBeInTheDocument();
      }

      await user.click(screen.getByRole('button', { name: suggestions[0] }));

      expect(screen.getByLabelText(composerLabel)).toHaveValue(suggestions[0]);
      expect(mockedRunAiAssistant).not.toHaveBeenCalled();

      act(() => {
        store.dispatch(appendAiMessage({
          id: `first-${language}-message`,
          role: 'user',
          content: suggestions[0],
          createdAt: now,
        }));
      });

      for (const suggestion of suggestions) {
        expect(screen.queryByRole('button', { name: suggestion })).not.toBeInTheDocument();
      }
    },
  );

  it('sends, shows thinking, and cancels with the request signal', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    let resolveRequest!: (value: AiAgentResult) => void;
    mockedRunAiAssistant.mockImplementation(
      () => new Promise((resolve) => { resolveRequest = resolve; }),
    );
    renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), 'Analyze my cards');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    const request = mockedRunAiAssistant.mock.calls[0][0];
    expect(request.userMessage).toBe('Analyze my cards');
    expect(request.snapshot.cards).toEqual([]);
    expect(request.signal?.aborted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    expect(request.signal?.aborted).toBe(true);
    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    resolveRequest({ ok: false, failure: { kind: 'cancelled', message: 'cancelled' } });
  });

  it('appends the response and stages a returned operation', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: true,
      content: 'I prepared a safe preview.',
      stagedOperation: operation,
    });
    const store = renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), operation.userPrompt);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('I prepared a safe preview.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: operation.title })).toBeInTheDocument();
    expect(store.getState().aiAssistant.messages.map(({ role }) => role)).toEqual([
      'user',
      'assistant',
    ]);
    expect(store.getState().aiAssistant.stagedOperation?.id).toBe(operation.id);
  });

  it('stores a localized safe error and retries the original prompt', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-never-show');
    mockedRunAiAssistant
      .mockResolvedValueOnce({
        ok: false,
        failure: {
          kind: 'transport',
          message: 'raw provider secret detail',
          error: { kind: 'network', message: 'raw provider secret detail' },
        },
      })
      .mockResolvedValueOnce({ ok: true, content: 'Recovered.' });
    const store = renderView({ language: 'es' });

    await user.type(screen.getByLabelText('Mensaje para el asistente de IA'), 'Revisa mis tarjetas');
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    const error = await screen.findByText(
      'No se pudo conectar con OpenRouter. Comprueba tu conexion e intentalo de nuevo.',
    );
    expect(error).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('raw provider secret detail');
    expect(document.body).not.toHaveTextContent('sk-never-show');
    const storedMessages = store.getState().aiAssistant.messages;
    expect(storedMessages[storedMessages.length - 1]?.retryPrompt).toBe('Revisa mis tarjetas');

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Recovered.')).toBeInTheDocument();
    expect(mockedRunAiAssistant.mock.calls[1][0].userMessage).toBe('Revisa mis tarjetas');
  });

  it.each([
    [
      'invalid key',
      {
        kind: 'transport' as const,
        message: 'raw authentication detail',
        error: { kind: 'invalid-key' as const, message: 'raw authentication detail', status: 401 },
      },
      'OpenRouter rejected this API key. Check whether it is valid and active.',
    ],
    [
      'credits',
      {
        kind: 'transport' as const,
        message: 'raw billing detail',
        error: { kind: 'credits' as const, message: 'raw billing detail', status: 402 },
      },
      'This OpenRouter account does not have enough credits.',
    ],
    [
      'rate limit',
      {
        kind: 'transport' as const,
        message: 'raw rate detail',
        error: { kind: 'rate-limit' as const, message: 'raw rate detail', status: 429 },
      },
      'OpenRouter is receiving too many requests. Wait a moment and try again.',
    ],
    [
      'provider',
      {
        kind: 'transport' as const,
        message: 'raw provider detail',
        error: { kind: 'provider' as const, message: 'raw provider detail', status: 500 },
      },
      'The AI provider could not complete the request. Try again later.',
    ],
    [
      'network',
      {
        kind: 'transport' as const,
        message: 'raw network detail',
        error: { kind: 'network' as const, message: 'raw network detail' },
      },
      'OpenRouter could not be reached. Check your connection and try again.',
    ],
    [
      'schema',
      { kind: 'invalid-proposal' as const, message: 'raw schema detail', errors: ['secret schema'] },
      'The AI response had an unexpected format and was not applied.',
    ],
    [
      'tool',
      { kind: 'unknown-tool' as const, message: 'raw tool detail', toolName: 'secret_tool' },
      'The AI assistant could not complete its tool request. Nothing was applied.',
    ],
    [
      'loop',
      { kind: 'loop-limit' as const, message: 'raw loop detail' },
      'The AI assistant stopped after too many tool steps. Nothing was applied.',
    ],
  ])('localizes a safe %s failure without persisting raw details', async (_name, failure, expected) => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-never-persist');
    mockedRunAiAssistant.mockResolvedValue({ ok: false, failure });
    const store = renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), 'Classify this failure');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(expected)).toBeInTheDocument();
    const persistedMessages = JSON.stringify(store.getState().aiAssistant.messages);
    expect(persistedMessages).not.toContain('raw ');
    expect(persistedMessages).not.toContain('secret');
    expect(persistedMessages).not.toContain('sk-never-persist');
  });

  it('keeps service cancellation neutral', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: false,
      failure: { kind: 'cancelled', message: 'raw cancellation detail' },
    });
    const store = renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), 'Cancel quietly');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(mockedRunAiAssistant).toHaveBeenCalledOnce());

    expect(store.getState().aiAssistant.messages).toHaveLength(1);
    expect(store.getState().aiAssistant.messages[0].role).toBe('user');
    expect(document.body).not.toHaveTextContent('raw cancellation detail');
  });

  it('clears messages without clearing operation history', async () => {
    const user = userEvent.setup();
    const store = renderView({
      messages: [
        { id: 'message-1', role: 'user', content: 'Old prompt', createdAt: now },
        { id: 'message-2', role: 'assistant', content: 'Old answer', createdAt: now },
      ],
      operations: [createAppliedOperation()],
      cards: createOperation().createdCards,
    });

    await user.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(screen.queryByText('Old prompt')).not.toBeInTheDocument();
    expect(store.getState().aiAssistant.messages).toEqual([]);
    expect(store.getState().aiAssistant.operations).toHaveLength(1);
    expect(screen.getByText('Travel vocabulary')).toBeInTheDocument();
  });

  it.each(['resolve', 'reject'] as const)(
    'keeps chat clear when an aborted request later %ss',
    async (settlement) => {
      const user = userEvent.setup();
      const operation = createAppliedOperation();
      let resolveRequest!: (value: AiAgentResult) => void;
      let rejectRequest!: (reason: Error) => void;
      saveOpenRouterKey('sk-test');
      mockedRunAiAssistant.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            resolveRequest = resolve;
            rejectRequest = reject;
          }),
      );
      const store = renderView({
        operations: [operation],
        cards: operation.createdCards,
      });

      await user.type(
        screen.getByLabelText('Message the AI assistant'),
        'Analyze before clearing',
      );
      await user.click(screen.getByRole('button', { name: 'Send message' }));
      const request = mockedRunAiAssistant.mock.calls[0][0];

      await user.click(screen.getByRole('button', { name: 'Clear chat' }));
      expect(request.signal?.aborted).toBe(true);
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();

      await act(async () => {
        if (settlement === 'resolve') {
          resolveRequest({ ok: true, content: 'Late response' });
        } else {
          rejectRequest(new Error('Late failure'));
        }
        await Promise.resolve();
      });

      expect(store.getState().aiAssistant.messages).toEqual([]);
      expect(screen.queryByText('Late response')).not.toBeInTheDocument();
      expect(store.getState().aiAssistant.operations).toHaveLength(1);
      expect(screen.getByText('Travel vocabulary')).toBeInTheDocument();
    },
  );
});

describe('AiAssistantView operation preview and history', () => {
  it('renders a staged operation as a purple unframed chat surface', () => {
    renderView({ stagedOperation: createOperation() });

    const preview = screen.getByTestId('ai_operation_preview__panel');
    const styles = getComputedStyle(preview);

    expect(preview.className).not.toContain('MuiPaper-root');
    expect(preview).toHaveAttribute('data-surface', 'purple-unframed');
    expect(styles.backgroundColor).toBe('rgb(245, 240, 255)');
  });

  it('shows all preview counts and applies exactly once', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    const store = renderView({ stagedOperation: operation });
    const preview = screen.getByTestId('ai_operation_preview__panel');

    for (const count of [1, 2, 3, 4, 5, 6, 7]) {
      expect(within(preview).getByText(String(count))).toBeInTheDocument();
    }
    await user.click(within(preview).getByRole('button', { name: 'Apply changes' }));
    expect(store.getState().aiAssistant.operations).toHaveLength(1);
    expect(store.getState().cards.cards).toHaveLength(1);
    expect(store.getState().aiAssistant.stagedOperation).toBeUndefined();
  });

  it('cancels a preview and disables apply for a blocking operation error', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    const store = renderView({
      stagedOperation: operation,
      operationError: 'The library changed after this AI operation was staged.',
    });

    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeDisabled();
    expect(screen.getByText('The operation cannot be applied because the library changed.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel preview' }));
    expect(store.getState().aiAssistant.stagedOperation).toBeUndefined();
  });

  it('shows newest history first and reverts a valid operation', async () => {
    const user = userEvent.setup();
    const older = createAppliedOperation('older', '2026-07-10T10:00:00.000Z');
    const newer = createAppliedOperation('newer', '2026-07-11T10:00:00.000Z');
    const store = renderView({
      operations: [newer, older],
      cards: [...older.createdCards, ...newer.createdCards],
    });
    const items = screen.getAllByTestId(/ai_operation_history__item__/);
    expect(within(items[0]).getByText('Travel vocabulary')).toBeInTheDocument();
    expect(items[0]).toHaveAttribute('data-test', 'ai_operation_history__item__newer');

    await user.click(within(items[0]).getByRole('button', { name: 'Roll back changes' }));
    expect(store.getState().aiAssistant.operations.find(({ id }) => id === 'newer')?.status).toBe('reverted');
  });

  it('uses newer-first list order to precheck rollback when timestamps match', async () => {
    const user = userEvent.setup();
    const older = createAppliedOperation('older', now);
    const originalCard = older.createdCards[0];
    const changedCard = {
      ...originalCard,
      translations: { ...originalCard.translations, en: 'changed platform' },
      updatedAt: '2026-07-11T21:00:00.000Z',
    };
    const newer: AppliedAiOperation = {
      ...createAppliedOperation('newer', now),
      title: 'Newer list operation',
      createdCards: [],
      updatedCards: [{ before: originalCard, after: changedCard }],
      previewCounts: {
        ...createOperation('newer').previewCounts,
        createdCards: 0,
        updatedCards: 1,
      },
    };
    const store = renderView({
      operations: [newer, older],
      cards: [changedCard],
    });
    const olderItem = screen.getByTestId('ai_operation_history__item__older');

    await user.click(
      within(olderItem).getByRole('button', { name: 'Roll back changes' }),
    );

    const conflictDialog = await screen.findByRole('dialog', {
      name: 'Changes cannot be rolled back',
    });
    expect(conflictDialog).toBeInTheDocument();
    expect(
      within(conflictDialog).getByText(/Newer list operation/),
    ).toBeInTheDocument();
    expect(
      store.getState().aiAssistant.operations.find(({ id }) => id === 'older')
        ?.status,
    ).toBe('applied');
  });

  it('shows a localized reducer operation error in history without a preview', () => {
    renderView({
      language: 'ru',
      operationError: 'The requested AI operation was not found.',
    });

    expect(
      screen.getByTestId('ai_operation_history__operation_error'),
    ).toHaveTextContent(
      'Операцию не удалось выполнить. Изменения в библиотеке не применены.',
    );
    expect(document.body).not.toHaveTextContent(
      'The requested AI operation was not found.',
    );
  });

  it('opens a localized conflict dialog instead of dispatching rollback', async () => {
    const user = userEvent.setup();
    const operation = createAppliedOperation();
    const changedCard = { ...operation.createdCards[0], translations: { en: 'changed' } };
    const store = renderView({
      language: 'ru',
      operations: [operation],
      cards: [changedCard],
    });

    await user.click(screen.getByRole('button', { name: 'Отменить изменения' }));
    expect(await screen.findByRole('dialog', { name: 'Нельзя отменить изменения' })).toBeInTheDocument();
    expect(screen.getByText(/библиотека изменилась/i)).toBeInTheDocument();
    expect(store.getState().aiAssistant.operations[0].status).toBe('applied');
  });
});

describe('AiAssistantView localization and manual import', () => {
  it.each([
    ['en', 'AI Assistant', 'Connection', 'Chat', 'Operation history', 'Manual card import'],
    ['ru', 'AI помощник', 'Подключение', 'Чат', 'История операций', 'Ручной импорт карточек'],
    ['es', 'Asistente IA', 'Conexion', 'Chat', 'Historial de operaciones', 'Importacion manual de tarjetas'],
  ] as const)('localizes the visible workspace in %s', (language, title, connection, chat, history, manual) => {
    renderView({ language });
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: connection })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: chat })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: history })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: manual })).toBeInTheDocument();
  });

  it('keeps manual file import functional below the assistant tools', async () => {
    const user = userEvent.setup();
    const store = renderView();
    const file = new File([
      JSON.stringify([{ translations: { en: 'station', ru: 'станция', es: 'estacion' } }]),
    ], 'cards.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Choose JSON file'), file);
    await waitFor(() => expect(store.getState().cards.cards).toHaveLength(1));
    expect(screen.getByText('Added: 1')).toBeInTheDocument();
  });
});
