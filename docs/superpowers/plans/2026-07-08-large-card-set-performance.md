# Large Card Set Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the app responsive when a user works with "All Cards" and future 10,000-card local datasets.

**Architecture:** The main fix is to stop rendering every card row and stop doing repeated linear lookups while rendering. The card detail list becomes a virtualized scroll surface, and expensive card/stat/history indexes are precomputed once per relevant input change. Exercise setup should avoid building every prompt for every game before the game actually needs those prompts.

**Tech Stack:** React 18, MUI 6, Redux Toolkit, Redux Persist, Vite, Vitest, Testing Library, `@tanstack/react-virtual`.

## Investigation Conclusion

The freeze is not caused primarily by storing 2,000 records in `localStorage`. The current bundled seed JSON is under 1 MB before Redux Persist overhead, and the browser can hold this scale locally.

The main bottleneck is rendering and recomputing too much work on the main thread:

- `src/components/CardSetDetailView.tsx` renders one full MUI card row for every visible card. Selecting "All Cards" means roughly 2,000 rich rows, each with stacks, chips, tooltip anchors, stats lookup, and recent history preparation.
- `CardSetDetailView` repeatedly uses `cards.find(...)`, `cardStats.find(...)`, and per-row `getRecentCardResults(...)`, which scans and sorts attempts for each row.
- `src/App.tsx` builds selected card arrays using `cards.find(...)`, then precomputes eligible, ordered, and prompt arrays for missing-letter and missing-word games whenever app-level inputs change.
- `src/domain/practiceOrdering.ts` summarizes practice by scanning all attempts for each candidate card. With larger history this becomes `cards * attempts`.
- TanStack Virtual is a good fit because its official docs describe rendering only the visible window of a long scroll surface while keeping custom markup, and `useVirtualizer` supports scroll containers and estimated/measured item sizes.

## Global Constraints

- `TASK_REQUIREMENTS.md` must never be changed.
- Commit messages must use a short subject and a detailed body.
- Interface and committed documentation should stay in English unless testing existing localized UI strings.
- Keep local-first storage; do not introduce a backend.
- Preserve the current visual style of card rows, chips, tooltips, and game tiles.
- Use TDD: write the failing test first, verify it fails, implement the smallest fix, then verify it passes.

---

### Task 1: Add TanStack Virtual Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `useVirtualizer` imported from `@tanstack/react-virtual`.
- Consumes: no code from later tasks.

- [ ] **Step 1: Install the dependency**

Run:

```bash
npm install @tanstack/react-virtual
```

Expected: `package.json` and `package-lock.json` include `@tanstack/react-virtual`.

- [ ] **Step 2: Verify TypeScript can resolve the package**

Run:

```bash
npm run lint
```

Expected: PASS with `tsc -b --noEmit`.

- [ ] **Step 3: Commit**

Run:

```bash
git add package.json package-lock.json
git commit -m "Add virtual scrolling dependency" -m "Install @tanstack/react-virtual so large local card lists can render only the visible rows instead of mounting thousands of MUI card rows at once."
```

---

### Task 2: Extract Indexed Card Set Selectors

**Files:**
- Create: `src/domain/cardIndexes.ts`
- Test: `src/domain/__tests__/cardIndexes.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/CardSetDetailView.tsx`

**Interfaces:**
- Produces: `createCardById(cards: LanguageCard[]): Map<string, LanguageCard>`.
- Produces: `getCardsByIds(cardById: Map<string, LanguageCard>, cardIds: string[]): LanguageCard[]`.
- Produces: `createCardStatsByTarget(cardStats: CardStats[], targetLanguage: SupportedLanguage): Map<string, CardStats>`.
- Consumes: `LanguageCard`, `CardStats`, `SupportedLanguage`.

- [ ] **Step 1: Write failing tests**

