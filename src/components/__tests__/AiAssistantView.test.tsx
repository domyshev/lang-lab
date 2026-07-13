import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlockedAiPreview } from '../../domain/aiBlockedPreview';
import type { AppliedAiOperation, PlannedAiOperation } from '../../domain/aiOperations';
import type { SupportedLanguage } from '../../domain/languages';
import { AiAgentResult, runAiAssistant } from '../../services/aiAssistantAgent';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_KEY_STORAGE_KEY,
  OPENROUTER_MODEL_STORAGE_KEY,
  OPENROUTER_TRIAL_KEY,
  OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY,
  saveOpenRouterKey,
} from '../../services/openRouterKeyStorage';
import {
  appendAiMessage,
  stageAiOperation,
} from '../../store/aiAssistantSlice';
import { saveAttempt } from '../../store/attemptsSlice';
import { recordAttemptStats } from '../../store/statsSlice';
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
      archivedCardSets: 0,
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

function createCardSetOperation(id = 'operation-1'): PlannedAiOperation {
  const operation = createOperation(id);
  return {
    ...operation,
    title: 'Создать набор «Для повторения»',
    summary: 'Creates a review card set from weak cards.',
    createdCardSets: [
      {
        id: `${id}-set`,
        name: 'Для повторения',
        names: { ru: 'Для повторения', en: 'For review', es: 'Para repasar' },
        cardIds: [`${id}-card`],
        createdAt: now,
        updatedAt: now,
      },
    ],
    previewCounts: {
      ...operation.previewCounts,
      createdCardSets: 1,
    },
  };
}

