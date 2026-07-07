# Language Crossword Lab

Language Crossword Lab is a local browser app for building a personal language-learning practice set from JSON language cards. The learner imports cards, groups them into card sets, chooses a target language, and practices with generated drills.



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
- learner-created card sets that persist locally;
- target-language scoped practice history;
- per-card target-language statistics;
- weighted exercise results;
- a strict sports-coach assistant panel.

## Learning Flow

1. Import language cards as JSON.
2. Create one or more card sets.
3. Add imported cards to a card set.
4. Choose a target language.
5. Start a generated exercise from the selected card set.
6. Review the saved attempt in target-language history.

Card sets are intentionally lightweight and learner-owned. A learner can create many card sets and keep them for later, but each exercise is generated from exactly one selected card set.

A later version may let a card set carry an optional topic label. That label should be metadata, not the required identity of the set.

## Exercise Modes

The MVP includes four exercise modes:

- crossword;
- question with three answer variants;
- missing letters in a word or phrase;
- missing word or phrase in a sentence.

Crosswords are generated from a single card set. If a phrase is selected for a crossword, the crossword uses only that phrase. If the crossword uses single words, it includes up to six card set cards.

## Practice Ordering

The cards page sorts cards for the current target language by total practice volume. Cards with the largest number of correct plus incorrect answers appear first. Cards with no recorded attempts appear after practiced cards.

Missing-letters practice uses a separate review order:

1. Cards with recent mistakes are shown first. The app looks at the last five target-language attempts for each card and groups cards by the number of incorrect answers in that recent window. Cards with more recent incorrect answers are prioritized. Cards inside the same mistake group are shuffled by the current generation seed.
2. Cards with no target-language attempts are shown next, shuffled by the current generation seed.
3. Practiced cards with no recent mistakes are shown after new cards, also shuffled.
4. Cards with a fresh correct streak can be cooled down. The default settings are:
   - last 5 or more answers correct: show again after 2 months;
   - last 4 answers correct: show again after 1 month;
   - last 3 answers correct: show again after 0.5 months.

The cooldown values are stored in the persisted app settings and can be changed from the settings menu in the top-right header. The order is reconstructed from saved exercise attempts, not only from aggregate card counters, so future analytics can change the weighting without losing the answer sequence.

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
