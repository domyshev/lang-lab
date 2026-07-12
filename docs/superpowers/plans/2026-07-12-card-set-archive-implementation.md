# Card Set Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement first-class archived card-set browsing, active-copy creation, active-only name uniqueness, and AI helper archive proposals while preserving historical statistics.

**Architecture:** Reuse the existing `CardSet.archivedAt` field as the single source of truth. Add small domain helpers in `src/domain/cardSets.ts`, keep Redux mutations in `src/store/cardSetsSlice.ts`, update Cards-page UI components to filter/search/copy archived sets, and extend the AI proposal/read-tool pipeline so archiving remains staged and reversible through operation history.

**Tech Stack:** React, MUI, Redux Toolkit, TypeScript, Vitest, Testing Library, Zod.

## Global Constraints

- `TASK_REQUIREMENTS.md` must never be changed.
- UI and committed documentation copy must remain English in docs and localized through `src/domain/i18n.ts` in app screens.
- `all-cards` cannot be archived.
- Archived card sets cannot be restored in place or deleted.
- Archived card sets remain in `state.cardSets.cardSets` so old statistics and attempts keep working.
- New active card sets may reuse names from archived sets.
- Name uniqueness checks apply only among non-archived custom card sets.
- AI helper writes must be staged through `propose_library_operation`; the model never applies Redux actions directly.

---

### Task 1: Card-Set Archive Domain Helpers And Store Actions

**Files:**
- Modify: `src/domain/cardSets.ts`
- Modify: `src/store/cardSetsSlice.ts`
- Create: `src/domain/__tests__/cardSets.test.ts`
- Create: `src/store/__tests__/cardSetsSlice.test.ts`

**Interfaces:**
- Produces:
  - `isArchivedCardSet(cardSet: Pick<CardSet, 'archivedAt'>): boolean`
  - `getCardSetSearchValues(cardSet: Pick<CardSet, 'name' | 'names'>): string[]`
  - `normalizeCardSetName(value: string): string`
  - `findActiveCardSetNameConflict(input: { cardSets: CardSet[]; names: Partial<Record<SupportedLanguage, string>>; excludeCardSetId?: string }): CardSet | undefined`
  - Redux action `copyArchivedCardSet({ sourceCardSetId, newCardSetId, now })`
- Consumes existing:
  - `CardSet`, `ALL_CARDS_CARD_SET_ID`, `getCardSetName`
  - `cardSetsReducer`

- [ ] **Step 1: Write failing domain helper tests**

Create `src/domain/__tests__/cardSets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  findActiveCardSetNameConflict,
  getCardSetSearchValues,
  isArchivedCardSet,
  normalizeCardSetName,
} from '../cardSets';
import type { CardSet } from '../cardSets';

const baseSet: CardSet = {
  id: 'set-active',
  name: 'Love',
  names: { en: 'Love', ru: 'Любовь', es: 'Amor' },
  cardIds: [],
  createdAt: '2026-07-12T10:00:00.000Z',
  updatedAt: '2026-07-12T10:00:00.000Z',
};

describe('card set archive helpers', () => {
  it('detects archived card sets through archivedAt', () => {
    expect(isArchivedCardSet(baseSet)).toBe(false);
    expect(
      isArchivedCardSet({
        ...baseSet,
        archivedAt: '2026-07-12T12:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('normalizes localized names for search and duplicate checks', () => {
    expect(normalizeCardSetName('  Любовь   Большая  ')).toBe('любовь большая');
    expect(getCardSetSearchValues(baseSet)).toEqual(['love', 'любовь', 'amor']);
  });

  it('finds duplicates only among active card sets across all localized names', () => {
    const archived: CardSet = {
      ...baseSet,
      id: 'set-archived-love',
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const active: CardSet = {
      ...baseSet,
      id: 'set-family',
      name: 'Family',
      names: { en: 'Family', ru: 'Семья', es: 'Familia' },
    };

    expect(
      findActiveCardSetNameConflict({
        cardSets: [archived, active],
        names: { en: 'Love' },
      }),
    ).toBeUndefined();
    expect(
      findActiveCardSetNameConflict({
        cardSets: [archived, active],
        names: { es: 'familia' },
      }),
    ).toEqual(active);
    expect(
      findActiveCardSetNameConflict({
        cardSets: [active],
        names: { ru: 'Семья' },
        excludeCardSetId: 'set-family',
      }),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run domain helper tests and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/cardSets.test.ts --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Implement domain helpers**

Modify `src/domain/cardSets.ts`:

```ts
export function isArchivedCardSet(
  cardSet: Pick<CardSet, 'archivedAt'>,
): boolean {
  return Boolean(cardSet.archivedAt);
}

