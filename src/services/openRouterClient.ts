export const OPENROUTER_CHAT_URL =
  'https://openrouter.ai/api/v1/chat/completions';
export const AI_ASSISTANT_MODEL_ID = 'deepseek/deepseek-v4-flash';

export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export type OpenRouterChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    }
  | { role: 'tool'; content: string; tool_call_id: string };

export interface OpenRouterToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type OpenRouterErrorKind =
  | 'invalid-key'
  | 'credits'
  | 'rate-limit'
  | 'provider'
  | 'network'
  | 'malformed-json'
  | 'malformed-response'
  | 'cancelled';

export interface OpenRouterError {
  kind: OpenRouterErrorKind;
  message: string;
  status?: number;
}

export type OpenRouterChatResult =
  | { ok: true; message: Extract<OpenRouterChatMessage, { role: 'assistant' }> }
  | { ok: false; error: OpenRouterError };

export async function sendOpenRouterChat(input: {
  apiKey: string;
  messages: OpenRouterChatMessage[];
  tools: OpenRouterToolDefinition[];
  signal?: AbortSignal;
}): Promise<OpenRouterChatResult> {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-OpenRouter-Title': 'Language Lab',
      },
      body: JSON.stringify({
        model: AI_ASSISTANT_MODEL_ID,
        messages: input.messages,
        tools: input.tools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        stream: false,
      }),
      signal: input.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      return failure('cancelled', 'Request cancelled.');
    }
    return failure('network', 'Unable to reach OpenRouter.');
  }

  if (!response.ok) {
    const providerMessage = await readProviderError(response, input.apiKey);
    if (response.status === 401 || response.status === 403) {
      return failure('invalid-key', 'The OpenRouter API key is invalid or revoked.');
    }
    if (response.status === 402) {
      return failure('credits', 'The OpenRouter account has insufficient credits.');
    }
    if (response.status === 429) {
      return failure('rate-limit', 'OpenRouter rate limit reached.');
    }
    return failure(
      'provider',
      providerMessage || `OpenRouter request failed with status ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return failure('malformed-json', 'OpenRouter returned malformed JSON.');
  }

  const message = readAssistantMessage(payload);
  if (!message) {
    return failure(
      'malformed-response',
      'OpenRouter returned an invalid chat completion.',
    );
  }

  return { ok: true, message };
}

function failure(
  kind: OpenRouterErrorKind,
  message: string,
  status?: number,
): OpenRouterChatResult {
  return {
    ok: false,
    error: status === undefined ? { kind, message } : { kind, message, status },
  };
}

async function readProviderError(
  response: Response,
  apiKey: string,
): Promise<string> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return '';
  }

  const message = extractProviderMessage(payload);
  return message ? sanitizeProviderMessage(message, apiKey) : '';
}

function extractProviderMessage(payload: unknown): string {
  if (!isRecord(payload)) return '';
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error === 'string') return payload.error;
  if (isRecord(payload.error) && typeof payload.error.message === 'string') {
    return payload.error.message;
  }
  return '';
}

function sanitizeProviderMessage(message: string, apiKey: string): string {
  const withoutKey = apiKey ? message.split(apiKey).join('[redacted]') : message;
  return withoutKey
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 500);
}

function readAssistantMessage(
  payload: unknown,
): Extract<OpenRouterChatMessage, { role: 'assistant' }> | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return null;
  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return null;
  const message = firstChoice.message;
  if (message.role !== 'assistant') return null;
  if (message.content !== null && typeof message.content !== 'string') return null;
  if (message.tool_calls !== undefined && !isToolCalls(message.tool_calls)) return null;

  return {
    role: 'assistant',
    content: message.content,
    ...(message.tool_calls === undefined ? {} : { tool_calls: message.tool_calls }),
  };
}

function isToolCalls(value: unknown): value is OpenRouterToolCall[] {
  return (
    Array.isArray(value) &&
    value.every(
      (call) =>
        isRecord(call) &&
        typeof call.id === 'string' &&
        call.type === 'function' &&
        isRecord(call.function) &&
        typeof call.function.name === 'string' &&
        typeof call.function.arguments === 'string',
    )
  );
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