Create `src/domain/__tests__/cardIndexes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createCardById, createCardStatsByTarget, getCardsByIds } from '../cardIndexes';
import type { LanguageCard } from '../cards';
import type { CardStats } from '../stats';

describe('cardIndexes', () => {
  it('resolves card ids in requested order without repeated array scans', () => {
    const cards: LanguageCard[] = [
      { id: 'one', translations: { en: 'one' }, createdAt: 'now', updatedAt: 'now' },
      { id: 'two', translations: { en: 'two' }, createdAt: 'now', updatedAt: 'now' },
    ];

    const cardById = createCardById(cards);

    expect(getCardsByIds(cardById, ['two', 'missing', 'one']).map((card) => card.id)).toEqual([
      'two',
      'one',
    ]);
  });

  it('indexes stats for one target language by card id', () => {
    const stats: CardStats[] = [
      {
        cardId: 'one',
        targetLanguage: 'en',
        attempts: 2,
        correct: 1,
        incorrect: 1,
        recentMistakes: 1,
        stability: 'weak',
      },
      {
        cardId: 'one',
        targetLanguage: 'es',
        attempts: 9,
        correct: 9,
        incorrect: 0,
        recentMistakes: 0,
        stability: 'strong',
      },
    ];

    expect(createCardStatsByTarget(stats, 'en').get('one')?.attempts).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- --run src/domain/__tests__/cardIndexes.test.ts
```

Expected: FAIL because `src/domain/cardIndexes.ts` does not exist.

- [ ] **Step 3: Implement index helpers**

Create `src/domain/cardIndexes.ts`:

```ts
import { LanguageCard } from './cards';
import { SupportedLanguage } from './languages';
import { CardStats } from './stats';

export function createCardById(cards: LanguageCard[]): Map<string, LanguageCard> {
  return new Map(cards.map((card) => [card.id, card]));
}

export function getCardsByIds(
  cardById: Map<string, LanguageCard>,
  cardIds: string[],
): LanguageCard[] {
  return cardIds
    .map((cardId) => cardById.get(cardId))
    .filter((card): card is LanguageCard => Boolean(card));
}

export function createCardStatsByTarget(
  cardStats: CardStats[],
  targetLanguage: SupportedLanguage,
): Map<string, CardStats> {
  return new Map(
    cardStats
      .filter((stat) => stat.targetLanguage === targetLanguage)
      .map((stat) => [stat.cardId, stat]),
  );
}
```

- [ ] **Step 4: Replace repeated lookups**

In `src/App.tsx`, create `cardById` once:

```ts
const cardById = useMemo(() => createCardById(cards), [cards]);
```

Use `getCardsByIds(cardById, selectedCardSet.cardIds)` where `cards.find(...)` is currently used for selected card sets and selectable card sets. For `ALL_CARDS_CARD_SET_ID`, return `cards` directly.

In `src/components/CardSetDetailView.tsx`, create:

```ts
const cardById = useMemo(() => createCardById(cards), [cards]);
const cardStatsById = useMemo(
  () => createCardStatsByTarget(cardStats, targetLanguage),
  [cardStats, targetLanguage],
);
```

