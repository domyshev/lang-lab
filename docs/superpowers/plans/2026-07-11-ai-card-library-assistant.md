# AI Card Library Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frontend-only OpenRouter chat assistant that can inspect the local card library, stage one validated mutation, apply it atomically, and safely roll it back.

**Architecture:** Pure domain modules own schemas, read tools, planning, and rollback checks. A bounded OpenRouter agent loop invokes those modules without mutating state. One shared Redux action is handled by cards, card sets, and a new AI assistant slice so apply and rollback each happen as one dispatch.

**Tech Stack:** React 18, TypeScript, MUI 6, Redux Toolkit, Redux Persist, Zod, Vitest, Testing Library, Playwright, OpenRouter Chat Completions.

## Global Constraints

- Keep `TASK_REQUIREMENTS.md` unchanged.
- Store the OpenRouter key only under `language-crossword-lab:openrouter-api-key:v1` in localStorage, outside Redux.
- Use the fixed model id `deepseek/deepseek-v4-flash` and endpoint `https://openrouter.ai/api/v1/chat/completions`.
- Allow at most eight model rounds per user message.
- Expose bounded read tools and only one non-mutating write proposal tool named `propose_library_operation`.
- Never mutate the library before explicit Apply confirmation.
- Do not let AI delete global cards or archive/delete card sets.
- Apply and rollback each use one Redux dispatch across cards, card sets, and AI operation history.
- Persist no more than 100 chat messages; do not cap operation history.
- Keep manual JSON import available.
- Localize visible UI in English, Russian, and Spanish; keep committed documentation in English.
- Add unique `data-test` hooks to every new meaningful DOM element.
- Follow TDD: write and run the failing test before production code for each task.
- Every commit uses a concise subject and a detailed body.

---

## File Structure

### New domain and service files

- `src/domain/aiAssistantSchemas.ts`: Zod schemas and inferred proposal types.
- `src/domain/aiLibraryTools.ts`: bounded, pure read-tool implementations.
- `src/domain/aiOperations.ts`: proposal planner, preview counts, rollback conflict detector, operation types.
- `src/services/openRouterKeyStorage.ts`: dedicated localStorage adapter.
- `src/services/openRouterClient.ts`: typed Chat Completions request/response transport.
- `src/services/aiAssistantAgent.ts`: bounded tool-calling loop and system context.
- `src/store/aiAssistantActions.ts`: shared atomic apply and rollback actions.
- `src/store/aiAssistantSlice.ts`: persisted chat, staged proposal, and operation history.

### New UI files

- `src/components/AiAssistantView.tsx`: page orchestration and network lifecycle.
- `src/components/ManualCardImportPanel.tsx`: extracted existing file-import UI.
- `src/components/ai/AiConnectionPanel.tsx`: key and model controls.
- `src/components/ai/AiChatPanel.tsx`: messages, composer, thinking, retry, cancel.
- `src/components/ai/AiOperationPreview.tsx`: staged operation summary and Apply/Cancel.
- `src/components/ai/AiOperationHistory.tsx`: newest-first operation history and rollback.

### Existing files to modify

- `package.json`, `package-lock.json`: add Zod.
- `src/domain/importCards.ts`: expose resolved card ids and injectable id factory.
- `src/store/cardsSlice.ts`, `src/store/cardSetsSlice.ts`, `src/store/store.ts`: atomic operation handling and assistant reducer.
- `src/components/ImportCardsView.tsx`: become a compatibility wrapper or be replaced by the new page.
- `src/components/CardSetLibraryPicker.tsx`: purple wand entry point with exact 10-pixel heading gap.
- `src/App.tsx`, `src/components/AppShell.tsx`: route the wand and rename the visible tab.
- `src/domain/i18n.ts`: all assistant strings in three languages.
- `docs/LANGUAGE_CARD_FORMAT.md`: external and in-app assistant modes.
- Existing tests and `e2e/golden-base.spec.ts`: update renamed surface and add end-to-end workflow.

---

