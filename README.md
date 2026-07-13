# Language Lab

Language Lab is a local-first browser game for building and practicing a personal multilingual vocabulary library. The learner owns the content: they import or generate language cards, organize them into card sets, choose a target language, and play short games that produce per-card and per-game learning statistics.



Current release: `0.1.0-alpha.1`



## What The App Does

Language Lab is built around three ideas:

- the learner is both the player and the teacher;
- card sets are lightweight learning collections that can be created, edited, archived, and reused;
- every game result feeds future practice ordering and statistics.

The app currently supports Russian, English, Spanish, and Ukrainian. The interface language and target language are separate settings, so a learner can practice English while keeping the UI in Russian, or switch the UI into the target language for extra exposure.

All application data is stored in the browser through Redux Persist and `localStorage`. There is no backend requirement for the current alpha.

## Core Features

- Card library with the permanent **All cards** set and user-created card sets.
- Built-in default vocabulary seed with words and phrases grouped into starter sets.
- Manual JSON import for language cards using the documented card format.
- Duplicate detection by matching translation values, safe merging of missing data, pending duplicate records, and duplicate processing history.
- Active and archived card-set browsing. Archived sets stay available for history and can be used as sources for new active sets.
- Large-library performance support through indexed lookups and virtualized card lists.
- Per-card **I know this** marker that excludes mastered cards from games until the marker is removed.
- Separate target-language statistics and game history.
- Playful assistant characters, tooltips, onboarding help, player greeting, and responsive game UI.

## Games

The alpha includes four playable game modes:

- **Crossword**: generated from a selected card set, with real horizontal and vertical intersections.
- **Question with 3 variants**: one prompt and three answer choices.
- **Missing letters**: single-word cards rendered as one-letter cells.
- **Missing word**: phrase cards where the missing word is filled inside the sentence-like card view.

Games are generated from one selected card set. Results are saved by target language and include answered cards, correctness, user answers, crossword layouts, and recent answer history. A game can be finished early; completed work is still counted according to the game rules.

## Statistics And Practice Ordering

Statistics are tracked per card and per target language. The app keeps both aggregate counters and recent answer history so it can show:

- total games completed;
- total cards answered;
- correct and incorrect answer counts;
- recent answer chips and tooltips;
- full crossword replay in the statistics page;
- per-card accuracy signals across games.

Practice ordering prioritizes cards with recent mistakes, then new cards, then stable cards. Cooldown settings can delay cards that have been answered correctly several times in a row. This is intentionally data-driven so later analytics can become more sophisticated without throwing away existing attempts.

## AI Chat Assistant

Language Lab includes an AI chat assistant for controlled card-library work. The chat lives in its own app tab and is also reachable from magic-wand buttons near the game and card-library sections.

The assistant uses OpenRouter from the browser. The app includes a limited built-in trial key and also lets the learner save a personal OpenRouter key in local browser storage. Keys are stored unencrypted in this browser profile, so use a restricted key and avoid high-value account credentials.

The default model is `deepseek/deepseek-v4-flash`. The model menu also includes `openai/gpt-5.5`, which is disabled while the built-in trial key is selected and becomes available when the learner saves their own key.

The assistant can:

- answer questions about the current card library, card sets, recent games, and learning statistics;
- use recent chat history to resolve references such as "these cards";
- search cards and read paginated card-set contents;
- create multilingual cards from a word or phrase list;
- create, update, rename, and archive card sets;
- propose membership changes for card sets;
- render markdown responses, including headings, lists, emphasis, and tables.

The assistant cannot apply writes directly. Any write request must produce a staged operation preview inside the chat. The learner then chooses **Apply changes** or cancels the preview. Applied operations are recorded in operation history and can be rolled back when no later conflicting edits changed the same entities.

Manual JSON import remains available as a non-AI fallback. The assistant uses the same card-quality rules described in [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md).

## Data Format

Language cards are documented in [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md). That file is intended for both external LLM agents and the in-app AI assistant skill context.

The app creates internal card ids. Imported JSON should not provide ids.

Minimal card example:

```json
[
  {
    "translations": {
      "ru": "аэропорт",
      "en": "airport",
      "es": "aeropuerto"
    },
    "definitions": {
      "en": "A place where airplanes take off, land, and passengers travel through."
    },
    "tags": ["travel"],
    "difficulty": "easy"
  }
]
```

## Planned Vocabulary Capture Tool

The product specification also includes a future vocabulary capture tool. A learner will paste free-form text, and the app will create a JSON document containing every extracted word and the input date. This data is intended to support detailed knowledge analytics later.

Minimal planned capture shape:

```json
{
  "inputDate": "2026-07-03",
  "words": ["airport", "ticket", "train"]
}
```

## Tech Stack

- React 18, TypeScript, Vite, and MUI.
- Redux Toolkit and Redux Persist for local application state.
- OpenRouter chat completions for the optional AI assistant.
- Zod for AI operation and tool schemas.
- TanStack Virtual for large card lists.
- Vitest, Testing Library, and Playwright for verification.

## Setup

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

## Testing

The short commands are:

```bash
npm test
npm run lint
npm run test:e2e
```

The full testing strategy, test layers, snapshot workflow, and recommended commands are documented in [docs/TESTING.md](docs/TESTING.md).

## Documentation

- [SPEC.md](SPEC.md) describes product behavior and future direction.
- [ARCHITECTURE.md](ARCHITECTURE.md) describes the implementation structure.
- [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md) captures detailed app requirements.
- [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md) is the card authoring guide for humans and LLM agents.
- [docs/TESTING.md](docs/TESTING.md) explains the test suite and verification workflow.
- [docs/superpowers/specs/2026-07-11-ai-card-library-assistant-design.md](docs/superpowers/specs/2026-07-11-ai-card-library-assistant-design.md) records the AI assistant design contract.
- [docs/superpowers/specs/2026-07-11-exercise-feedback-and-crossword-history-design.md](docs/superpowers/specs/2026-07-11-exercise-feedback-and-crossword-history-design.md) records the exercise feedback and crossword replay design.
