import languageCardSkill from '../../docs/LANGUAGE_CARD_FORMAT.md?raw';
import { aiLibraryProposalSchema } from '../domain/aiAssistantSchemas';
import {
  AiLibrarySnapshot,
  AiReadToolName,
  aiReadToolDefinitions,
  executeAiReadTool,
} from '../domain/aiLibraryTools';
import { PlannedAiOperation, planAiOperation } from '../domain/aiOperations';
import type { BlockedAiPreview } from '../domain/aiBlockedPreview';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OpenRouterChatMessage,
  OpenRouterError,
  OpenRouterModelId,
  OpenRouterToolDefinition,
  sendOpenRouterChat,
} from './openRouterClient';

const MAX_MODEL_RESPONSES = 8;
const PROPOSAL_TOOL_NAME = 'propose_library_operation';
const readToolNames = new Set<string>(
  aiReadToolDefinitions.map((tool) => tool.function.name),
);

export const aiAssistantToolDefinitions: OpenRouterToolDefinition[] = [
  ...aiReadToolDefinitions,
  {
    type: 'function',
    function: {
      name: PROPOSAL_TOOL_NAME,
      description:
        'Stage one validated card-library operation for user review. This does not apply changes.',
      parameters: proposalToolParameters(),
    },
  },
];

export type AiAgentFailure =
  | { kind: 'cancelled'; message: string }
  | { kind: 'transport'; message: string; error: OpenRouterError }
  | { kind: 'unknown-tool'; message: string; toolName: string }
  | { kind: 'invalid-tool-arguments'; message: string; toolName: string }
  | { kind: 'invalid-proposal'; message: string; errors: string[] }
  | { kind: 'empty-response'; message: string }
  | { kind: 'loop-limit'; message: string };

export type AiAgentResult =
  | { ok: true; content: string; stagedOperation?: PlannedAiOperation }
  | { ok: false; failure: AiAgentFailure; blockedPreview?: BlockedAiPreview };

export async function runAiAssistant(input: {
  apiKey: string;
  modelId?: OpenRouterModelId;
  userMessage: string;
  snapshot: AiLibrarySnapshot;
  signal?: AbortSignal;
  now?: () => string;
  idFactory?: (prefix: string) => string;
}): Promise<AiAgentResult> {
  const messages: OpenRouterChatMessage[] = [
    { role: 'system', content: createSystemMessage() },
    { role: 'user', content: input.userMessage },
  ];
  let stagedOperation: PlannedAiOperation | undefined;

  for (let responseCount = 0; responseCount < MAX_MODEL_RESPONSES; responseCount += 1) {
    const response = await sendOpenRouterChat({
        apiKey: input.apiKey,
        messages: [...messages],
        modelId: input.modelId ?? DEFAULT_OPENROUTER_MODEL_ID,
        tools: aiAssistantToolDefinitions,
        signal: input.signal,
    });
    if (!response.ok) {
      if (response.error.kind === 'cancelled') {
        return {
          ok: false,
          failure: { kind: 'cancelled', message: response.error.message },
        };
      }
      return {
        ok: false,
        failure: {
          kind: 'transport',
          message: response.error.message,
          error: response.error,
        },
      };
    }

    const assistantMessage = response.message;
    const toolCalls = assistantMessage.tool_calls ?? [];
    if (toolCalls.length === 0) {
      if (
        typeof assistantMessage.content !== 'string' ||
        assistantMessage.content.trim().length === 0
      ) {
        return {
          ok: false,
          failure: {
            kind: 'empty-response',
            message: 'The assistant returned neither content nor tool calls.',
          },
        };
      }
      return {
        ok: true,
        content: assistantMessage.content,
        ...(stagedOperation ? { stagedOperation } : {}),
      };
    }

    messages.push(assistantMessage);
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      if (!readToolNames.has(toolName) && toolName !== PROPOSAL_TOOL_NAME) {
        return {
          ok: false,
          failure: {
            kind: 'unknown-tool',
            message: 'The model requested an unknown tool.',
            toolName,
          },
        };
      }

      const parsedArguments = parseArguments(toolCall.function.arguments);
      if (!parsedArguments.ok) {
        return invalidArguments(toolName);
      }

      if (toolName === PROPOSAL_TOOL_NAME) {
        const parsedProposal = aiLibraryProposalSchema.safeParse(parsedArguments.value);
        if (!parsedProposal.success) {
          return invalidProposal(
            parsedProposal.error.issues.map((issue) => issue.message),
            parsedArguments.value,
          );
        }
        const planned = planAiOperation({
          cards: input.snapshot.cards,
          cardSets: input.snapshot.cardSets,
          proposal: parsedProposal.data,
          modelId: input.modelId ?? DEFAULT_OPENROUTER_MODEL_ID,
          now: input.now?.() ?? new Date().toISOString(),
          userPrompt: input.userMessage,
          idFactory: input.idFactory,
        });
        if (!planned.ok) {
          return invalidProposal(planned.errors, parsedProposal.data);
        }
        stagedOperation = planned.operation;
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(planned),
        });
        continue;
      }

      try {
        const result = executeAiReadTool(
          toolName as AiReadToolName,
          parsedArguments.value,
          input.snapshot,
        );
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch {
        return invalidArguments(toolName);
      }
    }
  }

  return {
    ok: false,
    failure: {
      kind: 'loop-limit',
      message: 'The assistant reached the eight-response limit.',
    },
  };
}

