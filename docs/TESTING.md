# Testing

Language Lab uses automated tests at several layers. The goal is to keep domain rules, UI behavior, AI assistant boundaries, and visual baselines stable while the app is still moving quickly.

## Test Commands

Run all Vitest tests:

```bash
npm test
```

Run TypeScript compilation without emitting files:

```bash
npm run lint
```

Run Playwright golden baseline tests:

```bash
npm run test:e2e
```

Update Playwright screenshots only after inspecting the visual differences:

```bash
npm run test:e2e:update
```

Build production assets:

```bash
npm run build
```

Check whitespace issues before commit:

```bash
git diff --check
```

## Test Layers

### Domain Tests

Domain tests live under `src/domain/__tests__`. They cover pure logic such as:

- card import and duplicate merging;
- card-set creation, archive behavior, and active-name uniqueness;
- exercise generation;
- crossword layout and result tones;
- practice ordering and recent result history;
- AI proposal schemas, library read tools, and atomic operation planning;
- statistics and learning summaries.

These tests should stay fast and deterministic. Prefer adding a domain test before changing business rules.

### Store Tests

Redux tests live under `src/store/__tests__`. They cover persisted state reducers and cross-slice actions, especially AI operation apply and rollback flows.

Use these tests when a feature changes how cards, card sets, attempts, stats, or AI operation history are written.

### Component Tests

Component tests live beside UI components under `src/components/**/__tests__` and `src/__tests__`. They use Testing Library and jsdom to cover:

- app navigation and confirmation modals;
- game interaction flows;
- card library editing and search;
- AI chat, model/key settings, markdown rendering, operation previews, and operation history;
- tooltip placement and accessibility hooks;
- statistics and crossword history replay.

Every meaningful DOM element should keep a stable `data-test` attribute using the `group__element` naming style. Tests should prefer accessible queries first and use `data-test` for app-specific surfaces that need precise targeting.

### AI Assistant Tests

The AI assistant is tested without making real OpenRouter calls. Tests mock or intercept requests and assert that:

- the saved key is used only in the authorization header;
- model selection is passed to the request;
- chat history is included for follow-up prompts;
- library and statistics read tools are available to the model;
- write requests create a staged operation preview instead of mutating state directly;
- invalid proposals become blocked previews;
- applying or cancelling previews keeps chat history consistent;
- applied operations can be rolled back when no conflict exists.

The assistant may read local cards, card sets, attempts, and card statistics through bounded tools. It must not claim that chat history or learning statistics are unavailable when those inputs are present.

### Playwright Golden Baselines

The Playwright suite lives in `e2e/golden-base.spec.ts` and stores snapshots in `e2e/golden-base.spec.ts-snapshots`.

The golden suite captures the first visual baseline for:

- games home;
- mobile games home;
- card-set library modal;
- card catalog;
- AI assistant workspace and operation preview;
- crossword, missing letters, missing word, and multiple-choice games;
- empty statistics.

Golden screenshots are intentionally opinionated. If a screenshot changes:

1. run the Playwright test and inspect the diff;
2. decide whether the visual change is intended;
3. update only the affected snapshots;
4. mention the visual update in the commit or merge request.

## Recommended Verification Before Merge

For a normal feature branch, run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

For UI changes that affect layout, screenshots, or first-viewport behavior, also run:

```bash
npm run test:e2e
```

For small documentation-only changes, at minimum run:

```bash
git diff --check
```

and use the relevant parser or command if the edited file has one, such as JSON parsing for `package.json`.

## Local Persistence Notes

Tests should avoid depending on a real browser profile. Redux Persist may fall back to noop storage in jsdom, and that warning is acceptable when the test explicitly controls state.

Playwright tests should clear or seed local storage through the page context so scenarios remain repeatable.

## External Services

Automated tests must not spend real OpenRouter credits. AI assistant tests should mock OpenRouter responses or intercept `https://openrouter.ai/**` requests.
