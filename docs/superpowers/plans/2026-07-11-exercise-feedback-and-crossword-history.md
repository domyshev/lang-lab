# Exercise Feedback And Crossword History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add character-level error feedback to playable cell exercises, preserve and replay complete crossword layouts in statistics, and make history and assistant tooltips trigger from the intended responsive controls.

**Architecture:** Add small domain helpers for case-insensitive character comparison and crossword result tones, then persist an optional complete crossword snapshot on each crossword attempt. Render that snapshot through a dedicated read-only history component, move recent-answer history behind a reusable chip, and extend the shared cursor-anchored tooltip with a stable right-edge anchor for narrow assistant layouts.

**Tech Stack:** React 18, TypeScript 5.6, MUI 6, Redux Toolkit, Redux Persist, Vitest, Testing Library, Playwright, Vite.

## Global Constraints

- `TASK_REQUIREMENTS.md` must never be changed.
- Commit messages require a short subject and a detailed body.
- All new committed documentation and code identifiers use English.
- All visible copy is localized for English, Russian, and Spanish.
- Keep `data-test` attributes unique and preserve existing hooks unless the plan explicitly replaces them.
- Preserve local-first Redux Persist behavior and backward compatibility with attempts that do not contain a crossword snapshot.
- Existing scoring remains based only on fully answered cards; partial crossword cells are visual history and do not alter totals.
- Use TDD for every behavior change: add a failing test, run it and observe the expected failure, implement the minimum change, then rerun the test.
- Do not change crossword generation, repetition ordering, assistant content, or keyboard shortcut behavior.

---

### Task 1: Share Character Comparison And Decorate Incorrect Exercise Inputs

**Files:**
- Create: `src/domain/answerCharacters.ts`
- Create: `src/domain/__tests__/answerCharacters.test.ts`
- Modify: `src/components/exercises/MissingLettersExercise.tsx:1-465`
- Modify: `src/components/exercises/MissingWordExercise.tsx:1-610`
- Test: `src/components/exercises/__tests__/MissingLettersExercise.test.tsx`
- Test: `src/components/exercises/__tests__/MissingWordExercise.test.tsx`

**Interfaces:**
- Produces: `areAnswerCharactersEqual(actual: string, expected: string): boolean`.
- Produces: `shouldStrikeAnswerCharacter(input: { actual: string; expected: string; isIncorrect: boolean }): boolean`.
- Consumes: no code from later tasks.

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/__tests__/answerCharacters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  areAnswerCharactersEqual,
  shouldStrikeAnswerCharacter,
} from '../answerCharacters';

