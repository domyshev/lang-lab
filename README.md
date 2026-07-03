# Language Crossword Lab

Language Crossword Lab is a local browser app for building a personal language-learning practice set from JSON language cards. The learner imports cards, groups them into temporary themes, chooses a target language, and practices with generated drills.



## Current MVP

The implemented frontend uses:

- React, TypeScript, Vite, and MUI;
- Redux Toolkit for application state;
- Redux Persist and `localStorage` for browser persistence;
- Vitest for domain-level tests.

The current app supports:

- separate interface language and target language selectors;
- Russian, English, and Spanish language cards;
- paste-based JSON import;
- duplicate detection by any matching translation value;
- safe merging of missing duplicate data;
- pending duplicate records for conflicts;
- learner-created themes that persist locally;
- target-language scoped practice history;
- per-card target-language statistics;
- weighted exercise results;
- a strict sports-coach assistant panel.

## Learning Flow

1. Import language cards as JSON.
2. Create one or more themes.
3. Add imported cards to a theme.
4. Choose a target language.
5. Start a generated exercise from the selected theme.
6. Review the saved attempt in target-language history.

Themes are intentionally lightweight and learner-owned. A learner can create many themes and keep them for later, but each exercise is generated from exactly one selected theme.

## Exercise Modes

The MVP includes four exercise modes:

- crossword;
- question with three answer variants;
- missing letters in a word or phrase;
- missing word or phrase in a sentence.

Crosswords are generated from a single theme. If a phrase is selected for a crossword, the crossword uses only that phrase. If the crossword uses single words, it includes up to six theme cards.

## Language Card JSON

Language cards are documented in [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md).

The app creates internal card ids. Imported JSON should not provide ids.

Minimal example:

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

## Setup

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build production assets:

```bash
npm run build
```

## Documentation

- [SPEC.md](SPEC.md) describes the product behavior.
- [ARCHITECTURE.md](ARCHITECTURE.md) describes the implementation structure.
- [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md) captures detailed requirements.
- [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md) is the LLM-facing card authoring guide.
- [RETROSPECTIVE.md](RETROSPECTIVE.md) records the AI-native development process.