function renderView({
  language = 'en',
  worldId = 'football',
  embedded = false,
  showManualImport = true,
  messages = [],
  operations = [],
  attempts,
  cardStats,
  cards,
  blockedPreview,
  stagedOperation,
  operationError,
}: {
  language?: SupportedLanguage;
  worldId?: 'football' | 'forest';
  embedded?: boolean;
  showManualImport?: boolean;
  messages?: ReturnType<typeof rootReducer>['aiAssistant']['messages'];
  operations?: AppliedAiOperation[];
  attempts?: ReturnType<typeof rootReducer>['attempts']['attempts'];
  cardStats?: ReturnType<typeof rootReducer>['stats']['cardStats'];
  cards?: ReturnType<typeof rootReducer>['cards']['cards'];
  blockedPreview?: BlockedAiPreview;
  stagedOperation?: PlannedAiOperation;
  operationError?: string;
} = {}) {
  const initial = rootReducer(undefined, { type: 'test/init' });
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      app: { ...initial.app, interfaceLanguage: language, worldId },
      cards: {
        ...initial.cards,
        ...(cards ? { cards } : {}),
      },
      attempts: {
        ...initial.attempts,
        ...(attempts ? { attempts } : {}),
      },
      stats: {
        ...initial.stats,
        ...(cardStats ? { cardStats } : {}),
      },
      aiAssistant: {
        messages,
        operations,
        ...(blockedPreview ? { blockedPreview } : {}),
        ...(stagedOperation ? { stagedOperation } : {}),
        ...(operationError ? { operationError } : {}),
      },
    },
  });

  render(
    <Provider store={store}>
      <AiAssistantView embedded={embedded} showManualImport={showManualImport} />
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
  it('keeps the compact model selector in the chat header and moves key controls into the model menu settings', async () => {
    const user = userEvent.setup();
    renderView();

    expect(screen.queryByLabelText('OpenRouter API key')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Connection' })).not.toBeInTheDocument();
    const chatSummary = screen.getByTestId('ai_assistant__chat_summary');
    expect(
      within(chatSummary).getByRole('combobox', { name: 'OpenRouter model' }),
    ).toHaveTextContent('DeepSeek V4 Flash');
    expect(screen.getByTestId('ai_connection__model_control')).toHaveStyle({
      minWidth: '176px',
    });
    expect(
      within(chatSummary).getByTestId('ai_connection__openrouter_info_wrapper'),
    ).toHaveStyle({ marginLeft: '5px' });
    expect(screen.getByTestId('ai_assistant__chat_summary_actions')).toHaveStyle({
      marginRight: '20px',
    });
    expect(screen.getByTestId('ai_assistant__operation_history_button')).toHaveStyle({
      color: 'rgba(91, 76, 115, 0.82)',
      height: '29px',
      width: '29px',
    });
    expect(screen.getByTestId('ai_chat__clear_button')).toHaveStyle({
      color: 'rgba(91, 76, 115, 0.42)',
      height: '29px',
      width: '29px',
    });
    expect(DEFAULT_OPENROUTER_MODEL_ID).toBe('deepseek/deepseek-v4-flash');
    await user.click(within(chatSummary).getByLabelText('OpenRouter model'));
    await user.click(screen.getByRole('option', { name: 'Connection settings' }));

    expect(screen.getByRole('dialog', { name: 'Connection settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('OpenRouter API key')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('OpenRouter API key')).toHaveValue(OPENROUTER_TRIAL_KEY);
    expect(screen.getByText(/built-in application key/i)).toBeInTheDocument();
    expect(screen.getByText(/unencrypted in this browser/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save key' })).toBeDisabled();
  });

  it('explains OpenRouter next to the model selector with a readable linked tooltip', async () => {
    const user = userEvent.setup();
    renderView();

    await user.hover(screen.getByTestId('ai_connection__openrouter_info_button'));

    const tooltip = await screen.findByTestId('ai_connection__openrouter_info_tooltip');
    expect(tooltip).toHaveTextContent(
      'OpenRouter is the gateway Language Lab uses to send chat requests to the selected model.',
    );
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
    expect(
      within(tooltip).getByRole('link', { name: 'OpenRouter' }),
    ).toHaveAttribute('href', 'https://openrouter.ai/');
  });

  it('locks GPT behind a custom key when the built-in key is selected', async () => {
    const user = userEvent.setup();
    renderView({ language: 'ru' });

    await user.click(screen.getByLabelText('Модель OpenRouter'));

    const gptOption = screen.getByRole('option', { name: 'GPT-5.5' });
    expect(gptOption).toHaveAttribute('aria-disabled', 'true');
    expect(gptOption).toHaveStyle({ opacity: '0.46' });

    await user.hover(
      screen.getByTestId('ai_connection__model_option__openai/gpt-5.5__locked_content'),
    );

    const tooltip = await screen.findByTestId('ai_connection__locked_model_tooltip');
    expect(
      screen.getByTestId('ai_connection__locked_model_tooltip_popper'),
    ).toHaveAttribute('data-popper-placement', 'left');
    expect(
      screen.getByTestId('ai_connection__locked_model_tooltip_body'),
    ).toHaveStyle({ fontWeight: '500' });
    expect(tooltip).toHaveTextContent(
      'Введите свой ключ OpenRouter, чтобы открыть эту модель.',
    );
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
  });

  it('allows GPT when a custom key is selected', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-custom');
    renderView();

    await user.click(screen.getByLabelText('OpenRouter model'));

    const gptOption = screen.getByRole('option', { name: 'GPT-5.5' });
    expect(gptOption).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(gptOption);

    expect(screen.getByLabelText('OpenRouter model')).toHaveTextContent('GPT-5.5');
    expect(window.localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY)).toBe(
      'openai/gpt-5.5',
    );
  });

  it('shows, saves, deletes, restores, and replaces the key through settings', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByLabelText('OpenRouter model'));
    await user.click(screen.getByRole('option', { name: 'Connection settings' }));
    const keyInput = screen.getByLabelText('OpenRouter API key');

    await user.clear(keyInput);
    await user.type(keyInput, '  sk-new-secret  ');
    expect(screen.getByRole('button', { name: 'Save key' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Show API key' }));
    expect(keyInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide API key' }));
    expect(keyInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Save key' }));
    expect(window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe('sk-new-secret');
    expect(window.localStorage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete key' }));
    expect(keyInput).toHaveValue('');
    expect(window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Restore built-in key' }));
    expect(keyInput).toHaveValue(OPENROUTER_TRIAL_KEY);
    expect(window.localStorage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBeNull();

    await user.clear(keyInput);
    await user.type(keyInput, 'sk-replacement');
    await user.click(screen.getByRole('button', { name: 'Save key' }));
    expect(window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe('sk-replacement');
    expect(window.localStorage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBeNull();
  });

  it('persists the selected model and passes it to the assistant service', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-custom');
    mockedRunAiAssistant.mockResolvedValue({ ok: true, content: 'Ready.' });
    renderView();

    await user.click(screen.getByLabelText('OpenRouter model'));
    await user.click(screen.getByRole('option', { name: 'GPT-5.5' }));
    expect(window.localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY)).toBe(
      'openai/gpt-5.5',
    );

    await user.type(screen.getByLabelText('Message the AI assistant'), 'Analyze my cards');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(mockedRunAiAssistant.mock.calls[0][0]).toMatchObject({
      apiKey: 'sk-custom',
      modelId: 'openai/gpt-5.5',
    });
  });

  it('focuses the key input and skips the service when sending without a key', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByLabelText('OpenRouter model'));
    await user.click(screen.getByRole('option', { name: 'Connection settings' }));
    await user.click(screen.getByRole('button', { name: 'Delete key' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Connection settings' }),
      ).not.toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText('Message the AI assistant'), 'Help me study');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByLabelText('OpenRouter API key')).toHaveFocus();
    expect(mockedRunAiAssistant).not.toHaveBeenCalled();
  });
});

describe('AiAssistantView chat', () => {
  it.each([
    ['Meta+Enter', '{Meta>}{Enter}{/Meta}'],
    ['Control+Enter', '{Control>}{Enter}{/Control}'],
  ])('sends the composer with %s', async (_, shortcut) => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({ ok: true, content: 'Shortcut accepted.' });
    renderView();

    await user.type(
      screen.getByLabelText('Message the AI assistant'),
      'Create a shortcut card set',
    );
    await user.keyboard(shortcut);

    await waitFor(() => expect(mockedRunAiAssistant).toHaveBeenCalledOnce());
    expect(mockedRunAiAssistant.mock.calls[0][0].userMessage).toBe(
      'Create a shortcut card set',
    );
  });

  it('passes prior chat messages to the assistant service for follow-up requests', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({ ok: true, content: 'I staged it.' });
    renderView({
      messages: [
        {
          id: 'message-love-request',
          role: 'user',
          content: 'Show me five interesting Love cards.',
          createdAt: now,
        },
        {
          id: 'message-love-answer',
          role: 'assistant',
          content: 'I picked soulmate, longing, cherish, blush, and flirt.',
          createdAt: now,
        },
      ],
    });

    await user.type(
      screen.getByLabelText('Message the AI assistant'),
      'Use these cards to create a new set.',
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(mockedRunAiAssistant.mock.calls[0][0].chatHistory).toEqual([
      {
        role: 'user',
        content: 'Show me five interesting Love cards.',
      },
      {
        role: 'assistant',
        content: 'I picked soulmate, longing, cherish, blush, and flirt.',
      },
    ]);
  });

  it('sends with Enter and keeps Shift+Enter as composer newline', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({ ok: true, content: 'Enter accepted.' });
    renderView();

    const composer = screen.getByLabelText('Message the AI assistant');
    await user.type(composer, 'First line');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockedRunAiAssistant).not.toHaveBeenCalled();
    expect(composer).toHaveValue('First line\n');

    await user.type(composer, 'Second line');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(mockedRunAiAssistant).toHaveBeenCalledOnce());
    expect(mockedRunAiAssistant.mock.calls[0][0].userMessage).toBe(
      'First line\nSecond line',
    );
  });

  it('shows a shortcut tooltip and football AI styling on the send button', async () => {
    const user = userEvent.setup();
    renderView({ language: 'ru' });

    await user.type(screen.getByLabelText('Сообщение AI-ассистенту'), 'Привет');
    const sendButton = screen.getByRole('button', { name: 'Отправить сообщение' });

    expect(sendButton).toHaveStyle({
      background:
        'linear-gradient(135deg, rgba(24, 119, 201, 0.96) 0%, rgba(73, 167, 232, 0.92) 48%, rgba(47, 143, 58, 0.9) 100%)',
      color: '#fffdf7',
    });

    await user.hover(sendButton);

    const tooltip = await screen.findByTestId('ai_chat__send_tooltip');
    expect(tooltip).toHaveTextContent('Отправить сообщение');
    expect(tooltip).toHaveTextContent('Enter');
    expect(tooltip).toHaveTextContent('Shift Enter');
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
  });

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

  it('scrolls the chat to the newest message on mount and after new messages arrive', async () => {
    let currentScrollHeight = 640;
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return this.getAttribute('data-test') === 'ai_chat__messages'
          ? currentScrollHeight
          : 0;
      },
    });

    try {
      const store = renderView({
        messages: [
          {
            id: 'message-older',
            role: 'user',
            content: 'Create a card set from these words.',
            createdAt: now,
          },
          {
            id: 'message-latest',
            role: 'assistant',
            content: 'I prepared the newest card set preview.',
            createdAt: now,
          },
        ],
      });
      const messagesContainer = screen.getByTestId('ai_chat__messages');

      await waitFor(() => expect(messagesContainer.scrollTop).toBe(640));

      currentScrollHeight = 1280;
      act(() => {
        store.dispatch(
          appendAiMessage({
            id: 'message-newest',
            role: 'assistant',
            content: 'One more line arrived at the bottom.',
            createdAt: now,
          }),
        );
      });

      await waitFor(() => expect(messagesContainer.scrollTop).toBe(1280));
    } finally {
      if (scrollHeightDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollHeight',
          scrollHeightDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
      }
    }
  });

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

  it('passes game attempts and card stats to the assistant service', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({ ok: true, content: 'I can see progress.' });
    renderView({
      attempts: [
        {
          id: 'attempt-1',
          exerciseSessionId: 'session-1',
          exerciseType: 'missingLetters',
          cardSetId: 'travel',
          targetLanguage: 'en',
          createdAt: now,
          completedAt: now,
          cardSnapshots: [],
          prompts: [],
          answers: { card1: 'wrong' },
          correctness: { card1: false },
          hintsUsed: {},
        },
      ],
      cardStats: [
        {
          cardId: 'card1',
          targetLanguage: 'en',
          attempts: 1,
          correct: 0,
          incorrect: 1,
          hintsUsed: 0,
          accuracy: 0,
          recentMistakes: 1,
          lastPracticedAt: now,
          stability: 'weak',
        },
      ],
    });

    await user.type(screen.getByLabelText('Message the AI assistant'), 'What should I repeat?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(mockedRunAiAssistant.mock.calls[0][0].snapshot).toMatchObject({
      attempts: [
        {
          id: 'attempt-1',
          exerciseSessionId: 'session-1',
          correctness: { card1: false },
        },
      ],
      cardStats: [
        {
          cardId: 'card1',
          targetLanguage: 'en',
          stability: 'weak',
        },
      ],
    });
  });

  it('uses attempts and stats saved after the chat view mounted', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: true,
      content: 'I can see the latest crossword.',
    });
    const store = renderView();
    const latestAttempt = {
      id: 'attempt-latest-crossword',
      exerciseSessionId: 'session-latest-crossword',
      exerciseType: 'crossword' as const,
      cardSetId: 'hunting',
      targetLanguage: 'en' as const,
      createdAt: '2026-07-13T10:01:00.000Z',
      completedAt: '2026-07-13T10:02:00.000Z',
      cardSnapshots: [],
      prompts: [],
      answers: { card1: 'wrnog' },
      correctness: { card1: false },
      hintsUsed: {},
    };

    act(() => {
      store.dispatch(saveAttempt(latestAttempt));
      store.dispatch(recordAttemptStats(latestAttempt));
    });

    await user.type(
      screen.getByLabelText('Message the AI assistant'),
      'Look at my latest crossword.',
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(mockedRunAiAssistant.mock.calls[0][0].snapshot.attempts).toEqual([
      latestAttempt,
    ]);
    expect(mockedRunAiAssistant.mock.calls[0][0].snapshot.cardStats).toMatchObject([
      {
        attempts: 1,
        cardId: 'card1',
        incorrect: 1,
        targetLanguage: 'en',
      },
    ]);
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
    expect(screen.getByTestId('ai_chat__messages')).toContainElement(
      screen.getByTestId('ai_operation_preview__panel'),
    );
    expect(store.getState().aiAssistant.messages.map(({ role }) => role)).toEqual([
      'user',
      'assistant',
    ]);
    expect(store.getState().aiAssistant.stagedOperation?.id).toBe(operation.id);
  });

  it('renders assistant markdown headings, lists, emphasis, and tables', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: true,
      content: [
        'Вот что я выяснил! 🕵️‍♂️',
        '',
        '---',
        '',
        '## 📋 Ваши последние кроссворды',
        '',
        '| Игра | Результат | Сет |',
        '|-----|-----------|-----|',
        '| 🥇 **Последняя** (сегодня) | ✅ **3/3 — без ошибок!** | «Охота» |',
        '| ❌ **Предпоследняя** | ❌ **1 ошибка** | «Любовь» |',
        '',
        '## 🚫 В каком слове ошибка?',
        '',
        '**soulmate** — *родственная душа / alma gemela* ❤️',
        '',
        '- ⚠️ 3 ошибки из 5 попыток',
      ].join('\n'),
    });

    renderView({ language: 'ru' });

    await user.type(screen.getByLabelText('Сообщение AI-ассистенту'), 'Что с кроссвордами?');
    await user.click(screen.getByRole('button', { name: 'Отправить сообщение' }));

    expect(
      await screen.findByRole('heading', { name: '📋 Ваши последние кроссворды' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '🚫 В каком слове ошибка?' }),
    ).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Игра' })).toBeInTheDocument();
    expect(
      within(table).getByRole('cell', { name: '🥇 Последняя (сегодня)' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('3 ошибки из 5 попыток');
    expect(screen.queryByText('| Игра | Результат | Сет |')).not.toBeInTheDocument();
  });

  it('hides verbal confirmation requests when preview actions already confirm the operation', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: true,
      content:
        'Я подготовил предпросмотр набора.\nПодтвердите словами, если хотите применить изменения.',
      stagedOperation: operation,
    });
    const store = renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), operation.userPrompt);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(/Я подготовил предпросмотр набора/)).toBeInTheDocument();
    expect(screen.queryByText(/Подтвердите словами/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeInTheDocument();
    expect(store.getState().aiAssistant.messages[1]?.content).toBe(
      'Я подготовил предпросмотр набора.',
    );
  });

  it('stages an invalid proposal as a blocked preview while keeping the chat error retryable', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-test');
    mockedRunAiAssistant.mockResolvedValue({
      ok: false,
      failure: {
        kind: 'invalid-proposal',
        message: 'The proposed library operation is invalid.',
        errors: ['A card requires translations in at least two languages.'],
      },
      blockedPreview: {
        title: 'Travel proposal needs review',
        summary: 'One card is missing a translation.',
        validationWarnings: [
          'A card requires translations in at least two languages.',
        ],
      },
    });
    const store = renderView();

    await user.type(screen.getByLabelText('Message the AI assistant'), 'Add a travel card');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Travel proposal needs review')).toBeInTheDocument();
    expect(screen.getByText('One card is missing a translation.')).toBeInTheDocument();
    expect(
      screen.getByText('A card requires translations in at least two languages.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByTestId('ai_chat__messages')).toContainElement(
      screen.getByTestId('ai_blocked_preview__panel'),
    );
    expect(store.getState().cards.cards).toEqual([]);
    expect(store.getState().aiAssistant.stagedOperation).toBeUndefined();
    expect(store.getState().aiAssistant.blockedPreview).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Cancel preview' }));
    expect(store.getState().aiAssistant.blockedPreview).toBeUndefined();
  });

  it('shows the sanitized provider detail with a localized provider prefix', async () => {
    const user = userEvent.setup();
    saveOpenRouterKey('sk-never-show');
    mockedRunAiAssistant.mockResolvedValue({
      ok: false,
      failure: {
        kind: 'transport',
        message: 'Upstream inference timed out. Request id req_123.',
        error: {
          kind: 'provider',
          message: 'Upstream inference timed out. Request id req_123.',
          status: 503,
        },
      },
    });
    const store = renderView({ language: 'ru' });

    await user.type(screen.getByLabelText('Сообщение AI-ассистенту'), 'Проверь карточки');
    await user.click(screen.getByRole('button', { name: 'Отправить сообщение' }));

    expect(
      await screen.findByText(
        'AI-провайдер не смог выполнить запрос. Попробуйте позже. Upstream inference timed out. Request id req_123.',
      ),
    ).toBeInTheDocument();
    const persistedMessages = JSON.stringify(store.getState().aiAssistant.messages);
    expect(persistedMessages).toContain('Upstream inference timed out. Request id req_123.');
    expect(persistedMessages).not.toContain('sk-never-show');
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
        message: 'OpenRouter upstream was unavailable.',
        error: {
          kind: 'provider' as const,
          message: 'OpenRouter upstream was unavailable.',
          status: 500,
        },
      },
      'The AI provider could not complete the request. Try again later. OpenRouter upstream was unavailable.',
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

  it('confirms before clearing messages without clearing operation history', async () => {
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
    const confirmDialog = screen.getByRole('dialog', { name: 'Erase chat?' });
    expect(confirmDialog).toHaveTextContent(
      'This will erase the visible chat messages. Operation history will stay available.',
    );
    expect(screen.getByText('Old prompt')).toBeInTheDocument();
    expect(store.getState().aiAssistant.messages).toHaveLength(2);

    await user.click(within(confirmDialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Erase chat?' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Old prompt')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear chat' }));
    await user.click(screen.getByRole('button', { name: 'Erase' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Erase chat?' })).not.toBeInTheDocument(),
    );

    expect(screen.queryByText('Old prompt')).not.toBeInTheDocument();
    expect(store.getState().aiAssistant.messages).toEqual([]);
    expect(store.getState().aiAssistant.operations).toHaveLength(1);
    await openOperationHistory(user);
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
      expect(request.signal?.aborted).toBe(false);
      await user.click(screen.getByRole('button', { name: 'Erase' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Erase chat?' })).not.toBeInTheDocument(),
      );
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
      await openOperationHistory(user);
      expect(screen.getByText('Travel vocabulary')).toBeInTheDocument();
    },
  );
});

describe('AiAssistantView operation preview and history', () => {
  it.each([
    [
      'en' as const,
      'Review required',
      'This proposal cannot be applied until its validation warnings are resolved.',
      'Validation warnings',
    ],
    [
      'ru' as const,
      'Требуется проверка',
      'Это предложение нельзя применить, пока не устранены замечания проверки.',
      'Замечания проверки',
    ],
    [
      'es' as const,
      'Revision necesaria',
      'Esta propuesta no se puede aplicar hasta resolver las advertencias de validacion.',
      'Advertencias de validacion',
    ],
  ])(
    'localizes blocked-preview fallbacks in %s',
    (language, title, summary, warningLabel) => {
      renderView({
        language,
        blockedPreview: { validationWarnings: ['Dynamic planner warning'] },
      });

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(summary)).toBeInTheDocument();
      expect(screen.getByText(warningLabel)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply|применить|aplicar/i })).toBeDisabled();
    },
  );

  it('renders a staged operation as a purple unframed chat surface', () => {
    renderView({ stagedOperation: createOperation() });

    const preview = screen.getByTestId('ai_operation_preview__panel');
    const styles = getComputedStyle(preview);

    expect(preview.className).not.toContain('MuiPaper-root');
    expect(preview).toHaveAttribute('data-surface', 'purple-unframed');
    expect(styles.backgroundColor).toBe('rgb(245, 240, 255)');
  });

  it('shows all preview counts, applies exactly once, and confirms the write in chat', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    const store = renderView({
      language: 'ru',
      stagedOperation: operation,
      messages: [
        {
          id: 'operation-preview-message',
          role: 'assistant',
          content: 'Review this operation.',
          createdAt: now,
          operationPreview: operation,
          previewStatus: 'pending',
        },
      ],
    });
    const preview = screen.getByTestId('ai_operation_preview__panel');

    for (const count of [1, 2, 3, 4, 5, 6, 7]) {
      expect(within(preview).getByText(String(count))).toBeInTheDocument();
    }
    await user.click(within(preview).getByRole('button', { name: 'Применить изменения' }));
    expect(store.getState().aiAssistant.operations).toHaveLength(1);
    expect(store.getState().cards.cards).toHaveLength(1);
    expect(store.getState().aiAssistant.stagedOperation).toBeUndefined();
    expect(within(preview).getByRole('button', { name: 'Применить изменения' })).toBeDisabled();
    expect(within(preview).getByRole('button', { name: 'Отменить предпросмотр' })).toBeDisabled();
    expect(screen.getByText('Изменения записаны.')).toBeInTheDocument();
    const messages = store.getState().aiAssistant.messages;
    expect(messages[messages.length - 1]).toMatchObject({
      role: 'assistant',
      content: 'Изменения записаны.',
    });
  });

  it('lets the user edit a created card set name before applying the preview', async () => {
    const user = userEvent.setup();
    const operation = createCardSetOperation();
    const store = renderView({
      language: 'ru',
      stagedOperation: operation,
      messages: [
        {
          id: 'operation-preview-message',
          role: 'assistant',
          content: 'Review this operation.',
          createdAt: now,
          operationPreview: operation,
          previewStatus: 'pending',
        },
      ],
    });
    const preview = screen.getByTestId('ai_operation_preview__panel');
    const nameInput = within(preview).getByRole('textbox', { name: 'Название набора' });

    expect(nameInput).toHaveValue('Для повторения');
    await user.clear(nameInput);
    await user.type(nameInput, 'Повторить любовь');
    await user.click(within(preview).getByRole('button', { name: 'Применить изменения' }));

    const savedSet = store
      .getState()
      .cardSets.cardSets.find((cardSet) => cardSet.id === 'operation-1-set');
    expect(savedSet).toMatchObject({
      name: 'Повторить любовь',
      names: {
        ru: 'Повторить любовь',
        en: 'Повторить любовь',
        es: 'Повторить любовь',
      },
    });
    expect(store.getState().aiAssistant.operations[0].createdCardSets[0]).toMatchObject({
      name: 'Повторить любовь',
      names: {
        ru: 'Повторить любовь',
        en: 'Повторить любовь',
        es: 'Повторить любовь',
      },
    });
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

  it('does not confirm a write when a stale preview is rejected by the store', async () => {
    const user = userEvent.setup();
    const operation = createOperation();
    const store = renderView({
      messages: [
        {
          id: 'stale-operation-preview-message',
          role: 'assistant',
          content: 'Review this stale operation.',
          createdAt: now,
          operationPreview: operation,
          previewStatus: 'pending',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Apply changes' }));

    expect(store.getState().aiAssistant.operations).toHaveLength(0);
    expect(store.getState().aiAssistant.operationError).toBe(
      'The staged AI operation is no longer current.',
    );
    expect(screen.queryByText('Changes have been recorded.')).not.toBeInTheDocument();
  });

  it('shows newest history first and reverts a valid operation', async () => {
    const user = userEvent.setup();
    const older = createAppliedOperation('older', '2026-07-10T10:00:00.000Z');
    const newer = createAppliedOperation('newer', '2026-07-11T10:00:00.000Z');
    const store = renderView({
      operations: [newer, older],
      cards: [...older.createdCards, ...newer.createdCards],
    });
    await openOperationHistory(user);
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
    await openOperationHistory(user);
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

  it('shows a localized reducer operation error in history without a preview', async () => {
    const user = userEvent.setup();
    renderView({
      language: 'ru',
      operationError: 'The requested AI operation was not found.',
    });
    await openOperationHistory(user, 'История операций');

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
    await openOperationHistory(user, 'История операций');

    await user.click(screen.getByRole('button', { name: 'Отменить изменения' }));
    expect(await screen.findByRole('dialog', { name: 'Нельзя отменить изменения' })).toBeInTheDocument();
    expect(screen.getByText(/библиотека изменилась/i)).toBeInTheDocument();
    expect(store.getState().aiAssistant.operations[0].status).toBe('applied');
  });
});

describe('AiAssistantView localization and manual import', () => {
  it.each([
    ['en', 'AI Assistant', 'Chat', 'Operation history', 'Manual card import'],
    ['ru', 'AI помощник', 'Чат', 'История операций', 'Ручной импорт карточек'],
    ['es', 'Asistente IA', 'Chat', 'Historial de operaciones', 'Importacion manual de tarjetas'],
  ] as const)('localizes the visible workspace in %s', (language, title, chat, history, manual) => {
    renderView({ language });
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.queryByTestId('ai_connection__panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai_assistant__chat_accordion')).toHaveTextContent(chat);
    expect(screen.getByRole('button', { name: history })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: manual })).toBeInTheDocument();
  });

  it('renders embedded chat as a fixed-height accordion and opens operation history in a modal', async () => {
    const user = userEvent.setup();
    const operation = createAppliedOperation();
    renderView({
      embedded: true,
      showManualImport: false,
      operations: [operation],
    });

    expect(screen.getByTestId('ai_assistant__page')).toHaveStyle({
      maxWidth: '760px',
      width: '100%',
    });
    expect(screen.getByTestId('ai_assistant__chat_accordion')).toBeInTheDocument();
    expect(screen.getByTestId('ai_chat__panel')).toHaveStyle({ height: '400px' });
    expect(screen.getByTestId('ai_chat__composer')).toHaveStyle({ alignItems: 'center' });
    expect(screen.getByTestId('ai_assistant__collapse_chat_action_row')).toHaveStyle({
      justifyContent: 'flex-start',
      marginTop: '5px',
    });
    expect(screen.getByTestId('ai_assistant__collapse_chat_button')).toHaveTextContent(
      'Collapse chat',
    );
    expect(
      screen.queryByRole('heading', { name: 'Operation history' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse chat' }));
    expect(screen.getByTestId('ai_assistant__chat_summary')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(screen.getByTestId('ai_assistant__chat_summary'));
    expect(screen.getByTestId('ai_assistant__chat_summary')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Operation history' }));

    const dialog = await screen.findByRole('dialog', { name: 'Operation history' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId('ai_operation_history__scroll_area')).toHaveStyle({
      overflowY: 'auto',
    });
    expect(within(dialog).getByText('Travel vocabulary')).toBeInTheDocument();
  });

  it('uses a forest-friendly green and lilac chat palette in the forest world', () => {
    renderView({ worldId: 'forest', showManualImport: false });

    expect(screen.getByTestId('ai_chat__panel')).toHaveStyle({
      background:
        'linear-gradient(145deg, rgba(246, 255, 235, 0.96) 0%, rgba(250, 240, 255, 0.94) 55%, rgba(238, 250, 229, 0.94) 100%)',
      borderColor: 'rgba(169, 137, 223, 0.30)',
    });
    expect(screen.getByTestId('ai_chat__messages')).toHaveStyle({
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.68) 0%, rgba(247, 239, 255, 0.46) 100%)',
      border: '1px solid rgba(169, 137, 223, 0.16)',
    });
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

async function openOperationHistory(
  user: ReturnType<typeof userEvent.setup>,
  label = 'Operation history',
) {
  await user.click(screen.getByRole('button', { name: label }));
}