describe('answerCharacters', () => {
  it('compares answer characters without case sensitivity', () => {
    expect(areAnswerCharactersEqual('Ñ', 'ñ')).toBe(true);
    expect(areAnswerCharactersEqual('x', 't')).toBe(false);
  });

  it('strikes only a non-empty incorrect submitted character', () => {
    expect(
      shouldStrikeAnswerCharacter({
        actual: 'x',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(true);
    expect(
      shouldStrikeAnswerCharacter({
        actual: 't',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(false);
    expect(
      shouldStrikeAnswerCharacter({
        actual: '',
        expected: 't',
        isIncorrect: true,
      }),
    ).toBe(false);
    expect(
      shouldStrikeAnswerCharacter({
        actual: 'x',
        expected: 't',
        isIncorrect: false,
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the domain test and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/answerCharacters.test.ts
```

Expected: FAIL because `src/domain/answerCharacters.ts` does not exist.

- [ ] **Step 3: Implement the domain helper**

Create `src/domain/answerCharacters.ts`:

```ts
export function areAnswerCharactersEqual(
  actual: string,
  expected: string,
): boolean {
  return actual.toLocaleLowerCase() === expected.toLocaleLowerCase();
}

export function shouldStrikeAnswerCharacter({
  actual,
  expected,
  isIncorrect,
}: {
  actual: string;
  expected: string;
  isIncorrect: boolean;
}): boolean {
  return (
    isIncorrect &&
    Boolean(actual.trim()) &&
    !areAnswerCharactersEqual(actual, expected)
  );
}
```

- [ ] **Step 4: Verify the domain test is GREEN**

Run:

```bash
npm test -- --run src/domain/__tests__/answerCharacters.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 5: Add failing Missing Letters feedback coverage**

Append a test to `src/components/exercises/__tests__/MissingLettersExercise.test.tsx` that fills `v_h_c_e` as `vehocle`, submits, and checks only the `o` input is struck:

```ts
it('strikes only an incorrectly entered letter after an incorrect submission', async () => {
  const user = userEvent.setup();

  render(
    <MissingLettersExercise
      interfaceLanguage="ru"
      prompt={{
        cardId: 'vehicle',
        prompt: 'ru: транспортное средство',
        expectedAnswer: 'vehicle',
        maskedAnswer: 'v_h_c_e',
        translationHints: [
          { language: 'ru', value: 'транспортное средство' },
        ],
      }}
      onAnswer={vi.fn()}
      onNext={vi.fn()}
    />,
  );

  const inputs = screen.getAllByLabelText(/Missing letter/);
  await user.type(inputs[0], 'e');
  await user.type(inputs[1], 'o');
  await user.type(inputs[2], 'l');
  await user.click(screen.getByRole('button', { name: 'Отправить' }));

  expect(inputs[0]).toHaveStyle({ textDecorationLine: 'none' });
  expect(inputs[1]).toHaveStyle({ textDecorationLine: 'line-through' });
  expect(inputs[2]).toHaveStyle({ textDecorationLine: 'none' });
  expect(
    screen.getByTestId(
      'missing_letters_exercise__correct_answer_cell__vehicle__3',
    ),
  ).toHaveStyle({ textDecorationLine: 'none' });
});
```

- [ ] **Step 6: Add failing Missing Word feedback coverage**

Extend the existing incorrect-answer test in `src/components/exercises/__tests__/MissingWordExercise.test.tsx` after entering `wxrxh ix`:

```ts
const submittedInputs = screen.getAllByLabelText(/Missing word letter/);
expect(submittedInputs[0]).toHaveStyle({
  textDecorationLine: 'line-through',
});
expect(submittedInputs[1]).toHaveStyle({
  textDecorationLine: 'line-through',
});
expect(submittedInputs[2]).toHaveStyle({
  textDecorationLine: 'line-through',
});
expect(
  screen.getByTestId(
    'missing_word_exercise__correct_answer_cell__worth-it__1',
  ),
).toHaveStyle({ textDecorationLine: 'none' });
```

- [ ] **Step 7: Run the exercise tests and verify RED**

Run:

```bash
npm test -- --run src/components/exercises/__tests__/MissingLettersExercise.test.tsx src/components/exercises/__tests__/MissingWordExercise.test.tsx
```

Expected: FAIL because submitted input cells do not set `text-decoration-line`.

- [ ] **Step 8: Apply character decoration in both exercises**

Import the helper in both exercise components:

```ts
import { shouldStrikeAnswerCharacter } from '../../domain/answerCharacters';
```

Add this helper to each file next to `getLetterCellInlineStyle`:

```ts
function getSubmittedInputCellStyle({
  actual,
  expected,
  resultTone,
}: {
  actual: string;
  expected: string;
  resultTone: SubmissionOutcome | null;
}): CSSProperties {
  return {
    ...getLetterCellInlineStyle(resultTone),
    textDecorationLine: shouldStrikeAnswerCharacter({
      actual,
      expected,
      isIncorrect: resultTone === 'incorrect',
    })
      ? 'line-through'
      : 'none',
    textDecorationThickness: '2px',
  };
}
```

Use it only on editable input cells. In Missing Letters:

```tsx
style={getSubmittedInputCellStyle({
  actual: letters[index] ?? '',
  expected: prompt.expectedAnswer[index] ?? '',
  resultTone,
})}
```

In Missing Word:

```tsx
style={getSubmittedInputCellStyle({
  actual: letters[index] ?? '',
  expected: characters[index] ?? '',
  resultTone,
})}
```

Keep fixed cells and correct-answer cells on `getLetterCellInlineStyle` so they never receive a line-through.

- [ ] **Step 9: Verify Task 1**

Run:

```bash
npm test -- --run src/domain/__tests__/answerCharacters.test.ts src/components/exercises/__tests__/MissingLettersExercise.test.tsx src/components/exercises/__tests__/MissingWordExercise.test.tsx
npm run lint
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 10: Commit Task 1**

```bash
git add src/domain/answerCharacters.ts src/domain/__tests__/answerCharacters.test.ts src/components/exercises/MissingLettersExercise.tsx src/components/exercises/MissingWordExercise.tsx src/components/exercises/__tests__/MissingLettersExercise.test.tsx src/components/exercises/__tests__/MissingWordExercise.test.tsx
git commit -m "Decorate incorrect exercise letters" -m "Add shared case-insensitive answer character comparison and use it to strike only incorrectly entered editable cells in Missing Letters and Missing Word. Keep fixed characters, correct answers, and memorize states undecorated."
```

---

### Task 2: Persist Complete Crossword Snapshots And Decorate Wrong Grid Letters

**Files:**
- Create: `src/domain/crosswordResults.ts`
- Create: `src/domain/__tests__/crosswordResults.test.ts`
- Modify: `src/domain/exercises.ts:1-50`
- Modify: `src/components/exercises/CrosswordExercise.tsx:1-850`
- Modify: `src/App.tsx:692-827,1383-1406`
- Test: `src/components/exercises/__tests__/CrosswordExercise.test.tsx`
- Test: `src/__tests__/App.navigation.test.tsx:1755-1884`

**Interfaces:**
- Consumes: `areAnswerCharactersEqual` and `shouldStrikeAnswerCharacter` from Task 1.
- Produces: `CrosswordAttemptSnapshot` with `puzzle` and `cellValues`.
- Produces: `getCrosswordCellTone(cell, correctness)` and `getIncorrectCrosswordEntries(cell, puzzle, correctness)`.
- Produces: `CrosswordDraftState.cellValues`.
- Changes: `CrosswordExercise.onSubmit(answers, snapshot)` receives the complete snapshot as its second argument.

- [ ] **Step 1: Write failing crossword result helper tests**

Create `src/domain/__tests__/crosswordResults.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getCrosswordCellTone,
  getIncorrectCrosswordEntries,
} from '../crosswordResults';
import type { CrosswordPuzzle } from '../crossword';

const puzzle: CrosswordPuzzle = {
  mode: 'words',
  bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 },
  cells: [
    { row: 0, col: 0, solution: 'c', entryIds: ['cat'] },
    { row: 0, col: 1, solution: 'a', entryIds: ['cat'] },
    { row: 0, col: 2, solution: 't', entryIds: ['cat', 'tea'] },
    { row: 1, col: 2, solution: 'e', entryIds: ['tea'] },
    { row: 2, col: 2, solution: 'a', entryIds: ['tea'] },
  ],
  entries: [
    {
      cardId: 'cat',
      answer: 'cat',
      clue: 'ru: кот',
      row: 0,
      col: 0,
      direction: 'across',
    },
    {
      cardId: 'tea',
      answer: 'tea',
      clue: 'ru: чай',
      row: 0,
      col: 2,
      direction: 'down',
    },
  ],
};

describe('crosswordResults', () => {
  it('gives incorrect results precedence at an intersection', () => {
    const crossingCell = puzzle.cells[2];

    expect(
      getCrosswordCellTone(crossingCell, { cat: true, tea: false }),
    ).toBe('incorrect');
    expect(getCrosswordCellTone(crossingCell, { cat: true })).toBe('correct');
    expect(getCrosswordCellTone(crossingCell, {})).toBeUndefined();
  });

  it('returns every incorrect entry crossing a cell', () => {
    expect(
      getIncorrectCrosswordEntries(puzzle.cells[2], puzzle, {
        cat: false,
        tea: false,
      }).map((entry) => entry.cardId),
    ).toEqual(['cat', 'tea']);
  });
});
```

- [ ] **Step 2: Run helper tests and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/crosswordResults.test.ts
```

Expected: FAIL because `src/domain/crosswordResults.ts` does not exist.

- [ ] **Step 3: Implement crossword result helpers**

Create `src/domain/crosswordResults.ts`:

```ts
import type { CrosswordCell, CrosswordEntry, CrosswordPuzzle } from './crossword';

export type CrosswordCellTone = 'correct' | 'incorrect' | undefined;

export function getCrosswordCellTone(
  cell: CrosswordCell,
  correctness: Record<string, boolean>,
): CrosswordCellTone {
  const results = cell.entryIds
    .filter((entryId) =>
      Object.prototype.hasOwnProperty.call(correctness, entryId),
    )
    .map((entryId) => correctness[entryId]);

  if (results.some((isCorrect) => !isCorrect)) {
    return 'incorrect';
  }

  return results.length > 0 ? 'correct' : undefined;
}

export function getIncorrectCrosswordEntries(
  cell: CrosswordCell,
  puzzle: CrosswordPuzzle,
  correctness: Record<string, boolean>,
): CrosswordEntry[] {
  const entryById = new Map(
    puzzle.entries.map((entry) => [entry.cardId, entry]),
  );

  return cell.entryIds
    .filter((entryId) => correctness[entryId] === false)
    .map((entryId) => entryById.get(entryId))
    .filter((entry): entry is CrosswordEntry => Boolean(entry));
}
```

- [ ] **Step 4: Add the snapshot type**

In `src/domain/exercises.ts`, import the puzzle type and add the optional field:

```ts
import type { CrosswordPuzzle } from './crossword';

export interface CrosswordAttemptSnapshot {
  puzzle: CrosswordPuzzle;
  cellValues: Record<string, string>;
}
```

Add to `ExerciseAttempt`:

```ts
crosswordSnapshot?: CrosswordAttemptSnapshot;
```

- [ ] **Step 5: Add failing playable-crossword tests**

Update the existing submit assertions in `CrosswordExercise.test.tsx` to expect a second snapshot argument:

```ts
expect(onSubmit).toHaveBeenCalledWith(
  { cat: 'cat', tea: 'tea' },
  expect.objectContaining({
    puzzle: expect.objectContaining({
      entries: expect.arrayContaining([
        expect.objectContaining({ cardId: 'cat' }),
        expect.objectContaining({ cardId: 'tea' }),
      ]),
    }),
    cellValues: {
      '0:0': 'c',
      '0:1': 'a',
      '0:2': 't',
      '1:2': 'e',
      '2:2': 'a',
    },
  }),
);
```

In the incorrect crossword test, add:

```ts
expect(screen.getByLabelText('Crossword cell 1 3')).toHaveStyle({
  textDecorationLine: 'none',
});
expect(screen.getByLabelText('Crossword cell 2 3')).toHaveStyle({
  textDecorationLine: 'line-through',
});
expect(screen.getByLabelText('Crossword cell 3 3')).toHaveStyle({
  textDecorationLine: 'line-through',
});
```

Add to the partial-submit App test after locating `crosswordAttempt`:

```ts
expect(crosswordAttempt?.crosswordSnapshot?.puzzle.entries.length).toBeGreaterThan(1);
expect(
  Object.values(crosswordAttempt?.crosswordSnapshot?.cellValues ?? {}).some(
    (value) => Boolean(value),
  ),
).toBe(true);
```

- [ ] **Step 6: Run crossword tests and verify RED**

Run:

```bash
npm test -- --run src/domain/__tests__/crosswordResults.test.ts src/components/exercises/__tests__/CrosswordExercise.test.tsx src/__tests__/App.navigation.test.tsx -t "crossword"
```

Expected: FAIL because the submit callback has one argument, wrong letters are not struck, and attempts have no snapshot.

- [ ] **Step 7: Report complete draft state and submit snapshots**

In `CrosswordExercise.tsx`, extend the draft and callback contracts:

```ts
export type CrosswordDraftState = {
  answers: Record<string, string>;
  answeredCardIds: string[];
  cellValues: Record<string, string>;
  filledEntryCount: number;
  hasAnyLetters: boolean;
};
```

Set `cellValues` in `getCrosswordDraftState`:

```ts
return {
  answers,
  answeredCardIds,
  cellValues: { ...cellValues },
  filledEntryCount: answeredCardIds.length,
  hasAnyLetters: Object.values(cellValues).some((value) =>
    Boolean(value.trim()),
  ),
};
```

Change the prop type:

```ts
onSubmit: (
  answers: Record<string, string>,
  snapshot: CrosswordAttemptSnapshot,
) => void;
```

Call it from `handleSubmit`:

```ts
const answers = getFilledCrosswordAnswers(draftState);
const snapshot: CrosswordAttemptSnapshot = {
  puzzle,
  cellValues: { ...cellValues },
};
setSubmittedAnswers(answers);
onSubmit(answers, snapshot);
```

- [ ] **Step 8: Use shared tones and decorate wrong crossword letters**

Import `getCrosswordCellTone`, `shouldStrikeAnswerCharacter`, and the snapshot type. Derive submitted correctness:

```ts
const submittedCorrectness = useMemo(() => {
  if (!submittedAnswers) {
    return {};
  }

  return Object.fromEntries(
    puzzle.entries
      .filter((entry) =>
        Object.prototype.hasOwnProperty.call(submittedAnswers, entry.cardId),
      )
      .map((entry) => [
        entry.cardId,
        normalizeAnswer(submittedAnswers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer),
      ]),
  );
}, [puzzle.entries, submittedAnswers]);
```

Replace `getSubmittedCellTone` with:

```ts
const cellTone = getCrosswordCellTone(cell, submittedCorrectness);
```

Extend the cell's inline style:

```tsx
style={{
  ...getSubmittedCellStyle(cellTone),
  textDecorationLine: shouldStrikeAnswerCharacter({
    actual: cellValues[key] ?? '',
    expected: cell.solution,
    isIncorrect: cellTone === 'incorrect',
  })
    ? 'line-through'
    : 'none',
  textDecorationThickness: '2px',
}}
```

Delete the old internal `getSubmittedCellTone` after all callers use the domain helper.

- [ ] **Step 9: Persist snapshots from normal submit and manual finish**

In `App.tsx`, extend `persistAttempt` input and the saved attempt:

```ts
crosswordSnapshot?: CrosswordAttemptSnapshot;
```

```ts
crosswordSnapshot: input.crosswordSnapshot,
```

Change `saveCrosswordAttempt` to accept and pass the snapshot:

```ts
function saveCrosswordAttempt(
  puzzle: CrosswordPuzzle,
  answers: Record<string, string>,
  crosswordSnapshot: CrosswordAttemptSnapshot,
) {
```

Add to its `persistAttempt` call:

```ts
crosswordSnapshot,
```

Add to `saveCrosswordDraftAttempt`:

```ts
crosswordSnapshot: {
  puzzle,
  cellValues: { ...draft.cellValues },
},
```

Update the component callback:

```tsx
onSubmit={(answers, crosswordSnapshot) =>
  saveCrosswordAttempt(
    exercisePreview.puzzle,
    answers,
    crosswordSnapshot,
  )
}
```

- [ ] **Step 10: Verify Task 2**

Run:

```bash
npm test -- --run src/domain/__tests__/crosswordResults.test.ts src/components/exercises/__tests__/CrosswordExercise.test.tsx src/__tests__/App.navigation.test.tsx
npm run lint
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 11: Commit Task 2**

```bash
git add src/domain/crosswordResults.ts src/domain/__tests__/crosswordResults.test.ts src/domain/exercises.ts src/components/exercises/CrosswordExercise.tsx src/components/exercises/__tests__/CrosswordExercise.test.tsx src/App.tsx src/__tests__/App.navigation.test.tsx
git commit -m "Persist complete crossword results" -m "Store the full puzzle and entered cell values with crossword attempts, including partial grids saved through manual finish. Share crossword result tone logic and strike only wrong entered grid characters while preserving intersection color precedence and word-level scoring."
```

---

### Task 3: Replay Saved Crosswords In Statistics

**Files:**
- Create: `src/components/history/CrosswordHistoryReplay.tsx`
- Create: `src/components/history/__tests__/CrosswordHistoryReplay.test.tsx`
- Modify: `src/components/HistoryView.tsx:68-197`
- Test: `src/components/__tests__/HistoryView.test.tsx`

**Interfaces:**
- Consumes: `CrosswordAttemptSnapshot` from Task 2.
- Consumes: `getCrosswordCellTone` and `getIncorrectCrosswordEntries` from Task 2.
- Consumes: `shouldStrikeAnswerCharacter` from Task 1.
- Produces: `CrosswordHistoryReplay({ snapshot, correctness, interfaceLanguage })`.

- [ ] **Step 1: Write a failing static replay test**

Create `src/components/history/__tests__/CrosswordHistoryReplay.test.tsx` with the same `cat`/`tea` crossing puzzle. Use cell values `{ '0:0': 'c', '0:1': 'a', '0:2': 't', '1:2': 'x' }` and correctness `{ cat: true }` first to prove partial `tea` remains neutral, then a second render with completed `tea: false` and `'2:2': 'x'` to prove incorrect styling.

The primary assertions are:

```ts
expect(screen.getByTestId('crossword_history__grid')).toBeInTheDocument();
expect(screen.getByTestId('crossword_history__clue_number__cat')).toHaveTextContent('1');
expect(screen.getByTestId('crossword_history__clue_number__tea')).toHaveTextContent('2');
expect(screen.getByTestId('crossword_history__cell__1_1')).toHaveTextContent('c');
expect(screen.getByTestId('crossword_history__cell__3_3')).toHaveTextContent('');
expect(screen.getByTestId('crossword_history__cell__1_1')).toHaveStyle({
  backgroundColor: 'rgb(235, 247, 225)',
});
expect(screen.getByTestId('crossword_history__cell__2_3')).not.toHaveStyle({
  backgroundColor: 'rgb(253, 235, 238)',
});
```

For the completed incorrect state:

```ts
expect(screen.getByTestId('crossword_history__cell__2_3')).toHaveStyle({
  backgroundColor: 'rgb(253, 235, 238)',
  textDecorationLine: 'line-through',
});
expect(screen.getByTestId('crossword_history__cell__1_3')).toHaveStyle({
  backgroundColor: 'rgb(253, 235, 238)',
  textDecorationLine: 'none',
});
```

Hover the clue number and wrong cell:

```ts
await user.hover(screen.getByTestId('crossword_history__clue_number__tea'));
expect(await screen.findByText('Вопрос')).toBeInTheDocument();
expect(await screen.findByText('ru: чай')).toBeInTheDocument();

await user.hover(screen.getByTestId('crossword_history__cell__2_3'));
expect(
  await screen.findByText('Правильный ответ: tea'),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the replay test and verify RED**

Run:

```bash
npm test -- --run src/components/history/__tests__/CrosswordHistoryReplay.test.tsx
```

Expected: FAIL because `CrosswordHistoryReplay.tsx` does not exist.

- [ ] **Step 3: Implement the read-only replay component**

Create `src/components/history/CrosswordHistoryReplay.tsx`. The component must:

```ts
export function CrosswordHistoryReplay({
  correctness,
  interfaceLanguage,
  snapshot,
}: {
  correctness: Record<string, boolean>;
  interfaceLanguage: SupportedLanguage;
  snapshot: CrosswordAttemptSnapshot;
})
```

Build these maps once:

```ts
const cellByKey = new Map(
  snapshot.puzzle.cells.map((cell) => [
    toCellKey(cell.row, cell.col),
    cell,
  ]),
);
const startEntryByKey = new Map(
  snapshot.puzzle.entries.map((entry, index) => [
    toCellKey(entry.row, entry.col),
    { entry, number: index + 1 },
  ]),
);
```

Use the same stable grid dimensions as the playable crossword:

```tsx
<Box
  data-test="crossword_history__grid"
  sx={{
    display: 'grid',
    gap: 0.5,
    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
    maxWidth: `min(100%, ${columns.length * 38}px)`,
    mx: 'auto',
    overflow: 'visible',
    pl: 2.75,
    pt: 2.75,
    width: '100%',
  }}
>
```

For each real cell, derive:

```ts
const value = snapshot.cellValues[key] ?? '';
const tone = getCrosswordCellTone(cell, correctness);
const incorrectEntries = getIncorrectCrosswordEntries(
  cell,
  snapshot.puzzle,
  correctness,
);
const shouldStrike = shouldStrikeAnswerCharacter({
  actual: value,
  expected: cell.solution,
  isIncorrect: tone === 'incorrect',
});
```

Render a static `Box component="span"` with the existing 38px cell styling and these result values:

```tsx
style={{
  backgroundColor:
    tone === 'correct'
      ? 'rgb(235, 247, 225)'
      : tone === 'incorrect'
        ? 'rgb(253, 235, 238)'
        : undefined,
  borderColor:
    tone === 'correct'
      ? '#8fc773'
      : tone === 'incorrect'
        ? '#f2a7b4'
        : undefined,
  textDecorationLine: shouldStrike ? 'line-through' : 'none',
  textDecorationThickness: '2px',
}}
```

Render clue numbers outside the starting cell at `left: -18`, `top: -18`, with the same localized white/dark tooltip structure used by `CrosswordExercise`.

When `incorrectEntries.length > 0`, wrap only the static cell in `CursorAnchoredTooltip` and render one line per incorrect entry:

```tsx
{incorrectEntries.map((entry) => (
  <Typography key={entry.cardId} sx={{ fontSize: 14, lineHeight: 1.35 }}>
    {t(interfaceLanguage, 'correctAnswer')}: {entry.answer}
  </Typography>
))}
```

Use `closeOnOtherOpen`, `leaveDelay={0}`, `transitionTimeout={0}`, a white light-theme surface, and the standard arrow.

- [ ] **Step 4: Verify the component test is GREEN**

Run:

```bash
npm test -- --run src/components/history/__tests__/CrosswordHistoryReplay.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Add failing HistoryView integration coverage**

Add a crossword `ExerciseAttempt` with `crosswordSnapshot` to `HistoryView.test.tsx`. Expand its accordion and assert:

```ts
expect(screen.getByTestId('crossword_history__grid')).toBeInTheDocument();
expect(
  screen.queryByTestId(
    'history_view__detail_row__attempt-crossword-1_card-cat',
  ),
).not.toBeInTheDocument();
```

Keep an additional legacy crossword attempt without `crosswordSnapshot` and assert its existing detail row still renders.

- [ ] **Step 6: Run HistoryView integration and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/HistoryView.test.tsx -t "crossword"
```

Expected: FAIL because `HistoryView` still renders one row per crossword prompt.

- [ ] **Step 7: Select snapshot replay in HistoryView**

In `AttemptHistoryCard`, locate the saved crossword attempt:

```ts
const crosswordAttempt = attempt.attempts.find(
  (savedAttempt) =>
    savedAttempt.exerciseType === 'crossword' &&
    Boolean(savedAttempt.crosswordSnapshot),
);
```

Inside `AccordionDetails`, render:

```tsx
{crosswordAttempt?.crosswordSnapshot ? (
  <CrosswordHistoryReplay
    correctness={crosswordAttempt.correctness}
    interfaceLanguage={interfaceLanguage}
    snapshot={crosswordAttempt.crosswordSnapshot}
  />
) : (
  <Stack
    data-test={`history_view__attempt_detail_rows__${attemptDomKey}`}
    spacing={1.25}
  >
    <Typography
      data-test={`history_view__attempt_details_label__${attemptDomKey}`}
      variant="overline"
    >
      {t(interfaceLanguage, 'exerciseDetails')}
    </Typography>
    {detailRows.map((row) => {
      const rowDomKey = toDomKey(row.id);

      return (
        <Box
          data-test={`history_view__detail_row__${rowDomKey}`}
          key={row.id}
          sx={{
            border: '1px solid rgba(32, 48, 21, 0.12)',
            borderRadius: 1,
            p: 1.25,
          }}
        >
          <Stack
            data-test={`history_view__detail_row_content__${rowDomKey}`}
            spacing={0.75}
          >
            <Typography
              color="text.secondary"
              data-test={`history_view__detail_prompt__${rowDomKey}`}
              variant="body2"
            >
              {row.prompt}
            </Typography>
            <HistoryAnswer
              answer={row.answer}
              dataTestPrefix={`history_view__detail_answer__${rowDomKey}`}
              expectedAnswer={row.expectedAnswer}
              interfaceLanguage={interfaceLanguage}
              isCorrect={row.isCorrect}
              options={row.options}
              recentResults={row.recentResults}
              type={row.exerciseType}
            />
          </Stack>
        </Box>
      );
    })}
  </Stack>
)}
```

This keeps legacy detail rendering behavior and `data-test` names unchanged.

- [ ] **Step 8: Verify Task 3**

Run:

```bash
npm test -- --run src/components/history/__tests__/CrosswordHistoryReplay.test.tsx src/components/__tests__/HistoryView.test.tsx src/__tests__/App.navigation.test.tsx
npm run lint
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 9: Commit Task 3**

```bash
git add src/components/history/CrosswordHistoryReplay.tsx src/components/history/__tests__/CrosswordHistoryReplay.test.tsx src/components/HistoryView.tsx src/components/__tests__/HistoryView.test.tsx
git commit -m "Replay crosswords in statistics" -m "Render saved crossword snapshots as their original read-only grid with clue numbers, clue tooltips, unanswered cells, word result colors, character-level strike-through feedback, and correct-answer tooltips. Preserve legacy per-row rendering for older attempts without snapshots."
```

---

### Task 4: Trigger Recent Answer History From A Dedicated Chip

**Files:**
- Create: `src/components/history/RecentAnswersChip.tsx`
- Modify: `src/components/HistoryView.tsx:243-526`
- Modify: `src/domain/i18n.ts`
- Test: `src/components/__tests__/HistoryView.test.tsx:23-148,266-318`

**Interfaces:**
- Produces: `RecentCardResult` type with `isCorrect` and `occurredAt`.
- Produces: `RecentAnswersChip({ dataTestPrefix, interfaceLanguage, recentResults, subject })`.
- Consumes: `CursorAnchoredTooltip`, existing date formatting behavior, and existing localized metric labels.

- [ ] **Step 1: Add the localized chip label**

Add `recentAnswerStatsChip` to the i18n key union and translations:

```ts
recentAnswerStatsChip: 'Recent answer statistics',
```

```ts
recentAnswerStatsChip: 'Статистика последних ответов',
```

```ts
recentAnswerStatsChip: 'Estadísticas de respuestas recientes',
```

- [ ] **Step 2: Rewrite HistoryView tests to express the desired trigger**

In the existing word-answer test:

```ts
await user.hover(
  within(missingLettersCard!).getByLabelText('Правильный ответ: airport'),
);
expect(
  screen.queryByTestId(
    'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
  ),
).not.toBeInTheDocument();

const recentStatsChip = within(correctAirportRow).getByTestId(
  'history_view__detail_answer__attempt-missing-1_card-airport__recent_stats_chip',
);
expect(recentStatsChip).toHaveTextContent('Статистика последних ответов');
expect(recentStatsChip).toHaveStyle({ cursor: 'pointer' });
await user.hover(recentStatsChip);
expect(
  await screen.findByTestId(
    'history_view__detail_answer__attempt-missing-1_card-airport__recent_tooltip',
  ),
).toBeInTheDocument();
```

Add the same chip assertion to the multiple-choice history row so every non-crossword game is covered.

- [ ] **Step 3: Run the HistoryView tests and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/HistoryView.test.tsx
```

Expected: FAIL because answer cells still trigger the tooltip and no chip exists.

- [ ] **Step 4: Extract the recent-answer chip**

Create `src/components/history/RecentAnswersChip.tsx` with this public contract:

```ts
export type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

export function RecentAnswersChip({
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  subject,
}: {
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: RecentCardResult[];
  subject: string;
})
```

Move the current tooltip title, subject, ten-row result list, chip colors, date formatting, arrow, close behavior, and `recentAnswersTooltipStyles` into this component. The only trigger must be:

```tsx
<Chip
  data-test={`${dataTestPrefix}__recent_stats_chip`}
  label={t(interfaceLanguage, 'recentAnswerStatsChip')}
  size="small"
  variant="outlined"
  sx={{
    alignSelf: 'flex-start',
    bgcolor: 'rgba(123, 95, 196, 0.06)',
    borderColor: 'rgba(123, 95, 196, 0.34)',
    color: '#4b3a70',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    height: 28,
  }}
/>
```

- [ ] **Step 5: Remove answer wrappers and place the chip below content**

In `HistoryAnswer`, build `answerContent` for both multiple choice and cell answers, then return:

```tsx
<Stack data-test={`${dataTestPrefix}__content`} spacing={0.9}>
  {answerContent}
  <RecentAnswersChip
    dataTestPrefix={dataTestPrefix}
    interfaceLanguage={interfaceLanguage}
    recentResults={recentResults}
    subject={expectedAnswer}
  />
</Stack>
```

Delete the internal `RecentAnswersTooltip`, `RecentCardResult`, recent tooltip styles, and date formatter from `HistoryView` after imports use the extracted component. Keep `getRecentCardResults` but return the imported `RecentCardResult` type.

- [ ] **Step 6: Verify Task 4**

Run:

```bash
npm test -- --run src/components/__tests__/HistoryView.test.tsx src/components/history/__tests__/CrosswordHistoryReplay.test.tsx
npm run lint
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/components/history/RecentAnswersChip.tsx src/components/HistoryView.tsx src/components/__tests__/HistoryView.test.tsx src/domain/i18n.ts
git commit -m "Add recent answer statistics chips" -m "Move the ten-answer history tooltip behind a localized pointer chip at the bottom of every non-crossword detail row. Stop answer cells, options, prompt text, and row whitespace from opening the tooltip while preserving its fixed interactive behavior."
```

---

### Task 5: Keep Assistant Tooltips In View And Normalize Shortcut Cursors

**Files:**
- Modify: `src/components/CursorAnchoredTooltip.tsx:18-319`
- Modify: `src/components/CoachPanel.tsx:1-225`
- Modify: `src/App.tsx:2148-2248`
- Test: `src/components/__tests__/CursorAnchoredTooltip.test.tsx`
- Create: `src/components/__tests__/CoachPanel.test.tsx`
- Test: `src/__tests__/App.navigation.test.tsx:1013-1044`

**Interfaces:**
- Produces: `TooltipAnchorOrigin` option `triggerCenterRight`.
- Preserves: pointer-independent anchor position after tooltip opening.
- Preserves: wide assistant tooltip placement `left`.
- Adds: narrow assistant tooltip placement `right` at the existing `md` responsive boundary.

- [ ] **Step 1: Add a failing right-anchor unit test**

Append to `CursorAnchoredTooltip.test.tsx`:

```ts
it('anchors to the trigger center-right without following mouse movement', () => {
  render(
    <CursorAnchoredTooltip
      anchorOrigin="triggerCenterRight"
      arrowDataTest="right-anchor-arrow"
      placement="right"
      title={<TooltipContent sx={{ bgcolor: '#ffffff', p: 1 }}>Profile</TooltipContent>}
      tooltipSx={{ bgcolor: '#ffffff' }}
    >
      <button type="button">Character</button>
    </CursorAnchoredTooltip>,
  );

  const trigger = screen.getByRole('button', { name: 'Character' });
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
    bottom: 220,
    height: 120,
    left: 40,
    right: 160,
    top: 100,
    width: 120,
    x: 40,
    y: 100,
    toJSON: () => undefined,
  });

  fireEvent.mouseOver(trigger, { clientX: 70, clientY: 140 });
  expect(trigger).toHaveAttribute('data-anchor-x', '160');
  expect(trigger).toHaveAttribute('data-anchor-y', '160');

  fireEvent.mouseMove(trigger, { clientX: 130, clientY: 200 });
  expect(trigger).toHaveAttribute('data-anchor-x', '160');
  expect(trigger).toHaveAttribute('data-anchor-y', '160');
});
```

- [ ] **Step 2: Run the cursor tooltip test and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/CursorAnchoredTooltip.test.tsx -t "center-right"
```

Expected: FAIL because `triggerCenterRight` is not a supported anchor origin.

- [ ] **Step 3: Implement `triggerCenterRight`**

Extend the union:

```ts
type TooltipAnchorOrigin =
  | 'pointer'
  | 'triggerCenterLeft'
  | 'triggerCenterRight'
  | 'triggerTopLeft';
```

Extend `getAnchorPosition` before the pointer fallback:

```ts
if (anchorOrigin === 'triggerCenterRight') {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: rect.right, y: rect.top + rect.height / 2 };
}
```

- [ ] **Step 4: Add failing responsive CoachPanel coverage**

Create `src/components/__tests__/CoachPanel.test.tsx`. Configure a minimal Redux store and a controllable `matchMedia` mock:

```ts
function setNarrowViewport(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: '(max-width:899.95px)',
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}
```

Render once with `false` and once with `true`. Hover the assistant wrapper and assert the newest tooltip popper placement:

```ts
expect(
  screen.getByRole('tooltip').closest('[data-popper-placement]'),
).toHaveAttribute('data-popper-placement', expect.stringMatching(/^left/));
```

For narrow:

```ts
expect(
  screen.getByRole('tooltip').closest('[data-popper-placement]'),
).toHaveAttribute('data-popper-placement', expect.stringMatching(/^right/));
expect(
  screen.getByTestId('coach_panel__assistant_sticker_wrapper__studyTroll'),
).toHaveAttribute('data-anchor-x', '160');
```

Mock the wrapper bounds to `left: 40`, `right: 160`, `top: 100`, `height: 120` before hover.

- [ ] **Step 5: Run CoachPanel coverage and verify RED**

Run:

```bash
npm test -- --run src/components/__tests__/CoachPanel.test.tsx
```

Expected: FAIL because the assistant always uses left placement and center-left anchoring.

- [ ] **Step 6: Make assistant placement responsive and stable**

In `CoachPanel.tsx`, import and use MUI responsive helpers:

```ts
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
```

Inside the component:

```ts
const theme = useTheme();
const isNarrowAssistantLayout = useMediaQuery(theme.breakpoints.down('md'));
const assistantTooltipPlacement = isNarrowAssistantLayout ? 'right' : 'left';
```

Change these props on the existing assistant `CursorAnchoredTooltip`; keep its
current title content and child sticker unchanged:

```tsx
anchorOrigin={
  isNarrowAssistantLayout ? 'triggerCenterRight' : 'triggerCenterLeft'
}
placement={assistantTooltipPlacement}
preventOverflow
tooltipSx={getAssistantTooltipStyles(isNarrowAssistantLayout)}
```

Replace `assistantTooltipStyles` with this function so all current visual values
remain intact and only the thought-bubble side changes:

```ts
function getAssistantTooltipStyles(isNarrow: boolean) {
  return {
    background:
      'linear-gradient(135deg, #fffaf0 0%, #fff7c7 48%, #f4edff 100%)',
    border: '1px solid rgba(123, 95, 196, 0.24)',
    borderRadius: '24px 18px 24px 10px',
    boxShadow:
      '0 14px 30px rgba(73, 48, 124, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.58)',
    color: '#4b3a70',
    maxWidth: 320,
    overflow: 'visible',
    position: 'relative',
    px: 1.75,
    py: 1.35,
    '&::before': {
      bgcolor: '#ffe27a',
      border: '1px solid rgba(123, 95, 196, 0.18)',
      borderRadius: '999px',
      boxShadow: '0 5px 12px rgba(73, 48, 124, 0.10)',
      content: '""',
      height: 10,
      left: isNarrow ? -9 : 'auto',
      position: 'absolute',
      right: isNarrow ? 'auto' : -9,
      top: 'calc(50% - 2px)',
      width: 10,
    },
    '&::after': {
      bgcolor: '#b99cff',
      border: '1px solid rgba(123, 95, 196, 0.14)',
      borderRadius: '999px',
      boxShadow: '0 4px 10px rgba(73, 48, 124, 0.08)',
      content: '""',
      height: 7,
      left: isNarrow ? -18 : 'auto',
      position: 'absolute',
      right: isNarrow ? 'auto' : -18,
      top: 'calc(50% + 10px)',
      width: 7,
    },
  };
}
```

The anchor remains fixed because `CursorAnchoredTooltip.openAtPointer` stores the trigger-bound coordinate only on first open and ignores later mouse movement.

- [ ] **Step 7: Add and implement the command-key cursor assertion**

In `App.navigation.test.tsx`, extend the existing hotkey test:

```ts
expect(
  screen.getByTestId('exercise_finish_action__hotkeys_anchor'),
).toHaveStyle({ cursor: 'default' });
expect(
  screen.getByTestId('exercise_finish_action__hotkeys_key'),
).toHaveStyle({ cursor: 'default' });
```

Run the focused test and observe RED:

```bash
npm test -- --run src/__tests__/App.navigation.test.tsx -t "command or control arrows"
```

Add `cursor: 'default'` to both `exercise_finish_action__hotkeys_anchor` and `exercise_finish_action__hotkeys_key` style objects in `App.tsx`.

- [ ] **Step 8: Verify Task 5**

Run:

```bash
npm test -- --run src/components/__tests__/CursorAnchoredTooltip.test.tsx src/components/__tests__/CoachPanel.test.tsx src/__tests__/App.navigation.test.tsx
npm run lint
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 9: Commit Task 5**

```bash
git add src/components/CursorAnchoredTooltip.tsx src/components/CoachPanel.tsx src/components/__tests__/CursorAnchoredTooltip.test.tsx src/components/__tests__/CoachPanel.test.tsx src/App.tsx src/__tests__/App.navigation.test.tsx
git commit -m "Keep exercise tooltips within view" -m "Add stable trigger center-right anchoring and use it for assistant profiles on narrow layouts while preserving fixed left placement on wide screens. Move decorative thought bubbles toward the character and use the normal arrow cursor over the 3D command-key shortcut."
```

---

### Task 6: Full Regression And Visual Verification

**Files:**
- Modify only if intended screenshots changed: `e2e/*.spec.ts-snapshots/*`
- Modify: `AGENT_HISTORY.md`

**Interfaces:**
- Consumes: all completed tasks.
- Produces: verified desktop and narrow-screen behavior with a clean worktree.

- [ ] **Step 1: Run the full unit and component suite**

Run:

```bash
npm test -- --run
```

Expected: all test files and tests PASS with zero failures.

- [ ] **Step 2: Run TypeScript and production build checks**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit 0; Vite writes a production build without TypeScript errors.

- [ ] **Step 3: Run Playwright regression coverage**

Run:

```bash
npm run test:e2e
```

Expected: all Playwright tests PASS. If a golden screenshot differs, inspect it before updating. Update only screenshots whose intended exercise/history UI changed.

- [ ] **Step 4: Verify the UI at desktop and narrow widths**

Start or reuse the dev server:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Using the in-app browser, verify at a desktop viewport and a viewport below 900px:

- submit wrong letters in Missing Letters and Missing Word and confirm only wrong typed characters are struck;
- submit an incorrect crossword and confirm word backgrounds and character strikes;
- open Statistics and confirm a saved crossword preserves its original grid, clues, empty cells, and correction tooltip;
- confirm non-crossword answer blocks do not open recent history and the chip does;
- confirm the assistant tooltip is fixed left on desktop and fixed right on narrow screens without viewport clipping;
- confirm the command-key icon uses the normal cursor and retains its tooltip.

- [ ] **Step 5: Check repository integrity**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Status contains only intentional implementation, screenshot, and `AGENT_HISTORY.md` changes.

- [ ] **Step 6: Refresh project history and create the verification commit if needed**

Append the current user and assistant messages to `AGENT_HISTORY.md` with timestamps sourced from the local Codex JSONL transcript and the required three-line dividers.

If Task 6 changed snapshots or history after Task 5, commit them:

```bash
git add AGENT_HISTORY.md e2e
git commit -m "Verify exercise feedback flows" -m "Record the completed implementation conversation and, when required by intentional UI changes, refresh reviewed Playwright golden screenshots after full unit, TypeScript, build, and browser verification."
```

If no screenshot changed, stage only `AGENT_HISTORY.md` in that command.

---

## Completion Checklist

- [ ] Every incorrect editable letter is struck only after an incorrect submission.
- [ ] Fixed letters, correct-answer rows, punctuation, and memorize results are never struck.
- [ ] New crossword attempts persist the complete puzzle and all cell values.
- [ ] Partial crossword cells do not affect card totals.
- [ ] Crossword history restores the original full grid, clue numbers, and clue tooltips.
- [ ] Unanswered crossword cells remain empty and neutral in history.
- [ ] Incorrect crossword words expose their correct answer on hover.
- [ ] Old crossword attempts without snapshots still render legacy detail rows.
- [ ] Recent-answer history opens only from the dedicated localized chip in non-crossword details.
- [ ] Assistant tooltips use stable left/right anchors according to viewport width.
- [ ] The command-key tooltip trigger uses the normal cursor.
- [ ] Full Vitest, TypeScript, production build, Playwright, and visual checks pass.
