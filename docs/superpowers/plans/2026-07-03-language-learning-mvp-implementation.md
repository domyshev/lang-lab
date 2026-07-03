# Language Learning MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first browser MVP for Language Crossword Lab: imported language cards, persistent themes, target/interface language settings, four exercise modes, history, card statistics, and a strict sports-coach assistant.

**Architecture:** Create a Vite React app with focused domain modules for cards, importing, themes, exercises, statistics, and coach feedback. Redux Toolkit owns persisted app data through Redux Persist, while exercise generators stay pure and testable. UI components use MUI and consume domain selectors/actions rather than embedding business logic.

**Tech Stack:** React, TypeScript, Vite, MUI, Redux Toolkit, Redux Persist, Vitest, Testing Library, localStorage.

---

## Project Rules

- Repository documentation and code comments must be in English.
- Do not modify `TASK_REQUIREMENTS.md`.
- Do not commit or push unless the user explicitly asks for it.
- Use `npm` for package scripts unless the project later adopts another package manager.
- Keep `.superpowers/` ignored; it contains brainstorming mockups, not project source.

## Reference Documents

- `docs/superpowers/specs/2026-07-03-language-learning-mvp-design.md`
- `docs/LANGUAGE_CARD_FORMAT.md`
- `SPEC.md`
- `ARCHITECTURE.md`

## Planned File Structure

Create this application structure:

```text
index.html
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
vite.config.ts
src/
  App.tsx
  main.tsx
  styles.css
  theme.ts
  domain/
    languages.ts
    cards.ts
    importCards.ts
    themes.ts
    exercises.ts
    crossword.ts
    stats.ts
    coach.ts
    i18n.ts
    __tests__/
      cards.test.ts
      importCards.test.ts
      exercises.test.ts
      crossword.test.ts
      stats.test.ts
      coach.test.ts
  store/
    appSlice.ts
    cardsSlice.ts
    themesSlice.ts
    attemptsSlice.ts
    statsSlice.ts
    store.ts
  components/
    AppShell.tsx
    CoachPanel.tsx
    LanguageSelectors.tsx
    ImportCardsView.tsx
    ThemeListView.tsx
    ThemeDetailView.tsx
    ExercisePicker.tsx
    exercises/
      CrosswordExercise.tsx
      MultipleChoiceExercise.tsx
      MissingLettersExercise.tsx
      MissingWordExercise.tsx
    HistoryView.tsx
    EmptyThemeStarter.tsx
  test/
    setup.ts
```

## Core Type Contracts

Use these names consistently across tasks:

```ts
export type SupportedLanguage = 'ru' | 'en' | 'es';

export type ExerciseType =
  | 'crossword'
  | 'multipleChoice'
  | 'missingLetters'
  | 'missingWord';

export interface LanguageCard {
  id: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  examples?: Partial<Record<SupportedLanguage, LanguageExample[]>>;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface LanguageExample {
  sentence: string;
  answer: string;
}
```

## Task 1: Scaffold Vite, TypeScript, React, MUI, Redux, And Tests

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/theme.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create `package.json`**

Use this file content:

```json
{
  "name": "language-crossword-lab",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --noEmit"
  },
  "dependencies": {
    "@emotion/react": "^11.13.5",
    "@emotion/styled": "^11.13.5",
    "@mui/icons-material": "^6.1.10",
    "@mui/material": "^6.1.10",
    "@reduxjs/toolkit": "^2.5.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.2.0",
    "redux-persist": "^6.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite config files**

Use this `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.app.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

Use this `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Use this `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 3: Create app shell entry files**

Use this `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Language Crossword Lab</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Use this `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Use this `src/theme.ts`:

```ts
import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#9cca56',
      contrastText: '#203015',
    },
    secondary: {
      main: '#f0f7d7',
      contrastText: '#203015',
    },
    background: {
      default: '#fbfcf5',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
});
```

Use this `src/styles.css`:

```css
html,
body,
#root {
  min-height: 100%;
  margin: 0;
}

body {
  background: #fbfcf5;
}

* {
  box-sizing: border-box;
}
```

Use this initial `src/App.tsx`:

```tsx
import { Box, Typography } from '@mui/material';

export function App() {
  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Typography variant="h4" component="h1">
        Language Crossword Lab
      </Typography>
      <Typography sx={{ mt: 1 }}>
        MVP implementation scaffold is ready.
      </Typography>
    </Box>
  );
}
```

Use this `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { appTheme } from './theme';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm test
npm run build
```

Expected: `npm test` exits with no tests found unless Vitest requires `--passWithNoTests`; if it fails for no tests, add this script instead: `"test": "vitest run --passWithNoTests"`, then rerun. `npm run build` should complete successfully.

- [ ] **Step 6: Checkpoint**

Review changed files with:

```bash
git status --short
git diff --stat
```

Do not commit unless the user explicitly asks.

## Task 2: Add Core Domain Types And Language Utilities

**Files:**

- Create: `src/domain/languages.ts`
- Create: `src/domain/cards.ts`
- Create: `src/domain/themes.ts`
- Create: `src/domain/exercises.ts`
- Create: `src/domain/__tests__/cards.test.ts`

- [ ] **Step 1: Write card utility tests**

Create `src/domain/__tests__/cards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getCardAnswer,
  getDefinitionHint,
  getTranslationHints,
  isPhraseValue,
  isCardEligibleForTarget,
} from '../cards';

const card = {
  id: 'card-1',
  translations: {
    ru: 'аэропорт',
    en: 'airport',
    es: 'aeropuerto',
  },
  definitions: {
    en: 'A place where airplanes take off and land.',
    ru: 'Место, где самолёты взлетают и садятся.',
  },
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
} as const;

describe('language cards', () => {
  it('uses the target language translation as answer', () => {
    expect(getCardAnswer(card, 'en')).toBe('airport');
  });

  it('uses only non-target translations as translation hints', () => {
    expect(getTranslationHints(card, 'en')).toEqual([
      { language: 'ru', value: 'аэропорт' },
      { language: 'es', value: 'aeropuerto' },
    ]);
  });

  it('uses only the target-language definition as definition hint', () => {
    expect(getDefinitionHint(card, 'en')).toBe(
      'A place where airplanes take off and land.',
    );
  });

  it('marks phrases by whitespace', () => {
    expect(isPhraseValue('airport')).toBe(false);
    expect(isPhraseValue('train station')).toBe(true);
  });

  it('requires target translation and at least one non-target prompt', () => {
    expect(isCardEligibleForTarget(card, 'en')).toBe(true);
    expect(
      isCardEligibleForTarget(
        {
          ...card,
          translations: { en: 'airport' },
        },
        'en',
      ),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- src/domain/__tests__/cards.test.ts
```

Expected: fail because `src/domain/cards.ts` does not exist.

- [ ] **Step 3: Implement language and card modules**

Create `src/domain/languages.ts`:

```ts
export const supportedLanguages = ['ru', 'en', 'es'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  ru: 'Russian',
  en: 'English',
  es: 'Spanish',
};

export const languageFlags: Record<SupportedLanguage, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  es: '🇪🇸',
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}
```

Create `src/domain/cards.ts`:

```ts
import { SupportedLanguage, supportedLanguages } from './languages';

export interface LanguageExample {
  sentence: string;
  answer: string;
}

export interface LanguageCard {
  id: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  examples?: Partial<Record<SupportedLanguage, LanguageExample[]>>;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface TranslationHint {
  language: SupportedLanguage;
  value: string;
}

export interface CardSnapshot {
  id: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  tags?: string[];
  difficulty?: LanguageCard['difficulty'];
}

export function getCardAnswer(
  card: Pick<LanguageCard, 'translations'>,
  targetLanguage: SupportedLanguage,
): string | undefined {
  return card.translations[targetLanguage];
}

export function getTranslationHints(
  card: Pick<LanguageCard, 'translations'>,
  targetLanguage: SupportedLanguage,
): TranslationHint[] {
  return supportedLanguages
    .filter((language) => language !== targetLanguage)
    .flatMap((language) => {
      const value = card.translations[language];
      return value ? [{ language, value }] : [];
    });
}

export function getDefinitionHint(
  card: Pick<LanguageCard, 'definitions'>,
  targetLanguage: SupportedLanguage,
): string | undefined {
  return card.definitions?.[targetLanguage];
}

export function isPhraseValue(value: string): boolean {
  return /\s/.test(value.trim());
}

export function isCardEligibleForTarget(
  card: Pick<LanguageCard, 'translations' | 'definitions'>,
  targetLanguage: SupportedLanguage,
): boolean {
  const answer = getCardAnswer(card, targetLanguage);
  if (!answer) {
    return false;
  }

  return (
    getTranslationHints(card, targetLanguage).length > 0 ||
    Boolean(getDefinitionHint(card, targetLanguage))
  );
}

export function createCardSnapshot(card: LanguageCard): CardSnapshot {
  return {
    id: card.id,
    translations: { ...card.translations },
    definitions: card.definitions ? { ...card.definitions } : undefined,
    tags: card.tags ? [...card.tags] : undefined,
    difficulty: card.difficulty,
  };
}
```

