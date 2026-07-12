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
    expect(first.messages[0].content).toContain('# Language Card JSON Format');
    expect(first.messages[0].content).toContain('limited authority');
    expect(first.messages[0].content).toContain('archive: true');
    expect(first.messages[0].content).toContain('must not archive all-cards');
    expect(first.messages[0].content).toContain('archiveFilter');
    expect(first.messages[0].content).not.toContain('archive or delete card sets');
    expect(first.messages[0].content).toContain('never dispatch');
    expect(first.messages[0].content).toContain(
      'Current selected model id: deepseek/deepseek-v4-flash',
    );
    expect(first.messages[0].content).toContain('Current effort: default');
    expect(first.messages[0].content).toContain(
      'You may answer questions about the supplied recent chat history',
    );

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

  it('sends recent chat history before the current user message', async () => {
    sendChatMock.mockResolvedValueOnce(success('I created the follow-up set.'));

    await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Use these cards to create a new set.',
      chatHistory: [
        {
          role: 'user',
          content: 'Show me five interesting Love cards.',
        },
        {
          role: 'assistant',
          content: 'I picked soulmate, longing, cherish, blush, and flirt.',
        },
      ],
      snapshot,
    });

    const first = sendChatMock.mock.calls[0][0];
    expect(first.messages).toHaveLength(4);
    expect(first.messages[0]).toMatchObject({ role: 'system' });
    expect(first.messages[0].content).toContain('recent chat history');
    expect(first.messages.slice(1)).toEqual([
      { role: 'user', content: 'Show me five interesting Love cards.' },
      {
        role: 'assistant',
        content: 'I picked soulmate, longing, cherish, blush, and flirt.',
      },
      { role: 'user', content: 'Use these cards to create a new set.' },
    ]);
  });

  it('uses the default OpenRouter model when no model is selected', async () => {
    sendChatMock.mockResolvedValueOnce(success('Ready.'));

    await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Review my cards.',
      snapshot,
    });

    expect(sendChatMock.mock.calls[0][0].modelId).toBe(
      'deepseek/deepseek-v4-flash',
    );
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

  it('lets the model recover after it asks for an unknown direct-write tool', async () => {
    const unknownWriteCall = toolCall('direct-write-1', 'create_card_set', {
      name: 'Funny love',
      cardRefs: ['crush', 'attraction'],
    });
    const proposalCall = toolCall('proposal-after-tool-error', 'propose_library_operation', {
      title: 'Funny love',
      summary: 'Create a set from the funny love cards selected earlier.',
      cardSetChanges: [
        {
          type: 'create',
          clientRef: 'funny-love-set',
          names: { en: 'Funny love', ru: 'краш любовь', es: 'Amor divertido' },
          cardRefs: ['existing-airport'],
        },
      ],
    });
    sendChatMock
      .mockResolvedValueOnce(success(null, [unknownWriteCall]))
      .mockResolvedValueOnce(success(null, [proposalCall]))
      .mockResolvedValueOnce(success('I staged the corrected card-set proposal.'));

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Create a new set from those cards.',
      chatHistory: [
        {
          role: 'assistant',
          content: 'I selected crush, attraction, chemistry, blush, and cuddle.',
        },
      ],
      snapshot,
      now: () => now,
      idFactory: (prefix) => `${prefix}-fixed`,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe('I staged the corrected card-set proposal.');
    expect(result.stagedOperation?.title).toBe('Funny love');

    const second = sendChatMock.mock.calls[1][0];
    expect(second.messages.slice(-2)).toEqual([
      { role: 'assistant', content: null, tool_calls: [unknownWriteCall] },
      {
        role: 'tool',
        tool_call_id: 'direct-write-1',
        content: JSON.stringify({
          ok: false,
          error: 'unknown_tool',
          toolName: 'create_card_set',
          message:
            'Use propose_library_operation for writes and read tools for inspection.',
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

  it.each([
    [
      'malformed JSON',
      '{bad-json',
      'Tool arguments must be valid JSON matching the tool schema.',
    ],
    [
      'invalid arguments',
      JSON.stringify({ query: '' }),
      'The supplied arguments did not match the tool schema. Correct them and call the tool again.',
    ],
  ])('lets the model recover after %s for a read tool', async (_name, arguments_, message) => {
    const invalidCall = {
      id: 'bad-args',
      type: 'function' as const,
      function: { name: 'search_cards', arguments: arguments_ },
    };
    sendChatMock
      .mockResolvedValueOnce({
        ok: true,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [invalidCall],
        },
      })
      .mockResolvedValueOnce(success('I corrected the tool call.'));

    const result = await runAiAssistant({
      apiKey: 'key',
      userMessage: 'Search.',
      snapshot,
    });

    expect(result).toEqual({ ok: true, content: 'I corrected the tool call.' });
    const second = sendChatMock.mock.calls[1][0];
    expect(second.messages.slice(-2)).toEqual([
      { role: 'assistant', content: null, tool_calls: [invalidCall] },
      {
        role: 'tool',
        tool_call_id: 'bad-args',
        content: JSON.stringify({
          ok: false,
          error: 'invalid_tool_arguments',
          toolName: 'search_cards',
          message,
        }),
      },
    ]);
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
  it('allows archive proposals only through a closed card-set update schema', () => {
    const proposal =
      aiAssistantToolDefinitions[aiAssistantToolDefinitions.length - 1];
    const parameters = proposal?.function.parameters as {
      properties?: {
        cardSetChanges?: {
          items?: { oneOf?: Array<{ properties?: Record<string, unknown> }> };
        };
      };
    };
    const updateSet = parameters.properties?.cardSetChanges?.items?.oneOf?.[1];

    expect(updateSet).toMatchObject({
      additionalProperties: false,
      properties: { archive: { const: true } },
    });
  });

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
