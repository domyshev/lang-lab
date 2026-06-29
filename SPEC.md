# Specification

## Project Goal

Build a small but complete educational crossword game for practicing foreign vocabulary. The initial learning direction is Russian clues to English or Spanish answers.

The project should be small enough to complete within the challenge timeframe, but complete enough to demonstrate planning, implementation, testing, documentation, and iteration with AI-assisted development.

## Game Rules

1. A player selects or creates a simple user profile.
2. The player selects a word set.
3. The application generates a crossword from words in that set.
4. Each crossword clue is shown in Russian.
5. The player fills crossword cells with the foreign-language answer.
6. The game validates the filled answers.
7. The game records the attempt result in the player's history.

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

## Scope

### In Scope for MVP

- TypeScript React frontend using MUI.
- Go backend API.
- SQLite database.
- Simple user profile creation by unique username.
- No passwords or complex authorization.
- Store users, word sets, crossword attempts, and attempt results.
- Generate playable crossword puzzles from a selected word set.
- Support Russian clues and English or Spanish answers.
- Support importing custom JSON word sets.
- Show a player's attempt history.

### Out of Scope for MVP

- Secure authentication.
- Multiplayer sessions.
- Real-time collaboration.
- Advanced spaced repetition.
- Full learning analytics dashboard.
- AI generation inside the app.
- Mobile-native application.

## Functional Requirements

### Users

- A user can create a profile with a unique username.
- A user can select an existing profile.
- The app stores game attempts under the selected profile.

### Word Sets

- The app includes at least one predefined word set.
- A user can import a JSON word set.
- The backend validates imported JSON before storing it.
- Invalid JSON should produce a clear error message.

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

- A player can view previous attempts.
- History includes date, word set, language, score, and completion status.

## Acceptance Criteria

- A new user can create a profile with a unique username.
- The user can start a crossword from a predefined word set.
- The user can complete and submit the crossword.
- The result is saved to SQLite.
- The user can see the saved attempt in history.
- A custom JSON word set can be imported and used for a new crossword.
- The frontend is implemented in TypeScript and React with MUI components.
- The backend is implemented in Go.
- The project includes `README.md`, `SPEC.md`, `ARCHITECTURE.md`, and `RETROSPECTIVE.md`.

## Bonus Goal

If feasible, provide a /GitDocs-friendly playable demo. If GitDocs supports only static hosting, the static demo may run without the Go backend, while the full local version uses the backend and SQLite.
