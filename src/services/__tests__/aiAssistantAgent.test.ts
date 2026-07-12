import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiLibrarySnapshot } from '../../domain/aiLibraryTools';
import languageCardSkill from '../../../docs/LANGUAGE_CARD_FORMAT.md?raw';
import {
  aiAssistantToolDefinitions,
  runAiAssistant,
} from '../aiAssistantAgent';
import {
  OpenRouterChatResult,
  sendOpenRouterChat,
} from '../openRouterClient';

vi.mock('../openRouterClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../openRouterClient')>();
  return { ...actual, sendOpenRouterChat: vi.fn() };
});

const sendChatMock = vi.mocked(sendOpenRouterChat);
const now = '2026-07-11T18:00:00.000Z';
const snapshot: AiLibrarySnapshot = {
  interfaceLanguage: 'en',
  cards: [
    {
      id: 'existing-airport',
      translations: { en: 'airport', es: 'aeropuerto', ru: 'аэропорт' },
      createdAt: now,
      updatedAt: now,
    },
  ],
  cardSets: [],
};

beforeEach(() => {
  sendChatMock.mockReset();
});

describe('runAiAssistant', () => {
  it('continues exact tool messages and returns a staged plan without mutation', async () => {
    const searchCall = toolCall('search-1', 'search_cards', { query: 'airport' });
    const proposalCall = toolCall('proposal-1', 'propose_library_operation', {
      title: 'Rail travel',
      summary: 'Add a train card and travel set.',
      cards: [
        {
          clientRef: 'train',
          translations: { en: 'train', es: 'tren', ru: 'поезд' },
        },
      ],
      cardSetChanges: [
        {
          type: 'create',
          clientRef: 'rail-set',
          names: { en: 'Rail travel', es: 'Viajes en tren', ru: 'Поезда' },
          cardRefs: ['train'],
        },
      ],
    });
    sendChatMock
      .mockResolvedValueOnce(success(null, [searchCall]))
      .mockResolvedValueOnce(success(null, [proposalCall]))
      .mockResolvedValueOnce(success('I staged the rail travel operation.'));
    const before = structuredClone(snapshot);

    const result = await runAiAssistant({
      apiKey: 'sk-or-test',
      modelId: 'deepseek/deepseek-v4-flash',
      userMessage: 'Create a rail travel set.',
      snapshot,
      now: () => now,
      idFactory: (prefix) => `${prefix}-fixed`,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe('I staged the rail travel operation.');
    expect(result.stagedOperation).toMatchObject({
      id: 'ai-operation-fixed',
      modelId: 'deepseek/deepseek-v4-flash',
      userPrompt: 'Create a rail travel set.',
      title: 'Rail travel',
      previewCounts: { createdCards: 1, createdCardSets: 1 },
    });
    expect(snapshot).toEqual(before);

    expect(sendChatMock).toHaveBeenCalledTimes(3);
    const first = sendChatMock.mock.calls[0][0];
    expect(first.tools).toBe(aiAssistantToolDefinitions);
    expect(first.modelId).toBe('deepseek/deepseek-v4-flash');
    expect(first.tools.map((tool) => tool.function.name)).toEqual([
      'list_card_sets',
      'get_card_set',
      'search_cards',
      'get_cards',
      'propose_library_operation',
    ]);
    expect(first.messages).toHaveLength(2);
    expect(first.messages[0]).toMatchObject({ role: 'system' });
    expect(first.messages[0].content).toContain(languageCardSkill);
    expect(first.messages[0].content).toContain('limited authority');
    expect(first.messages[0].content).toContain('never dispatch');

    const second = sendChatMock.mock.calls[1][0];
    expect(second.tools).toBe(aiAssistantToolDefinitions);
    expect(second.messages.slice(-2)).toEqual([
      { role: 'assistant', content: null, tool_calls: [searchCall] },
      {
        role: 'tool',
        tool_call_id: 'search-1',
        content: JSON.stringify({
          cursor: 0,
          items: [snapshot.cards[0]],
          limit: 20,
          nextCursor: null,
          total: 1,
        }),
      },
    ]);

    const third = sendChatMock.mock.calls[2][0];
    expect(third.tools).toBe(aiAssistantToolDefinitions);
    expect(third.messages[third.messages.length - 2]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [proposalCall],
    });
    const plannerToolMessage = third.messages[third.messages.length - 1];
    expect(plannerToolMessage).toMatchObject({
      role: 'tool',
      tool_call_id: 'proposal-1',
    });
    if (plannerToolMessage?.role !== 'tool') return;
    expect(JSON.parse(plannerToolMessage.content)).toMatchObject({
      ok: true,
      operation: { id: 'ai-operation-fixed', title: 'Rail travel' },
    });
  });

  it('returns content-only responses as a controlled success', async () => {
    sendChatMock.mockResolvedValueOnce(success('  Here is what I found.\n'));

    await expect(
      runAiAssistant({
        apiKey: 'key',
        userMessage: 'Review my cards.',
        snapshot,
      }),
    ).resolves.toEqual({
      ok: true,
      content: '  Here is what I found.\n',
    });
  });

  it('uses the default OpenRouter model when no model is selected', async () => {
    sendChatMock.mockResolvedValueOnce(success('Ready.'));

    await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Review my cards.',
      snapshot,
    });

    expect(sendChatMock.mock.calls[0][0].modelId).toBe('openai/gpt-5.5');
  });

  it('continues when a model sends an empty optional card set id for search', async () => {
    const searchCall = toolCall('search-empty-set', 'search_cards', {
      cardSetId: '',
      languages: ['en'],
      query: 'airport',
    });
    sendChatMock
      .mockResolvedValueOnce(success(null, [searchCall]))
      .mockResolvedValueOnce(success('I found the airport card.'));

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Find airport.',
      snapshot,
    });

    expect(result).toEqual({
      ok: true,
      content: 'I found the airport card.',
    });
    const second = sendChatMock.mock.calls[1][0];
    expect(second.messages.slice(-2)).toEqual([
      { role: 'assistant', content: null, tool_calls: [searchCall] },
      {
        role: 'tool',
        tool_call_id: 'search-empty-set',
        content: JSON.stringify({
          cursor: 0,
          items: [snapshot.cards[0]],
          limit: 20,
          nextCursor: null,
          total: 1,
        }),
      },
    ]);
  });

  it.each(['', '   \n\t'])('returns empty-response for blank content %j', async (content) => {
    sendChatMock.mockResolvedValueOnce(success(content));

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Review my cards.',
      snapshot,
    });

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'empty-response',
        message: 'The assistant returned neither content nor tool calls.',
      },
    });
  });

  it('returns a controlled unknown-tool failure', async () => {
    sendChatMock.mockResolvedValueOnce(
      success(null, [toolCall('bad-1', 'delete_everything', {})]),
    );

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Delete everything.',
      snapshot,
    });

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'unknown-tool',
        message: 'The model requested an unknown tool.',
        toolName: 'delete_everything',
      },
    });
  });

  it.each([
    ['malformed JSON', '{bad-json'],
    ['invalid arguments', JSON.stringify({ query: '' })],
  ])('returns a controlled argument failure for %s', async (_name, arguments_ ) => {
    sendChatMock.mockResolvedValueOnce({
      ok: true,
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'bad-args',
            type: 'function',
            function: { name: 'search_cards', arguments: arguments_ },
          },
        ],
      },
    });

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Search.',
      snapshot,
    });

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'invalid-tool-arguments',
        message: 'The model supplied invalid tool arguments.',
        toolName: 'search_cards',
      },
    });
  });

  it('retains an invalid schema proposal as a blocked preview for inspection', async () => {
    sendChatMock.mockResolvedValueOnce(
      success(null, [
        toolCall('proposal-bad', 'propose_library_operation', {
          title: 'Unsafe',
          summary: 'Tries an unsupported mutation.',
          deleteAllCards: true,
        }),
      ]),
    );

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Delete all cards.',
      snapshot,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toMatchObject({
      kind: 'invalid-proposal',
      message: 'The proposed library operation is invalid.',
    });
    expect(result.blockedPreview).toEqual({
      title: 'Unsafe',
      summary: 'Tries an unsupported mutation.',
      validationWarnings: expect.arrayContaining([expect.any(String)]),
    });
    if (result.failure.kind === 'invalid-proposal') {
      expect(result.failure.errors.length).toBeGreaterThan(0);
    }
  });

  it('retains planner validation errors in a blocked preview', async () => {
    sendChatMock.mockResolvedValueOnce(
      success(null, [
        toolCall('proposal-missing-ref', 'propose_library_operation', {
          title: 'Broken travel set',
          summary: 'References a card that does not exist.',
          cardSetChanges: [
            {
              type: 'create',
              clientRef: 'travel-set',
              names: { en: 'Travel' },
              cardRefs: ['missing-card'],
            },
          ],
        }),
      ]),
    );

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Create a travel set.',
      snapshot,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.kind).toBe('invalid-proposal');
    expect(result.blockedPreview).toEqual({
      title: 'Broken travel set',
      summary: 'References a card that does not exist.',
      validationWarnings: expect.arrayContaining([expect.stringContaining('missing-card')]),
    });
  });

  it('stops after eight model responses', async () => {
    for (let index = 0; index < 8; index += 1) {
      sendChatMock.mockResolvedValueOnce(
        success(null, [toolCall(`search-${index}`, 'search_cards', { query: 'x' })]),
      );
    }

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Keep searching.',
      snapshot,
    });

    expect(sendChatMock).toHaveBeenCalledTimes(8);
    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'loop-limit',
        message: 'The assistant reached the eight-response limit.',
      },
    });
  });

  it('returns cancellation as a neutral controlled outcome', async () => {
    sendChatMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'cancelled', message: 'Request cancelled.' },
    });

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Create cards.',
      snapshot,
      signal: new AbortController().signal,
    });

    expect(result).toEqual({
      ok: false,
      failure: { kind: 'cancelled', message: 'Request cancelled.' },
    });
  });
});

describe('aiAssistantToolDefinitions', () => {
  it('closes the proposal schema and every nested object schema', () => {
    const proposal =
      aiAssistantToolDefinitions[aiAssistantToolDefinitions.length - 1];
    expect(proposal?.function.name).toBe('propose_library_operation');
    expect(proposal?.function.parameters).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['title', 'summary'],
    });
    expect(allObjectSchemasAreClosed(proposal?.function.parameters)).toBe(true);
  });
});

function success(
  content: string | null,
  toolCalls?: ReturnType<typeof toolCall>[],
): OpenRouterChatResult {
  return {
    ok: true,
    message: {
      role: 'assistant',
      content,
      ...(toolCalls ? { tool_calls: toolCalls } : {}),
    },
  };
}

function toolCall(id: string, name: string, arguments_: unknown) {
  return {
    id,
    type: 'function' as const,
    function: { name, arguments: JSON.stringify(arguments_) },
  };
}

function allObjectSchemasAreClosed(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(allObjectSchemasAreClosed);
  if (typeof value !== 'object' || value === null) return true;
  const record = value as Record<string, unknown>;
  if (record.type === 'object' && record.additionalProperties !== false) return false;
  return Object.values(record).every(allObjectSchemasAreClosed);
}