Use `cardStatsById.get(card.id)` inside the row renderer.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- --run src/domain/__tests__/cardIndexes.test.ts src/components/__tests__/CardSetDetailView.test.tsx src/__tests__/App.navigation.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/cardIndexes.ts src/domain/__tests__/cardIndexes.test.ts src/App.tsx src/components/CardSetDetailView.tsx
git commit -m "Index card lookups for large sets" -m "Add reusable card and stats indexes and replace repeated linear scans in app-level card set selection and card detail rendering. This reduces large-set work before adding virtual rendering."
```

---

### Task 3: Virtualize CardSetDetailView Rows

**Files:**
- Modify: `src/components/CardSetDetailView.tsx`
- Test: `src/components/__tests__/CardSetDetailView.test.tsx`

**Interfaces:**
- Consumes: `useVirtualizer` from `@tanstack/react-virtual`.
- Produces: `CardSetDetailView` renders only virtual rows while keeping existing `data-test` names for visible rows.

- [ ] **Step 1: Write failing test for large all-cards render**

Append to `src/components/__tests__/CardSetDetailView.test.tsx`:

```ts
it('virtualizes a large all-cards list instead of mounting every row', () => {
  const store = createStoreWithLargeCardList(2000);
  const { container } = render(
    <Provider store={store}>
      <CardSetDetailView />
    </Provider>,
  );

  expect(screen.getByTestId('card_set_detail__virtualized_cards_list__all-cards')).toBeInTheDocument();
  expect(
    getByDataTestPrefix(container, 'card_set_detail__card_item__').length,
  ).toBeLessThan(80);
  expect(screen.getByText('word 0000')).toBeInTheDocument();
});
```

Add helper in the same test file:

```ts
function createStoreWithLargeCardList(count: number) {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        assistantId: 'studyTroll',
        complementaryLanguages: { en: 'ru', ru: 'en', es: 'en' },
        interfaceLanguage: 'ru',
        targetLanguage: 'en',
      },
      cards: {
        cards: Array.from({ length: count }, (_, index) => ({
          id: `large-card-${index}`,
          translations: {
            en: `word ${String(index).padStart(4, '0')}`,
            ru: `слово ${String(index).padStart(4, '0')}`,
            es: `palabra ${String(index).padStart(4, '0')}`,
          },
          createdAt: now,
          updatedAt: now,
        })),
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      attempts: { attempts: [] },
      stats: { cardStats: [] },
      cardSets: {
        cardSets: [],
        selectedCardSetId: 'all-cards',
      },
    },
  });
}
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- --run src/components/__tests__/CardSetDetailView.test.tsx -t "virtualizes a large all-cards list"
```

Expected: FAIL because all 2,000 rows mount and the virtualized list test id is absent.

- [ ] **Step 3: Implement virtualizer**

In `CardSetDetailView`, add:

```ts
import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
```

Create a scroll parent:

```ts
const cardsListRef = useRef<HTMLDivElement | null>(null);
const shouldVirtualizeCards = sortedCardSetCards.length > 100;
const cardRowVirtualizer = useVirtualizer({
  count: sortedCardSetCards.length,
  estimateSize: () => 118,
  getScrollElement: () => cardsListRef.current,
  overscan: 8,
});
const virtualRows = shouldVirtualizeCards
  ? cardRowVirtualizer.getVirtualItems()
  : [];
```

Replace the list body with:

```tsx
<Box
  data-test={
    shouldVirtualizeCards
      ? `card_set_detail__virtualized_cards_list__${selectedCardSet.id}`
      : `card_set_detail__cards_list__${selectedCardSet.id}`
  }
  ref={cardsListRef}
  sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}