export function normalizeCardSetName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function getCardSetSearchValues(
  cardSet: Pick<CardSet, 'name' | 'names'>,
): string[] {
  return [cardSet.name, ...Object.values(cardSet.names ?? {})]
    .map((value) => normalizeCardSetName(value ?? ''))
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
}

export function findActiveCardSetNameConflict(input: {
  cardSets: CardSet[];
  names: Partial<Record<SupportedLanguage, string>>;
  excludeCardSetId?: string;
}): CardSet | undefined {
  const proposedNames = Object.values(input.names)
    .map((value) => normalizeCardSetName(value ?? ''))
    .filter(Boolean);

  if (proposedNames.length === 0) {
    return undefined;
  }

  return input.cardSets.find((cardSet) => {
    if (
      cardSet.id === ALL_CARDS_CARD_SET_ID ||
      cardSet.id === input.excludeCardSetId ||
      isArchivedCardSet(cardSet)
    ) {
      return false;
    }
    const existingNames = new Set(getCardSetSearchValues(cardSet));
    return proposedNames.some((name) => existingNames.has(name));
  });
}
```

- [ ] **Step 4: Write failing reducer tests**

Create `src/store/__tests__/cardSetsSlice.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  archiveCardSet,
  cardSetsReducer,
  copyArchivedCardSet,
} from '../cardSetsSlice';

const now = '2026-07-12T10:00:00.000Z';

const activeSet = {
  id: 'set-love',
  name: 'Love',
  names: { en: 'Love', ru: 'Любовь' },
  cardIds: ['card-a', 'card-b'],
  createdAt: now,
  updatedAt: now,
};

describe('cardSetsSlice archive behavior', () => {
  it('archives a custom set and selects all cards if the archived set was selected', () => {
    const state = cardSetsReducer(
      { cardSets: [activeSet], selectedCardSetId: 'set-love' },
      archiveCardSet({
        cardSetId: 'set-love',
        archivedAt: '2026-07-12T12:00:00.000Z',
      }),
    );

    expect(state.cardSets[0]).toMatchObject({
      id: 'set-love',
      archivedAt: '2026-07-12T12:00:00.000Z',
    });
    expect(state.selectedCardSetId).toBe('all-cards');
  });

  it('copies an archived set into a new active set without restoring the source', () => {
    const archived = {
      ...activeSet,
      archivedAt: '2026-07-12T12:00:00.000Z',
    };
    const state = cardSetsReducer(
      { cardSets: [archived], selectedCardSetId: 'all-cards' },
      copyArchivedCardSet({
        sourceCardSetId: 'set-love',
        newCardSetId: 'set-love-copy',
        now: '2026-07-12T13:00:00.000Z',
      }),
    );

    expect(state.cardSets[0]).toEqual(archived);
    expect(state.cardSets[1]).toEqual({
      id: 'set-love-copy',
      name: 'Love',
      names: { en: 'Love', ru: 'Любовь' },
      cardIds: ['card-a', 'card-b'],
      createdAt: '2026-07-12T13:00:00.000Z',
      updatedAt: '2026-07-12T13:00:00.000Z',
    });
    expect(state.selectedCardSetId).toBe('set-love-copy');
  });

  it('does not copy active or missing sets', () => {
    expect(
      cardSetsReducer(
        { cardSets: [activeSet], selectedCardSetId: 'all-cards' },
        copyArchivedCardSet({
          sourceCardSetId: 'set-love',
          newCardSetId: 'set-copy',
          now,
        }),
      ).cardSets,
    ).toEqual([activeSet]);
  });
});
```

- [ ] **Step 5: Run reducer tests and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/store/__tests__/cardSetsSlice.test.ts --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because `copyArchivedCardSet` does not exist.

- [ ] **Step 6: Implement reducer action**

Modify `src/store/cardSetsSlice.ts`:

```ts
    copyArchivedCardSet(
      state,
      action: PayloadAction<{
        sourceCardSetId: string;
        newCardSetId: string;
        now: string;
      }>,
    ) {
      const source = state.cardSets.find(
        (item) => item.id === action.payload.sourceCardSetId,
      );
      if (!source?.archivedAt || source.id === ALL_CARDS_CARD_SET_ID) {
        return;
      }

      const copy: CardSet = {
        id: action.payload.newCardSetId,
        name: source.name,
        ...(source.names ? { names: { ...source.names } } : {}),
        cardIds: [...source.cardIds],
        createdAt: action.payload.now,
        updatedAt: action.payload.now,
      };
      state.cardSets.push(copy);
      state.selectedCardSetId = copy.id;
    },
