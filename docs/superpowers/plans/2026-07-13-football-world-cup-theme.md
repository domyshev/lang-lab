# Football World Cup Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved World Cup 2026 football theme across game tiles, character selection, card-set library palettes, utility accents, chat tab icon, and answer result colors.

**Architecture:** Add a small football theme domain module that owns country palettes, game-country mapping, stadium-blue accent tokens, and semantic result colors. UI components consume those tokens instead of hard-coded purple/Spain-only values, while assistant ids stay persisted-compatible.

**Tech Stack:** React, TypeScript, MUI, Redux Persist, Vitest, Testing Library, inline SVG/DOM art.

## Global Constraints

- `TASK_REQUIREMENTS.md` must never be changed.
- Documentation committed to the project must be in English.
- Keep Spain as the main app identity in the header.
- Replace visible purple as a primary/secondary accent with stadium blue.
- Use football-grass green for correct states and Spain red for incorrect states.
- Use custom SVG/DOM art only; do not add official FIFA, federation, club, or player likeness assets.
- Preserve existing persisted assistant ids by keeping `AssistantId` compatible.
- Store no derived palette assignment in Redux; derive it deterministically from card-set id.

---

## File Structure

- Create `src/domain/footballTheme.ts`: football-country palettes, game tile themes, stadium-blue tokens, result colors, and deterministic card-set palette assignment.
- Create `src/domain/__tests__/footballTheme.test.ts`: domain coverage for mappings, palette count, deterministic assignment, and semantic result colors.
- Modify `src/components/ExercisePicker.tsx`: consume `gameTileThemes`, expose country metadata, and render football-specific tile art.
- Modify `src/__tests__/App.navigation.test.tsx`: assert game tile country metadata and visible disabled tooltip copy.
- Modify `src/domain/assistants.ts`: keep `AssistantId`, expose four visible football-country profiles, map legacy hidden id safely.
- Modify `src/domain/coachThoughts.ts`: keep thoughts for the four visible profiles and make hidden legacy ids resolve through `resolveAssistantId`.
- Modify `src/components/assistantAssets.tsx`: keep the asset map compatible with hidden ids while visible selection uses four profiles.
- Modify `src/components/LanguageSelectors.tsx`: render only visible assistant profiles.
- Modify assistant tests in `src/domain/__tests__/assistants.test.ts`, `src/domain/__tests__/coachThoughts.test.ts`, `src/components/__tests__/LanguageSelectors.test.tsx`, and `src/__tests__/App.navigation.test.tsx`.
- Modify `src/components/CardSetLibraryPicker.tsx`: consume deterministic football palettes and stadium-blue accents.
- Modify `src/components/__tests__/CardSetLibraryPicker.test.tsx`: assert palette stability and no old purple accent.
- Modify `src/components/AppShell.tsx`: active tab readable color and football-AI chat icon.
- Modify `src/components/__tests__/AppShell.test.tsx`: assert readable active tab and new chat icon.
- Modify result-color surfaces that currently hard-code old green/pink values. Likely files include `src/components/AnswerTiles.tsx`, `src/components/ResultFormula.tsx`, `src/components/RecentStatsChip.tsx`, `src/components/exercises/MissingLettersExercise.tsx`, `src/components/exercises/MissingWordExercise.tsx`, `src/components/exercises/MultipleChoiceExercise.tsx`, `src/components/exercises/CrosswordExercise.tsx`, and crossword/history replay helpers. Confirm exact files with `rg "#e|#f|correct|incorrect|pink|green|rose|success" src/components src/domain`.
- Update tests that assert old success/error colors.
- Modify `AGENT_HISTORY.md` with each new user and assistant message.

---

### Task 1: Football Theme Tokens And Palette Assignment

**Files:**
- Create: `src/domain/footballTheme.ts`
- Create: `src/domain/__tests__/footballTheme.test.ts`

**Interfaces:**
- Produces:
  - `stadiumAccent: { main: string; light: string; border: string; dark: string }`
  - `footballResultColors: { correct: { main: string; soft: string; border: string; text: string }; incorrect: { main: string; soft: string; border: string; text: string } }`
  - `footballCountryPalettes: FootballCountryPalette[]`
  - `getFootballPaletteForCardSet(cardSetId: string, options?: { isAllCards?: boolean }): FootballCountryPalette`
  - `gameTileThemes: Record<ExerciseType, FootballGameTileTheme>`
  - `visibleAssistantIds: AssistantId[]`

- [ ] **Step 1: Write the failing domain tests**

