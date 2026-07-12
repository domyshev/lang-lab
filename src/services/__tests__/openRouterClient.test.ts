import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_CHAT_URL,
  sendOpenRouterChat,
} from '../openRouterClient';

const apiKey = 'sk-or-secret-test-key';
const messages = [{ role: 'user' as const, content: 'Create travel cards.' }];
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_cards',
      description: 'Search cards.',
      parameters: {
        type: 'object' as const,
        additionalProperties: false as const,
        properties: {},
      },
    },
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendOpenRouterChat', () => {
  it('sends a non-streaming request with the exact OpenRouter contract', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'Ready.' } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendOpenRouterChat({
      apiKey,
      messages,
      tools,
      signal: controller.signal,
    });

    expect(result).toEqual({
      ok: true,
      message: { role: 'assistant', content: 'Ready.' },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(OPENROUTER_CHAT_URL);
    expect(init).toMatchObject({
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-OpenRouter-Title': 'Language Lab',
      },
    });
    expect(JSON.parse(String(init.body))).toEqual({
      model: DEFAULT_OPENROUTER_MODEL_ID,
      messages,
      tools,
      tool_choice: 'auto',
      parallel_tool_calls: false,
      stream: false,
    });
    expect(DEFAULT_OPENROUTER_MODEL_ID).toBe('openai/gpt-5.5');
    expect(OPENROUTER_CHAT_URL).toBe(
      'https://openrouter.ai/api/v1/chat/completions',
    );
  });

  it('sends the explicitly selected OpenRouter model id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'Ready.' } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await sendOpenRouterChat({
      apiKey,
      messages,
      tools,
      modelId: 'deepseek/deepseek-v4-flash',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe('deepseek/deepseek-v4-flash');
  });

  it.each([
    [401, 'invalid-key'],
    [403, 'invalid-key'],
    [402, 'credits'],
    [429, 'rate-limit'],
    [500, 'provider'],
  ] as const)('maps HTTP %i to %s without exposing the key', async (status, kind) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { message: `Provider rejected Bearer ${apiKey}` } },
          status,
        ),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe(kind);
    expect(JSON.stringify(result.error)).not.toContain(apiKey);
    expect(JSON.stringify(result.error)).not.toContain(`Bearer ${apiKey}`);
  });

  it('distinguishes a network failure and does not leak its key-bearing message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError(`Failed request for ${apiKey}`)),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'network',
        message: 'Unable to reach OpenRouter.',
      },
    });
  });

  it('distinguishes malformed JSON from other provider failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{not-json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'malformed-json',
        message: 'OpenRouter returned malformed JSON.',
      },
    });
  });

  it('treats AbortError while reading a successful body as cancellation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(
          new DOMException(`Aborted ${apiKey}`, 'AbortError'),
        ),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'cancelled', message: 'Request cancelled.' },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('treats a non-syntax successful body-read failure as a sanitized network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(new TypeError(`Body stream exposed ${apiKey}`)),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'network', message: 'Unable to read the OpenRouter response.' },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('lets cancellation win while reading a non-ok provider body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(
          new DOMException(`Aborted ${apiKey}`, 'AbortError'),
          500,
        ),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'cancelled', message: 'Request cancelled.' },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('types a generic non-ok body-read failure as a sanitized network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(new TypeError(`Body stream exposed ${apiKey}`), 500),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'network', message: 'Unable to read the OpenRouter response.' },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('preserves a known status when its provider body cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(new TypeError(`Body stream exposed ${apiKey}`), 401),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'invalid-key',
        message: 'The OpenRouter API key is invalid or revoked.',
      },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('types malformed JSON from a generic non-ok body read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        responseWithJsonFailure(new SyntaxError(`Malformed ${apiKey}`), 500),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'malformed-json',
        message: 'OpenRouter returned malformed JSON.',
      },
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it('returns a controlled malformed-response result for an invalid payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ choices: [] })));

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'malformed-response',
        message: 'OpenRouter returned an invalid chat completion.',
      },
    });
  });

  it.each([
    ['empty tool-call id', toolCall('', 'search_cards')],
    ['whitespace tool-call id', toolCall('   ', 'search_cards')],
    ['empty function name', toolCall('call-1', '')],
    ['whitespace function name', toolCall('call-1', '   ')],
  ])('rejects %s as a malformed response', async (_name, call) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [
            { message: { role: 'assistant', content: null, tool_calls: [call] } },
          ],
        }),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'malformed-response',
        message: 'OpenRouter returned an invalid chat completion.',
      },
    });
  });

  it('rejects duplicate tool-call ids as a malformed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  toolCall('duplicate', 'search_cards'),
                  toolCall('duplicate', 'get_cards'),
                ],
              },
            },
          ],
        }),
      ),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'malformed-response',
        message: 'OpenRouter returned an invalid chat completion.',
      },
    });
  });

  it('distinguishes AbortError as cancellation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Request aborted', 'AbortError')),
    );

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'cancelled', message: 'Request cancelled.' },
    });
  });

  it('recognizes a name-only AbortError across runtime realms', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const result = await sendOpenRouterChat({ apiKey, messages, tools });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'cancelled', message: 'Request cancelled.' },
    });
  });
});

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function responseWithJsonFailure(error: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockRejectedValue(error),
  } as unknown as Response;
}

function toolCall(id: string, name: string) {
  return {
    id,
    type: 'function',
    function: { name, arguments: '{}' },
  };
}