>
  {shouldVirtualizeCards ? (
    <Box
      sx={{
        height: `${cardRowVirtualizer.getTotalSize()}px`,
        position: 'relative',
        width: '100%',
      }}
    >
      {virtualRows.map((virtualRow) => {
        const card = sortedCardSetCards[virtualRow.index];
        return (
          <Box
            data-index={virtualRow.index}
            key={card.id}
            ref={cardRowVirtualizer.measureElement}
            sx={{
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
          >
            <CardSetCardRow card={card} />
          </Box>
        );
      })}
    </Box>
  ) : (
    <Stack spacing={1.25}>{sortedCardSetCards.map((card) => <CardSetCardRow key={card.id} card={card} />)}</Stack>
  )}
</Box>
```

Extract the existing inline row markup into an inner `CardSetCardRow` component in the same file. Preserve all existing row `data-test` attributes.

- [ ] **Step 4: Verify existing tooltip behavior still works**

Run:

```bash
npm test -- --run src/components/__tests__/CardSetDetailView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/components/CardSetDetailView.tsx src/components/__tests__/CardSetDetailView.test.tsx
git commit -m "Virtualize large card detail lists" -m "Render large card sets through TanStack Virtual so the Cards page mounts only visible rows plus overscan while preserving existing card row styling, tooltips, and data-test selectors."
```

---

### Task 4: Precompute Recent Results by Card

**Files:**
- Create: `src/domain/cardResultHistory.ts`
- Test: `src/domain/__tests__/cardResultHistory.test.ts`
- Modify: `src/components/CardSetDetailView.tsx`

**Interfaces:**
- Produces: `createRecentResultsByCardId(input): Map<string, RecentCardResult[]>`.
- Consumes: `ExerciseAttempt[]`, `SupportedLanguage`, `limit`.

- [ ] **Step 1: Write failing tests**

Create `src/domain/__tests__/cardResultHistory.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRecentResultsByCardId } from '../cardResultHistory';
import type { ExerciseAttempt } from '../exercises';

describe('createRecentResultsByCardId', () => {
  it('keeps newest target-language results per card', () => {
    const attempts: ExerciseAttempt[] = [
      makeAttempt('old', 'en', 'card-a', false, '2026-07-01T10:00:00.000Z'),
      makeAttempt('new', 'en', 'card-a', true, '2026-07-02T10:00:00.000Z'),
      makeAttempt('other-language', 'es', 'card-a', false, '2026-07-03T10:00:00.000Z'),
    ];

    const results = createRecentResultsByCardId({
      attempts,
      limit: 2,
      targetLanguage: 'en',
    });

    expect(results.get('card-a')).toEqual([
      { isCorrect: true, occurredAt: '2026-07-02T10:00:00.000Z' },
      { isCorrect: false, occurredAt: '2026-07-01T10:00:00.000Z' },
    ]);
  });
});

function makeAttempt(
  id: string,
  targetLanguage: 'en' | 'es',
  cardId: string,
  isCorrect: boolean,
  completedAt: string,
): ExerciseAttempt {
  return {
    id,
    exerciseType: 'missingLetters',
    cardSetId: 'all-cards',
    targetLanguage,
    createdAt: completedAt,
    completedAt,
    cardSnapshots: [],
    prompts: [],
    answers: { [cardId]: 'answer' },
    correctness: { [cardId]: isCorrect },
    hintsUsed: { [cardId]: 0 },
  };
}
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- --run src/domain/__tests__/cardResultHistory.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement history index**

Create `src/domain/cardResultHistory.ts`:

```ts
import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

export function createRecentResultsByCardId(input: {
  attempts: ExerciseAttempt[];
  limit: number;
  targetLanguage: SupportedLanguage;
}): Map<string, RecentCardResult[]> {
  const byCardId = new Map<string, RecentCardResult[]>();

  [...input.attempts]
    .filter((attempt) => attempt.targetLanguage === input.targetLanguage)
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? right.createdAt) -
        Date.parse(left.completedAt ?? left.createdAt),
    )
    .forEach((attempt) => {
      Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
        const current = byCardId.get(cardId) ?? [];
        if (current.length >= input.limit) {
          return;
        }
        current.push({
          isCorrect: Boolean(isCorrect),
          occurredAt: attempt.completedAt ?? attempt.createdAt,
        });
        byCardId.set(cardId, current);
      });
    });

  return byCardId;
}
```

- [ ] **Step 4: Use indexed history in CardSetDetailView**

In `CardSetDetailView`, replace per-row `getRecentCardResults(...)` with:

```ts
const recentResultsByCardId = useMemo(
  () =>
    createRecentResultsByCardId({
      attempts: allAttempts,
      limit: 20,
      targetLanguage,
    }),
  [allAttempts, targetLanguage],
);
```

Pass `recentResults={recentResultsByCardId.get(card.id) ?? []}`.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- --run src/domain/__tests__/cardResultHistory.test.ts src/components/__tests__/CardSetDetailView.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/domain/cardResultHistory.ts src/domain/__tests__/cardResultHistory.test.ts src/components/CardSetDetailView.tsx
git commit -m "Index recent card result history" -m "Build recent per-card answer history once per target language instead of scanning and sorting all attempts for every rendered card row."
```

---

### Task 5: Lazy Exercise Preparation for Large Sets

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/domain/practiceOrdering.ts`
- Test: `src/domain/__tests__/practiceOrdering.test.ts`
- Test: `src/__tests__/App.navigation.test.tsx`

**Interfaces:**
- Produces: `summarizePracticeByCardId(input): Map<string, CardPracticeSummary>`.
- Produces: `orderCardsForMissingLettersPractice` uses pre-indexed attempt summaries internally.
- Produces: `App` only builds prompt lists for the selected exercise type.

- [ ] **Step 1: Write failing test for indexed practice summaries**

In `src/domain/__tests__/practiceOrdering.test.ts`, add:

```ts
it('summarizes practice for many cards from a single attempt pass', () => {
  const summaries = summarizePracticeByCardId({
    attempts: [
      makePracticeAttempt('a1', { 'card-1': true, 'card-2': false }),
      makePracticeAttempt('a2', { 'card-2': false }),
    ],
    now: '2026-07-08T00:00:00.000Z',
    settings: undefined,
    targetLanguage: 'en',
  });

  expect(summaries.get('card-1')?.correct).toBe(1);
  expect(summaries.get('card-2')?.incorrect).toBe(2);
  expect(summaries.get('card-2')?.recentIncorrectCount).toBe(2);
});
```

Add a local helper:

```ts
function makePracticeAttempt(id: string, correctness: Record<string, boolean>) {
  return {
    id,
    exerciseType: 'missingLetters' as const,
    cardSetId: 'all-cards',
    targetLanguage: 'en' as const,
    createdAt: `2026-07-0${id === 'a1' ? 1 : 2}T00:00:00.000Z`,
    completedAt: `2026-07-0${id === 'a1' ? 1 : 2}T00:00:00.000Z`,
    cardSnapshots: [],
    prompts: [],
    answers: {},
    correctness,
    hintsUsed: {},
  };
}
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- --run src/domain/__tests__/practiceOrdering.test.ts -t "summarizes practice"
```

Expected: FAIL because `summarizePracticeByCardId` is not exported.

- [ ] **Step 3: Implement single-pass practice summary**

In `src/domain/practiceOrdering.ts`, add:

```ts
export function summarizePracticeByCardId(input: {
  attempts: ExerciseAttempt[];
  now: string;
  settings: PracticeSettings | undefined;
  targetLanguage: SupportedLanguage;
}): Map<string, CardPracticeSummary> {
  const eventsByCardId = new Map<string, Array<{ at: string; isCorrect: boolean }>>();

  input.attempts
    .filter((attempt) => attempt.targetLanguage === input.targetLanguage)
    .forEach((attempt) => {
      Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
        const events = eventsByCardId.get(cardId) ?? [];
        events.push({
          at: attempt.completedAt ?? attempt.createdAt,
          isCorrect: Boolean(isCorrect),
        });
        eventsByCardId.set(cardId, events);
      });
    });

  return new Map(
    Array.from(eventsByCardId.entries()).map(([cardId, events]) => [
      cardId,
      summarizePracticeEvents({
        cardId,
        events: events.sort((left, right) => left.at.localeCompare(right.at)),
        now: input.now,
        settings: input.settings,
      }),
    ]),
  );
}
```

Refactor existing `summarizeCardPractice` to call a shared `summarizePracticeEvents(...)`.

- [ ] **Step 4: Use summaries inside ordering**

Inside `orderCardsForMissingLettersPractice`, build:

```ts
const summariesByCardId = summarizePracticeByCardId({
  attempts: input.attempts,
  now: input.now,
  settings: input.settings,
  targetLanguage: input.targetLanguage,
});
```

Then use:

```ts
const summaries = input.cards.map((card) => ({
  card,
  summary:
    summariesByCardId.get(card.id) ??
    createEmptyPracticeSummary(card.id, input.settings, input.now),
}));
```

- [ ] **Step 5: Stop preparing prompt arrays for unselected games**

In `src/App.tsx`, only compute ordered cards and prompts for the selected exercise:

```ts
const missingLettersOrderedCards = useMemo(
  () =>
    selectedExerciseType === 'missingLetters'
      ? orderCardsForMissingLettersPractice({ ... })
      : [],
  [selectedExerciseType, attempts, generationSeed, missingLettersEligibleCards, practiceSettings, targetLanguage],
);
```

Do the same for `missingWordOrderedCards`. Keep only lightweight eligibility counts for disabled tiles.

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- --run src/domain/__tests__/practiceOrdering.test.ts src/__tests__/App.navigation.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/domain/practiceOrdering.ts src/domain/__tests__/practiceOrdering.test.ts src/App.tsx src/__tests__/App.navigation.test.tsx
git commit -m "Reduce large-set exercise preparation work" -m "Index practice history in a single attempt pass and avoid preparing full prompt queues for games that are not currently selected. This keeps large local card sets responsive on the game setup page."
```

---

### Task 6: Add Performance Regression Coverage

**Files:**
- Create: `src/__tests__/largeDatasetPerformance.test.tsx`

**Interfaces:**
- Consumes: `App`, Redux store reducers, bundled app state shape.
- Produces: regression checks that large all-card rendering does not mount every row and that game setup remains interactable.

- [ ] **Step 1: Write regression tests**

Create `src/__tests__/largeDatasetPerformance.test.tsx`:

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { appReducer } from '../store/appSlice';
import { attemptsReducer } from '../store/attemptsSlice';
import { cardsReducer } from '../store/cardsSlice';
import { cardSetsReducer } from '../store/cardSetsSlice';
import { statsReducer } from '../store/statsSlice';

describe('large local datasets', () => {
  it('keeps all-cards card detail rendering virtualized', async () => {
    const user = userEvent.setup();
    const { container } = renderLargeApp(2000);

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    expect(screen.getByTestId('card_set_detail__virtualized_cards_list__all-cards')).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-test^="card_set_detail__card_item__"]').length,
    ).toBeLessThan(80);
  });

  it('keeps the game start button usable for all cards', async () => {
    const user = userEvent.setup();
    renderLargeApp(2000);

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));

    expect(screen.getByRole('button', { name: 'Играть' })).toBeEnabled();
  });
});

function renderLargeApp(cardCount: number) {
  const now = '2026-07-08T00:00:00.000Z';
  const store = configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        assistantId: 'studyTroll',
        complementaryLanguages: { en: 'ru', ru: 'en', es: 'en' },
        interfaceLanguage: 'ru',
        targetLanguage: 'en',
      },
      cards: {
        cards: Array.from({ length: cardCount }, (_, index) => ({
          id: `large-card-${index}`,
          translations: {
            en: `word ${String(index).padStart(4, '0')}`,
            ru: `слово ${String(index).padStart(4, '0')}`,
            es: `palabra ${String(index).padStart(4, '0')}`,
          },
          createdAt: now,
          updatedAt: now,
        })),
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
      attempts: { attempts: [] },
      stats: { cardStats: [] },
      cardSets: {
        cardSets: [],
        selectedCardSetId: 'all-cards',
      },
    },
  });

  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm test -- --run src/__tests__/largeDatasetPerformance.test.tsx
```

Expected: PASS after Tasks 1-5.

- [ ] **Step 3: Full verification**

Run:

```bash
npm test -- --run
npm run lint
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/__tests__/largeDatasetPerformance.test.tsx
git commit -m "Cover large local dataset performance" -m "Add regression coverage for rendering the All Cards detail view and keeping game setup usable with thousands of local cards."
```

---

## Self-Review

- Spec coverage: The plan addresses the Cards page freeze, game setup work for large card sets, localStorage staying local-first, and future 10,000-card scale.
- Placeholder scan: No task relies on TBD or unspecified behavior; every task includes files, interfaces, commands, and expected outputs.
- Type consistency: The helper names `createCardById`, `getCardsByIds`, `createCardStatsByTarget`, `createRecentResultsByCardId`, and `summarizePracticeByCardId` are consistent across tasks.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-07-08-large-card-set-performance.md`.

1. Subagent-Driven (recommended): dispatch a fresh subagent per task and review between tasks.
2. Inline Execution: execute tasks in this session with checkpoints.