```

Export `copyArchivedCardSet` with the other slice actions.

- [ ] **Step 7: Verify task tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/cardSets.test.ts src/store/__tests__/cardSetsSlice.test.ts --exclude ".worktrees/**" --reporter=dot
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

```bash
git add src/domain/cardSets.ts src/domain/__tests__/cardSets.test.ts src/store/cardSetsSlice.ts src/store/__tests__/cardSetsSlice.test.ts
git commit -m "Add card set archive helpers" -m "Add reusable card-set archive and name-normalization helpers, plus a reducer action for creating an active copy from an archived card set. Cover archive detection, active-only duplicate detection, archive selection fallback, and copy behavior with focused Vitest tests."
```

---

### Task 2: Cards Rail Archive Filter, Search, And Active-Copy Action

**Files:**
- Modify: `src/components/CardSetListView.tsx`
- Create: `src/components/__tests__/CardSetListView.test.tsx`
- Modify: `src/domain/i18n.ts`

**Interfaces:**
- Consumes:
  - `isArchivedCardSet`, `getCardSetSearchValues`, `copyArchivedCardSet`
- Produces:
  - `card_set_list__search_input`
  - `card_set_list__archived_checkbox`
  - `card_set_list__tile_copy_button__${id}`

- [ ] **Step 1: Write failing Cards rail tests**

Create `src/components/__tests__/CardSetListView.test.tsx`:

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { CardSetListView } from '../CardSetListView';

const now = '2026-07-12T10:00:00.000Z';

function renderList() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      cards: cardsReducer,
      cardSets: cardSetsReducer,
    },
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        interfaceLanguage: 'en',
        targetLanguage: 'en',
      },
      cards: {
        cards: [
          { id: 'card-a', translations: { en: 'love', ru: 'любовь' }, createdAt: now, updatedAt: now },
        ],
        pendingDuplicates: [],
        duplicateProcessingHistory: [],
      },
      cardSets: {
        selectedCardSetId: 'all-cards',
        cardSets: [
          {
            id: 'set-love',
            name: 'Love',
            names: { en: 'Love', ru: 'Любовь' },
            cardIds: ['card-a'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'set-old-love',
            name: 'Love',
            names: { en: 'Love archive', ru: 'Старая любовь' },
            cardIds: ['card-a'],
            createdAt: now,
            updatedAt: now,
            archivedAt: '2026-07-12T11:00:00.000Z',
          },
          {
            id: 'set-family',
            name: 'Family',
            cardIds: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    },
  });

  render(
    <Provider store={store}>
      <CardSetListView />
    </Provider>,
  );
  return store;
}

describe('CardSetListView archive browsing', () => {
  it('filters active and archived card sets and searches localized names', async () => {
    const user = userEvent.setup();
    renderList();

    expect(screen.getByTestId('card_set_list__tile__all-cards')).toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-love')).toBeInTheDocument();
    expect(screen.queryByTestId('card_set_list__tile__set-old-love')).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search card sets' }), 'сем');
    expect(screen.queryByTestId('card_set_list__tile__set-love')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-family')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search card sets' }));
    await user.click(screen.getByRole('checkbox', { name: 'Archived' }));

    expect(screen.queryByTestId('card_set_list__tile__all-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card_set_list__tile__set-love')).not.toBeInTheDocument();
    expect(screen.getByTestId('card_set_list__tile__set-old-love')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('card_set_list__tile__set-old-love')).queryByLabelText(/В архив/),
    ).not.toBeInTheDocument();
  });

  it('creates an active copy from an archived card set', async () => {
    const user = userEvent.setup();
    const store = renderList();

    await user.click(screen.getByRole('checkbox', { name: 'Archived' }));
    await user.click(screen.getByRole('button', { name: 'Create active copy: Love archive' }));

    const copied = store
      .getState()
      .cardSets.cardSets.find((cardSet) => cardSet.id !== 'set-old-love' && cardSet.name === 'Love');
    expect(copied).toMatchObject({
      cardIds: ['card-a'],
      archivedAt: undefined,
    });
    expect(store.getState().cardSets.selectedCardSetId).toBe(copied?.id);
  });
});
```

- [ ] **Step 2: Run Cards rail tests and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/__tests__/CardSetListView.test.tsx --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because search, archive checkbox, and copy button do not exist.

- [ ] **Step 3: Add i18n labels**

