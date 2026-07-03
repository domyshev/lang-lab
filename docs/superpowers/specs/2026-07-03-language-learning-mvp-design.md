# Language Learning MVP Design

## Purpose

This document captures the MVP design for a browser-based language learning game. The product is built around the idea that the learner acts as their own teacher: they import language cards, organize them into themes, choose exercises, and use the app to generate practice sessions and track progress.

The first version focuses on structured learning exercises, not arcade mini-games. Slalom, racing, snowball, and similar modes are intentionally outside this MVP and may become separate modules later.

## Product Scope

The MVP includes:

- React, TypeScript, MUI, Redux Toolkit, and Redux Persist.
- Browser-only persistence through `localStorage`.
- Language card JSON import through a large paste field.
- Duplicate detection, safe merge, duplicate processing history, and pending duplicate conflicts.
- Persistent learner-created themes.
- A global target language setting.
- A separate interface language setting.
- Exercises generated from a selected theme.
- Crossword as the primary exercise mode.
- Multiple choice with three answer options.
- Missing letters in a word or phrase.
- Missing word in a sentence.
- Exercise history filtered by target language.
- Card-level statistics filtered by target language.
- Theme and exercise attempt statistics.
- A strict sports-coach style assistant that gives useful feedback based on real learning data.

The MVP does not include:

- Backend services.
- LLM-powered import or duplicate review inside the app.
- User accounts or remote sync.
- Arcade mini-games.
- Full analytics dashboards.
- Secure authentication.

## Language Settings

The app has two independent language settings.

### Interface Language

The interface language controls labels, menus, empty states, validation messages, history UI, and coach commentary.

Supported interface languages:

- `ru`
- `en`
- `es`

Example: a learner can study English while using Russian UI text.

### Target Language

The target language controls what the learner is practicing.

Supported target languages:

- `ru`
- `en`
- `es`

The selected target language determines:

- which cards are eligible for exercises;
- which translation is the correct answer;
- which exercise attempts are shown in history;
- which card statistics are shown;
- which definitions are shown as hints;
- what the coach analyzes.

History and learning statistics must always be tracked in the context of `targetLanguage`.

## Language Cards

A language card is the central learning unit. It can represent a single word, a phrase, or a short expression.

User-imported JSON does not need to include an `id`. The app creates internal ids after import.

A card contains:

- `translations`: translations for one or more supported languages;
- `definitions`: optional same-language definitions;
- `examples`: optional usage examples;
- `tags`: optional topic or grammar labels;
- `difficulty`: optional rough difficulty label.

Translations may contain words or phrases. This is intentional. The same card model should support:

- `airport`;
- `train station`;
- `I would like a ticket`;
- equivalent Russian, English, and Spanish phrases.

For a selected `targetLanguage`:

- the answer comes from `translations[targetLanguage]`;
- translation hints come from the other available languages in `translations`;
- definition hints come only from `definitions[targetLanguage]`;
- definitions in non-target languages are not shown as hints for that exercise.

A card is eligible for a target language only if it has `translations[targetLanguage]` and at least one other translation or usable prompt source.

## Import Flow

The MVP imports cards through a large paste field. The user pastes JSON directly into the app.

The app should accept a JSON array of language cards. It should attempt to process large JSON documents within normal browser limits.

The import flow:

1. User pastes JSON into the import field.
2. App parses the JSON.
3. App validates record structure.
4. App imports new valid cards.
5. App detects duplicates by matching any translation value in any supported language.
6. App performs safe merge when possible.
7. App records safe merge actions in duplicate processing history.
8. App stores duplicate conflicts in pending duplicates.
9. App shows an import summary.

The import summary should include:

- added cards;
- safely merged cards;
- pending duplicate conflicts;
- invalid records;
- skipped records and reasons.

## Duplicate Handling

A duplicate is detected when any incoming translation matches any existing card translation in any supported language after normalization.

Normalization should include at least:

- trimming leading and trailing whitespace;
- case-insensitive comparison for languages where this is appropriate;
- collapsing repeated internal whitespace.

Safe merge is allowed when the incoming card adds missing information or new list items without conflicting with existing fields.

Safe merge may:

- fill missing translations;
- fill missing definitions;
- add new tags;
- add new examples;
- add a missing difficulty value if the existing card has none.

Safe merge must not:

- replace an existing translation with a different value;
- replace an existing definition with a different value;
- overwrite existing scalar fields;
- silently ignore conflicts.

Every safe merge must create a duplicate processing history entry. The entry should record:

- when processing happened;
- which existing card matched;
- which incoming card matched;
- which language and value triggered the match;
- which fields were added.

If a duplicate contains conflicting information, the app must not merge the conflict automatically. It must store the incoming card and conflict details in `pendingDuplicates`.

`pendingDuplicates` are persisted locally so a future manual review or AI review flow can use them.

## Themes

A theme is a persistent learner-created set of language cards.

Themes are central to the learning flow:

- the learner can create many themes;
- themes are always saved;
- themes remain in the theme list;
- theme history remains available;
- theme statistics remain available;
- exercises are always generated from one selected theme.

Themes may be short-lived in a learning sense, such as a topic for a few days or weeks, but they are not temporary in storage.

A theme can contain both words and phrases. Exercise modes decide which cards from the theme are eligible.

If there are no themes, the UI should not show a dead-end empty state. It should immediately guide the learner into creating the first theme and starting practice.

For the MVP, physical theme deletion is out of scope. A future version may add archiving.

## Learning Flow

The standard flow is:

