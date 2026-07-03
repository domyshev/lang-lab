# Specification



Detailed application requirements: [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md)

## Project Goal

Build a small but complete educational crossword game for practicing foreign vocabulary. The initial learning direction is Russian clues to English or Spanish answers.

The project should be small enough to complete within the challenge timeframe, but complete enough to demonstrate planning, implementation, testing, documentation, and iteration with AI-assisted development.

## Supported Languages

The first version supports Russian, Spanish, and English.

The application architecture should allow more languages later. The core concept is based on language-independent ideas: source language, target language, clue, answer, word set, puzzle, and attempt. It should not depend on assumptions that only work for Russian, Spanish, or English.

## Game Rules

1. A player enters the application and chooses a display name.
2. The player can type a custom name or choose one of five generated names.
3. The player selects a word set.
4. The application generates a crossword from words in that set.
5. Each crossword clue is shown in Russian for the MVP learning direction.
6. The player fills crossword cells with the English or Spanish answer.
7. The game validates the filled answers.
8. The game records the attempt result in local browser history.

## Player Name Flow

When a player opens the application, the first screen asks for a display name.

The player can:

- enter a custom name manually;
- choose one name from a generated list;
- refresh the generated list.

Generated names use this format:

```text
FunnyAdjective-Surname
```

Examples:

- `Curious-Webster`
- `Brave-Nebrija`
- `Sparkly-Cervantes`

The generated list contains five different names at a time. The "Refresh list" button regenerates the five suggestions.

Surnames come from a planned local JSON file containing 100 known contributors to language development, linguistics, literacy, dictionaries, English learning, or Spanish learning. Detailed requirements for this file are described in [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md).

## Word Set Format

The MVP should support JSON word sets. A minimal item contains:

```json
{
  "word": "airport",
  "clue": "аэропорт"
}
```

A fuller word set may include metadata:

```json
{
  "title": "Basic travel words",
  "sourceLanguage": "ru",
  "targetLanguage": "en",
  "items": [
    {
      "word": "airport",
      "clue": "аэропорт",
      "tags": ["travel"],
      "difficulty": "easy"
    }
  ]
}
```

Only `word` and `clue` are required for the first implementation. Metadata fields are useful for future filtering and learning analytics.

## Vocabulary Capture Tool

The game should include a tool that lets a player paste or type free-form text and turn it into a vocabulary capture JSON document. The tool extracts all words from the submitted text and stores them together with the date of the text submission.

A minimal vocabulary capture document contains:

```json
{
  "inputDate": "2026-06-29",
  "words": ["airport", "ticket", "train"]
}
```

The first version may keep this data local, but the format should be designed so later versions can use it for detailed analytics of the player's vocabulary knowledge, learning history, repeated words, and gaps.

## Scope

### In Scope for MVP

- TypeScript React application using MUI.
- Browser-only persistence through `localStorage`.
- Simple local profile creation by display name.
- Five generated name suggestions on entry.
- "Refresh list" action for generated names.
- A planned local JSON file with 100 contributor records for name generation.
- Store local users, word sets, crossword attempts, and attempt results.
- Generate playable crossword puzzles from a selected word set.
- Support Russian clues and English or Spanish answers.
- Support importing custom JSON word sets.
- Support creating vocabulary capture JSON from text entered by a player.
- Show a player's attempt history in the same browser.

### Out of Scope for MVP

- Secure authentication.
- Shared online accounts.
- Multiplayer sessions.
- Real-time collaboration.
- Advanced spaced repetition.
- Full learning analytics dashboard.
- AI generation inside the app.
- Mobile-native application.

## Functional Requirements

### Users

- A user can create a local profile with a display name.
- A user can select an existing local profile.
- A user can choose from five generated name suggestions.
- A user can refresh generated name suggestions.
- Generated names must be unique within a single generated list.
- The app stores game attempts under the selected local profile.

### Word Sets

- The app includes at least one predefined word set.
- A user can import a JSON word set.
- The app validates imported JSON before storing it.
- Invalid JSON should produce a clear error message.

### Vocabulary Capture

- A user can enter or paste free-form text into a vocabulary capture tool.
- The app extracts all words from the submitted text.
- The app creates a JSON document containing the extracted words and the input date.
- Vocabulary capture data should be stored in a structure that can support future detailed learning analytics.

### Crossword Generation

- The app generates a crossword from available words in a word set.
- The generated crossword should place words on a grid with valid intersections where possible.
- If not all words can be placed, the app should still generate a playable puzzle from the placed subset and report the number of included words.

### Gameplay

- The player can type answers into crossword cells.
- The player can submit the puzzle for validation.
- The app shows correct and incorrect answers after submission.
- The app records the attempt result.

### History

- A player can view previous attempts from the same browser.
- History includes date, word set, language, score, and completion status.

### Local Persistence

- The app stores profiles, imported word sets, puzzle attempts, and history in `localStorage`.
- The app should handle missing, empty, or malformed stored data gracefully.
- The app should keep predefined data separate from user-imported data.

## Acceptance Criteria

- A new user can create a local profile with a custom display name.
- The user can choose one of five generated names.
- The user can refresh the generated name list.
- Generated names use contributor surnames from the planned local JSON file.
- The user can start a crossword from a predefined word set.
- The user can complete and submit the crossword.
- The result is saved to `localStorage`.
- The user can see the saved attempt in history.
- A custom JSON word set can be imported and used for a new crossword.
- The application is implemented in TypeScript and React with MUI components.
- The project includes `README.md`, `SPEC.md`, `ARCHITECTURE.md`, and `RETROSPECTIVE.md`.

## Bonus Goal

If feasible, provide a /GitDocs-friendly playable demo. A static browser app is well suited for this because someone should be able to open a link and play without cloning the repository, installing dependencies, or running a local process.