Create `src/domain/themes.ts`:

```ts
export interface Theme {
  id: string;
  name: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

Create `src/domain/exercises.ts`:

```ts
import { CardSnapshot } from './cards';
import { SupportedLanguage } from './languages';

export type ExerciseType =
  | 'crossword'
  | 'multipleChoice'
  | 'missingLetters'
  | 'missingWord';

export interface ExercisePrompt {
  cardId: string;
  prompt: string;
  expectedAnswer: string;
  translationHints: Array<{ language: SupportedLanguage; value: string }>;
  definitionHint?: string;
}

export interface ExerciseAttempt {
  id: string;
  exerciseType: ExerciseType;
  themeId: string;
  targetLanguage: SupportedLanguage;
  createdAt: string;
  completedAt?: string;
  cardSnapshots: CardSnapshot[];
  prompts: ExercisePrompt[];
  answers: Record<string, string>;
  correctness: Record<string, boolean>;
  hintsUsed: Record<string, number>;
  weightedScore?: number;
  coachComment?: string;
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```bash
npm test -- src/domain/__tests__/cards.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete.

## Task 3: Implement Card Import Validation, Duplicate Detection, Safe Merge, And Pending Conflicts

**Files:**

- Create: `src/domain/importCards.ts`
- Create: `src/domain/__tests__/importCards.test.ts`

- [ ] **Step 1: Write import behavior tests**

Create `src/domain/__tests__/importCards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import { importLanguageCards, normalizeTranslationValue } from '../importCards';

const now = '2026-07-03T12:00:00.000Z';

function existingCard(overrides: Partial<LanguageCard> = {}): LanguageCard {
  return {
    id: 'card-existing',
    translations: {
      en: 'airport',
      ru: 'аэропорт',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('importLanguageCards', () => {
  it('normalizes translation values for duplicate matching', () => {
    expect(normalizeTranslationValue('  AirPort   Station ')).toBe(
      'airport station',
    );
  });

  it('adds valid new cards from pasted JSON', () => {
    const result = importLanguageCards({
      existingCards: [],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'ticket',
            ru: 'билет',
          },
          tags: ['travel'],
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.invalid).toBe(0);
    expect(result.cards[0].id).toMatch(/^card-/);
  });

  it('safe-merges missing fields and records history', () => {
    const result = importLanguageCards({
      existingCards: [existingCard()],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'Airport',
            es: 'aeropuerto',
          },
          definitions: {
            en: 'A place where airplanes take off and land.',
          },
          tags: ['travel'],
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].translations.es).toBe('aeropuerto');
    expect(result.cards[0].definitions?.en).toBe(
      'A place where airplanes take off and land.',
    );
    expect(result.cards[0].tags).toEqual(['travel']);
    expect(result.summary.safeMerged).toBe(1);
    expect(result.duplicateProcessingHistory[0].addedFields).toEqual([
      'translations.es',
      'definitions.en',
      'tags.travel',
    ]);
  });

  it('stores conflicting duplicates in pending duplicates', () => {
    const result = importLanguageCards({
      existingCards: [
        existingCard({
          definitions: {
            en: 'Existing definition.',
          },
        }),
      ],
      pastedJson: JSON.stringify([
        {
          translations: {
            en: 'airport',
            ru: 'аэропорт',
          },
          definitions: {
            en: 'Different definition.',
          },
        },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].definitions?.en).toBe('Existing definition.');
    expect(result.pendingDuplicates).toHaveLength(1);
    expect(result.summary.pendingDuplicates).toBe(1);
  });

  it('reports invalid records without stopping the whole import', () => {
    const result = importLanguageCards({
      existingCards: [],
      pastedJson: JSON.stringify([
        { translations: { en: 'only one language' } },
        { translations: { en: 'train', ru: 'поезд' } },
      ]),
      now,
    });

    expect(result.cards).toHaveLength(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.invalid).toBe(1);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- src/domain/__tests__/importCards.test.ts
```

Expected: fail because `src/domain/importCards.ts` does not exist.

- [ ] **Step 3: Implement import module**

Create `src/domain/importCards.ts`:

```ts
import { LanguageCard, LanguageExample } from './cards';
import { SupportedLanguage, isSupportedLanguage } from './languages';

type RawIncomingCard = {
  translations?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  examples?: Record<string, unknown>;
  tags?: unknown;
  difficulty?: unknown;
};

export interface NormalizedIncomingCard {
  translations: Partial<Record<SupportedLanguage, string>>;
  definitions?: Partial<Record<SupportedLanguage, string>>;
  examples?: Partial<Record<SupportedLanguage, LanguageExample[]>>;
  tags?: string[];
  difficulty?: LanguageCard['difficulty'];
}

export interface DuplicateProcessingEntry {
  id: string;
  processedAt: string;
  type: 'safeMerge';
  existingCardId: string;
  incomingCard: NormalizedIncomingCard;
  matchedBy: {
    language: SupportedLanguage;
    value: string;
  };
  addedFields: string[];
}

export interface PendingDuplicate {
  id: string;
  detectedAt: string;
  existingCardId: string;
  incomingCard: NormalizedIncomingCard;
  matchedBy: {
    language: SupportedLanguage;
    value: string;
  };
  conflicts: string[];
  status: 'pending';
}

export interface ImportSummary {
  added: number;
  safeMerged: number;
  pendingDuplicates: number;
  invalid: number;
  skipped: number;
}

export interface ImportResult {
  cards: LanguageCard[];
  duplicateProcessingHistory: DuplicateProcessingEntry[];
  pendingDuplicates: PendingDuplicate[];
  invalidRecords: Array<{ index: number; reason: string }>;
  summary: ImportSummary;
}

export function normalizeTranslationValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function importLanguageCards(input: {
  existingCards: LanguageCard[];
  pastedJson: string;
  now: string;
}): ImportResult {
  const cards = input.existingCards.map(cloneCard);
  const duplicateProcessingHistory: DuplicateProcessingEntry[] = [];
  const pendingDuplicates: PendingDuplicate[] = [];
  const invalidRecords: Array<{ index: number; reason: string }> = [];
  const summary: ImportSummary = {
    added: 0,
    safeMerged: 0,
    pendingDuplicates: 0,
    invalid: 0,
    skipped: 0,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.pastedJson);
  } catch {
    return {
      cards,
      duplicateProcessingHistory,
      pendingDuplicates,
      invalidRecords: [{ index: -1, reason: 'JSON is not valid.' }],
      summary: { ...summary, invalid: 1 },
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      cards,
      duplicateProcessingHistory,
      pendingDuplicates,
      invalidRecords: [{ index: -1, reason: 'Root value must be an array.' }],
      summary: { ...summary, invalid: 1 },
    };
  }

  parsed.forEach((raw, index) => {
    const validation = normalizeIncomingCard(raw);
    if (!validation.ok) {
      invalidRecords.push({ index, reason: validation.reason });
      summary.invalid += 1;
      return;
    }

    const incoming = validation.card;
    const match = findDuplicate(cards, incoming);
    if (!match) {
      cards.push({
        id: createId('card'),
        translations: incoming.translations,
        definitions: incoming.definitions,
        examples: incoming.examples,
        tags: incoming.tags,
        difficulty: incoming.difficulty,
        createdAt: input.now,
        updatedAt: input.now,
      });
      summary.added += 1;
      return;
    }

    const merge = safeMergeCard(match.card, incoming, input.now);
    if (merge.conflicts.length > 0) {
      pendingDuplicates.push({
        id: createId('pending'),
        detectedAt: input.now,
        existingCardId: match.card.id,
        incomingCard: incoming,
        matchedBy: match.matchedBy,
        conflicts: merge.conflicts,
        status: 'pending',
      });
      summary.pendingDuplicates += 1;
      return;
    }

    if (merge.addedFields.length > 0) {
      Object.assign(match.card, merge.card);
      duplicateProcessingHistory.push({
        id: createId('merge'),
        processedAt: input.now,
        type: 'safeMerge',
        existingCardId: match.card.id,
        incomingCard: incoming,
        matchedBy: match.matchedBy,
        addedFields: merge.addedFields,
      });
      summary.safeMerged += 1;
      return;
    }

    summary.skipped += 1;
  });

  return {
    cards,
    duplicateProcessingHistory,
    pendingDuplicates,
    invalidRecords,
    summary,
  };
}

function normalizeIncomingCard(
  raw: unknown,
): { ok: true; card: NormalizedIncomingCard } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'Record must be an object.' };
  }

  const record = raw as RawIncomingCard;
  const translations = normalizeLanguageStringMap(record.translations);
  if (Object.keys(translations).length < 2) {
    return {
      ok: false,
      reason: 'Card must include translations for at least two supported languages.',
    };
  }

  return {
    ok: true,
    card: {
      translations,
      definitions: normalizeLanguageStringMap(record.definitions),
      examples: normalizeExamples(record.examples),
      tags: normalizeTags(record.tags),
      difficulty: normalizeDifficulty(record.difficulty),
    },
  };
}

function normalizeLanguageStringMap(
  value: unknown,
): Partial<Record<SupportedLanguage, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Partial<Record<SupportedLanguage, string>> = {};
  Object.entries(value).forEach(([key, rawValue]) => {
    if (isSupportedLanguage(key) && typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed) {
        output[key] = trimmed;
      }
    }
  });
  return output;
}

function normalizeTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tags = [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
  return tags.length > 0 ? tags : undefined;
}

function normalizeDifficulty(value: unknown): LanguageCard['difficulty'] | undefined {
  return value === 'easy' || value === 'medium' || value === 'hard'
    ? value
    : undefined;
}

function normalizeExamples(value: unknown): LanguageCard['examples'] | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const output: LanguageCard['examples'] = {};
  Object.entries(value).forEach(([key, rawExamples]) => {
    if (!isSupportedLanguage(key) || !Array.isArray(rawExamples)) {
      return;
    }
    const examples = rawExamples
      .filter((example): example is { sentence: string; answer: string } => {
        return (
          example &&
          typeof example === 'object' &&
          typeof (example as { sentence?: unknown }).sentence === 'string' &&
          typeof (example as { answer?: unknown }).answer === 'string'
        );
      })
      .map((example) => ({
        sentence: example.sentence.trim(),
        answer: example.answer.trim(),
      }))
      .filter((example) => example.sentence && example.answer);

    if (examples.length > 0) {
      output[key] = examples;
    }
  });

  return Object.keys(output).length > 0 ? output : undefined;
}

function findDuplicate(
  cards: LanguageCard[],
  incoming: NormalizedIncomingCard,
): { card: LanguageCard; matchedBy: { language: SupportedLanguage; value: string } } | undefined {
  for (const card of cards) {
    for (const [language, incomingValue] of Object.entries(incoming.translations)) {
      if (!incomingValue) {
        continue;
      }
      const supportedLanguage = language as SupportedLanguage;
      const normalizedIncoming = normalizeTranslationValue(incomingValue);
      const normalizedExistingValues = Object.values(card.translations)
        .filter((value): value is string => Boolean(value))
        .map((value) => normalizeTranslationValue(value));
      if (normalizedExistingValues.includes(normalizedIncoming)) {
        return {
          card,
          matchedBy: {
            language: supportedLanguage,
            value: incomingValue,
          },
        };
      }
    }
  }

  return undefined;
}

function safeMergeCard(
  existing: LanguageCard,
  incoming: NormalizedIncomingCard,
  now: string,
): { card: LanguageCard; addedFields: string[]; conflicts: string[] } {
  const card = cloneCard(existing);
  const addedFields: string[] = [];
  const conflicts: string[] = [];

  mergeLanguageMap('translations', card.translations, incoming.translations, addedFields, conflicts);
  if (incoming.definitions && Object.keys(incoming.definitions).length > 0) {
    card.definitions = card.definitions ?? {};
    mergeLanguageMap('definitions', card.definitions, incoming.definitions, addedFields, conflicts);
  }

  if (incoming.tags) {
    const tags = new Set(card.tags ?? []);
    incoming.tags.forEach((tag) => {
      if (!tags.has(tag)) {
        tags.add(tag);
        addedFields.push(`tags.${tag}`);
      }
    });
    card.tags = [...tags];
  }

  if (incoming.examples) {
    card.examples = card.examples ?? {};
    Object.entries(incoming.examples).forEach(([language, examples]) => {
      const supportedLanguage = language as SupportedLanguage;
      const existingExamples = card.examples?.[supportedLanguage] ?? [];
      const existingKeys = new Set(
        existingExamples.map((example) => `${example.sentence}\u0000${example.answer}`),
      );
      examples.forEach((example) => {
        const key = `${example.sentence}\u0000${example.answer}`;
        if (!existingKeys.has(key)) {
          card.examples[supportedLanguage] = [
            ...(card.examples[supportedLanguage] ?? []),
            example,
          ];
          addedFields.push(`examples.${supportedLanguage}`);
        }
      });
    });
  }

  if (incoming.difficulty && !card.difficulty) {
    card.difficulty = incoming.difficulty;
    addedFields.push('difficulty');
  } else if (incoming.difficulty && card.difficulty && incoming.difficulty !== card.difficulty) {
    conflicts.push('difficulty');
  }

  if (addedFields.length > 0) {
    card.updatedAt = now;
  }

  return { card, addedFields, conflicts };
}

function mergeLanguageMap(
  fieldName: 'translations' | 'definitions',
  target: Partial<Record<SupportedLanguage, string>>,
  incoming: Partial<Record<SupportedLanguage, string>> | undefined,
  addedFields: string[],
  conflicts: string[],
): void {
  if (!incoming) {
    return;
  }

  Object.entries(incoming).forEach(([language, value]) => {
    const supportedLanguage = language as SupportedLanguage;
    const existingValue = target[supportedLanguage];
    if (!existingValue) {
      target[supportedLanguage] = value;
      addedFields.push(`${fieldName}.${supportedLanguage}`);
      return;
    }

    if (normalizeTranslationValue(existingValue) !== normalizeTranslationValue(value)) {
      conflicts.push(`${fieldName}.${supportedLanguage}`);
    }
  });
}

function cloneCard(card: LanguageCard): LanguageCard {
  return {
    ...card,
    translations: { ...card.translations },
    definitions: card.definitions ? { ...card.definitions } : undefined,
    examples: card.examples
      ? Object.fromEntries(
          Object.entries(card.examples).map(([language, examples]) => [
            language,
            examples.map((example) => ({ ...example })),
          ]),
        )
      : undefined,
    tags: card.tags ? [...card.tags] : undefined,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
```

- [ ] **Step 4: Verify import tests pass**

Run:

```bash
npm test -- src/domain/__tests__/importCards.test.ts
```

Expected: all import tests pass.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 4: Add Redux Store, Persistence, And Core Slices

**Files:**

- Create: `src/store/store.ts`
- Create: `src/store/appSlice.ts`
- Create: `src/store/cardsSlice.ts`
- Create: `src/store/themesSlice.ts`
- Create: `src/store/attemptsSlice.ts`
- Create: `src/store/statsSlice.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Implement app settings slice**

Create `src/store/appSlice.ts`:

```ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SupportedLanguage } from '../domain/languages';

export interface AppState {
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

const initialState: AppState = {
  interfaceLanguage: 'ru',
  targetLanguage: 'en',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInterfaceLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.interfaceLanguage = action.payload;
    },
    setTargetLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.targetLanguage = action.payload;
    },
  },
});

export const { setInterfaceLanguage, setTargetLanguage } = appSlice.actions;
export const appReducer = appSlice.reducer;
```

- [ ] **Step 2: Implement cards slice**

Create `src/store/cardsSlice.ts`:

```ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { LanguageCard } from '../domain/cards';
import {
  DuplicateProcessingEntry,
  ImportResult,
  PendingDuplicate,
} from '../domain/importCards';

export interface CardsState {
  cards: LanguageCard[];
  duplicateProcessingHistory: DuplicateProcessingEntry[];
  pendingDuplicates: PendingDuplicate[];
}

const initialState: CardsState = {
  cards: [],
  duplicateProcessingHistory: [],
  pendingDuplicates: [],
};

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    applyImportResult(state, action: PayloadAction<ImportResult>) {
      state.cards = action.payload.cards;
      state.duplicateProcessingHistory.push(
        ...action.payload.duplicateProcessingHistory,
      );
      state.pendingDuplicates.push(...action.payload.pendingDuplicates);
    },
  },
});

export const { applyImportResult } = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
```

- [ ] **Step 3: Implement themes, attempts, and stats slices**

Create `src/store/themesSlice.ts`:

```ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Theme } from '../domain/themes';

export interface ThemesState {
  themes: Theme[];
  selectedThemeId?: string;
}

const initialState: ThemesState = {
  themes: [],
};

const themesSlice = createSlice({
  name: 'themes',
  initialState,
  reducers: {
    addTheme(state, action: PayloadAction<Theme>) {
      state.themes.push(action.payload);
      state.selectedThemeId = action.payload.id;
    },
    selectTheme(state, action: PayloadAction<string>) {
      state.selectedThemeId = action.payload;
    },
    addCardToTheme(
      state,
      action: PayloadAction<{ themeId: string; cardId: string; now: string }>,
    ) {
      const theme = state.themes.find((item) => item.id === action.payload.themeId);
      if (!theme || theme.cardIds.includes(action.payload.cardId)) {
        return;
      }
      theme.cardIds.push(action.payload.cardId);
      theme.updatedAt = action.payload.now;
    },
  },
});

export const { addTheme, selectTheme, addCardToTheme } = themesSlice.actions;
export const themesReducer = themesSlice.reducer;
```

Create `src/store/attemptsSlice.ts`:

```ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ExerciseAttempt } from '../domain/exercises';

export interface AttemptsState {
  attempts: ExerciseAttempt[];
}

const initialState: AttemptsState = {
  attempts: [],
};

const attemptsSlice = createSlice({
  name: 'attempts',
  initialState,
  reducers: {
    saveAttempt(state, action: PayloadAction<ExerciseAttempt>) {
      state.attempts.push(action.payload);
    },
  },
});

export const { saveAttempt } = attemptsSlice.actions;
export const attemptsReducer = attemptsSlice.reducer;
```

Create `src/store/statsSlice.ts`:

```ts
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { CardStats, updateStatsFromAttempt } from '../domain/stats';
import { ExerciseAttempt } from '../domain/exercises';

export interface StatsState {
  cardStats: CardStats[];
}

const initialState: StatsState = {
  cardStats: [],
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    recordAttemptStats(state, action: PayloadAction<ExerciseAttempt>) {
      state.cardStats = updateStatsFromAttempt(state.cardStats, action.payload);
    },
  },
});

export const { recordAttemptStats } = statsSlice.actions;
export const statsReducer = statsSlice.reducer;
```

- [ ] **Step 4: Add initial stats module needed by slice**

Create `src/domain/stats.ts`:

```ts
import { ExerciseAttempt } from './exercises';
import { SupportedLanguage } from './languages';

export interface CardStats {
  cardId: string;
  targetLanguage: SupportedLanguage;
  attempts: number;
  correct: number;
  incorrect: number;
  hintsUsed: number;
  accuracy: number;
  recentMistakes: number;
  lastPracticedAt: string;
  stability: 'new' | 'weak' | 'unstable' | 'strong';
}

export function updateStatsFromAttempt(
  currentStats: CardStats[],
  attempt: ExerciseAttempt,
): CardStats[] {
  const next = currentStats.map((stat) => ({ ...stat }));
  const completedAt = attempt.completedAt ?? attempt.createdAt;

  Object.entries(attempt.correctness).forEach(([cardId, isCorrect]) => {
    const existing =
      next.find(
        (stat) =>
          stat.cardId === cardId && stat.targetLanguage === attempt.targetLanguage,
      ) ??
      createEmptyStats(cardId, attempt.targetLanguage, completedAt);

    if (!next.includes(existing)) {
      next.push(existing);
    }

    existing.attempts += 1;
    existing.correct += isCorrect ? 1 : 0;
    existing.incorrect += isCorrect ? 0 : 1;
    existing.hintsUsed += attempt.hintsUsed[cardId] ?? 0;
    existing.recentMistakes = isCorrect ? 0 : existing.recentMistakes + 1;
    existing.lastPracticedAt = completedAt;
    existing.accuracy = existing.correct / existing.attempts;
    existing.stability = classifyStability(existing);
  });

  return next;
}

function createEmptyStats(
  cardId: string,
  targetLanguage: SupportedLanguage,
  now: string,
): CardStats {
  return {
    cardId,
    targetLanguage,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    hintsUsed: 0,
    accuracy: 0,
    recentMistakes: 0,
    lastPracticedAt: now,
    stability: 'new',
  };
}

function classifyStability(stats: CardStats): CardStats['stability'] {
  if (stats.attempts < 2) {
    return 'new';
  }
  if (stats.recentMistakes >= 2 || stats.accuracy < 0.5) {
    return 'weak';
  }
  if (stats.accuracy < 0.8) {
    return 'unstable';
  }
  return 'strong';
}
```

- [ ] **Step 5: Configure store and Redux Persist**

Create `src/store/store.ts`:

```ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { appReducer } from './appSlice';
import { cardsReducer } from './cardsSlice';
import { themesReducer } from './themesSlice';
import { attemptsReducer } from './attemptsSlice';
import { statsReducer } from './statsSlice';

const rootReducer = combineReducers({
  app: appReducer,
  cards: cardsReducer,
  themes: themesReducer,
  attempts: attemptsReducer,
  stats: statsReducer,
});

const persistConfig = {
  key: 'language-crossword-lab:v1',
  version: 1,
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 6: Wire Provider and PersistGate**

Modify `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { appTheme } from './theme';
import { App } from './App';
import { persistor, store } from './store/store';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
```

- [ ] **Step 7: Verify**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

## Task 5: Implement Exercise Generators

**Files:**

- Modify: `src/domain/exercises.ts`
- Create: `src/domain/__tests__/exercises.test.ts`

- [ ] **Step 1: Write generator tests**

Create `src/domain/__tests__/exercises.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import {
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from '../exercises';

const baseCard: LanguageCard = {
  id: 'card-1',
  translations: {
    en: 'airport',
    ru: 'аэропорт',
    es: 'aeropuerto',
  },
  definitions: {
    en: 'A place where airplanes take off and land.',
  },
  examples: {
    en: [{ sentence: 'The airport is busy today.', answer: 'airport' }],
  },
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
};

describe('exercise generators', () => {
  it('filters cards by target language eligibility', () => {
    const cards = [
      baseCard,
      { ...baseCard, id: 'card-2', translations: { ru: 'поезд', es: 'tren' } },
    ];

    expect(getEligibleCardsForTarget(cards, 'en').map((card) => card.id)).toEqual([
      'card-1',
    ]);
  });

  it('creates a multiple choice prompt with three options', () => {
    const prompt = createMultipleChoicePrompt({
      card: baseCard,
      distractorCards: [
        { ...baseCard, id: 'card-2', translations: { en: 'ticket', ru: 'билет' } },
        { ...baseCard, id: 'card-3', translations: { en: 'train', ru: 'поезд' } },
      ],
      targetLanguage: 'en',
    });

    expect(prompt.expectedAnswer).toBe('airport');
    expect(prompt.options).toHaveLength(3);
    expect(prompt.options).toContain('airport');
  });

  it('creates missing letters prompt while preserving spaces', () => {
    const prompt = createMissingLettersPrompt({
      card: {
        ...baseCard,
        translations: { en: 'train station', ru: 'вокзал' },
      },
      targetLanguage: 'en',
    });

    expect(prompt.expectedAnswer).toBe('train station');
    expect(prompt.maskedAnswer).toContain(' ');
    expect(prompt.maskedAnswer).toMatch(/_/);
  });

  it('creates missing word prompt from examples', () => {
    const prompt = createMissingWordPrompt({
      card: baseCard,
      targetLanguage: 'en',
    });

    expect(prompt?.sentenceWithGap).toBe('The _____ is busy today.');
    expect(prompt?.expectedAnswer).toBe('airport');
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- src/domain/__tests__/exercises.test.ts
```

Expected: fail because generator functions are not implemented.

- [ ] **Step 3: Extend `src/domain/exercises.ts`**

Add these exports below existing types:

```ts
import {
  LanguageCard,
  getCardAnswer,
  getDefinitionHint,
  getTranslationHints,
  isCardEligibleForTarget,
} from './cards';

export interface MultipleChoicePrompt extends ExercisePrompt {
  options: string[];
}

export interface MissingLettersPrompt extends ExercisePrompt {
  maskedAnswer: string;
}

export interface MissingWordPrompt extends ExercisePrompt {
  sentenceWithGap: string;
}

export function getEligibleCardsForTarget(
  cards: LanguageCard[],
  targetLanguage: SupportedLanguage,
): LanguageCard[] {
  return cards.filter((card) => isCardEligibleForTarget(card, targetLanguage));
}

export function createBasePrompt(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
): ExercisePrompt {
  const expectedAnswer = getCardAnswer(card, targetLanguage);
  if (!expectedAnswer) {
    throw new Error(`Card ${card.id} has no answer for ${targetLanguage}.`);
  }

  return {
    cardId: card.id,
    prompt: getTranslationHints(card, targetLanguage)
      .map((hint) => `${hint.language}: ${hint.value}`)
      .join(' / '),
    expectedAnswer,
    translationHints: getTranslationHints(card, targetLanguage),
    definitionHint: getDefinitionHint(card, targetLanguage),
  };
}

export function createMultipleChoicePrompt(input: {
  card: LanguageCard;
  distractorCards: LanguageCard[];
  targetLanguage: SupportedLanguage;
}): MultipleChoicePrompt {
  const base = createBasePrompt(input.card, input.targetLanguage);
  const distractors = input.distractorCards
    .map((card) => getCardAnswer(card, input.targetLanguage))
    .filter((answer): answer is string => Boolean(answer))
    .filter((answer) => answer !== base.expectedAnswer)
    .slice(0, 2);

  return {
    ...base,
    options: shuffleStable([base.expectedAnswer, ...distractors]).slice(0, 3),
  };
}

export function createMissingLettersPrompt(input: {
  card: LanguageCard;
  targetLanguage: SupportedLanguage;
}): MissingLettersPrompt {
  const base = createBasePrompt(input.card, input.targetLanguage);
  return {
    ...base,
    maskedAnswer: maskAnswer(base.expectedAnswer),
  };
}

export function createMissingWordPrompt(input: {
  card: LanguageCard;
  targetLanguage: SupportedLanguage;
}): MissingWordPrompt | undefined {
  const base = createBasePrompt(input.card, input.targetLanguage);
  const example = input.card.examples?.[input.targetLanguage]?.find((item) =>
    item.sentence.includes(item.answer),
  );

  if (!example) {
    return undefined;
  }

  return {
    ...base,
    sentenceWithGap: example.sentence.replace(example.answer, '_____'),
    expectedAnswer: example.answer,
  };
}

function maskAnswer(answer: string): string {
  return answer
    .split('')
    .map((char, index) => {
      if (!/[A-Za-zА-Яа-яЁёÁÉÍÓÚÜÑáéíóúüñ]/.test(char)) {
        return char;
      }
      return index % 2 === 0 ? '_' : char;
    })
    .join('');
}

function shuffleStable(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- src/domain/__tests__/exercises.test.ts
npm run build
```

Expected: tests and build pass.

## Task 6: Implement Crossword Generator

**Files:**

- Create: `src/domain/crossword.ts`
- Create: `src/domain/__tests__/crossword.test.ts`

- [ ] **Step 1: Write crossword tests**

Create `src/domain/__tests__/crossword.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LanguageCard } from '../cards';
import { createCrossword } from '../crossword';

function card(id: string, answer: string): LanguageCard {
  return {
    id,
    translations: {
      en: answer,
      ru: `ru-${answer}`,
    },
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  };
}

describe('createCrossword', () => {
  it('uses up to six single-word cards', () => {
    const result = createCrossword({
      cards: [
        card('1', 'airport'),
        card('2', 'ticket'),
        card('3', 'train'),
        card('4', 'station'),
        card('5', 'hotel'),
        card('6', 'map'),
        card('7', 'bus'),
      ],
      targetLanguage: 'en',
    });

    expect(result.entries).toHaveLength(6);
    expect(result.mode).toBe('words');
  });

  it('uses only one phrase card for phrase mode', () => {
    const result = createCrossword({
      cards: [card('1', 'I would like a ticket'), card('2', 'airport')],
      targetLanguage: 'en',
    });

    expect(result.entries).toHaveLength(1);
    expect(result.mode).toBe('phrase');
    expect(result.entries[0].answer).toBe('I would like a ticket');
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- src/domain/__tests__/crossword.test.ts
```

Expected: fail because `src/domain/crossword.ts` does not exist.

- [ ] **Step 3: Implement simple MVP crossword generator**

Create `src/domain/crossword.ts`:

```ts
import { LanguageCard, getCardAnswer, getTranslationHints, isPhraseValue } from './cards';
import { SupportedLanguage } from './languages';

export interface CrosswordEntry {
  cardId: string;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordPuzzle {
  mode: 'words' | 'phrase';
  entries: CrosswordEntry[];
}

export function createCrossword(input: {
  cards: LanguageCard[];
  targetLanguage: SupportedLanguage;
}): CrosswordPuzzle {
  const eligible = input.cards
    .map((card) => ({ card, answer: getCardAnswer(card, input.targetLanguage) }))
    .filter((item): item is { card: LanguageCard; answer: string } =>
      Boolean(item.answer),
    );

  const phrase = eligible.find((item) => isPhraseValue(item.answer));
  if (phrase) {
    return {
      mode: 'phrase',
      entries: [createEntry(phrase.card, phrase.answer, input.targetLanguage, 0)],
    };
  }

  return {
    mode: 'words',
    entries: eligible
      .slice(0, 6)
      .map((item, index) =>
        createEntry(item.card, item.answer, input.targetLanguage, index),
      ),
  };
}

function createEntry(
  card: LanguageCard,
  answer: string,
  targetLanguage: SupportedLanguage,
  index: number,
): CrosswordEntry {
  return {
    cardId: card.id,
    answer,
    clue: getTranslationHints(card, targetLanguage)
      .map((hint) => `${hint.language}: ${hint.value}`)
      .join(' / '),
    row: index * 2,
    col: 0,
    direction: index % 2 === 0 ? 'across' : 'down',
  };
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- src/domain/__tests__/crossword.test.ts
npm run build
```

Expected: tests and build pass.

## Task 7: Implement Statistics And Coach Feedback

**Files:**

- Modify: `src/domain/stats.ts`
- Create: `src/domain/coach.ts`
- Create: `src/domain/__tests__/stats.test.ts`
- Create: `src/domain/__tests__/coach.test.ts`

- [ ] **Step 1: Add stats tests**

Create `src/domain/__tests__/stats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { updateStatsFromAttempt } from '../stats';
import { ExerciseAttempt } from '../exercises';

const attempt: ExerciseAttempt = {
  id: 'attempt-1',
  exerciseType: 'crossword',
  themeId: 'theme-1',
  targetLanguage: 'en',
  createdAt: '2026-07-03T00:00:00.000Z',
  completedAt: '2026-07-03T00:05:00.000Z',
  cardSnapshots: [],
  prompts: [],
  answers: { 'card-1': 'airport' },
  correctness: { 'card-1': true, 'card-2': false },
  hintsUsed: { 'card-1': 0, 'card-2': 1 },
};

describe('updateStatsFromAttempt', () => {
  it('updates card stats per card and target language', () => {
    const stats = updateStatsFromAttempt([], attempt);

    expect(stats).toEqual([
      expect.objectContaining({
        cardId: 'card-1',
        targetLanguage: 'en',
        attempts: 1,
        correct: 1,
        accuracy: 1,
      }),
      expect.objectContaining({
        cardId: 'card-2',
        targetLanguage: 'en',
        attempts: 1,
        incorrect: 1,
        hintsUsed: 1,
        accuracy: 0,
      }),
    ]);
  });
});
```

- [ ] **Step 2: Add coach tests**

Create `src/domain/__tests__/coach.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildCoachComment } from '../coach';
import { CardStats } from '../stats';

describe('buildCoachComment', () => {
  it('reports repeated weak cards in a strict style', () => {
    const stats: CardStats[] = [
      {
        cardId: 'card-1',
        targetLanguage: 'en',
        attempts: 4,
        correct: 1,
        incorrect: 3,
        hintsUsed: 2,
        accuracy: 0.25,
        recentMistakes: 2,
        lastPracticedAt: '2026-07-03T00:00:00.000Z',
        stability: 'weak',
      },
    ];

    const comment = buildCoachComment({
      interfaceLanguage: 'en',
      targetLanguage: 'en',
      cardStats: stats,
      correctCount: 2,
      totalCount: 4,
    });

    expect(comment).toContain('Accuracy: 50%');
    expect(comment).toContain('Weak cards: 1');
  });
});
```

- [ ] **Step 3: Run failing coach test**

Run:

```bash
npm test -- src/domain/__tests__/stats.test.ts src/domain/__tests__/coach.test.ts
```

Expected: stats may pass, coach fails because `coach.ts` does not exist.

- [ ] **Step 4: Implement coach module**

Create `src/domain/coach.ts`:

```ts
import { SupportedLanguage } from './languages';
import { CardStats } from './stats';

export function buildCoachComment(input: {
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  cardStats: CardStats[];
  correctCount: number;
  totalCount: number;
}): string {
  const percent =
    input.totalCount === 0
      ? 0
      : Math.round((input.correctCount / input.totalCount) * 100);
  const weakCount = input.cardStats.filter(
    (stat) =>
      stat.targetLanguage === input.targetLanguage && stat.stability === 'weak',
  ).length;

  if (input.interfaceLanguage === 'ru') {
    return `Точность: ${percent}%. Слабые карточки: ${weakCount}. Повтори их перед новой темой.`;
  }

  if (input.interfaceLanguage === 'es') {
    return `Precisión: ${percent}%. Tarjetas débiles: ${weakCount}. Repítelas antes de una nueva tema.`;
  }

  return `Accuracy: ${percent}%. Weak cards: ${weakCount}. Repeat them before starting a new theme.`;
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- src/domain/__tests__/stats.test.ts src/domain/__tests__/coach.test.ts
npm run build
```

Expected: tests and build pass.

## Task 8: Build i18n Dictionary And App Shell UI

**Files:**

- Create: `src/domain/i18n.ts`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/LanguageSelectors.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add i18n strings**

Create `src/domain/i18n.ts`:

```ts
import { SupportedLanguage } from './languages';

type I18nKey =
  | 'appName'
  | 'themes'
  | 'history'
  | 'interfaceLanguage'
  | 'targetLanguage'
  | 'importCards'
  | 'startLearning';

const messages: Record<SupportedLanguage, Record<I18nKey, string>> = {
  en: {
    appName: 'Language Crossword Lab',
    themes: 'Themes',
    history: 'History',
    interfaceLanguage: 'Interface',
    targetLanguage: 'Target',
    importCards: 'Import cards',
    startLearning: 'Start learning',
  },
  ru: {
    appName: 'Language Crossword Lab',
    themes: 'Темы',
    history: 'История',
    interfaceLanguage: 'Интерфейс',
    targetLanguage: 'Цель',
    importCards: 'Импорт карточек',
    startLearning: 'Начать учиться',
  },
  es: {
    appName: 'Language Crossword Lab',
    themes: 'Temas',
    history: 'Historial',
    interfaceLanguage: 'Interfaz',
    targetLanguage: 'Objetivo',
    importCards: 'Importar tarjetas',
    startLearning: 'Empezar',
  },
};

export function t(language: SupportedLanguage, key: I18nKey): string {
  return messages[language][key];
}
```

- [ ] **Step 2: Add language selectors**

Create `src/components/LanguageSelectors.tsx`:

```tsx
import { Button, Menu, MenuItem, Stack } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { languageFlags, languageLabels, SupportedLanguage, supportedLanguages } from '../domain/languages';
import { t } from '../domain/i18n';
import { setInterfaceLanguage, setTargetLanguage } from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';

export function LanguageSelectors() {
  const dispatch = useDispatch<AppDispatch>();
  const { interfaceLanguage, targetLanguage } = useSelector(
    (state: RootState) => state.app,
  );
  const [menu, setMenu] = useState<'interface' | 'target' | null>(null);

  const selectedLanguage = menu === 'interface' ? interfaceLanguage : targetLanguage;

  function selectLanguage(language: SupportedLanguage) {
    if (menu === 'interface') {
      dispatch(setInterfaceLanguage(language));
    }
    if (menu === 'target') {
      dispatch(setTargetLanguage(language));
    }
    setMenu(null);
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button variant="contained" color="secondary" onClick={() => setMenu('interface')}>
        {languageFlags[interfaceLanguage]} {t(interfaceLanguage, 'interfaceLanguage')}:{' '}
        {languageLabels[interfaceLanguage]}
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setMenu('target')}>
        {languageFlags[targetLanguage]} {t(interfaceLanguage, 'targetLanguage')}:{' '}
        {languageLabels[targetLanguage]}
      </Button>
      <Menu
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 72, left: window.innerWidth - 240 }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language}
            selected={language === selectedLanguage}
            onClick={() => selectLanguage(language)}
          >
            {languageFlags[language]} {languageLabels[language]}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
```

- [ ] **Step 3: Add app shell**

Create `src/components/AppShell.tsx`:

```tsx
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { LanguageSelectors } from './LanguageSelectors';

export function AppShell({ children }: { children: ReactNode }) {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, flexGrow: 1 }}>
            {t(interfaceLanguage, 'appName')}
          </Typography>
          <Button color="inherit">{t(interfaceLanguage, 'themes')}</Button>
          <Button color="inherit">{t(interfaceLanguage, 'history')}</Button>
          <LanguageSelectors />
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
```

- [ ] **Step 4: Use shell in `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { Typography } from '@mui/material';
import { AppShell } from './components/AppShell';

export function App() {
  return (
    <AppShell>
      <Typography variant="h4" component="h1">
        Language Crossword Lab
      </Typography>
    </AppShell>
  );
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 9: Build Import Cards View

**Files:**

- Create: `src/components/ImportCardsView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement import UI**

Create `src/components/ImportCardsView.tsx`:

```tsx
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { importLanguageCards, ImportSummary } from '../domain/importCards';
import { applyImportResult } from '../store/cardsSlice';
import { AppDispatch, RootState } from '../store/store';

export function ImportCardsView() {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const [json, setJson] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function importCards() {
    const result = importLanguageCards({
      existingCards: cards,
      pastedJson: json,
      now: new Date().toISOString(),
    });

    if (result.invalidRecords.some((record) => record.index === -1)) {
      setError(result.invalidRecords[0].reason);
      setSummary(null);
      return;
    }

    dispatch(applyImportResult(result));
    setSummary(result.summary);
    setError(null);
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Import language cards</Typography>
        <TextField
          label="Paste JSON"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          multiline
          minRows={10}
          fullWidth
        />
        <Box>
          <Button variant="contained" onClick={importCards}>
            Import cards
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {summary && (
          <Alert severity="info">
            Added: {summary.added}. Safe merged: {summary.safeMerged}. Pending
            duplicates: {summary.pendingDuplicates}. Invalid: {summary.invalid}.
            Skipped: {summary.skipped}.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Render import UI in `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { Stack } from '@mui/material';
import { AppShell } from './components/AppShell';
import { ImportCardsView } from './components/ImportCardsView';

export function App() {
  return (
    <AppShell>
      <Stack spacing={3}>
        <ImportCardsView />
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 3: Verify**

Run:

```bash
npm test -- src/domain/__tests__/importCards.test.ts
npm run build
```

Expected: tests and build pass.

## Task 10: Build Themes UI

**Files:**

- Create: `src/components/EmptyThemeStarter.tsx`
- Create: `src/components/ThemeListView.tsx`
- Create: `src/components/ThemeDetailView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add empty starter component**

Create `src/components/EmptyThemeStarter.tsx`:

```tsx
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTheme } from '../store/themesSlice';
import { AppDispatch } from '../store/store';

export function EmptyThemeStarter() {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('My first theme');

  function createTheme() {
    const now = new Date().toISOString();
    dispatch(
      addTheme({
        id: `theme-${Date.now()}`,
        name: name.trim() || 'My first theme',
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Create your first theme</Typography>
        <Typography>
          Start by naming a theme, then add language cards and choose an exercise.
        </Typography>
        <TextField
          label="Theme name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button variant="contained" onClick={createTheme}>
          Create theme
        </Button>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Add theme list and detail**

Create `src/components/ThemeListView.tsx`:

```tsx
import { Button, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTheme, selectTheme } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';

export function ThemeListView() {
  const dispatch = useDispatch<AppDispatch>();
  const { themes, selectedThemeId } = useSelector((state: RootState) => state.themes);
  const [name, setName] = useState('');

  function createTheme() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const now = new Date().toISOString();
    dispatch(
      addTheme({
        id: `theme-${Date.now()}`,
        name: trimmed,
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
    setName('');
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Themes</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            label="New theme"
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={createTheme}>
            Add
          </Button>
        </Stack>
        <List dense>
          {themes.map((theme) => (
            <ListItemButton
              key={theme.id}
              selected={theme.id === selectedThemeId}
              onClick={() => dispatch(selectTheme(theme.id))}
            >
              <ListItemText
                primary={theme.name}
                secondary={`${theme.cardIds.length} cards`}
              />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
```

Create `src/components/ThemeDetailView.tsx`:

```tsx
import { Button, Checkbox, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getCardAnswer } from '../domain/cards';
import { addCardToTheme } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';

export function ThemeDetailView() {
  const dispatch = useDispatch<AppDispatch>();
  const { cards } = useSelector((state: RootState) => state.cards);
  const { themes, selectedThemeId } = useSelector((state: RootState) => state.themes);
  const targetLanguage = useSelector((state: RootState) => state.app.targetLanguage);
  const theme = themes.find((item) => item.id === selectedThemeId);

  if (!theme) {
    return null;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{theme.name}</Typography>
        <Typography>Add cards to this theme.</Typography>
        <List dense>
          {cards.map((card) => {
            const answer = getCardAnswer(card, targetLanguage) ?? 'No target translation';
            const checked = theme.cardIds.includes(card.id);
            return (
              <ListItemButton
                key={card.id}
                onClick={() =>
                  dispatch(
                    addCardToTheme({
                      themeId: theme.id,
                      cardId: card.id,
                      now: new Date().toISOString(),
                    }),
                  )
                }
              >
                <Checkbox checked={checked} tabIndex={-1} disableRipple />
                <ListItemText primary={answer} secondary={card.tags?.join(', ')} />
              </ListItemButton>
            );
          })}
        </List>
        <Button variant="outlined" disabled={theme.cardIds.length === 0}>
          Choose exercise
        </Button>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 3: Render themes in `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { Grid, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import { AppShell } from './components/AppShell';
import { EmptyThemeStarter } from './components/EmptyThemeStarter';
import { ImportCardsView } from './components/ImportCardsView';
import { ThemeDetailView } from './components/ThemeDetailView';
import { ThemeListView } from './components/ThemeListView';
import { RootState } from './store/store';

export function App() {
  const themes = useSelector((state: RootState) => state.themes.themes);

  return (
    <AppShell>
      <Stack spacing={3}>
        <ImportCardsView />
        {themes.length === 0 ? (
          <EmptyThemeStarter />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ThemeListView />
            </Grid>
            <Grid item xs={12} md={8}>
              <ThemeDetailView />
            </Grid>
          </Grid>
        )}
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 11: Build Exercise Picker And Exercise UI Components

**Files:**

- Create: `src/components/ExercisePicker.tsx`
- Create: `src/components/exercises/MultipleChoiceExercise.tsx`
- Create: `src/components/exercises/MissingLettersExercise.tsx`
- Create: `src/components/exercises/MissingWordExercise.tsx`
- Create: `src/components/exercises/CrosswordExercise.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create exercise picker**

Create `src/components/ExercisePicker.tsx`:

```tsx
import { Button, Paper, Stack, Typography } from '@mui/material';
import { ExerciseType } from '../domain/exercises';

const exerciseOptions: Array<{ type: ExerciseType; label: string }> = [
  { type: 'crossword', label: 'Crossword' },
  { type: 'multipleChoice', label: 'Question with 3 answers' },
  { type: 'missingLetters', label: 'Missing letters' },
  { type: 'missingWord', label: 'Missing word in sentence' },
];

export function ExercisePicker({
  onPick,
}: {
  onPick: (exerciseType: ExerciseType) => void;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Choose exercise</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {exerciseOptions.map((option) => (
            <Button
              key={option.type}
              variant="contained"
              onClick={() => onPick(option.type)}
            >
              {option.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Create minimal exercise components**

Create `src/components/exercises/MultipleChoiceExercise.tsx`:

```tsx
import { Button, Paper, Stack, Typography } from '@mui/material';
import { MultipleChoicePrompt } from '../../domain/exercises';

export function MultipleChoiceExercise({
  prompt,
  onAnswer,
}: {
  prompt: MultipleChoicePrompt;
  onAnswer: (answer: string) => void;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Question</Typography>
        <Typography>{prompt.prompt}</Typography>
        {prompt.definitionHint && <Typography>{prompt.definitionHint}</Typography>}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {prompt.options.map((option) => (
            <Button key={option} variant="outlined" onClick={() => onAnswer(option)}>
              {option}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
```

Create `src/components/exercises/MissingLettersExercise.tsx`:

```tsx
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { MissingLettersPrompt } from '../../domain/exercises';

export function MissingLettersExercise({
  prompt,
  onAnswer,
}: {
  prompt: MissingLettersPrompt;
  onAnswer: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState('');
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Missing letters</Typography>
        <Typography>{prompt.prompt}</Typography>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 24 }}>
          {prompt.maskedAnswer}
        </Typography>
        <TextField label="Answer" value={answer} onChange={(event) => setAnswer(event.target.value)} />
        <Button variant="contained" onClick={() => onAnswer(answer)}>
          Submit
        </Button>
      </Stack>
    </Paper>
  );
}
```

Create `src/components/exercises/MissingWordExercise.tsx`:

```tsx
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { MissingWordPrompt } from '../../domain/exercises';

export function MissingWordExercise({
  prompt,
  onAnswer,
}: {
  prompt: MissingWordPrompt;
  onAnswer: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState('');
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Missing word</Typography>
        <Typography>{prompt.sentenceWithGap}</Typography>
        <TextField label="Answer" value={answer} onChange={(event) => setAnswer(event.target.value)} />
        <Button variant="contained" onClick={() => onAnswer(answer)}>
          Submit
        </Button>
      </Stack>
    </Paper>
  );
}
```

Create `src/components/exercises/CrosswordExercise.tsx`:

```tsx
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { CrosswordPuzzle } from '../../domain/crossword';

export function CrosswordExercise({
  puzzle,
  onSubmit,
}: {
  puzzle: CrosswordPuzzle;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Crossword</Typography>
        <Typography>
          {puzzle.mode === 'phrase'
            ? 'Single phrase challenge'
            : 'Up to 6 words from the selected theme'}
        </Typography>
        {puzzle.entries.map((entry) => (
          <TextField
            key={entry.cardId}
            label={entry.clue || 'Answer'}
            value={answers[entry.cardId] ?? ''}
            onChange={(event) =>
              setAnswers((current) => ({
                ...current,
                [entry.cardId]: event.target.value,
              }))
            }
          />
        ))}
        <Button variant="contained" onClick={() => onSubmit(answers)}>
          Submit crossword
        </Button>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 3: Wire exercise selection in `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { Alert, Grid, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppShell } from './components/AppShell';
import { EmptyThemeStarter } from './components/EmptyThemeStarter';
import { ExercisePicker } from './components/ExercisePicker';
import { ImportCardsView } from './components/ImportCardsView';
import { ThemeDetailView } from './components/ThemeDetailView';
import { ThemeListView } from './components/ThemeListView';
import { CrosswordExercise } from './components/exercises/CrosswordExercise';
import { MissingLettersExercise } from './components/exercises/MissingLettersExercise';
import { MissingWordExercise } from './components/exercises/MissingWordExercise';
import { MultipleChoiceExercise } from './components/exercises/MultipleChoiceExercise';
import { createCrossword } from './domain/crossword';
import {
  ExerciseType,
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from './domain/exercises';
import { RootState } from './store/store';

export function App() {
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType>('crossword');
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const cards = useSelector((state: RootState) => state.cards.cards);
  const themes = useSelector((state: RootState) => state.themes.themes);
  const selectedThemeId = useSelector(
    (state: RootState) => state.themes.selectedThemeId,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );

  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId);
  const themeCards = selectedTheme
    ? cards.filter((card) => selectedTheme.cardIds.includes(card.id))
    : [];
  const eligibleCards = getEligibleCardsForTarget(themeCards, targetLanguage);

  const exercisePreview = useMemo(() => {
    const firstCard = eligibleCards[0];
    if (!firstCard) {
      return null;
    }

    if (selectedExerciseType === 'crossword') {
      return {
        type: 'crossword' as const,
        puzzle: createCrossword({ cards: eligibleCards, targetLanguage }),
      };
    }

    if (selectedExerciseType === 'multipleChoice') {
      return {
        type: 'multipleChoice' as const,
        prompt: createMultipleChoicePrompt({
          card: firstCard,
          distractorCards: eligibleCards.slice(1),
          targetLanguage,
        }),
      };
    }

    if (selectedExerciseType === 'missingLetters') {
      return {
        type: 'missingLetters' as const,
        prompt: createMissingLettersPrompt({
          card: firstCard,
          targetLanguage,
        }),
      };
    }

    return {
      type: 'missingWord' as const,
      prompt: createMissingWordPrompt({
        card: firstCard,
        targetLanguage,
      }),
    };
  }, [eligibleCards, selectedExerciseType, targetLanguage]);

  function renderExercise() {
    if (!selectedTheme) {
      return null;
    }

    if (eligibleCards.length === 0) {
      return (
        <Alert severity="warning">
          This theme has no cards eligible for the selected target language.
        </Alert>
      );
    }

    if (!exercisePreview) {
      return null;
    }

    if (exercisePreview.type === 'crossword') {
      return (
        <CrosswordExercise
          puzzle={exercisePreview.puzzle}
          onSubmit={(answers) => setLastAnswer(JSON.stringify(answers))}
        />
      );
    }

    if (exercisePreview.type === 'multipleChoice') {
      return (
        <MultipleChoiceExercise
          prompt={exercisePreview.prompt}
          onAnswer={setLastAnswer}
        />
      );
    }

    if (exercisePreview.type === 'missingLetters') {
      return (
        <MissingLettersExercise
          prompt={exercisePreview.prompt}
          onAnswer={setLastAnswer}
        />
      );
    }

    if (!exercisePreview.prompt) {
      return (
        <Alert severity="info">
          This exercise needs a target-language example sentence.
        </Alert>
      );
    }

    return (
      <MissingWordExercise
        prompt={exercisePreview.prompt}
        onAnswer={setLastAnswer}
      />
    );
  }

  return (
    <AppShell>
      <Stack spacing={3}>
        <ImportCardsView />
        {themes.length === 0 ? (
          <EmptyThemeStarter />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <ThemeListView />
                <ExercisePicker onPick={setSelectedExerciseType} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <ThemeDetailView />
                {renderExercise()}
                {lastAnswer && (
                  <Alert severity="info">Last answer: {lastAnswer}</Alert>
                )}
              </Stack>
            </Grid>
          </Grid>
        )}
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 12: Save Exercise Attempts, Update Stats, And Show History

**Files:**

- Create: `src/components/HistoryView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/store/attemptsSlice.ts`
- Modify: `src/store/statsSlice.ts`

- [ ] **Step 1: Implement history component**

Create `src/components/HistoryView.tsx`:

```tsx
import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export function HistoryView() {
  const targetLanguage = useSelector((state: RootState) => state.app.targetLanguage);
  const attempts = useSelector((state: RootState) =>
    state.attempts.attempts.filter(
      (attempt) => attempt.targetLanguage === targetLanguage,
    ),
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">History</Typography>
        <List dense>
          {attempts.map((attempt) => (
            <ListItem key={attempt.id}>
              <ListItemText
                primary={`${attempt.exerciseType} / ${attempt.targetLanguage}`}
                secondary={`${attempt.completedAt ?? attempt.createdAt} / score ${
                  attempt.weightedScore ?? 0
                }`}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Add save flow in `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { Alert, Grid, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppShell } from './components/AppShell';
import { EmptyThemeStarter } from './components/EmptyThemeStarter';
import { ExercisePicker } from './components/ExercisePicker';
import { HistoryView } from './components/HistoryView';
import { ImportCardsView } from './components/ImportCardsView';
import { ThemeDetailView } from './components/ThemeDetailView';
import { ThemeListView } from './components/ThemeListView';
import { CrosswordExercise } from './components/exercises/CrosswordExercise';
import { MissingLettersExercise } from './components/exercises/MissingLettersExercise';
import { MissingWordExercise } from './components/exercises/MissingWordExercise';
import { MultipleChoiceExercise } from './components/exercises/MultipleChoiceExercise';
import { createCardSnapshot } from './domain/cards';
import { CrosswordPuzzle, createCrossword } from './domain/crossword';
import {
  ExerciseAttempt,
  ExercisePrompt,
  ExerciseType,
  createMissingLettersPrompt,
  createMissingWordPrompt,
  createMultipleChoicePrompt,
  getEligibleCardsForTarget,
} from './domain/exercises';
import { buildCoachComment } from './domain/coach';
import { saveAttempt } from './store/attemptsSlice';
import { recordAttemptStats } from './store/statsSlice';
import { AppDispatch, RootState } from './store/store';

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedExerciseType, setSelectedExerciseType] =
    useState<ExerciseType>('crossword');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const cards = useSelector((state: RootState) => state.cards.cards);
  const themes = useSelector((state: RootState) => state.themes.themes);
  const selectedThemeId = useSelector(
    (state: RootState) => state.themes.selectedThemeId,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const cardStats = useSelector((state: RootState) => state.stats.cardStats);

  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId);
  const themeCards = selectedTheme
    ? cards.filter((card) => selectedTheme.cardIds.includes(card.id))
    : [];
  const eligibleCards = getEligibleCardsForTarget(themeCards, targetLanguage);

  const exercisePreview = useMemo(() => {
    const firstCard = eligibleCards[0];
    if (!firstCard) {
      return null;
    }

    if (selectedExerciseType === 'crossword') {
      return {
        type: 'crossword' as const,
        puzzle: createCrossword({ cards: eligibleCards, targetLanguage }),
      };
    }

    if (selectedExerciseType === 'multipleChoice') {
      return {
        type: 'multipleChoice' as const,
        prompt: createMultipleChoicePrompt({
          card: firstCard,
          distractorCards: eligibleCards.slice(1),
          targetLanguage,
        }),
      };
    }

    if (selectedExerciseType === 'missingLetters') {
      return {
        type: 'missingLetters' as const,
        prompt: createMissingLettersPrompt({
          card: firstCard,
          targetLanguage,
        }),
      };
    }

    return {
      type: 'missingWord' as const,
      prompt: createMissingWordPrompt({
        card: firstCard,
        targetLanguage,
      }),
    };
  }, [eligibleCards, selectedExerciseType, targetLanguage]);

  function savePromptAttempt(
    exerciseType: Exclude<ExerciseType, 'crossword'>,
    prompt: ExercisePrompt,
    answer: string,
  ) {
    const correctness = {
      [prompt.cardId]:
        normalizeAnswer(answer) === normalizeAnswer(prompt.expectedAnswer),
    };
    persistAttempt({
      exerciseType,
      prompts: [prompt],
      answers: { [prompt.cardId]: answer },
      correctness,
      hintsUsed: { [prompt.cardId]: 0 },
      cardIds: [prompt.cardId],
    });
  }

  function saveCrosswordAttempt(
    puzzle: CrosswordPuzzle,
    answers: Record<string, string>,
  ) {
    const prompts: ExercisePrompt[] = puzzle.entries.map((entry) => ({
      cardId: entry.cardId,
      prompt: entry.clue,
      expectedAnswer: entry.answer,
      translationHints: [],
    }));
    const correctness = Object.fromEntries(
      puzzle.entries.map((entry) => [
        entry.cardId,
        normalizeAnswer(answers[entry.cardId] ?? '') ===
          normalizeAnswer(entry.answer),
      ]),
    );
    const hintsUsed = Object.fromEntries(
      puzzle.entries.map((entry) => [entry.cardId, 0]),
    );

    persistAttempt({
      exerciseType: 'crossword',
      prompts,
      answers,
      correctness,
      hintsUsed,
      cardIds: puzzle.entries.map((entry) => entry.cardId),
    });
  }

  function persistAttempt(input: {
    exerciseType: ExerciseType;
    prompts: ExercisePrompt[];
    answers: Record<string, string>;
    correctness: Record<string, boolean>;
    hintsUsed: Record<string, number>;
    cardIds: string[];
  }) {
    if (!selectedTheme) {
      return;
    }

    const now = new Date().toISOString();
    const correctCount = Object.values(input.correctness).filter(Boolean).length;
    const totalCount = Object.keys(input.correctness).length;
    const coachComment = buildCoachComment({
      interfaceLanguage,
      targetLanguage,
      cardStats,
      correctCount,
      totalCount,
    });
    const attempt: ExerciseAttempt = {
      id: `attempt-${Date.now()}`,
      exerciseType: input.exerciseType,
      themeId: selectedTheme.id,
      targetLanguage,
      createdAt: now,
      completedAt: now,
      cardSnapshots: themeCards
        .filter((card) => input.cardIds.includes(card.id))
        .map(createCardSnapshot),
      prompts: input.prompts,
      answers: input.answers,
      correctness: input.correctness,
      hintsUsed: input.hintsUsed,
      weightedScore: calculateWeightedScore(input.correctness),
      coachComment,
    };

    dispatch(saveAttempt(attempt));
    dispatch(recordAttemptStats(attempt));
    setLastResult(coachComment);
  }

  function renderExercise() {
    if (!selectedTheme) {
      return null;
    }

    if (eligibleCards.length === 0) {
      return (
        <Alert severity="warning">
          This theme has no cards eligible for the selected target language.
        </Alert>
      );
    }

    if (!exercisePreview) {
      return null;
    }

    if (exercisePreview.type === 'crossword') {
      return (
        <CrosswordExercise
          puzzle={exercisePreview.puzzle}
          onSubmit={(answers) =>
            saveCrosswordAttempt(exercisePreview.puzzle, answers)
          }
        />
      );
    }

    if (exercisePreview.type === 'multipleChoice') {
      return (
        <MultipleChoiceExercise
          prompt={exercisePreview.prompt}
          onAnswer={(answer) =>
            savePromptAttempt('multipleChoice', exercisePreview.prompt, answer)
          }
        />
      );
    }

    if (exercisePreview.type === 'missingLetters') {
      return (
        <MissingLettersExercise
          prompt={exercisePreview.prompt}
          onAnswer={(answer) =>
            savePromptAttempt('missingLetters', exercisePreview.prompt, answer)
          }
        />
      );
    }

    if (!exercisePreview.prompt) {
      return (
        <Alert severity="info">
          This exercise needs a target-language example sentence.
        </Alert>
      );
    }

    return (
      <MissingWordExercise
        prompt={exercisePreview.prompt}
        onAnswer={(answer) =>
          savePromptAttempt('missingWord', exercisePreview.prompt, answer)
        }
      />
    );
  }

  return (
    <AppShell>
      <Stack spacing={3}>
        <ImportCardsView />
        {themes.length === 0 ? (
          <EmptyThemeStarter />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <ThemeListView />
                <ExercisePicker onPick={setSelectedExerciseType} />
                <HistoryView />
              </Stack>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <ThemeDetailView />
                {renderExercise()}
                {lastResult && <Alert severity="info">{lastResult}</Alert>}
              </Stack>
            </Grid>
          </Grid>
        )}
      </Stack>
    </AppShell>
  );
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function calculateWeightedScore(correctness: Record<string, boolean>): number {
  const total = Object.keys(correctness).length;
  if (total === 0) {
    return 0;
  }
  const correct = Object.values(correctness).filter(Boolean).length;
  return Math.round((correct / total) * 100);
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

## Task 13: Add Coach Panel And Final UI Polish

**Files:**

- Create: `src/components/CoachPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add coach panel component**

Create `src/components/CoachPanel.tsx`:

```tsx
import { Box, Paper, Stack, Typography } from '@mui/material';

export function CoachPanel({ comment }: { comment: string }) {
  return (
    <Paper sx={{ p: 2, borderLeft: '4px solid #9cca56' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Box
          aria-label="Sports coach"
          sx={{
            width: 96,
            height: 116,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            textAlign: 'center',
          }}
        >
          COACH
        </Box>
        <Box>
          <Typography variant="overline">Coach</Typography>
          <Typography>{comment}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Render coach panel**

In `App.tsx`, derive the latest target-language attempt and render:

```tsx
<CoachPanel comment={latestAttempt?.coachComment ?? 'Select a theme and start a drill.'} />
```

- [ ] **Step 3: Verify responsive layout**

Run:

```bash
npm run build
npm run dev
```

Open the local URL and manually verify:

- header has interface and target language selectors with labels;
- no-theme state guides directly into theme creation;
- import paste field is visible;
- theme list and theme detail are visible after creating a theme;
- coach panel is visible;
- layout does not overlap on a narrow browser width.

Stop the dev server after checking.

## Task 14: Documentation Update

**Files:**

- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/APP_REQUIREMENTS.md`

- [ ] **Step 1: Update README status and run instructions**

Add sections that state:

```markdown
## Current Status

The repository now contains the initial React MVP implementation.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Test

```bash
npm test
npm run build
```
```

- [ ] **Step 2: Update architecture**

Add Redux Toolkit, Redux Persist, language cards, themes, exercise attempts, target/interface language settings, and duplicate processing to `ARCHITECTURE.md`.

- [ ] **Step 3: Update app requirements**

Add the current MVP decisions to `docs/APP_REQUIREMENTS.md`:

- language cards;
- paste JSON import;
- safe merge and pending duplicates;
- persistent themes;
- global target language;
- separate interface language;
- exercise modes;
- card and attempt statistics.

- [ ] **Step 4: Verify docs and build**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests pass, build passes, and `git diff --check` reports no whitespace errors.

## Final Verification

Run all verification commands:

```bash
npm test
npm run build
git status --short
```

Expected:

- all tests pass;
- production build succeeds;
- `git status --short` shows only intended changes;
- no changes to `TASK_REQUIREMENTS.md`.

Do not commit or push unless the user explicitly asks.
