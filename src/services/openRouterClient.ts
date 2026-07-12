export const OPENROUTER_CHAT_URL =
  'https://openrouter.ai/api/v1/chat/completions';
export {
  DEFAULT_OPENROUTER_MODEL_ID,
  type OpenRouterModelId,
} from './openRouterKeyStorage';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  type OpenRouterModelId,
} from './openRouterKeyStorage';

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
  modelId?: OpenRouterModelId;
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
        model: input.modelId ?? DEFAULT_OPENROUTER_MODEL_ID,
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
    const bodyResult = await readJsonBody(response);
    if (!bodyResult.ok && bodyResult.kind === 'cancelled') {
      return bodyReadFailure(bodyResult.kind);
    }
    if (response.status === 401 || response.status === 403) {
      return failure('invalid-key', 'The OpenRouter API key is invalid or revoked.');
    }
    if (response.status === 402) {
      return failure('credits', 'The OpenRouter account has insufficient credits.');
    }
    if (response.status === 429) {
      return failure('rate-limit', 'OpenRouter rate limit reached.');
    }
    if (!bodyResult.ok) {
      return bodyReadFailure(bodyResult.kind);
    }
    const providerMessage = extractProviderMessage(bodyResult.value);
    return failure(
      'provider',
      (providerMessage && sanitizeProviderMessage(providerMessage, input.apiKey)) ||
        `OpenRouter request failed with status ${response.status}.`,
      response.status,
    );
  }

  const bodyResult = await readJsonBody(response);
  if (!bodyResult.ok) {
    return bodyReadFailure(bodyResult.kind);
  }

  const message = readAssistantMessage(bodyResult.value);
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

type BodyReadFailureKind = 'cancelled' | 'malformed-json' | 'network';

async function readJsonBody(
  response: Response,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; kind: BodyReadFailureKind }
> {
  try {
    return { ok: true, value: await response.json() };
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, kind: 'cancelled' };
    }
    if (isNamedError(error, 'SyntaxError')) {
      return { ok: false, kind: 'malformed-json' };
    }
    return { ok: false, kind: 'network' };
  }
}

function bodyReadFailure(kind: BodyReadFailureKind): OpenRouterChatResult {
  switch (kind) {
    case 'cancelled':
      return failure('cancelled', 'Request cancelled.');
    case 'malformed-json':
      return failure('malformed-json', 'OpenRouter returned malformed JSON.');
    case 'network':
      return failure('network', 'Unable to read the OpenRouter response.');
  }
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
  if (!Array.isArray(value)) return false;

  const callIds = new Set<string>();
  return value.every((call) => {
    if (
      !isRecord(call) ||
      typeof call.id !== 'string' ||
      call.id.trim().length === 0 ||
      callIds.has(call.id) ||
      call.type !== 'function' ||
      !isRecord(call.function) ||
      typeof call.function.name !== 'string' ||
      call.function.name.trim().length === 0 ||
      typeof call.function.arguments !== 'string'
    ) {
      return false;
    }
    callIds.add(call.id);
    return true;
  });
}

function isAbortError(error: unknown): boolean {
  return isNamedError(error, 'AbortError');
}

function isNamedError(error: unknown, name: string): boolean {
  return isRecord(error) && error.name === name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
