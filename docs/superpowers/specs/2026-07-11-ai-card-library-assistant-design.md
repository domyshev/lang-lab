# AI Card Library Assistant Design

## Summary

Language Lab will add a frontend-only AI assistant for controlled card-library management. The assistant uses a user-provided OpenRouter API key and the fixed `deepseek/deepseek-v4-flash` model. It can inspect the complete local library through bounded read tools and propose one atomic write operation, but it cannot mutate Redux state until the user reviews and applies the proposal.

The existing `Agents LLM` surface becomes `AI Assistant`. A purple magic-wand button appears 10 pixels to the right of the `Card library` heading and opens the same assistant page as the top navigation tab.

## Goals

- Provide a useful conversational assistant for creating and maintaining language cards and card sets.
- Let a learner paste a list of words or phrases and receive complete Russian, English, and Spanish cards when the model can supply them.
- Give the assistant on-demand access to every local card and card set without sending the whole library in every request.
- Preview every proposed mutation before it can affect the library.
- Apply cards, duplicate merges, pending duplicates, card-set changes, and operation history atomically.
- Persist chat and operation history locally and support conflict-safe rollback.
- Preserve manual JSON import as an independent fallback.

## Non-Goals

- No backend or server-side key vault.
- No bundled or trial OpenRouter key.
- No model selector in the first version.
- No global card deletion by the assistant.
- No card-set archive or deletion by the assistant.
- No automatic mutation without explicit user confirmation.
- No streaming responses in the first version.
- No arbitrary web browsing or tools unrelated to the card library.

## OpenRouter Contract

- Endpoint: `https://openrouter.ai/api/v1/chat/completions`.
- Model: `deepseek/deepseek-v4-flash`.
- Authentication: `Authorization: Bearer <key>`.
- App headers: `HTTP-Referer` uses the current app origin and `X-OpenRouter-Title` is `Language Lab`.
- The agent loop allows at most eight model responses per user message.
- The current request is abortable through `AbortController`.
- Each request includes the same tool declarations, as required by OpenRouter tool-calling semantics.
- The model metadata currently advertises `tools`, `tool_choice`, `response_format`, and `structured_outputs` support.

Authoritative references:

- [OpenRouter authentication](https://openrouter.ai/docs/api/reference/authentication)
- [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling)
- [DeepSeek V4 Flash on OpenRouter](https://openrouter.ai/deepseek/deepseek-v4-flash-20260423/api)

## API Key Storage

The key is saved in a dedicated localStorage entry:

```text
language-crossword-lab:openrouter-api-key:v1
```

It is not stored in Redux, Redux Persist, chat messages, agent operations, exported JSON, console logs, error telemetry, or test fixtures. The interface uses a masked field with show, hide, save, and delete controls and states plainly that the key is stored unencrypted in this browser.

## Navigation And Entry Point

- Keep the internal AppShell section id `agents` to avoid collision with the existing assistant-character profile route.
- Localize the visible tab and page title as `AI Assistant`, `AI помощник`, and `Asistente IA`.
- In `CardSetLibraryPicker`, render a heading row containing the current `Card library` title and a purple `AutoFixHigh` wand icon button with an exact 10-pixel horizontal gap.
- The wand has a localized accessible label and tooltip and invokes a navigation callback supplied by `App`.
- Clicking the wand or the top tab opens the same assistant surface.

## Page Layout

The current import page is decomposed into an `AiAssistantView` and a reusable `ManualCardImportPanel`.

Desktop layout:

1. Page heading.
2. OpenRouter connection panel with masked key, save/delete controls, and a fixed `DeepSeek V4 Flash` model badge.
3. Two-column work area: chat on the left and operation history on the right.
4. Manual card import below the work area.

Mobile layout stacks the connection panel, chat, history, and manual import vertically. No card is nested inside another card. The chat composer remains visible at the bottom of the chat region without covering messages.

## Chat Behavior

- Persist at most the most recent 100 user and assistant messages through Redux Persist.
- Show localized empty-state suggestions before the first message.
- Disable send while a request is active and expose a cancel action.
- Render a playful assistant-thinking state until a complete non-streaming response arrives.
- Network, authentication, credit, rate-limit, provider, schema, and tool-loop failures appear as assistant error messages with a retry action.
- Retrying repeats the failed user request but never duplicates an already staged or applied operation.
- A clear-chat action removes chat messages but leaves operation history unchanged.

## System Context And Card Skill

`docs/LANGUAGE_CARD_FORMAT.md` remains the downloadable authoring guide and becomes the in-app assistant skill source through a Vite `?raw` import. The guide is updated to distinguish two modes:

- External authoring mode returns a JSON array with no surrounding prose.
- In-app assistant mode follows the same card quality rules but uses the provided library tools and proposes writes through `propose_library_operation`.

The system prompt also defines the assistant's limited authority, supported languages, one-meaning-per-card rule, duplicate behavior, and requirement to ask for clarification when the user's list is ambiguous.

## Read Tools

All read results are JSON, paginated, deterministic, and capped. They never mutate state.

### `list_card_sets`

Input:

```ts
{
  query?: string;
  cursor?: number;
  limit?: number; // clamped to 1..50
}
```

Returns localized names, ids, archived status, card counts, and pagination metadata. `All cards` is represented by the existing reserved id.

### `get_card_set`

Input:

```ts
{
  cardSetId: string;
  cursor?: number;
  limit?: number; // clamped to 1..100
}
```

Returns card-set metadata and a page of complete cards.

### `search_cards`

Input:

```ts
{
  query: string;
  cardSetId?: string;
  languages?: Array<'ru' | 'en' | 'es'>;
  cursor?: number;
  limit?: number; // clamped to 1..100
}
```

Searches normalized translations, definitions, examples, and tags.

### `get_cards`

Input:

```ts
{
  cardIds: string[]; // unique and capped at 100
}
```

Returns complete cards for known ids and a separate list of unknown ids.

## Write Proposal Tool

`propose_library_operation` is the only write-capable tool exposed to the model. Its execution only builds a staged proposal; it does not dispatch Redux actions.

It accepts:

```ts
{
  title: string;
  summary: string;
  cards?: Array<{
    clientRef: string;
    translations: Partial<Record<'ru' | 'en' | 'es', string>>;
    definitions?: Partial<Record<'ru' | 'en' | 'es', string>>;
    examples?: Partial<Record<'ru' | 'en' | 'es', Array<{
      sentence: string;
      answer: string;
    }>>;
    tags?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
  cardSetChanges?: Array<
    | {
        type: 'create';
        clientRef: string;
        names: Partial<Record<'ru' | 'en' | 'es', string>>;
        cardRefs: string[];
      }
    | {
        type: 'update';
        cardSetId: string;
        names?: Partial<Record<'ru' | 'en' | 'es', string>>;
        addCardRefs?: string[];
        removeCardIds?: string[];
      }
  >;
}
```

`cardRefs` may refer to staged `clientRef` values or existing card ids. Zod validates tool arguments before the domain planner runs.

## Proposal Planning

The domain planner consumes current cards, card sets, the validated proposal, and a single timestamp. It returns either blocking validation errors or an exact `PlannedAiOperation`.

The planner:

1. Reuses the existing card normalization and duplicate matching rules.
2. Creates stable ids for new cards and sets before preview.
3. Resolves staged card references to either new ids or safely matched existing ids.
4. Records safe field additions as card updates.
5. Records conflicting duplicates as new pending-duplicate entries.
6. Builds exact before and after values for every changed card and card set.
7. Builds preview counts for created cards, updated cards, pending duplicates, created sets, renamed sets, membership additions, and membership removals.
8. Rejects unknown ids, duplicate client references, unsupported languages, empty operations, archive/delete requests, and invalid set memberships.

The preview is a purple unframed operation panel inside chat. It shows title, summary, counts, validation warnings, `Cancel`, and `Apply`. `Apply` is disabled for blocking errors.

## Atomic Apply

One action object is handled by the cards, cardSets, and aiAssistant reducers in the same Redux dispatch:

```ts
applyAiOperation(plannedOperation)
```

The cards reducer applies created and updated cards and appends operation-owned duplicate merge and pending duplicate records. The cardSets reducer creates or updates sets. The aiAssistant reducer stores the applied operation with its before/after patches and status `applied`.

This gives one observable Redux transition and prevents a partially applied library operation.

## Operation History And Rollback

Each applied operation stores:

- id, title, summary, user prompt, model id, createdAt, appliedAt;
- created cards and card sets;
- before/after snapshots for updated cards and card sets;
- ids of duplicate-processing and pending-duplicate records created by the operation;
- preview counts;
- status `applied` or `reverted` and optional revertedAt.

The history is persisted without an automatic length cap. It displays newest first.

Rollback uses a single action:

```ts
revertAiOperation({ operationId, revertedAt })
```

Before dispatching, a conflict detector compares every affected current entity with the operation's recorded after state. If a later change touched the same entity, rollback is blocked and the interface names the newer dependent operation when available. It never overwrites newer values silently. Without conflicts, one dispatch removes operation-created entities, restores before snapshots, removes operation-owned duplicate records, and marks the operation `reverted`.

Reverted operations cannot be reverted twice. Re-applying a reverted operation is outside the first version.

## Error Handling

- Missing key: focus the key field and do not call OpenRouter.
- `401` or `403`: localized invalid/revoked key message.
- `402`: localized insufficient credits message.
- `429`: localized rate-limit message.
- Other non-2xx responses: preserve the sanitized OpenRouter message without headers or keys.
- Network failure: retryable chat error.
- Aborted request: neutral cancelled state, not an error.
- Malformed model response or tool arguments: retryable schema error.
- Unknown tool: terminate the loop with a controlled error.
- More than eight rounds: terminate with a loop-limit error.
- Invalid proposal: retain it for inspection but disable Apply.
- Redux state is never changed by a failed request, read tool, cancelled proposal, or blocked rollback.

## Localization And DOM Hooks

- All visible text is localized in English, Russian, and Spanish.
- Committed documentation remains English.
- Every new meaningful DOM element receives a unique `data-test` attribute following the existing `group__element` convention.
- Icon-only controls have localized accessible labels and tooltips.

## Test Strategy

### Domain unit tests

- Zod schema acceptance and rejection.
- Pagination and search behavior for every read tool.
- Duplicate-safe proposal planning and pending conflicts.
- Exact preview counts and clientRef resolution.
- Atomic apply patches.
- Successful rollback and conflict-blocked rollback.
- API-key storage never appears in Redux state.

### Component tests

- Wand position, tooltip, and navigation callback.
- Localized AI Assistant tab and page titles.
- Masked key save/show/delete behavior.
- Chat empty, thinking, response, retry, and cancel states.
- Proposal preview, Apply disabled state, Apply, Cancel, operation history, and rollback conflict UI.
- Responsive layout semantics.

### Integration tests

- Mocked OpenRouter chat completion with read tool, tool result, proposal tool, and final assistant response.
- Authorization/header construction without logging the key.
- Eight-round loop limit and AbortController behavior.

### Playwright

Use a routed mock for OpenRouter and cover:

1. Click the purple wand from Card library.
2. Save a test key.
3. Ask for a named set from a word list.
4. Observe the staged preview.
5. Apply it.
6. Verify the set and cards in the Cards section.
7. Return to operation history and roll it back.
8. Verify the created set and cards are gone.

## Acceptance Criteria

- The wand is visibly 10 pixels to the right of the Card library heading and opens AI Assistant.
- The tab and page are renamed in all three interface languages.
- A local OpenRouter key can be saved, masked, shown, and removed.
- A real OpenRouter request uses `deepseek/deepseek-v4-flash` and bounded library tools.
- The assistant can turn a word or phrase list into valid multilingual cards and a named set.
- No AI write occurs before the user presses Apply.
- Apply changes cards, sets, duplicate metadata, and history in one Redux dispatch.
- Every applied operation is visible and can be safely rolled back unless a later conflicting edit exists.
- Manual JSON import remains available.
- Existing game, card, statistics, import, persistence, and 2,000-card performance behavior remains green.
