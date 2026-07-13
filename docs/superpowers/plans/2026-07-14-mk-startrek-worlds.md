# Mortal Kombat And Star Trek Worlds Implementation Plan

> **Execution note:** The user requested an uninterrupted pass without clarification. Work was completed directly in this branch and verified before commit.

**Goal:** Add Mortal Kombat and Star Trek as complete selectable application worlds.

**Architecture:** Extend the existing world registry in `src/domain/worlds.ts`, reuse the current world-aware assistant registry in `src/domain/assistants.ts`, and update AppShell/LanguageSelectors/assistant assets to render the new worlds without hardcoded two-world assumptions.

**Tech Stack:** React, TypeScript, Redux Toolkit, MUI, Vitest.

## Global Constraints

- Do not modify `TASK_REQUIREMENTS.md`.
- Keep tooltips on the project standard readable white/dark backgrounds with arrows.
- Use original genre-inspired assets, not exact third-party character art.

---

### Task 1: Domain Worlds

**Files:**
- Modify: `src/domain/worlds.ts`
- Test: `src/domain/__tests__/worlds.test.ts`

- [x] Add failing tests for `mortalKombat` and `starTrek` labels, accents, result colors, game tile themes, and card-set palettes.
- [x] Implement new world ids, definitions, palettes, result colors, and switch-based getters.
- [x] Run `npm test -- --run src/domain/__tests__/worlds.test.ts --reporter=dot`.

### Task 2: Assistants And Stickers

**Files:**
- Modify: `src/domain/assistants.ts`
- Modify: `src/components/assistantAssets.tsx`
- Create: `src/assets/characters/mk-*.svg`
- Create: `src/assets/characters/trek-*.svg`
- Test: `src/domain/__tests__/assistants.test.ts`

- [x] Add failing tests for four visible assistants in each new world.
- [x] Add localized assistant profiles and map the new worlds to original sticker assets.
- [x] Run `npm test -- --run src/domain/__tests__/assistants.test.ts --reporter=dot`.

### Task 3: UI World Selection

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/LanguageSelectors.tsx`
- Modify: `src/components/PlayerPixelAvatar.tsx`
- Test: `src/components/__tests__/AppShell.test.tsx`
- Test: `src/components/__tests__/LanguageSelectors.test.tsx`

- [x] Add failing tests that first-run setup and settings list all four worlds.
- [x] Replace hardcoded onboarding world buttons with a `worldIds.map` renderer.
- [x] Add world-specific button/icon/app-bar/game-tab/info-icon styling.
- [x] Run affected tests.

### Task 4: Verification And Commit

**Files:**
- All changed files.

- [x] Run `npm run lint`.
- [x] Run focused world/assistant/AppShell/LanguageSelectors tests.
- [x] Run `npm test -- --run --reporter=dot`.
- [ ] Commit with detailed body.