### Task 1: Proposal Schemas And API-Key Storage

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/domain/aiAssistantSchemas.ts`
- Create: `src/domain/__tests__/aiAssistantSchemas.test.ts`
- Create: `src/services/openRouterKeyStorage.ts`
- Create: `src/services/__tests__/openRouterKeyStorage.test.ts`

**Interfaces:**
- Produces `aiLibraryProposalSchema`, `AiLibraryProposal`, `AiProposalCard`, and `AiCardSetChange`.
- Produces `OPENROUTER_KEY_STORAGE_KEY`, `loadOpenRouterKey`, `saveOpenRouterKey`, and `removeOpenRouterKey`.

- [ ] **Step 1: Add Zod**

Run:

```bash
npm install zod@^3.24.2
```

Expected: `package.json` and `package-lock.json` include Zod.

- [ ] **Step 2: Write failing schema tests**

Cover a complete three-language proposal, two-language cards, create/update set changes, duplicate `clientRef`, unsupported language keys, fewer than two translations, empty operations, and archive/delete-shaped input. Assert `safeParse` success or failure explicitly.

Core wished-for API:

```ts
const result = aiLibraryProposalSchema.safeParse({
  title: 'Travel',
  summary: 'Create travel cards',
  cards: [{
    clientRef: 'airport',
    translations: { en: 'airport', ru: 'аэропорт', es: 'aeropuerto' },
  }],
  cardSetChanges: [{
    type: 'create',
    clientRef: 'travel-set',
    names: { en: 'Travel', ru: 'Путешествия', es: 'Viajes' },
    cardRefs: ['airport'],
  }],
});
expect(result.success).toBe(true);
```

- [ ] **Step 3: Run schema tests and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/aiAssistantSchemas.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 4: Implement strict schemas**

Use `.strict()` object schemas, supported-language records, trimmed non-empty strings, at least two translations, unique non-empty client refs, and a root `superRefine` that rejects proposals with neither cards nor card-set changes. Export inferred TypeScript types.

- [ ] **Step 5: Write failing key-storage tests**

Use a stub `Storage` object and assert exact key usage, trimming, removal for blank input, and no Redux dependency:

```ts
saveOpenRouterKey('  sk-or-test  ', storage);
expect(storage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe('sk-or-test');
removeOpenRouterKey(storage);
expect(loadOpenRouterKey(storage)).toBe('');
```

- [ ] **Step 6: Run key-storage tests and verify RED**

Run:

```bash
npm test -- --run src/services/__tests__/openRouterKeyStorage.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 7: Implement key storage**

Export:

```ts
export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';
export function loadOpenRouterKey(storage: Storage = window.localStorage): string;
export function saveOpenRouterKey(value: string, storage?: Storage): void;
export function removeOpenRouterKey(storage?: Storage): void;
```

Never log the value.

- [ ] **Step 8: Run Task 1 tests and commit**

Run:

```bash
npm test -- --run src/domain/__tests__/aiAssistantSchemas.test.ts src/services/__tests__/openRouterKeyStorage.test.ts
npm run lint
```

Commit subject: `Add AI proposal schemas and key storage`.

---

### Task 2: Bounded Library Read Tools

**Files:**
- Create: `src/domain/aiLibraryTools.ts`
- Create: `src/domain/__tests__/aiLibraryTools.test.ts`

**Interfaces:**
- Consumes `LanguageCard`, `CardSet`, `ALL_CARDS_CARD_SET_ID`, and supported languages.
- Produces `AiLibrarySnapshot`, `executeAiReadTool`, `aiReadToolDefinitions`, and `AiReadToolName`.

- [ ] **Step 1: Write failing read-tool tests**

Create a fixture with localized set names, archived and active sets, translations, definitions, examples, and tags. Cover:

```ts
executeAiReadTool('list_card_sets', { query: 'trav', limit: 500 }, snapshot);
executeAiReadTool('get_card_set', { cardSetId: 'travel', cursor: 1, limit: 1 }, snapshot);
executeAiReadTool('search_cards', { query: 'airport', languages: ['en'] }, snapshot);
executeAiReadTool('get_cards', { cardIds: ['known', 'missing', 'known'] }, snapshot);
```

Assert limits clamp to 50 or 100, pagination metadata is stable, unknown ids are explicit, and search covers translations, definitions, examples, and tags.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/aiLibraryTools.test.ts
```

Expected: FAIL because `aiLibraryTools.ts` does not exist.

- [ ] **Step 3: Implement pure tool execution**

Define:

```ts
export interface AiLibrarySnapshot {
  cards: LanguageCard[];
  cardSets: CardSet[];
  interfaceLanguage: SupportedLanguage;
}

export function executeAiReadTool(
  name: AiReadToolName,
  rawArguments: unknown,
  snapshot: AiLibrarySnapshot,
): unknown;
```

Validate each argument object with local Zod schemas. Normalize search with the existing whitespace/lowercase convention. Return serializable plain objects only.

- [ ] **Step 4: Define OpenRouter tool declarations**

Export `aiReadToolDefinitions` as OpenAI-compatible function tool objects with exact names `list_card_sets`, `get_card_set`, `search_cards`, and `get_cards`. Keep `additionalProperties: false` in every JSON schema.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- --run src/domain/__tests__/aiLibraryTools.test.ts
npm run lint
```

Commit subject: `Add bounded AI library read tools`.

---

### Task 3: Operation Planning And Conflict-Safe Rollback

**Files:**
- Modify: `src/domain/importCards.ts`
- Modify: `src/domain/__tests__/importCards.test.ts`
- Create: `src/domain/aiOperations.ts`
- Create: `src/domain/__tests__/aiOperations.test.ts`

**Interfaces:**
- Extends `ImportResult` with `resolvedCardIds: Array<string | undefined>`.
- Adds optional `idFactory?: (prefix: string) => string` to `importLanguageCards` input.
- Produces `PlannedAiOperation`, `AiOperationPreviewCounts`, `planAiOperation`, and `findAiRollbackConflict`.

- [ ] **Step 1: Write failing import resolution tests**

Assert that new, safely merged, conflicting duplicate, skipped duplicate, and invalid incoming records return the complete aligned `resolvedCardIds` vector. Every valid duplicate resolves to its existing id; only the invalid record resolves to `undefined`. Inject deterministic ids:

```ts
const result = importLanguageCards({
  existingCards,
  pastedJson,
  now,
  idFactory: (prefix) => `${prefix}-fixed`,
});
expect(result.resolvedCardIds).toEqual([
  'card-fixed',
  safelyMergedId,
  conflictingDuplicateId,
  skippedDuplicateId,
  undefined,
]);
```

- [ ] **Step 2: Run import test and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/importCards.test.ts
```

Expected: FAIL because `resolvedCardIds` and `idFactory` are absent.

- [ ] **Step 3: Extend import result without changing existing behavior**

Push one aligned resolved id for every parsed array item. Use the injected factory for card, merge, and pending ids and keep the existing random id behavior as the default.

- [ ] **Step 4: Write failing operation planner tests**

Cover one proposal that creates a card and set, one that safely completes an existing card and renames a set, one conflicting duplicate that creates pending metadata, membership removal, unknown ids, duplicate client refs, attempted update of `all-cards`, empty operation, exact preview counts, deterministic ids, and canonical set-name derivation. Create names use priority `en`, `ru`, `es`; updates merge partial names and derive the canonical fallback with the same priority before falling back to the old canonical name.

Wished-for call:

```ts
const result = planAiOperation({
  cards,
  cardSets,
  proposal,
  modelId: 'deepseek/deepseek-v4-flash',
  now: '2026-07-11T18:00:00.000Z',
  userPrompt: 'Create Travel',
  idFactory: (prefix) => `${prefix}-1`,
});
expect(result.ok).toBe(true);
```

- [ ] **Step 5: Run planner tests and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/aiOperations.test.ts
```

Expected: FAIL because the planner does not exist.

- [ ] **Step 6: Implement exact operation patches**

Define created cards/sets, updated `{before, after}` pairs, duplicate records, preview counts, and metadata. Resolve proposal card refs through the aligned import result. Reject blocking validation as `{ ok: false, errors: string[] }` without partial patches.

- [ ] **Step 7: Implement rollback conflict detection**

Export:

```ts
export function findAiRollbackConflict(input: {
  operation: AppliedAiOperation;
  cards: LanguageCard[];
  cardSets: CardSet[];
  laterOperations: AppliedAiOperation[];
}): AiRollbackConflict | null;
```

Compare current affected entities with recorded after snapshots. Name a later operation that touches the same entity when available.

- [ ] **Step 8: Run Task 3 tests and commit**

Run:

```bash
npm test -- --run src/domain/__tests__/importCards.test.ts src/domain/__tests__/aiOperations.test.ts
npm run lint
```

Commit subject: `Plan reversible AI library operations`.

---

### Task 4: Atomic Redux Apply, Rollback, And Persistence

**Files:**
- Create: `src/store/aiAssistantActions.ts`
- Create: `src/store/aiAssistantSlice.ts`
- Create: `src/store/__tests__/aiAssistantStore.test.ts`
- Modify: `src/store/cardsSlice.ts`
- Modify: `src/store/cardSetsSlice.ts`
- Modify: `src/store/store.ts`

**Interfaces:**
- Produces `applyAiOperation`, `revertAiOperation`, and an internal `commitAiRollback` action.
- Produces `AiAssistantState`, chat actions, staging actions, and selectors.
- Adds `aiAssistant` to `RootState` and Redux Persist and wraps `combineReducers` with a full-state operation gate.

- [ ] **Step 1: Write failing atomic store tests**

Build a real configured test store and dispatch exactly one `applyAiOperation({ operation: planned, appliedAt })`. Assert cards, sets, pending duplicates, merge history, staged proposal, explicit `appliedAt`, and operation history all change. Dispatch rollback by operation id once and assert exact restoration and `status: 'reverted'`. Assert a second rollback does nothing. Also assert stale Apply after an intervening manual card edit changes no library state, rollback after an intervening edit is rejected, and rollback of a selected AI-created set resets `selectedCardSetId` to `all-cards`.

Also append 105 messages and assert only the newest 100 remain while operations are uncapped.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm test -- --run src/store/__tests__/aiAssistantStore.test.ts
```

Expected: FAIL because the actions and reducer do not exist.

- [ ] **Step 3: Define shared actions**

```ts
export const applyAiOperation = createAction<{
  operation: PlannedAiOperation;
  appliedAt: string;
}>(
  'aiAssistant/applyOperation',
);
export const revertAiOperation = createAction<{
  operationId: string;
  revertedAt: string;
}>('aiAssistant/revertOperation');
```

Define an internal `commitAiRollback` action carrying the resolved operation; UI code never dispatches it directly.

- [ ] **Step 4: Handle actions in library reducers**

Wrap the combined reducer with a root reducer that inspects full state. For Apply, require the staged operation id and all current entities to match recorded before snapshots. For rollback, resolve an applied operation by id and run the conflict detector. Reject stale requests through assistant state without library mutation; otherwise forward one enriched action to the combined reducer. Use `extraReducers` in cards and card sets to apply exact after values, append operation-owned duplicate records, and on committed rollback remove created entities, restore before values, remove duplicate records by id, and reset selection when a removed AI-created set was selected.

- [ ] **Step 5: Implement assistant slice**

State contains `messages`, `stagedOperation`, `operations`, and `operationError`. Export actions `appendAiMessage`, `clearAiChat`, `stageAiOperation`, `cancelStagedAiOperation`, and `clearAiOperationError`. Extra reducers record applied/reverted status and rejected stale requests.

- [ ] **Step 6: Register reducer and run tests**

Update the RootState literal in `src/store/__tests__/store.test.ts` and every custom configured App test store that now requires `aiAssistant`. Run:

```bash
npm test -- --run src/store/__tests__/aiAssistantStore.test.ts src/store/__tests__/store.test.ts
npm run lint
```

- [ ] **Step 7: Commit**

Commit subject: `Apply AI operations atomically in Redux`.

---

### Task 5: OpenRouter Transport And Bounded Agent Loop

**Files:**
- Create: `src/services/openRouterClient.ts`
- Create: `src/services/aiAssistantAgent.ts`
- Create: `src/services/__tests__/openRouterClient.test.ts`
- Create: `src/services/__tests__/aiAssistantAgent.test.ts`
- Modify: `docs/LANGUAGE_CARD_FORMAT.md`

**Interfaces:**
- Produces `sendOpenRouterChat`, `OpenRouterChatMessage`, and sanitized `OpenRouterError`.
- Produces `runAiAssistant`, `AiAgentResult`, `AiAgentFailure`, and exported model/endpoint constants.
- Consumes Tasks 1-3 schemas, read tools, and planner.

- [ ] **Step 1: Write failing transport tests**

Mock `fetch` and assert endpoint, method, `Authorization`, current origin referer, title, fixed model, messages, tools, `tool_choice: 'auto'`, and signal forwarding. Cover `401`, `402`, `429`, generic error, malformed JSON, and AbortError. Assert errors never contain the key.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm test -- --run src/services/__tests__/openRouterClient.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement raw fetch transport**

Use constants:

```ts
export const OPENROUTER_CHAT_URL =
  'https://openrouter.ai/api/v1/chat/completions';
export const AI_ASSISTANT_MODEL_ID = 'deepseek/deepseek-v4-flash';
```

Return typed assistant content and tool calls. Sanitize provider error bodies.

- [ ] **Step 4: Update the skill guide**

Keep existing format rules and examples. Add explicit `External JSON authoring mode` and `In-app tool-calling mode` sections. In tool mode, direct writes only through `propose_library_operation` and never invent existing ids.

- [ ] **Step 5: Write failing agent-loop tests**

Mock sequential OpenRouter responses for:

1. `search_cards` tool call.
2. Tool result returned to the model.
3. `propose_library_operation` tool call.
4. Planner result returned to the model.
5. Final assistant response.

Assert the staged operation is returned without Redux mutation. Cover unknown tool, invalid arguments, eight-round limit, cancellation, and a normal content-only response.

- [ ] **Step 6: Run and verify RED**

Run:

```bash
npm test -- --run src/services/__tests__/aiAssistantAgent.test.ts
```

Expected: FAIL because the agent loop does not exist.

- [ ] **Step 7: Implement the agent loop**

Import `docs/LANGUAGE_CARD_FORMAT.md?raw`. Send one system message with scope and skill content. Append assistant tool-call messages and `role: 'tool'` results exactly. Set `parallel_tool_calls: false`. Stop after final content or eight model responses.

- [ ] **Step 8: Run tests and commit**

Run:

```bash
npm test -- --run src/services/__tests__/openRouterClient.test.ts src/services/__tests__/aiAssistantAgent.test.ts
npm run lint
```

Commit subject: `Connect the AI assistant to OpenRouter`.

---

### Task 6: AI Assistant Page And Manual Import

**Files:**
- Create: `src/components/ManualCardImportPanel.tsx`
- Create: `src/components/AiAssistantView.tsx`
- Create: `src/components/ai/AiConnectionPanel.tsx`
- Create: `src/components/ai/AiChatPanel.tsx`
- Create: `src/components/ai/AiOperationPreview.tsx`
- Create: `src/components/ai/AiOperationHistory.tsx`
- Create: `src/components/__tests__/AiAssistantView.test.tsx`
- Modify: `src/components/ImportCardsView.tsx`
- Modify: `src/components/__tests__/ImportCardsView.test.tsx`
- Modify: `src/domain/i18n.ts`

**Interfaces:**
- `AiAssistantView` reads Redux library and assistant state and dispatches Task 4 actions.
- `AiConnectionPanel` owns no key state outside props.
- `ImportCardsView` may re-export `AiAssistantView` temporarily so existing imports compile during this task.

- [ ] **Step 1: Extract manual import with existing tests green**

Move file selection, import summary, requirement download, and current count into `ManualCardImportPanel`. Keep all existing manual-import behavior and data hooks. Update its test render helper to include card sets and assistant reducers where needed.

- [ ] **Step 2: Write failing assistant page tests**

Mock `runAiAssistant`. Cover:

- masked saved key loaded from localStorage;
- show/hide/save/delete controls;
- fixed model badge;
- missing-key focus behavior;
- send, thinking, cancel, assistant response, retry;
- staged operation preview and disabled Apply for errors;
- Apply and Cancel;
- operation history and successful/conflicted rollback;
- clear chat leaving operation history intact;
- manual import still present.

Run the visible page assertions in English, Russian, and Spanish so the page is localized before it is routed into the main navigation.

- [ ] **Step 3: Run and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/AiAssistantView.test.tsx
```

Expected: FAIL because the page components do not exist.

- [ ] **Step 4: Implement connection and chat components**

Add the connection, key warning, key actions, chat states, preview counts, history states, rollback conflicts, retry/cancel, and manual-import strings to `src/domain/i18n.ts` in English, Russian, and Spanish. Use controlled props, MUI icons, localized tooltips, stable dimensions, and no nested cards. The composer uses a multiline input and Send icon button. Thinking is playful but compact. AbortController lives in `AiAssistantView` and is aborted on unmount.

- [ ] **Step 5: Implement preview and operation history**

Preview shows all count categories and validation messages. History is newest first. Before rollback, call `findAiRollbackConflict`; show a localized conflict dialog instead of dispatching when blocked.

- [ ] **Step 6: Wire the real agent call**

On send, append the user message, call `runAiAssistant` with the current snapshot, append its assistant response, and stage its operation. Error messages store a retryable copy of the original user content but no key.

- [ ] **Step 7: Run component tests and commit**

Run:

```bash
npm test -- --run src/components/__tests__/AiAssistantView.test.tsx src/components/__tests__/ImportCardsView.test.tsx
npm run lint
```

Commit subject: `Build the AI assistant chat workspace`.

---

### Task 7: Navigation, Purple Wand, And Localization

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/CardSetLibraryPicker.tsx`
- Modify: `src/components/__tests__/CardSetLibraryPicker.test.tsx`
- Modify: `src/domain/i18n.ts`
- Modify: `src/__tests__/App.navigation.test.tsx`

**Interfaces:**
- Add `onOpenAiAssistant: () => void` to `CardSetLibraryPicker`.
- Keep internal section value `agents`; render `AiAssistantView` for it.

- [ ] **Step 1: Write failing wand tests**

Assert the heading contains a title row with exact CSS gap `10px`, the purple wand has the localized label and tooltip, and clicking calls `onOpenAiAssistant` without opening the card-set search modal. Add the required callback to every direct `CardSetLibraryPicker` test render.

- [ ] **Step 2: Write failing navigation/localization tests**

Assert visible tab and page names in all three languages and click both the tab and wand. Replace old `Agents LLM` expectations. Assert manual import remains on the page.

- [ ] **Step 3: Run and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/CardSetLibraryPicker.test.tsx src/__tests__/App.navigation.test.tsx -t "AI Assistant|AI помощник|Asistente IA|wand"
```

Expected: FAIL because the callback, wand, and copy are absent.

- [ ] **Step 4: Finalize navigation and wand i18n keys**

Add or update the visible tab, page title, and wand tooltip strings in English, Russian, and Spanish. Verify the assistant-page keys added in Task 6 remain complete. Remove visible trial-key claims.

- [ ] **Step 5: Implement wand and route**

Use `AutoFixHighIcon`. Place the title and wand in an inner row with `gap: '10px'`; retain the search button on the far right. In `App`, pass `onOpenAiAssistant={() => setActiveSection('agents')}` and render `AiAssistantView` for that section.

- [ ] **Step 6: Run navigation tests and commit**

Run:

```bash
npm test -- --run src/components/__tests__/CardSetLibraryPicker.test.tsx src/__tests__/App.navigation.test.tsx src/components/__tests__/AppShell.test.tsx
npm run lint
```

Commit subject: `Open AI Assistant from the card library`.

---

### Task 8: Golden Workflow, Performance, And Final Verification

**Files:**
- Modify: `e2e/golden-base.spec.ts`
- Modify: `e2e/golden-base.spec.ts-snapshots/agents-llm-import-chromium-desktop-darwin.png` or replace with an AI-assistant-named snapshot
- Modify: `src/__tests__/largeDatasetPerformance.test.tsx`
- Modify: `README.md`
- Modify: `AGENT_HISTORY.md`

**Interfaces:**
- No new production interfaces.

- [ ] **Step 1: Add a 10,000-card read-tool performance assertion**

Build 10,000 deterministic cards, search through `executeAiReadTool`, and assert the result is capped and completes within the existing performance-test conventions. Do not use a brittle sub-millisecond threshold.

- [ ] **Step 2: Add the mocked Playwright workflow**

Route `https://openrouter.ai/api/v1/chat/completions` and serve deterministic tool-call/final responses. Cover wand navigation, key save, word-list prompt, purple preview, Apply, Cards verification, operation history, Rollback, and absence after rollback. Assert no network request body contains the key.

- [ ] **Step 3: Update the golden AI Assistant snapshot**

Capture desktop and narrow layouts with no real key. Inspect the image for overlap, clipped chat/history, and incorrect card nesting before accepting it.

- [ ] **Step 4: Update README**

Document the frontend-only assistant, fixed model, local key security warning, staged operations, rollback rules, and manual import fallback. Link the design and card format guide.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
npm run test:e2e
git diff --check
```

Expected: all commands exit zero. The existing Vite large-chunk advisory may remain a warning.

- [ ] **Step 6: Commit**

Commit subject: `Verify the AI assistant workflow`.

---

## Plan Self-Review

- Every goal and acceptance criterion in the design maps to Tasks 1-8.
- The write proposal remains non-mutating until Task 4's explicit Apply action.
- Model id, storage key, endpoint, round cap, tool names, and mutation limits are consistent across tasks.
- No task permits global card deletion, set archive, automatic apply, streaming, or a bundled key.
- The plan contains no unresolved or deferred implementation placeholders.
