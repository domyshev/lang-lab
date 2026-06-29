# Architecture



Detailed application requirements: [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md)

## Technology Stack

- Application: TypeScript, React, MUI
- Runtime: browser
- Persistence: browser `localStorage`
- Data format: JSON
- Repository target: 
- Optional delivery target: /GitDocs or  Pages for a playable static demo

## Architecture Overview

The intended MVP architecture is a static browser application.

```text
React + TypeScript + MUI application
        |
        v
Browser state and localStorage
        |
        v
Bundled JSON assets and user-imported JSON word sets
```

The application owns the interactive crossword experience: profile selection, generated name suggestions, word set import flow, crossword grid UI, answer entry, submission, and history screens.

`localStorage` stores user-created data on the current device and browser. This keeps the MVP simple and makes the application easier to deliver as a static playable demo.

## Main Components

### Application Shell

The application shell provides the main layout, current profile state, navigation between views, and common UI structure. It should use MUI components for consistent controls and layout.

### Profile Onboarding

The first screen asks the user to enter a display name or choose a generated one.

Generated names combine:

- a funny adjective;
- a hyphen;
- the surname of a known contributor to languages, linguistics, dictionaries, literacy, English learning, or Spanish learning.

The screen shows five generated names at a time. A "Refresh list" button regenerates the suggestions.

### Contributor Name Seeds

Contributor data is planned as a local JSON asset. The detailed content requirement is described in [docs/APP_REQUIREMENTS.md](docs/APP_REQUIREMENTS.md).

The contributor list contains 100 records. Each record contains:

- `firstName`;
- `lastName`;
- `birthYear`;
- `contribution.ru`;
- `contribution.es`;
- `contribution.en`;
- `wikipediaUrl`.

Contribution descriptions should be compact and capped at 255 characters per language so they can fit in tooltips, dialogs, or profile-name explanation UI later.

### Word Set Manager

The word set manager loads predefined word sets and allows users to import custom JSON word sets. Imported data is validated before it is stored in `localStorage`.

### Crossword Generator

The crossword generator creates a grid from selected word set entries. It should attempt valid word intersections and produce a playable puzzle even when only a subset of words can be placed.

### Gameplay View

The gameplay view renders the crossword, clue list, answer cells, validation controls, and result state. MUI should be used for the surrounding interface, while the crossword grid can use custom layout logic where needed.

### History View

The history view reads saved attempts from `localStorage` and displays previous results for the selected local profile.

### Storage Adapter

A small storage adapter should wrap `localStorage` access. This keeps serialization, parsing, versioning, default values, and malformed-data recovery in one place.

## Local Storage Model

The exact keys may change during implementation, but the model should include:

- profiles;
- selected profile;
- imported word sets;
- crossword attempts;
- attempt summaries;
- storage schema version.

Stored records should include enough data to show history even if a word set changes later.

## Language Model

The first version supports Russian, Spanish, and English.

The architecture should not hard-code game concepts to one specific language. Data should be modeled around:

- source language;
- target language;
- clue;
- answer;
- localized labels;
- localized descriptions.

This allows the same structure to support additional languages in the future. The application concept focuses on general language-learning mechanics instead of rules that only apply to one language pair.

## Major Design Decisions

### Static Browser App

The MVP is a static browser app to keep the challenge scope manageable and make a one-click /GitDocs demo more realistic.

### Local Profiles Instead of Full Authentication

The MVP does not need secure authentication. A profile is identified by a local display name. This keeps the project focused on game mechanics and learning flow.

### localStorage for Persistence

`localStorage` is enough for the first version because the app stores small amounts of local data: profiles, imported word sets, attempts, and history. A storage adapter should isolate direct `localStorage` usage from UI components.

### JSON Word Sets

JSON is a good fit for word sets because it is strict, easy to validate, easy for AI tools to generate, and flexible enough to support future metadata such as tags, language, difficulty, examples, and parts of speech.

### TypeScript, React, and MUI

TypeScript and React provide a practical browser application stack. MUI gives the project a ready-made component system, reducing time spent on low-level UI primitives and helping the app feel complete sooner.

## AI Tooling Used

Initial ideation and documentation were developed with Codex as an AI coding assistant. The workflow is expected to include:

- conversational product discovery;
- specification drafting;
- implementation planning;
- code generation and editing;
- test and validation support;
- documentation updates;
- retrospective capture.

## Agent Workflow

The intended AI-native workflow is:

1. Capture requirements and constraints.
2. Write the initial specification and architecture.
3. Create an implementation plan.
4. Implement in small increments.
5. Validate each increment with tests or manual checks.
6. Update documentation as the design changes.
7. Record lessons learned in the retrospective.
