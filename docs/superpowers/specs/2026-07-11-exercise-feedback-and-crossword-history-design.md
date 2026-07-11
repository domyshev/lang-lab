# Exercise Feedback And Crossword History Design

## Purpose

This change makes answer feedback consistent across the playable exercises and
turns crossword history into a faithful replay of the submitted puzzle. It also
narrows recent-answer tooltips to an explicit control and keeps assistant
tooltips usable on narrow screens.

The design covers:

- per-character error decoration in Missing Letters, Missing Word, and
  Crossword;
- complete crossword layout snapshots in exercise history;
- a dedicated recent-answer statistics chip for non-crossword history rows;
- responsive, position-stable assistant tooltips;
- a non-text-selection cursor over the command-key shortcut icon.

## Design Decisions

### Character-Level Error Feedback

The submitted answer remains the source of truth for result feedback. After a
submission:

- a correct answer keeps the existing green cell treatment;
- an incorrect answer keeps the existing pink cell treatment;
- only entered characters that differ from the expected character receive a
  line-through decoration;
- fixed characters supplied by the exercise are never struck through;
- the separately rendered correct answer always uses strong, undecorated text;
- a memorize result remains yellow and does not receive incorrect-character
  decoration.

Character comparison is case-insensitive and should use one shared helper so
the playable exercises and history apply the same rule.

For crossword intersections, the existing word-level background precedence is
preserved: if any submitted word crossing a cell is incorrect, the cell is
pink. The character itself is struck through only when the entered character
does not match the cell solution. A correctly entered intersection character
therefore remains readable even if another character makes one crossing word
incorrect.

## Crossword Attempt Snapshot

`ExerciseAttempt` gains an optional crossword snapshot:

```ts
interface CrosswordAttemptSnapshot {
  puzzle: CrosswordPuzzle;
  cellValues: Record<string, string>;
}
```

The snapshot is optional for backward compatibility. Existing attempts without
it continue to use the legacy detail-row presentation.

The snapshot stores the complete original puzzle, not only answered entries.
`CrosswordPuzzle` already contains all required immutable layout data:

- puzzle mode;
- entries with card id, answer, clue, row, column, and direction;
- cells with solution characters and crossing entry ids;
- grid bounds.

`cellValues` stores every value visible when the user submits or finishes the
crossword, including partial words. `CrosswordDraftState` will expose these cell
values so both normal submission and finish-session persistence can save the
same complete snapshot.

The existing `answers` and `correctness` fields remain unchanged and continue
to contain only fully answered words. They remain the source for aggregate
statistics. Partial and empty words are visual history only and do not affect
totals.

## Crossword History Replay

When a crossword attempt contains a snapshot, its expanded history details
render one static crossword grid instead of separate answer rows.

The replay preserves:

- the original rows, columns, intersections, and empty grid spaces;
- clue numbers anchored outside the top-left corner of their starting cells;
- the existing clue tooltip with a localized `Question` heading and clue text;
- empty values for cells that were not filled;
- neutral styling for unanswered words;
- green styling for fully answered correct words;
- pink styling for fully answered incorrect words;
- line-through decoration only on incorrect entered characters.

Hovering any cell belonging to an incorrect answered word shows the correct
answer. If an intersection belongs to two incorrect words, the tooltip lists
both correct answers with enough direction or clue context to distinguish them.
Unanswered and correct words do not show this correction tooltip.

The history replay is read-only and uses stable dimensions derived from the
saved bounds. It does not regenerate the crossword from cards or prompts.

## Recent Answer Statistics Control

For Missing Letters, Missing Word, and Multiple Choice history rows, the answer
display is no longer the tooltip trigger.

Each detail row gets a compact localized chip at the bottom:

- English: `Recent answer statistics`;
- Russian: `Статистика последних ответов`;
- Spanish: `Estadisticas de respuestas recientes`.

The chip uses a pointer cursor and the existing light/dark recent-answer
tooltip. Only hovering the chip opens the tooltip. Hovering answer cells,
options, prompt text, or empty space in the detail row does nothing.

The tooltip keeps the current content and behavior:

- localized title;
- card word or phrase;
- up to ten newest correct/incorrect records with timestamps;
- fixed initial position;
- interactive hover bridge;
- immediate closing when another shared tooltip opens.

Crossword replay does not use this chip. Its incorrect-word tooltip serves a
different purpose: revealing the correct answer for the saved grid.

## Responsive Assistant Tooltip

The assistant tooltip remains anchored to a stable point on the character, not
to the current mouse coordinates.

- On wide screens it opens to the left of the character, as it does now.
- On narrow screens it opens to the right to avoid clipping against the
  viewport edge.
- The decorative yellow and purple thought bubbles move to the side nearest the
  character.

`CursorAnchoredTooltip` gains a `triggerCenterRight` anchor origin so the narrow
layout can use the character's vertical center and right edge without following
mouse movement. The breakpoint follows the application's existing responsive
layout boundary.

## Command-Key Cursor

The command-key shortcut tooltip behavior and visual design remain unchanged.
Its trigger and rendered key use the normal arrow cursor so the command symbol
cannot imply text selection.

## Data Flow

1. The crossword generator creates a `CrosswordPuzzle`.
2. `CrosswordExercise` maintains `cellValues` and reports them through its draft
   state.
3. Submit or finish persistence stores the existing answered-word records plus
   `{ puzzle, cellValues }` as `crosswordSnapshot`.
4. Statistics grouping remains based on the existing attempt/session fields.
5. `HistoryView` detects a crossword snapshot and delegates to a static replay
   renderer.
6. Legacy crossword attempts without snapshots use existing per-prompt rows.

## Component Boundaries

The implementation should introduce focused reusable units:

- a small character-comparison helper shared by cells;
- a static crossword history renderer that accepts a snapshot and correctness;
- a recent-answer tooltip trigger chip used by all non-crossword history rows;
- responsive anchor selection inside `CoachPanel`, with the generic anchor
  calculation remaining in `CursorAnchoredTooltip`.

The playable crossword remains responsible for editing and focus movement. The
history crossword is a separate read-only renderer rather than an editable
component with disabled inputs.

## Testing

Component tests must cover:

- Missing Letters strikes only an incorrectly entered editable character;
- Missing Word strikes only incorrectly entered editable characters and leaves
  fixed punctuation and the correct-answer row undecorated;
- Crossword strikes a wrong cell character after submission while preserving
  the existing word-level background colors;
- a saved crossword snapshot renders the original complete grid, including
  unanswered cells, clue numbers, clue tooltips, intersections, result colors,
  and correction tooltips;
- legacy crossword history still renders without a snapshot;
- non-crossword history opens recent answers only from the dedicated chip;
- the chip uses a pointer cursor;
- the assistant tooltip uses stable left anchoring on wide screens and stable
  right anchoring on narrow screens;
- `triggerCenterRight` uses the trigger bounds rather than mouse coordinates;
- the command-key trigger uses the normal cursor.

After unit and component tests, run the full Vitest suite, TypeScript lint/build
checks, and Playwright visual checks at representative desktop and mobile
viewports. Existing golden screenshots should be reviewed and updated only when
the intended UI changes affect them.

## Out Of Scope

- Reconstructing exact layouts for legacy crossword attempts.
- Changing exercise scoring or card statistics.
- Changing crossword generation rules.
- Adding recent-answer statistics to the crossword correction tooltip.
- Changing assistant content or shortcut behavior.