Add `src/domain/__tests__/footballTheme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  footballCountryPalettes,
  footballResultColors,
  gameTileThemes,
  getFootballPaletteForCardSet,
  stadiumAccent,
} from '../footballTheme';

describe('footballTheme', () => {
  it('maps each game to a distinct football country theme', () => {
    expect(gameTileThemes.crossword.countryKey).toBe('spain');
    expect(gameTileThemes.multipleChoice.countryKey).toBe('portugal');
    expect(gameTileThemes.missingLetters.countryKey).toBe('england');
    expect(gameTileThemes.missingWord.countryKey).toBe('germany');
  });

  it('provides at least thirty football country palettes', () => {
    expect(footballCountryPalettes.length).toBeGreaterThanOrEqual(30);
    expect(footballCountryPalettes.map((palette) => palette.countryKey)).toEqual(
      expect.arrayContaining(['spain', 'portugal', 'england', 'germany', 'brazil', 'argentina']),
    );
  });

  it('assigns stable football palettes to card sets', () => {
    const first = getFootballPaletteForCardSet('love-set');
    const second = getFootballPaletteForCardSet('love-set');
    const different = getFootballPaletteForCardSet('family-set');

    expect(first.countryKey).toBe(second.countryKey);
    expect(first.gradient).toBe(second.gradient);
    expect(different.countryKey).not.toBe('');
  });

  it('keeps all cards on the Spain World Cup palette', () => {
    expect(
      getFootballPaletteForCardSet('all-cards', { isAllCards: true }).countryKey,
    ).toBe('spain');
  });

  it('uses stadium blue instead of the old purple accent', () => {
    expect(stadiumAccent.main).toBe('#1877c9');
    expect(stadiumAccent.dark).toBe('#123c69');
  });

  it('uses football grass and Spain red for result states', () => {
    expect(footballResultColors.correct.main).toBe('#2f8f3a');
    expect(footballResultColors.incorrect.main).toBe('#c60b1e');
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm test -- src/domain/__tests__/footballTheme.test.ts --reporter=dot
```

Expected: FAIL because `src/domain/footballTheme.ts` does not exist.

- [ ] **Step 3: Implement the domain module**

Create `src/domain/footballTheme.ts`:

```ts
import type { ExerciseType } from './exercises';

export type FootballCountryPalette = {
  accent: string;
  border: string;
  countryKey: string;
  foreground: string;
  gradient: string;
  label: string;
  soft: string;
};

export type FootballGameTileTheme = FootballCountryPalette & {
  art: 'goal' | 'ball' | 'worldCup2026' | 'goalkeeper';
};

export const stadiumAccent = {
  border: '#8fc8f2',
  dark: '#123c69',
  light: '#e8f5ff',
  main: '#1877c9',
};

export const footballResultColors = {
  correct: {
    border: '#7fc77a',
    main: '#2f8f3a',
    soft: '#e8f7df',
    text: '#173f1f',
  },
  incorrect: {
    border: '#f39aa4',
    main: '#c60b1e',
    soft: '#fde8df',
    text: '#5a1118',
  },
};

export const footballCountryPalettes: FootballCountryPalette[] = [
  makePalette('spain', 'Spain', '#c60b1e', '#ffc400', '#7c1518', '#203015'),
  makePalette('portugal', 'Portugal', '#006b3f', '#c8102e', '#ffcc33', '#ffffff'),
  makePalette('england', 'England', '#ffffff', '#cf142b', '#1f4fa3', '#1f2937'),
  makePalette('germany', 'Germany', '#111111', '#dd0000', '#ffce00', '#fff8d6'),
  makePalette('brazil', 'Brazil', '#009b3a', '#ffdf00', '#002776', '#073b1a'),
  makePalette('argentina', 'Argentina', '#75aadb', '#ffffff', '#f6b40e', '#123c69'),
  makePalette('france', 'France', '#0055a4', '#ffffff', '#ef4135', '#10243d'),
  makePalette('italy', 'Italy', '#009246', '#ffffff', '#ce2b37', '#16351f'),
  makePalette('netherlands', 'Netherlands', '#ae1c28', '#ffffff', '#21468b', '#17233f'),
  makePalette('uruguay', 'Uruguay', '#6bc6e8', '#ffffff', '#fcd116', '#15364d'),
  makePalette('croatia', 'Croatia', '#f00000', '#ffffff', '#171796', '#261515'),
  makePalette('japan', 'Japan', '#ffffff', '#bc002d', '#f3f4f6', '#2f1b1f'),
  makePalette('morocco', 'Morocco', '#c1272d', '#006233', '#f4d35e', '#fff7df'),
  makePalette('mexico', 'Mexico', '#006847', '#ffffff', '#ce1126', '#173d2d'),
  makePalette('usa', 'USA', '#3c3b6e', '#ffffff', '#b22234', '#15152f'),
  makePalette('belgium', 'Belgium', '#000000', '#fae042', '#ed2939', '#fff4ba'),
  makePalette('denmark', 'Denmark', '#c60c30', '#ffffff', '#f6d3d9', '#2a1014'),
  makePalette('sweden', 'Sweden', '#006aa7', '#fecc00', '#70b7df', '#102f45'),
  makePalette('switzerland', 'Switzerland', '#d52b1e', '#ffffff', '#f4c6c1', '#351512'),
  makePalette('poland', 'Poland', '#ffffff', '#dc143c', '#ffd7df', '#2f1720'),
  makePalette('senegal', 'Senegal', '#00853f', '#fdef42', '#e31b23', '#173b20'),
  makePalette('ghana', 'Ghana', '#ce1126', '#fcd116', '#006b3f', '#1c2419'),
  makePalette('nigeria', 'Nigeria', '#008751', '#ffffff', '#9be7c2', '#113522'),
  makePalette('south-korea', 'South Korea', '#ffffff', '#c60c30', '#003478', '#15233c'),
  makePalette('australia', 'Australia', '#012169', '#ffcd00', '#00843d', '#ffffff'),
  makePalette('colombia', 'Colombia', '#fcd116', '#003893', '#ce1126', '#17233f'),
  makePalette('chile', 'Chile', '#0039a6', '#ffffff', '#d52b1e', '#17233f'),
  makePalette('serbia', 'Serbia', '#c6363c', '#0c4076', '#ffffff', '#fff3e0'),
  makePalette('scotland', 'Scotland', '#0065bd', '#ffffff', '#9ed0ff', '#102b44'),
  makePalette('wales', 'Wales', '#ffffff', '#d30731', '#00ad36', '#183a23'),
  makePalette('cameroon', 'Cameroon', '#007a5e', '#ce1126', '#fcd116', '#fff7d6'),
  makePalette('turkey', 'Turkey', '#e30a17', '#ffffff', '#f6b1b8', '#3b1115'),
];

export const gameTileThemes: Record<ExerciseType, FootballGameTileTheme> = {
  crossword: { ...footballCountryPalettes[0], art: 'goal' },
  multipleChoice: { ...footballCountryPalettes[1], art: 'ball' },
  missingLetters: { ...footballCountryPalettes[2], art: 'worldCup2026' },
  missingWord: { ...footballCountryPalettes[3], art: 'goalkeeper' },
};

export function getFootballPaletteForCardSet(
  cardSetId: string,
  options: { isAllCards?: boolean } = {},
): FootballCountryPalette {
  if (options.isAllCards) {
    return footballCountryPalettes[0];
  }
  const index = stableHash(cardSetId) % footballCountryPalettes.length;
  return footballCountryPalettes[index];
}

function makePalette(
  countryKey: string,
  label: string,
  primary: string,
  secondary: string,
  tertiary: string,
  foreground: string,
): FootballCountryPalette {
  return {
    accent: tertiary,
    border: primary,
    countryKey,
    foreground,
    gradient:
      `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.42) 0 15%, transparent 16%), ` +
      `linear-gradient(135deg, ${primary} 0%, ${secondary} 48%, ${tertiary} 100%)`,
    label,
    soft: secondary,
  };
}

function stableHash(value: string): number {
  return [...value].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 17);
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run:

```bash
npm test -- src/domain/__tests__/footballTheme.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/footballTheme.ts src/domain/__tests__/footballTheme.test.ts
git commit -m "Add football theme tokens" -m "Introduce shared football country palettes, stadium-blue accent tokens, semantic football result colors, and deterministic card-set palette assignment."
```

---

### Task 2: Country-Themed Game Tiles

**Files:**
- Modify: `src/components/ExercisePicker.tsx`
- Modify: `src/__tests__/App.navigation.test.tsx`

**Interfaces:**
- Consumes: `gameTileThemes` from `src/domain/footballTheme.ts`
- Produces: game tile DOM attributes `data-football-country` and art nodes for `goal`, `ball`, `worldCup2026`, `goalkeeper`

- [ ] **Step 1: Write the failing tile tests**

In `src/__tests__/App.navigation.test.tsx`, update the existing game tile visual test near the exercise picker assertions:

```ts
expect(screen.getByTestId('exercise_picker__option__crossword')).toHaveAttribute(
  'data-football-country',
  'spain',
);
expect(screen.getByTestId('exercise_picker__option__multipleChoice')).toHaveAttribute(
  'data-football-country',
  'portugal',
);
expect(screen.getByTestId('exercise_picker__option__missingLetters')).toHaveAttribute(
  'data-football-country',
  'england',
);
expect(screen.getByTestId('exercise_picker__option__missingWord')).toHaveAttribute(
  'data-football-country',
  'germany',
);
expect(screen.getByTestId('exercise_picker__art_goal__crossword')).toBeInTheDocument();
expect(screen.getByTestId('exercise_picker__art_ball__multipleChoice')).toBeInTheDocument();
expect(screen.getByTestId('exercise_picker__art_wc2026__missingLetters')).toHaveTextContent(
  'FIFA WC 2026',
);
expect(screen.getByTestId('exercise_picker__art_goalkeeper__missingWord')).toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/__tests__/App.navigation.test.tsx -t "renders the game setup" --reporter=dot
```

Expected: FAIL because the country attributes and new art test ids do not exist.

- [ ] **Step 3: Replace hard-coded tile themes**

In `src/components/ExercisePicker.tsx`:

```ts
import { gameTileThemes } from '../domain/footballTheme';
```

Replace the `accent` and `background` fields in `exerciseOptions` with only `type` and `labelKey`. Inside the map:

```ts
const theme = gameTileThemes[option.type];
const tileAccent = isDisabled ? disabledTileAccent : theme.accent;
const tileBackground = isDisabled ? disabledTileBackground : theme.gradient;
```

Add the attribute to `ToggleButton`:

```tsx
data-football-country={theme.countryKey}
```

Pass the art kind:

```tsx
<GameTileArt
  accent={tileAccent}
  art={theme.art}
  dataTest={`exercise_picker__option_art__${option.type}`}
  type={option.type}
