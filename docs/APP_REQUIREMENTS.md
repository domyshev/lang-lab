# Application Requirements

Challenge requirements: [../TASK_REQUIREMENTS.md](../TASK_REQUIREMENTS.md)

## Product Summary

Language Crossword Lab is a static browser game for learning vocabulary through generated crosswords. It starts with Russian clues and English or Spanish answers, while keeping the data model open to more languages later.

The application is implemented with TypeScript, React, and MUI. User data is stored locally in the browser with `localStorage`.

## Supported Languages

The first version supports:

- Russian;
- Spanish;
- English.

The application should be designed around general language-learning concepts rather than language-specific assumptions. Core data entities should use source language, target language, clue, answer, localized labels, and localized descriptions so more languages can be added later.

## Entry Flow and Player Names

When the user enters the application, they must choose a display name before starting a game.

The entry screen supports two paths:

- manual name entry;
- generated name selection.

The generated-name list shows five different options at a time. A "Refresh list" button regenerates the five suggestions.

Generated names use the format:

```text
FunnyAdjective-Surname
```

The adjective should be light and playful. The surname should come from a curated contributor list connected to languages, linguistics, dictionaries, literacy, English learning, or Spanish learning.

## Contributor List Requirement

A future project JSON file should contain 100 people who made notable contributions to the development of languages, language education, English learning, Spanish learning, linguistics, lexicography, translation, literacy, or language standardization.

This task records the requirement only. The 100-person JSON file is not created at this documentation stage.

Each contributor record should contain:

```json
{
  "firstName": "Noah",
  "lastName": "Webster",
  "birthYear": 1758,
  "contribution": {
    "ru": "Краткое описание вклада на русском языке.",
    "es": "Breve descripción de la contribución en español.",
    "en": "Short contribution description in English."
  },
  "wikipediaUrl": "https://en.wikipedia.org/wiki/Noah_Webster"
}
```

Requirements for the contributor JSON file:

- exactly 100 contributor records;
- each record includes first name and surname;
- each record includes birth year;
- each record includes a short contribution description in Russian, Spanish, and English;
- each localized contribution description is no longer than 255 characters;
- each record includes a Wikipedia page URL;
- surnames should be suitable for generated names;
- the list should include contributors relevant to English and Spanish when possible, while also allowing broader language-learning contributors.

## Word Sets

Word sets are JSON documents. The minimum word item contains:

```json
{
  "word": "airport",
  "clue": "аэропорт"
}
```

Recommended word set metadata:

- title;
- source language;
- target language;
- tags;
- difficulty.

## Crossword Play

The user selects a word set and starts a generated crossword. The crossword presents clues and answer cells. The user fills the cells and submits the puzzle for validation.

The application shows:

- correct answers;
- incorrect answers;
- score;
- completion status.

## Local Persistence

The application stores local data in `localStorage`.

Stored data should include:

- local profiles;
- selected profile;
- imported word sets;
- crossword attempts;
- attempt summaries;
- storage schema version.

The application should handle empty, missing, or malformed stored data gracefully.