Modify `src/domain/i18n.ts` by adding keys to `I18nKey` and each language map:

```ts
| 'searchCardSets'
| 'showArchivedCardSets'
| 'createActiveCopy'
```

English values:

```ts
searchCardSets: 'Search card sets',
showArchivedCardSets: 'Archived',
createActiveCopy: 'Create active copy',
```

Russian values:

```ts
searchCardSets: 'Поиск наборов',
showArchivedCardSets: 'Заархивированные',
createActiveCopy: 'Создать активную копию',
```

Spanish values:

```ts
searchCardSets: 'Buscar conjuntos',
showArchivedCardSets: 'Archivados',
createActiveCopy: 'Crear copia activa',
```

- [ ] **Step 4: Implement Cards rail filtering and copy action**

Modify imports in `src/components/CardSetListView.tsx`:

```ts
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ALL_CARDS_CARD_SET_ID,
  getCardSetName,
  getCardSetSearchValues,
  isArchivedCardSet,
} from '../domain/cardSets';
import {
  addCardSet,
  archiveCardSet,
  copyArchivedCardSet,
  selectCardSet,
} from '../store/cardSetsSlice';
```

Add state and filtering:

```ts
const [cardSetSearchQuery, setCardSetSearchQuery] = useState('');
const [showArchived, setShowArchived] = useState(false);
const normalizedCardSetSearch = cardSetSearchQuery.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const visibleCardSets = cardSets.filter((cardSet) => {
  if (showArchived !== isArchivedCardSet(cardSet)) {
    return false;
  }
  if (!normalizedCardSetSearch) {
    return true;
  }
  return getCardSetSearchValues(cardSet).some((value) =>
    value.includes(normalizedCardSetSearch),
  );
});
```

Add controls above tiles:

```tsx
<Stack data-test="card_set_list__filters" spacing={1}>
  <TextField
    data-test="card_set_list__search_input"
    label={t(interfaceLanguage, 'searchCardSets')}
    size="small"
    value={cardSetSearchQuery}
    onChange={(event) => setCardSetSearchQuery(event.target.value)}
  />
  <FormControlLabel
    control={
      <Checkbox
        data-test="card_set_list__archived_checkbox"
        checked={showArchived}
        onChange={(event) => setShowArchived(event.target.checked)}
      />
    }
    label={t(interfaceLanguage, 'showArchivedCardSets')}
  />
</Stack>
```

Only render `All cards` when `!showArchived`. Pass `archived` and `onCopyArchived` into tiles:

```tsx
{!showArchived && (
  <CardSetTile
    id={ALL_CARDS_CARD_SET_ID}
    name={t(interfaceLanguage, 'allCards')}
    cardCount={cards.length}
    selected={selectedCardSetId === ALL_CARDS_CARD_SET_ID}
    onSelect={() => dispatch(selectCardSet(ALL_CARDS_CARD_SET_ID))}
  />
)}

{visibleCardSets.map((cardSet) => (
  <CardSetTile
    key={cardSet.id}
    id={cardSet.id}
    name={getCardSetName(cardSet, targetLanguage)}
    cardCount={cardSet.cardIds.length}
    selected={selectedCardSetId === cardSet.id}
    archived={isArchivedCardSet(cardSet)}
    onSelect={() => dispatch(selectCardSet(cardSet.id))}
    onCopyArchived={
      isArchivedCardSet(cardSet)
        ? () =>
            dispatch(
              copyArchivedCardSet({
                sourceCardSetId: cardSet.id,
                newCardSetId: createCardSetId(),
                now: new Date().toISOString(),
              }),
            )
        : undefined
    }
  />
))}
```

In `CardSetTile`, render the copy action when archived:

```tsx
{onCopyArchived && (
  <Tooltip title={t(interfaceLanguage, 'createActiveCopy')}>
    <IconButton
      aria-label={`${t(interfaceLanguage, 'createActiveCopy')}: ${name}`}
      data-test={`card_set_list__tile_copy_button__${id}`}
      onClick={onCopyArchived}
      sx={{ mx: 1 }}
    >
      <ContentCopyIcon />
    </IconButton>
  </Tooltip>
)}
```

