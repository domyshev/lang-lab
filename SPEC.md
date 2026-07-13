# Specification



Detailed application requirements: [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md)

## Project Goal

Build a small but complete browser language-learning game where learners create their own practice material from JSON language cards, organize cards into card sets, and practice through generated exercises.

The first implementation focuses on Russian, English, Spanish, and Ukrainian. The architecture should remain language-card based rather than hard-coded to one source-target pair.

## Core Concept

The learner is both student and teacher.

They can:

- import language cards;
- create many card sets;
- add cards to card sets;
- choose a target language;
- practice generated exercises;
- review target-language history and statistics.

## Supported Languages

The first version supports:

- Russian;
- English;
- Spanish;
- Ukrainian.

The target language can be any supported language. A card is usable for a target language only when it has a target-language answer and enough hint data.

## Language Settings

The application has two separate language settings:

- interface language;
- target language.

The interface language controls UI text and coach comments. The target language controls exercises, history, and statistics.

## Language Card Format

A language card represents one learning unit: a word, phrase, or short expression.

Cards contain:

- translations for at least two supported languages;
- optional definitions;
- optional example sentences;
- optional tags;
- optional difficulty.

The app creates internal ids. Imported JSON does not need ids.

The LLM-facing card authoring guide is [docs/LANGUAGE_CARD_FORMAT.md](docs/LANGUAGE_CARD_FORMAT.md).

## Import Rules

The app imports cards from pasted JSON.

Requirements:

- add valid cards;
- keep importing valid records even when other records are invalid;
- detect duplicates by any matching translation value;
- safely merge missing duplicate information;
- record safe merge history;
- store conflicting duplicate records in pending duplicates;
- persist all imported and duplicate-processing data locally.

## Card Sets

Card sets are learner-created card groups.

Requirements:

- a learner can create many card sets;
- card sets persist locally;
- a card set may contain words and phrases together;
- each exercise is generated from exactly one selected card set;
- when no card sets exist, the app should guide directly into card set creation.

Card sets are intended as flexible short-term learning focus areas rather than permanent taxonomy. A later version may add an optional topic label to a card set, but a card set must remain valid without one.

## Exercise Modes

The MVP includes:

1. Crossword.
2. Question with three answer variants.
3. Missing letters.
4. Missing word or phrase in a sentence.

All exercise modes use the same language cards and selected target language.

## Crossword Rules

Crosswords are generated from one card set.

Rules:

- if a crossword uses a phrase, it contains only that phrase;
- if a crossword uses separate words, it contains up to six cards;
- a crossword must not mix phrases and separate words;
- generated order should be randomized and independent from previous history.

## Hints

For a target-language exercise:

- translation hints come from the other available languages;
- definition hints come only from the current target language.

Example: if the target language is English, hints may include Russian, Spanish, and Ukrainian translations plus an English definition.

## History And Statistics

Every submitted exercise creates an attempt record.

History is scoped by target language. When the target language is English, the learner sees English practice history. When it is Spanish, Russian, or Ukrainian, history changes to that target language.

The app tracks:

- per-card target-language accuracy;
- per-card stability;
- exercise-level weighted score;
- submitted answers and correctness;
- coach feedback for the attempt.

The weighted exercise score should treat a new-card mistake less severely than another mistake on a card that has already been weak several times.

## Coach Assistant

The app includes a persistent strict sports-coach assistant.

The coach should:

- be visible as a character image;
- use concise analytics-style feedback;
- mention accuracy and weak cards;
- avoid empty generic encouragement.

The MVP uses deterministic local analytics. Future versions may use an LLM-backed coach.

## Vocabulary Capture Tool

The game should include a future tool that turns free-form text into vocabulary JSON.

The tool should:

- accept pasted or typed text;
- extract all words from the text;
- store the input date;
- create a JSON document that can support later learning analytics.

Minimal planned capture document:

```json
{
  "inputDate": "2026-07-03",
  "words": ["airport", "ticket", "train"]
}
```

This data should later help analyze a learner's vocabulary knowledge, repeated words, gaps, and learning progress.

## Scope

### In Scope For MVP

- TypeScript React application with MUI.
- Redux Toolkit application state.
- Redux Persist over `localStorage`.
- JSON language card import.
- Duplicate detection, safe merge, and pending duplicates.
- Learner-created persistent card sets.
- Target and interface language settings.
- Four exercise modes.
- Target-language scoped history.
- Per-card statistics.
- Weighted exercise score.
- Strict sports-coach assistant.

### Out Of Scope For MVP

- backend services;
- secure authentication;
- shared accounts;
- in-app LLM card generation;
- backend AI duplicate review;
- arcade modules such as slalom, racing, or snowball games;
- full analytics dashboard;
- mobile-native app.

Arcade modules can be added later as separate modules that reuse the same card set, attempt, and statistics model.

## Acceptance Criteria

- A learner can import valid language-card JSON.
- Invalid import records do not block valid records.
- Duplicate cards are detected by any translation match.
- Safe duplicate data is merged and recorded.
- Conflicting duplicates are persisted as pending.
- A learner can create and persist multiple card sets.
- A learner can add cards to a selected card set.
- A learner can switch target language.
- Exercises use only cards eligible for the current target language.
- The learner can submit each MVP exercise type.
- Submitted attempts are saved to `localStorage`.
- History is filtered by target language.
- Card statistics update after submitted attempts.
- The coach assistant is visible and uses statistics-aware feedback.
- Tests and production build pass.