1. Learner selects interface language.
2. Learner selects target language.
3. Learner creates or selects a theme.
4. Learner adds language cards to the theme.
5. Learner chooses an exercise type.
6. App generates an exercise from eligible cards in that theme.
7. Learner completes the exercise.
8. App saves the attempt.
9. App updates card statistics and theme statistics.
10. Coach gives strict, useful feedback based on the result.

Generated exercises should be created on demand. They should vary card order and selection rather than replaying the exact same arrangement for a theme.

Exercise attempts must store enough snapshot data to remain understandable even if a theme or card changes later.

## Exercise Modes

### Crossword

Crossword is the primary MVP exercise.

Rules:

- A crossword is generated from one selected theme.
- The correct answers use the current target language.
- If a crossword uses single-word cards, it may include up to 6 cards.
- If a crossword uses a phrase card, it includes only one phrase card.
- A crossword must not mix phrase cards and word cards.
- The 6-card limit is fixed in the MVP.

For phrase cards, the crossword mode may use a single-phrase challenge layout. Spaces and punctuation should be handled as separators rather than ordinary editable crossword cells.

### Multiple Choice

Multiple choice uses one selected card and three answer options.

Rules:

- The correct option is `translations[targetLanguage]`.
- Distractors come from other eligible cards in the selected theme when possible.
- The prompt can use translations from non-target languages and the optional target-language definition.
- The attempt records the selected option and whether it was correct.

### Missing Letters

Missing letters asks the learner to complete a target-language word or phrase.

Rules:

- The answer comes from `translations[targetLanguage]`.
- The app masks selected letters.
- Spaces and punctuation should remain visible.
- The prompt can use other translations and the optional target-language definition.
- The attempt records the final answer and hint usage.

### Missing Word In Sentence

Missing word in sentence uses an example sentence with one target-language word or phrase removed.

Rules:

- This exercise requires a usable target-language example or sentence template.
- If no suitable sentence exists, the card is not eligible for this exercise.
- The missing answer is the target-language translation or a configured target phrase.
- The attempt records the completed sentence answer and correctness.

## Statistics

The app tracks statistics at three levels.

### Card Statistics

Card statistics are tracked per language card and target language. They are not primarily tied to exercise type.

Card stats answer the question: how well does the learner know this language card in the current target language?

Card stats should include:

- attempts;
- correct answers;
- incorrect answers;
- accuracy;
- last practiced date;
- recent mistake count;
- hint usage;
- stability or confidence classification.

Exercise type should still be stored in attempt history so deeper analysis is possible later.

### Exercise Attempt Statistics

Each generated exercise creates an exercise attempt record.

An exercise attempt should include:

- exercise type;
- theme id;
- target language;
- created and completed timestamps;
- cards used;
- snapshot of prompts and expected answers;
- learner answers;
- correctness per card;
- hint usage;
- weighted result score;
- coach comment.

Exercise result score is not just the raw number of correct answers. It should consider learning impact.

For example:

- a mistake on a new card is less severe;
- a repeated mistake on a known weak card is more severe;
- a correct answer on a previously weak card is a strong positive signal;
- a correct answer on an already strong card is a smaller positive signal.

The first implementation can use simple hidden weights for new, weak, and strong cards. The UI should show understandable coach feedback rather than exposing raw weight formulas.

### Theme Statistics

Theme statistics are derived from card stats and exercise attempts in the context of the selected target language.

Theme stats should include:

- accuracy across cards in the theme;
- weak cards in the theme;
- recent progress;
- exercise attempts by type;
- recommended next practice.

## Sports Coach

The coach is a persistent strict sports-coach style character.

The coach is not a generic cheerleader. It should provide useful feedback based on real app data.

Tone:

- strict;
- concise;
- data-aware;
- practical;
- no empty praise.

Examples:

- "Accuracy is 72%. Repeat travel phrases before starting a new theme."
- "The card 'I would like a ticket' failed twice. Schedule another drill."
- "Good recovery: 2 previously weak cards were answered correctly."
- "Low impact session. Most correct answers came from already strong cards."

The coach should be visible near the top-left area of the game screen as a character image or sprite. It may have simple animated states such as idle, blink, nod, point, or strict reaction.

Coach explanations and comments should use the selected interface language.

Coach analysis should use the selected target language.

## UI Layout

The main application shell includes:

- app name;
- navigation to themes;
- navigation to history;
- interface language selector;
- target language selector.

The interface language and target language selectors may show country flag indicators, but they must also include text labels. The learner must be able to tell which setting controls UI language and which setting controls the language being practiced.

The visual direction should use a warm pistachio color family for the header, but final color tuning can happen during implementation.

The game screen should prioritize:

- crossword in the center;
- coach character near the upper-left area;
- explanations and coach comments below the main exercise;
- compact clues, progress, or stats where screen space allows.

On smaller screens, secondary panels may collapse into bottom or stacked sections.

## Persistence

Redux Persist stores the relevant Redux state in `localStorage`.

Persisted data should include:

- language cards;
- themes;
- selected target language;
- selected interface language;
- exercise attempts;
- card statistics;
- duplicate processing history;
- pending duplicates;
- app storage schema version.

Ephemeral UI state such as open menus or temporary form focus does not need to be persisted.

The storage model should include a schema version so future migrations are possible.

## Documentation

Repository documentation should be written in English.

The app can support multiple interface languages, but committed documentation should remain English.

The card authoring guide should live in a separate Markdown file so the learner can provide it to an external LLM when generating language card JSON. The app itself does not need to know that an LLM was used.