/>
```

- [ ] **Step 4: Update `GameTileArt` to render the four requested football motifs**

Change the signature:

```ts
function GameTileArt({
  accent,
  art,
  dataTest,
  type,
}: {
  accent: string;
  art: FootballGameTileTheme['art'];
  dataTest: string;
  type: ExerciseType;
}) {
```

For `art === 'goal'`, add a goal element inside the crossword SVG:

```tsx
<g data-test={`exercise_picker__art_goal__${type}`} opacity="0.36">
  <rect x="154" y="34" width="62" height="42" rx="4" fill="none" stroke={accent} strokeWidth="5" />
  <path d="M166 34v42M178 34v42M190 34v42M202 34v42M154 48h62M154 62h62" stroke={accent} strokeWidth="1.8" />
</g>
```

For `art === 'ball'`, add a ball element inside the multiple-choice SVG:

```tsx
<g data-test={`exercise_picker__art_ball__${type}`} transform="translate(176 28)">
  <circle r="26" fill="#fffdf4" stroke={accent} strokeWidth="4" />
  <path d="M0-15 13-5 8 12H-8l-5-17Z" fill={accent} opacity="0.78" />
  <path d="M0-26v11M0 15v11M-25 0h12M13 0h12" stroke="#203015" strokeWidth="2" opacity="0.34" />
</g>
```

For `art === 'worldCup2026'`, add tournament text inside the missing-letters SVG:

```tsx
<text
  data-test={`exercise_picker__art_wc2026__${type}`}
  x="130"
  y="34"
  textAnchor="middle"
  fontSize="18"
  fontWeight="950"
  fill={accent}
>
  FIFA WC 2026
</text>
```

For `art === 'goalkeeper'`, add a goalkeeper silhouette inside the missing-word SVG:

```tsx
<g data-test={`exercise_picker__art_goalkeeper__${type}`} transform="translate(174 42)" opacity="0.72">
  <circle cx="0" cy="-18" r="10" fill={accent} />
  <path d="M-6-8 10 8 2 34 -16 28Z" fill={accent} />
  <path d="M-10-2 -38-20M8 0 34-18M-8 28 -28 48M2 34 24 48" stroke={accent} strokeWidth="8" strokeLinecap="round" />
</g>
```

- [ ] **Step 5: Run the test and verify it passes**

Run:

```bash
npm test -- src/__tests__/App.navigation.test.tsx -t "renders the game setup" --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExercisePicker.tsx src/__tests__/App.navigation.test.tsx
git commit -m "Theme game tiles by football country" -m "Use shared football country themes for the four game tiles and add goal, ball, World Cup 2026, and goalkeeper art motifs."
```

---

### Task 3: Four Visible Football Characters

**Files:**
- Modify: `src/domain/assistants.ts`
- Modify: `src/domain/coachThoughts.ts`
- Modify: `src/components/LanguageSelectors.tsx`
- Modify: `src/components/assistantAssets.tsx`
- Modify: `src/domain/__tests__/assistants.test.ts`
- Modify: `src/domain/__tests__/coachThoughts.test.ts`
- Modify: `src/components/__tests__/LanguageSelectors.test.tsx`
- Modify: `src/__tests__/App.navigation.test.tsx`

**Interfaces:**
- Produces: `visibleAssistantCharacters: AssistantCharacter[]`
- Produces: `visibleAssistantIds: AssistantId[]`
- Keeps: `AssistantId` union including the legacy `trollMama`

- [ ] **Step 1: Write failing assistant tests**

In `src/domain/__tests__/assistants.test.ts`, add:

```ts
import { visibleAssistantCharacters, visibleAssistantIds } from '../assistants';

it('exposes four visible football-country assistants', () => {
  expect(visibleAssistantIds).toEqual([
    'studyTroll',
    'greenPower',
    'webRunner',
    'capeChampion',
  ]);
  expect(visibleAssistantCharacters.map((assistant) => assistant.name.ru)).toEqual([
    'Испанский вингер',
    'Португальский бомбардир',
    'Английский капитан',
    'Немецкий сейвер',
  ]);
});

it('maps the hidden legacy assistant id to the default visible assistant', () => {
  expect(resolveAssistantId('trollMama')).toBe(defaultAssistantId);
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/domain/__tests__/assistants.test.ts --reporter=dot
```

Expected: FAIL because `visibleAssistantCharacters` and new names are not implemented.

- [ ] **Step 3: Implement four visible profiles**

In `src/domain/assistants.ts`:

```ts
const visibleAssistantIdList: AssistantId[] = [
  'studyTroll',
  'greenPower',
  'webRunner',
  'capeChampion',
];

export const visibleAssistantIds = visibleAssistantIdList;
export const visibleAssistantCharacters = assistantCharacters.filter((assistant) =>
  visibleAssistantIdList.includes(assistant.id),
);

export function resolveAssistantId(value: unknown): AssistantId {
  if (value === 'trollMama') {
    return defaultAssistantId;
  }
  return visibleAssistantIdList.some((assistantId) => assistantId === value)
    ? (value as AssistantId)
    : defaultAssistantId;
}
```

Change visible profile names to:

```ts
studyTroll.name.ru = 'Испанский вингер';
greenPower.name.ru = 'Португальский бомбардир';
webRunner.name.ru = 'Английский капитан';
capeChampion.name.ru = 'Немецкий сейвер';
```

Also update `en` and `es` names and all labels/mottos/superpowers to match those countries. Keep `trollMama` either absent from `assistantCharacters` or present only if `visibleAssistantCharacters` excludes it. If `assistantCharacters` excludes it, update `getAssistantProfile` to use `visibleAssistantCharacters`.

- [ ] **Step 4: Render only visible characters**

In `src/components/LanguageSelectors.tsx`, change the import and map:

```ts
import {
  AssistantId,
  defaultAssistantId,
  getAssistantTooltip,
  resolveAssistantId,
  visibleAssistantCharacters,
} from '../domain/assistants';
```

```tsx
{visibleAssistantCharacters.map((assistant) => (
  <MenuItem ...>
```

- [ ] **Step 5: Keep asset resolution safe**

In `src/components/assistantAssets.tsx`, keep `assistantImages` as `Record<AssistantId, string>` so a legacy value never breaks image lookup. Since `resolveAssistantId('trollMama')` returns the default, the hidden asset will not be displayed through normal state.

- [ ] **Step 6: Update thought tests and thought sources**

In `src/domain/coachThoughts.ts`, keep keys for all `AssistantId` values if the type requires it, but make hidden `trollMama` text irrelevant by resolving ids before lookup:

```ts
const assistantId = resolveAssistantId(value);
```

Update `src/domain/__tests__/coachThoughts.test.ts` so it expects match-tone phrases for visible characters and does not reference old fantasy phrases.

- [ ] **Step 7: Update UI tests**

In `src/components/__tests__/LanguageSelectors.test.tsx`, assert only four options:

```ts
expect(screen.getAllByTestId(/language_selectors__assistant_option__/)).toHaveLength(4);
expect(screen.getByLabelText(/Испанский вингер/)).toBeInTheDocument();
expect(screen.queryByLabelText(/Иньеста/)).not.toBeInTheDocument();
```

In `src/__tests__/App.navigation.test.tsx`, replace old assistant name expectations with `Испанский вингер`.

- [ ] **Step 8: Run assistant tests**

Run:

```bash
npm test -- src/domain/__tests__/assistants.test.ts src/domain/__tests__/coachThoughts.test.ts src/components/__tests__/LanguageSelectors.test.tsx src/__tests__/App.navigation.test.tsx -t "assistant|character|персонаж|tooltip" --reporter=dot
```

Expected: PASS for matching tests. If the `-t` pattern does not select all changed tests, run the full files:

```bash
npm test -- src/domain/__tests__/assistants.test.ts src/domain/__tests__/coachThoughts.test.ts src/components/__tests__/LanguageSelectors.test.tsx src/__tests__/App.navigation.test.tsx --reporter=dot
```

- [ ] **Step 9: Commit**

```bash
git add src/domain/assistants.ts src/domain/coachThoughts.ts src/components/LanguageSelectors.tsx src/components/assistantAssets.tsx src/domain/__tests__/assistants.test.ts src/domain/__tests__/coachThoughts.test.ts src/components/__tests__/LanguageSelectors.test.tsx src/__tests__/App.navigation.test.tsx
git commit -m "Show four football country assistants" -m "Expose four visible football-country assistant characters while preserving persisted assistant id compatibility and mapping the hidden legacy id to the default visible profile."
```

---

### Task 4: Card Set Library Country Palettes And Stadium-Blue Accents

**Files:**
- Modify: `src/components/CardSetLibraryPicker.tsx`
- Modify: `src/components/__tests__/CardSetLibraryPicker.test.tsx`

**Interfaces:**
- Consumes: `getFootballPaletteForCardSet`, `stadiumAccent`
- Produces: chip attributes `data-football-country`

- [ ] **Step 1: Write failing library tests**

In `src/components/__tests__/CardSetLibraryPicker.test.tsx`, replace the purple wand test with:

```ts
it('uses stadium-blue AI Assistant styling beside the title with an exact 10px gap', async () => {
  const user = userEvent.setup();
  const onOpenAiAssistant = vi.fn();
  render(
    <CardSetLibraryPicker
      cards={cards}
      cardSets={cardSets}
      interfaceLanguage="ru"
      targetLanguage="ru"
      selectedCardSetId="all-cards"
      onOpenAiAssistant={onOpenAiAssistant}
      onSelect={vi.fn()}
    />,
  );

  expect(screen.getByTestId('card_set_library__title_row')).toHaveStyle({
    gap: '10px',
  });
  const wand = screen.getByTestId('card_set_library__ai_assistant_button');
  expect(getComputedStyle(wand).color).toBe('rgb(24, 119, 201)');
  expect(getComputedStyle(wand).color).not.toBe('rgb(111, 75, 216)');

  await user.click(wand);
  expect(onOpenAiAssistant).toHaveBeenCalledTimes(1);
});
```

Add a palette stability test:

```ts
it('assigns stable football country palettes to visible card set chips', () => {
  const { rerender } = render(
    <CardSetLibraryPicker
      cards={cards}
      cardSets={cardSets}
      interfaceLanguage="ru"
      targetLanguage="ru"
      selectedCardSetId="work-set"
      onOpenAiAssistant={vi.fn()}
      onSelect={vi.fn()}
    />,
  );

  const firstCountry = screen
    .getByTestId('card_set_library__chip_select__work-set')
    .getAttribute('data-football-country');

  rerender(
    <CardSetLibraryPicker
      cards={cards}
      cardSets={cardSets}
      interfaceLanguage="en"
      targetLanguage="en"
      selectedCardSetId="work-set"
      onOpenAiAssistant={vi.fn()}
      onSelect={vi.fn()}
    />,
  );

  expect(screen.getByTestId('card_set_library__chip_select__all-cards')).toHaveAttribute(
    'data-football-country',
    'spain',
  );
  expect(screen.getByTestId('card_set_library__chip_select__work-set')).toHaveAttribute(
    'data-football-country',
    firstCountry ?? '',
  );
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/components/__tests__/CardSetLibraryPicker.test.tsx --reporter=dot
```

Expected: FAIL on old purple color and missing `data-football-country`.

- [ ] **Step 3: Use football palettes in chips**

In `src/components/CardSetLibraryPicker.tsx`:

```ts
import {
  getFootballPaletteForCardSet,
  stadiumAccent,
} from '../domain/footballTheme';
```

Inside `CardSetLibraryChip`, derive:

```ts
const palette = getFootballPaletteForCardSet(item.id, {
  isAllCards: item.isAllCards,
});
```

Add to the button:

```tsx
data-football-country={palette.countryKey}
```

Use palette styling:

```tsx
background: palette.gradient,
borderColor: selected ? stadiumAccent.main : 'rgba(32, 48, 21, 0.14)',
boxShadow: selected ? `0 0 0 3px ${stadiumAccent.main}55` : undefined,
color: palette.foreground,
```

- [ ] **Step 4: Replace purple AI button styling**

Change AI button styling:

```tsx
bgcolor: 'rgba(24, 119, 201, 0.10)',
color: stadiumAccent.main,
'&:hover': { bgcolor: 'rgba(24, 119, 201, 0.18)' },
```

- [ ] **Step 5: Run tests and verify they pass**

Run:

```bash
npm test -- src/components/__tests__/CardSetLibraryPicker.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/CardSetLibraryPicker.tsx src/components/__tests__/CardSetLibraryPicker.test.tsx
git commit -m "Apply football palettes to card sets" -m "Use deterministic football-country palettes for card-set chips and replace the old purple AI assistant accent with stadium blue."
```

---

### Task 5: App Shell Active Tab And Football-AI Chat Icon

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/__tests__/AppShell.test.tsx`

**Interfaces:**
- Consumes: `stadiumAccent`
- Produces: `app_shell__tab_icon__chat_football_ai_ball`

- [ ] **Step 1: Write failing AppShell tests**

In `src/components/__tests__/AppShell.test.tsx`, add:

```ts
it('uses a readable stadium-blue active tab and a football AI chat icon', () => {
  const store = configureStore({
    reducer: {
      app: appReducer,
    },
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        playerProfile: {
          avatarSeed: 'supporter:spain:test',
          displayName: 'Илья',
          isAnonymous: false,
        },
        selectedPage: 'chat',
      },
    },
  });

  render(
    <Provider store={store}>
      <AppShell>
        <div>Content</div>
      </AppShell>
    </Provider>,
  );

  expect(screen.getByTestId('app_shell__tab__chat')).toHaveStyle({
    color: '#123c69',
  });
  expect(
    screen.getByTestId('app_shell__tab_icon__chat_football_ai_ball'),
  ).toBeInTheDocument();
  expect(
    screen.queryByTestId('app_shell__tab_icon__chat_robot'),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm test -- src/components/__tests__/AppShell.test.tsx --reporter=dot
```

Expected: FAIL because the chat football icon does not exist or active color still uses old styling.

- [ ] **Step 3: Replace active tab color**

In `src/components/AppShell.tsx`, import `stadiumAccent`:

```ts
import { stadiumAccent } from '../domain/footballTheme';
```

Update selected tab styling:

```tsx
'&.Mui-selected': {
  color: stadiumAccent.dark,
}
```

Update the indicator if needed:

```tsx
TabIndicatorProps={{
  style: {
    backgroundColor: stadiumAccent.dark,
  },
}}
```

- [ ] **Step 4: Replace Chat tab robot icon with football-AI SVG**

Create a local component in `AppShell.tsx`:

```tsx
function FootballAiChatIcon() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      data-test="app_shell__tab_icon__chat_football_ai_ball"
      viewBox="0 0 40 40"
      sx={{ height: 24, width: 24 }}
    >
      <circle cx="20" cy="20" r="15" fill="#fffdf4" stroke="#123c69" strokeWidth="2" />
      <path d="M20 8v24M8 20h24M12 12l16 16M28 12 12 28" stroke="#1877c9" strokeWidth="1.4" opacity="0.62" />
      <circle cx="30" cy="9" r="3" fill="#ffc400" />
      <path d="M30 2v4M30 12v4M23 9h4M33 9h4" stroke="#c60b1e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="31" r="2" fill="#1877c9" />
    </Box>
  );
}
```

Use it for the Chat tab icon instead of the robot icon.

- [ ] **Step 5: Run tests and verify they pass**

Run:

```bash
npm test -- src/components/__tests__/AppShell.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppShell.tsx src/components/__tests__/AppShell.test.tsx
git commit -m "Refresh app shell football accents" -m "Replace the hard-to-read active tab color with stadium blue and swap the chat robot icon for a football AI icon."
```

---

### Task 6: Football Result Colors

**Files:**
- Modify: result-color constants and components found by `rg`
- Modify: tests that assert result colors

**Interfaces:**
- Consumes: `footballResultColors`

- [ ] **Step 1: Locate old success/error colors**

Run:

```bash
rg -n "#e8f7|#fde|#fce|#eaf|pink|rose|correctColor|incorrectColor|success|error" src/components src/domain src/__tests__
```

Expected: list of files and tests that hard-code current green/pink styles.

- [ ] **Step 2: Write failing representative tests**

Update one representative game test and one statistics/card detail test to assert:

```ts
expect(correctCell).toHaveStyle({
  backgroundColor: '#e8f7df',
  borderColor: '#7fc77a',
});
expect(incorrectCell).toHaveStyle({
  backgroundColor: '#fde8df',
  borderColor: '#f39aa4',
});
```

Use existing tests in:

- `src/components/exercises/__tests__/CrosswordExercise.test.tsx` for game cells.
- `src/components/history/__tests__/CrosswordHistoryReplay.test.tsx` or `src/__tests__/App.navigation.test.tsx` for history/statistics.

- [ ] **Step 3: Run tests and verify they fail**

Run the changed files, for example:

```bash
npm test -- src/components/exercises/__tests__/CrosswordExercise.test.tsx src/components/history/__tests__/CrosswordHistoryReplay.test.tsx --reporter=dot
```

Expected: FAIL on old color values.

- [ ] **Step 4: Replace component colors with theme constants**

Where old correct/incorrect colors are defined, import:

```ts
import { footballResultColors } from '../../domain/footballTheme';
```

or for files one level higher:

```ts
import { footballResultColors } from '../domain/footballTheme';
```

Replace hard-coded correct styles:

```ts
backgroundColor: footballResultColors.correct.soft,
borderColor: footballResultColors.correct.border,
color: footballResultColors.correct.text,
```

Replace hard-coded incorrect styles:

```ts
backgroundColor: footballResultColors.incorrect.soft,
borderColor: footballResultColors.incorrect.border,
color: footballResultColors.incorrect.text,
```

- [ ] **Step 5: Run result color tests**

Run:

```bash
npm test -- src/components/exercises/__tests__/CrosswordExercise.test.tsx src/components/history/__tests__/CrosswordHistoryReplay.test.tsx --reporter=dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components src/domain src/__tests__
git commit -m "Adapt result colors to football theme" -m "Use football-grass green for correct answer states and Spain red for incorrect answer states across representative game and statistics surfaces."
```

---

### Task 7: Final Verification, History, And Push

**Files:**
- Modify: `AGENT_HISTORY.md`
- No production files unless a verification failure requires a fix

- [ ] **Step 1: Record this implementation turn**

Append new entries to `AGENT_HISTORY.md` with the visible user/assistant messages and timestamp divider in `DMMYY:HMM` format. Use:

```bash
date '+%-d%m%y:%-H%M'
```

- [ ] **Step 2: Run targeted changed-file tests**

Run:

```bash
npm test -- src/domain/__tests__/footballTheme.test.ts src/components/__tests__/CardSetLibraryPicker.test.tsx src/components/__tests__/AppShell.test.tsx src/components/__tests__/LanguageSelectors.test.tsx src/domain/__tests__/assistants.test.ts src/domain/__tests__/coachThoughts.test.ts src/components/exercises/__tests__/CrosswordExercise.test.tsx src/components/history/__tests__/CrosswordHistoryReplay.test.tsx src/__tests__/App.navigation.test.tsx --reporter=dot
```

Expected: all selected tests pass.

- [ ] **Step 3: Run TypeScript and whitespace checks**

Run:

```bash
npx tsc -b --noEmit
git diff --check
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit history or verification fixes**

If `AGENT_HISTORY.md` is the only changed file:

```bash
git add AGENT_HISTORY.md
git commit -m "Record football theme implementation history" -m "Record the football World Cup theme implementation turn in AGENT_HISTORY.md after verification."
```

If verification required code fixes, include those files in a focused commit with a detailed body.

- [ ] **Step 5: Push the branch**

Run:

```bash
git push origin codex/exercise-feedback-replay
```

Expected: push succeeds and updates the existing merge request.