function createSystemMessage(): string {
  return `You are the Language Lab card-library assistant with limited authority.
You may inspect the supplied current library only through the four read tools.
You may propose writes only through propose_library_operation. That tool stages a plan for user review; you never dispatch Redux actions, apply changes, delete global cards, or archive or delete card sets.
Never invent an id for an existing card or card set. Read the current library to obtain existing ids.
Ask for clarification when a requested word, phrase, or meaning is ambiguous.

The following raw English skill document is authoritative for card quality and format:

${languageCardSkill}`;
}

function parseArguments(
  rawArguments: string,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(rawArguments) };
  } catch {
    return { ok: false };
  }
}

function invalidArguments(toolName: string): AiAgentResult {
  return {
    ok: false,
    failure: {
      kind: 'invalid-tool-arguments',
      message: 'The model supplied invalid tool arguments.',
      toolName,
    },
  };
}

function invalidProposal(errors: string[], proposal: unknown): AiAgentResult {
  const validationWarnings = [...new Set(errors)];
  return {
    ok: false,
    failure: {
      kind: 'invalid-proposal',
      message: 'The proposed library operation is invalid.',
      errors: validationWarnings,
    },
    blockedPreview: {
      ...readPreviewText(proposal),
      validationWarnings,
    },
  };
}

function readPreviewText(proposal: unknown): Pick<BlockedAiPreview, 'title' | 'summary'> {
  if (typeof proposal !== 'object' || proposal === null) {
    return {};
  }
  const candidate = proposal as Record<string, unknown>;
  const title = readNonEmptyText(candidate.title);
  const summary = readNonEmptyText(candidate.summary);
  return {
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
  };
}

function readNonEmptyText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function proposalToolParameters(): Record<string, unknown> {
  const languageMap = () => ({
    type: 'object',
    additionalProperties: false,
    properties: {
      en: { type: 'string', minLength: 1 },
      es: { type: 'string', minLength: 1 },
      ru: { type: 'string', minLength: 1 },
    },
  });
  const example = {
    type: 'object',
    additionalProperties: false,
    required: ['answer', 'sentence'],
    properties: {
      answer: { type: 'string', minLength: 1 },
      sentence: { type: 'string', minLength: 1 },
    },
  };
  const examples = {
    type: 'object',
    additionalProperties: false,
    properties: {
      en: { type: 'array', minItems: 1, items: example },
      es: { type: 'array', minItems: 1, items: example },
      ru: { type: 'array', minItems: 1, items: example },
    },
  };
  const card = {
    type: 'object',
    additionalProperties: false,
    required: ['clientRef', 'translations'],
    properties: {
      clientRef: { type: 'string', minLength: 1 },
      translations: languageMap(),
      definitions: languageMap(),
      examples,
      tags: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    },
  };
  const createSet = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'clientRef', 'names', 'cardRefs'],
    properties: {
      type: { const: 'create' },
      clientRef: { type: 'string', minLength: 1 },
      names: languageMap(),
      cardRefs: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
    },
  };
  const updateSet = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'cardSetId'],
    properties: {
      type: { const: 'update' },
      cardSetId: { type: 'string', minLength: 1 },
      names: languageMap(),
      addCardRefs: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
      removeCardIds: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
    },
  };

  return {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'summary'],
    properties: {
      title: { type: 'string', minLength: 1 },
      summary: { type: 'string', minLength: 1 },
      cards: { type: 'array', items: card },
      cardSetChanges: {
        type: 'array',
        items: { oneOf: [createSet, updateSet] },
      },
    },
  };
}