- [ ] **Step 5: Verify Cards rail tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/__tests__/CardSetListView.test.tsx --exclude ".worktrees/**" --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/components/CardSetListView.tsx src/components/__tests__/CardSetListView.test.tsx src/domain/i18n.ts
git commit -m "Add archived card set browsing" -m "Add Cards-page controls for searching card sets and toggling archived card sets. Hide All cards in archived mode, keep archive actions off archived tiles, and expose an active-copy action for archived card sets. Localize the new UI labels."
```

---

### Task 3: Read-Only Archived Card Set Detail

**Files:**
- Modify: `src/components/CardSetDetailView.tsx`
- Modify: `src/components/__tests__/CardSetDetailView.test.tsx`
- Modify: `src/domain/i18n.ts`

**Interfaces:**
- Consumes:
  - `isArchivedCardSet`, `copyArchivedCardSet`
- Produces:
  - `card_set_detail__archived_chip__${id}`
  - `card_set_detail__copy_archived_button__${id}`

- [ ] **Step 1: Write failing detail-view test**

Append to `src/components/__tests__/CardSetDetailView.test.tsx`:

```tsx
it('opens archived card sets read-only and can create an active copy', async () => {
  const user = userEvent.setup();
  const store = createStore({
    selectedCardSetId: 'card-set-archived',
    cardSets: [
      {
        id: 'card-set-archived',
        name: 'Archived love',
        cardIds: ['card-airport', 'card-worth-it'],
        createdAt: now,
        updatedAt: now,
        archivedAt: '2026-07-04T12:00:00.000Z',
      },
    ],
  });

  render(
    <Provider store={store}>
      <CardSetDetailView />
    </Provider>,
  );

  expect(screen.getByTestId('card_set_detail__archived_chip__card-set-archived')).toHaveTextContent('Заархивировано');
  expect(screen.queryByRole('button', { name: 'Редактировать карточки' })).not.toBeInTheDocument();
  expect(screen.getByText('airport')).toBeInTheDocument();
  expect(screen.getByText('worth it')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Создать активную копию' }));

  const copied = store
    .getState()
    .cardSets.cardSets.find((cardSet) => cardSet.id !== 'card-set-archived' && cardSet.name === 'Archived love');
  expect(copied?.archivedAt).toBeUndefined();
  expect(copied?.cardIds).toEqual(['card-airport', 'card-worth-it']);
});
```

Update the `createStore` helper type inside this test file to allow `archivedAt?: string`:

```ts
cardSets?: Array<{
  id: string;
  name: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}>;
```

- [ ] **Step 2: Run detail-view test and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/__tests__/CardSetDetailView.test.tsx -t "archived" --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because archived sets are currently excluded from selection.

- [ ] **Step 3: Add i18n archived label**

Modify `src/domain/i18n.ts`:

```ts
| 'archived'
```

Values:

```ts
archived: 'Archived',
archived: 'Заархивировано',
archived: 'Archivado',
```

- [ ] **Step 4: Implement archived detail mode**

Modify selected set lookup in `src/components/CardSetDetailView.tsx`:

```ts
const selectedCardSet = isAllCardsSelected
  ? {
      id: ALL_CARDS_CARD_SET_ID,
      name: t(targetLanguage, 'allCards'),
      cardIds: cards.map((card) => card.id),
      createdAt: '',
      updatedAt: '',
    }
  : cardSets.find((cardSet) => cardSet.id === selectedCardSetId);
const isArchivedSelectedCardSet =
  selectedCardSet && !isAllCardsSelected && isArchivedCardSet(selectedCardSet);
```

Disable editing and show copy controls:

```tsx
{isArchivedSelectedCardSet && (
  <Chip
    data-test={`card_set_detail__archived_chip__${selectedCardSet.id}`}
    label={t(interfaceLanguage, 'archived')}
    variant="outlined"
    sx={{
      borderColor: 'rgba(111, 75, 216, 0.52)',
      color: '#5e3fc0',
      fontWeight: 850,
    }}
  />
)}

{isArchivedSelectedCardSet && (
  <Button
    data-test={`card_set_detail__copy_archived_button__${selectedCardSet.id}`}
    startIcon={<AddIcon />}
    variant="outlined"
    onClick={() =>
      dispatch(
        copyArchivedCardSet({
          sourceCardSetId: selectedCardSet.id,
          newCardSetId: createCardSetId(),
          now: new Date().toISOString(),
        }),
      )
    }
  >
    {t(interfaceLanguage, 'createActiveCopy')}
  </Button>
)}
```

Guard the edit button:

```ts
const canEditSelectedCardSet = !isAllCardsSelected && !isArchivedSelectedCardSet;
```

Use `canEditSelectedCardSet` wherever the edit button or checkbox mode is displayed.

- [ ] **Step 5: Verify detail tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/__tests__/CardSetDetailView.test.tsx --exclude ".worktrees/**" --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/components/CardSetDetailView.tsx src/components/__tests__/CardSetDetailView.test.tsx src/domain/i18n.ts
git commit -m "Show archived card set details read-only" -m "Allow archived card sets to open in the Cards detail panel without editing controls. Add an archived status chip and active-copy action while preserving card search, translations, and per-card statistics."
```

---

### Task 4: AI Proposal Archive Support

**Files:**
- Modify: `src/domain/aiAssistantSchemas.ts`
- Modify: `src/domain/aiOperations.ts`
- Modify: `src/domain/__tests__/aiOperations.test.ts`
- Modify: `src/components/ai/AiOperationPreview.tsx`
- Modify: `src/components/ai/AiOperationHistory.tsx`
- Modify: `src/domain/i18n.ts`

**Interfaces:**
- Produces:
  - `AiOperationPreviewCounts.archivedCardSets: number`
  - `AiCardSetChange` update payload accepts `archive?: true`

- [ ] **Step 1: Write failing AI archive tests**

Append to `src/domain/__tests__/aiOperations.test.ts`:

```ts
it('plans card-set archival through an update operation', () => {
  const result = planAiOperation(
    plannerInput({
      title: 'Archive Travel',
      summary: 'Archive the old travel set.',
      cardSetChanges: [
        {
          type: 'update',
          cardSetId: 'set-travel',
          archive: true,
        },
      ],
    }),
  );

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.operation.updatedCardSets).toEqual([
    {
      before: cardSet(),
      after: cardSet({
        archivedAt: now,
        updatedAt: now,
      }),
    },
  ]);
  expect(result.operation.previewCounts).toMatchObject({
    archivedCardSets: 1,
    membershipAdditions: 0,
    membershipRemovals: 0,
  });
});

it('rejects attempts to archive all-cards or already archived sets', () => {
  expect(
    planAiOperation(
      plannerInput({
        title: 'Archive all',
        summary: 'Invalid archive.',
        cardSetChanges: [
          { type: 'update', cardSetId: 'all-cards', archive: true },
        ],
      }),
    ),
  ).toEqual({
    ok: false,
    errors: ['The all-cards set cannot be updated.'],
  });

  const input = plannerInput({
    title: 'Archive again',
    summary: 'Invalid archive.',
    cardSetChanges: [
      { type: 'update', cardSetId: 'set-travel', archive: true },
    ],
  });
  input.cardSets = [cardSet({ archivedAt: now })];

  expect(planAiOperation(input)).toEqual({
    ok: false,
    errors: ['Card set set-travel is already archived.'],
  });
});
```

- [ ] **Step 2: Run AI archive tests and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/aiOperations.test.ts -t "archive" --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because `archive` is not accepted by the schema.

- [ ] **Step 3: Extend proposal schema**

Modify `updateCardSetChangeSchema` in `src/domain/aiAssistantSchemas.ts`:

```ts
const updateCardSetChangeSchema = z
  .object({
    addCardRefs: uniqueStringsSchema.optional(),
    archive: z.literal(true).optional(),
    cardSetId: nonEmptyStringSchema,
    names: cardSetNamesSchema.optional(),
    removeCardIds: uniqueStringsSchema.optional(),
    type: z.literal('update'),
  })
  .strict()
  .superRefine((change, context) => {
    if (
      !change.archive &&
      !change.names &&
      (change.addCardRefs?.length ?? 0) === 0 &&
      (change.removeCardIds?.length ?? 0) === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card-set update must contain at least one change.',
      });
    }
  });
```

- [ ] **Step 4: Extend operation preview counts**

Modify `AiOperationPreviewCounts`:

```ts
export interface AiOperationPreviewCounts {
  createdCards: number;
  updatedCards: number;
  pendingDuplicates: number;
  createdCardSets: number;
  archivedCardSets: number;
  renamedCardSets: number;
  membershipAdditions: number;
  membershipRemovals: number;
}
```

Update every existing test fixture and operation fixture to include `archivedCardSets: 0`.

- [ ] **Step 5: Implement archive planning and validation**

In `validateReferences`, after finding `cardSet` for an update:

```ts
if (change.archive && cardSet.archivedAt) {
  errors.push(`Card set ${cardSet.id} is already archived.`);
}
```

In the update branch of `planAiOperation`, include:

```ts
const after: CardSet = {
  ...current,
  name: deriveCanonicalName(names, current.name),
  names,
  cardIds: unique([...remainingIds, ...addedIds]),
  ...(change.archive ? { archivedAt: input.now } : {}),
  updatedAt: input.now,
};
```

In `buildPreviewCounts`, add:

```ts
let archivedCardSets = 0;
for (const { before, after } of updatedCardSets) {
  if (!before.archivedAt && after.archivedAt) {
    archivedCardSets += 1;
  }
}
return {
  addedCards,
  addedCardSets,
  archivedCardSets,
  membershipAdditions,
  membershipRemovals,
  updatedCardSets: updatedCardSets.length,
};
```

- [ ] **Step 6: Update preview/history UI copy**

Add i18n key:

```ts
| 'aiArchivedCardSets'
```

Values:

```ts
aiArchivedCardSets: 'Archived card sets',
aiArchivedCardSets: 'Заархивированные наборы',
aiArchivedCardSets: 'Conjuntos archivados',
```

Add to `previewCountLabels` in `src/components/ai/AiOperationPreview.tsx`:

```ts
['archivedCardSets', 'aiArchivedCardSets'],
```

If `AiOperationHistory.tsx` renders the same count list manually, add the same key there as well.

- [ ] **Step 7: Verify AI archive tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/aiOperations.test.ts src/store/__tests__/aiAssistantStore.test.ts src/components/__tests__/AiAssistantView.test.tsx --exclude ".worktrees/**" --reporter=dot
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add src/domain/aiAssistantSchemas.ts src/domain/aiOperations.ts src/domain/__tests__/aiOperations.test.ts src/components/ai/AiOperationPreview.tsx src/components/ai/AiOperationHistory.tsx src/domain/i18n.ts src/store/__tests__/aiAssistantStore.test.ts src/components/__tests__/AiAssistantView.test.tsx
git commit -m "Allow AI to archive card sets" -m "Extend AI card-set update proposals with archive: true, validate archive constraints, record archived card-set preview counts, and surface the count in AI operation previews/history. Cover planning and integration behavior with focused tests."
```

---

### Task 5: AI Read Tools Archive Filter And Prompt Update

**Files:**
- Modify: `src/domain/aiLibraryTools.ts`
- Modify: `src/domain/__tests__/aiLibraryTools.test.ts`
- Modify: `src/services/aiAssistantAgent.ts`
- Modify: `src/services/__tests__/aiAssistantAgent.test.ts`

**Interfaces:**
- Produces:
  - `list_card_sets` argument `archiveFilter?: 'active' | 'archived' | 'all'`

- [ ] **Step 1: Write failing read-tool filter tests**

Modify `src/domain/__tests__/aiLibraryTools.test.ts` in the `lists localized card sets` test and add a new test:

```ts
it('lists only active card sets by default and can include archived sets explicitly', () => {
  expect(
    executeAiReadTool('list_card_sets', { query: 'viaj' }, snapshot),
  ).toMatchObject({
    items: [
      {
        archivedAt: undefined,
        id: 'travel',
        name: 'Viajes',
      },
    ],
    total: 1,
  });

  expect(
    executeAiReadTool(
      'list_card_sets',
      { query: 'viaj', archiveFilter: 'archived' },
      snapshot,
    ),
  ).toMatchObject({
    items: [
      {
        archivedAt: '2026-07-10T09:00:00.000Z',
        id: 'archive',
        name: 'Viajes antiguos',
      },
    ],
    total: 1,
  });

  expect(
    executeAiReadTool(
      'list_card_sets',
      { query: 'viaj', archiveFilter: 'all' },
      snapshot,
    ),
  ).toMatchObject({
    total: 2,
  });
});
```

- [ ] **Step 2: Run read-tool tests and verify RED**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/aiLibraryTools.test.ts -t "card sets" --exclude ".worktrees/**" --reporter=dot
```

Expected: FAIL because `archiveFilter` is rejected and default still includes archived sets.

- [ ] **Step 3: Implement archive filter in read tools**

Modify `listCardSetsArgumentsSchema`:

```ts
archiveFilter: z.enum(['active', 'archived', 'all']).optional(),
```

Add it to tool definition properties:

```ts
archiveFilter: {
  type: 'string',
  enum: ['active', 'archived', 'all'],
  description: 'active lists active sets plus All cards, archived lists archived sets only, all lists both.',
},
```

Filter in `listCardSets`:

```ts
const archiveFilter = arguments_.archiveFilter ?? 'active';
const includeAllCards = archiveFilter === 'active';
const cardSets = [
  ...(includeAllCards && normalizeSearchValue(allCards.name).includes(query) ? [allCards] : []),
  ...snapshot.cardSets
    .filter((cardSet) => {
      if (archiveFilter === 'active' && cardSet.archivedAt) return false;
      if (archiveFilter === 'archived' && !cardSet.archivedAt) return false;
      return cardSetNameMatchesQuery(cardSet, query);
    })
    .map((cardSet) =>
      toCardSetSummary(cardSet, snapshot.interfaceLanguage, cardCounts),
    ),
];
```

- [ ] **Step 4: Update AI system prompt**

Modify `createSystemMessage` in `src/services/aiAssistantAgent.ts`:

```ts
You may propose archiving normal card sets through propose_library_operation using cardSetChanges update objects with archive: true.
You must not archive all-cards, delete card sets, delete global cards, or restore archived sets in place.
When the user wants to reuse an archived set, propose creating a new active card set based on it instead.
Use list_card_sets with archiveFilter when you need active, archived, or all card sets explicitly.
```

Remove the old sentence that says the assistant may not archive card sets.

- [ ] **Step 5: Update agent tests**

In `src/services/__tests__/aiAssistantAgent.test.ts`, add or update a prompt test to assert the system message contains:

```ts
expect(systemMessage.content).toContain('archive: true');
expect(systemMessage.content).toContain('must not archive all-cards');
expect(systemMessage.content).toContain('archiveFilter');
```

If the test currently asserts the old prohibition text, change that assertion to:

```ts
expect(systemMessage.content).not.toContain('archive or delete card sets');
```

- [ ] **Step 6: Verify AI read and prompt tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/domain/__tests__/aiLibraryTools.test.ts src/services/__tests__/aiAssistantAgent.test.ts --exclude ".worktrees/**" --reporter=dot
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/domain/aiLibraryTools.ts src/domain/__tests__/aiLibraryTools.test.ts src/services/aiAssistantAgent.ts src/services/__tests__/aiAssistantAgent.test.ts
git commit -m "Add archive filtering to AI library tools" -m "Add an archiveFilter argument to list_card_sets, default the tool to active sets, expose archived summaries when requested, and update the AI assistant system prompt so archiving is allowed only through staged operations with clear constraints."
```

---

### Task 6: Final Integration Verification

**Files:**
- Modify only if the verification output identifies a concrete failure:
  - `src/App.tsx`
  - `src/components/CardSetLibraryPicker.tsx`
  - `src/components/AiAssistantView.tsx`
  - related tests

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified branch state ready for review.

- [ ] **Step 1: Run focused feature tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  src/components/__tests__/CardSetListView.test.tsx \
  src/components/__tests__/CardSetDetailView.test.tsx \
  src/domain/__tests__/cardSets.test.ts \
  src/store/__tests__/cardSetsSlice.test.ts \
  src/domain/__tests__/aiOperations.test.ts \
  src/domain/__tests__/aiLibraryTools.test.ts \
  src/services/__tests__/aiAssistantAgent.test.ts \
  src/components/__tests__/AiAssistantView.test.tsx \
  --exclude ".worktrees/**" \
  --reporter=dot
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
node node_modules/typescript/bin/tsc -b --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Run diff hygiene**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Manually inspect expected UI behavior in the app**

Start the dev server if it is not already running:

```bash
npm run dev -- --host 127.0.0.1
```

Manual checks:

- Cards page active mode shows `All cards` plus active sets.
- Cards page archived checkbox shows only archived sets.
- Cards page search filters active and archived modes independently.
- Archived detail view shows cards and stats but no edit-membership controls.
- Archived copy action creates and selects a new active set.
- AI can stage an archive proposal and the preview mentions archived card sets.

- [ ] **Step 5: Commit verification fixes if any were needed**

If Step 1-4 required code changes, commit them:

```bash
git add src/App.tsx src/components/CardSetLibraryPicker.tsx src/components/AiAssistantView.tsx src/components/__tests__/App.navigation.test.tsx src/components/__tests__/AiAssistantView.test.tsx
git commit -m "Verify card set archive integration" -m "Fix integration issues found while running the full archived card-set verification pass."
```

If no changes were required, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: data model, Cards page archive mode, active-copy creation, active-only uniqueness, AI proposal archive support, AI read-tool filtering, statistics preservation, and testing are covered by Tasks 1-6.
- Placeholder scan: no unresolved placeholder markers are present; each task has concrete files, commands, and expected results.
- Type consistency: all new names are introduced before downstream tasks use them: `isArchivedCardSet`, `getCardSetSearchValues`, `normalizeCardSetName`, `findActiveCardSetNameConflict`, `copyArchivedCardSet`, `archivedCardSets`, and `archiveFilter`.
