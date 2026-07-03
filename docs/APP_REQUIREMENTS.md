# Application Requirements

Challenge requirements: [../TASK_REQUIREMENTS.md](../TASK_REQUIREMENTS.md)

## Product Summary

Language Crossword Lab is a local browser app for self-directed vocabulary practice. A learner imports language cards, creates themes, and generates exercises from a selected theme.

The learner acts as both student and teacher: they choose the source material, import cards, create short-term themes, and practice the target language that matters now.

## Supported Languages

The first version supports:

- Russian (`ru`);
- English (`en`);
- Spanish (`es`).

Language support is modeled through language cards rather than fixed source-target pairs.

## Language Settings

The app must keep two independent language settings:

- interface language;
- target language.

The target language controls exercise answers, history filtering, and statistics. If the target language is English, the learner practices English and sees English-target history. If the target language changes to Spanish or Russian, history and statistics are shown for that target language only.

The interface language controls UI copy and coach feedback. A learner may study English while keeping the interface in Russian, or may switch the interface to the target language for extra exposure.

## Language Cards

A language card is one learning unit. It can be:

- a single word;
- a phrase;
- a short expression.

Cards must include translations for at least two supported languages. Definitions are optional. Example sentences are optional and are used by missing-word exercises.

The app creates internal ids. Imported JSON should not require or depend on user-authored ids.

The card authoring format is documented in [LANGUAGE_CARD_FORMAT.md](LANGUAGE_CARD_FORMAT.md).

## Import Requirements

The MVP imports language cards through a pasteable JSON field.

Requirements:

- accept a JSON array of cards;
- validate each record without stopping the whole import;
- add valid non-duplicate cards;
- detect duplicates by matching any translation value in any supported language;
- safely merge missing fields from duplicates;
- record safe merge history with added field names;
- store conflicting duplicates in pending duplicates;
- persist cards, merge history, and pending duplicates in `localStorage`.

If an incoming duplicate contains both safe missing information and conflicting information, the safe information should still be merged, while the conflicting duplicate remains pending for later review.

Future backend work may use an AI agent to review pending duplicates and add dictionary entries.

## Themes

Themes are learner-created groups of card ids.

Requirements:

- a learner can create many themes;
- themes persist locally;
- themes are not deleted automatically;
- a theme may contain words and phrases at the same time;
- each exercise is generated from exactly one selected theme;
- when there are no themes, the app should lead directly into theme creation.

Themes are important for short learning periods such as a few days or weeks. They should remain available, but they are not meant to be a strict permanent taxonomy.

## Exercise Types

The MVP includes:

- crossword;
- question with three answer variants;
- missing letters in words or phrases;
- missing word or phrase in sentences.

All exercise types use the same language-card data.

## Exercise Eligibility

A card is eligible for a target language when:

- it has a translation in the target language;
- it has at least one hint source.

Hint sources are:

- translations in the other available supported languages;
- a definition in the same language as the target language.

Translations used as hints must come from languages other than the current target language. Definitions used as hints must come only from the current target language.

## Crossword Requirements

Crosswords are generated from one theme.

Rules:

- a phrase crossword contains only one phrase;
- a word crossword contains up to six words;
- a crossword must not mix a phrase with separate words;
- exercise generation should be randomized and should not depend on previous exercise history.

The current grid may be simple in the MVP, but the data model should allow a stronger crossword layout engine later.

## Attempt History

Every submitted exercise should create an attempt history record.

History records include:

- exercise type;
- target language;
- theme id;
- card snapshots;
- prompts;
- submitted answers;
- correctness per card;
- weighted score;
- coach comment;
- timestamps.

History must be scoped by target language in the UI.

## Statistics

The app tracks statistics at two levels:

- per-card statistics;
- per-exercise attempt results.

Per-card statistics are scoped by card and target language. They include accuracy, attempts, correct and incorrect counts, recent mistakes, hints used, and stability.

Exercise results are scoped to one generated attempt. The weighted score should account for whether missed cards are new or already known weak cards. A mistake on a new card should affect the score less severely than repeating a mistake on a card with a weak history.

## Coach Assistant

The app should include a persistent coach assistant with a strict sports-analytics tone.

The coach should:

- appear as a visual character;
- stay visible during learning;
- provide progress-aware feedback;
- mention accuracy and weak cards;
- avoid generic empty praise.

Future versions may connect this assistant to deeper analytics or an LLM. The MVP can use deterministic feedback based on local statistics.

## Vocabulary Capture Tool

The product should include a future tool that lets a learner paste or type free-form text and create vocabulary JSON from it.

The tool should:

- extract all words from the submitted text;
- store the input date;
- preserve the extracted words in a JSON shape suitable for later analytics.

Minimal planned output:

```json
{
  "inputDate": "2026-07-03",
  "words": ["airport", "ticket", "train"]
}
```

The first implementation may keep this as a documented requirement. Later versions can connect captured vocabulary to card generation, knowledge analytics, repeated-word detection, and gap analysis.

## Persistence

The MVP stores local state in browser `localStorage` through Redux Persist.

Persisted state includes:

- language settings;
- imported language cards;
- duplicate history;
- pending duplicates;
- themes;
- exercise attempts;
- card statistics.

The app should handle empty storage and restored persisted state gracefully.

## Out Of Scope For MVP

- secure authentication;
- shared online accounts;
- multiplayer;
- backend duplicate resolution;
- in-app LLM generation;
- slalom, racing, snowball, or other arcade modules;
- full analytics dashboard;
- mobile-native app.

Arcade-style modules can be added later as separate modules that reuse the same language-card, theme, attempt, and statistics data.
