# Architecture

## Technology Stack

- Frontend: TypeScript, React, MUI
- Backend: Go
- Database: SQLite
- Data exchange format: JSON
- Repository target: 
- Optional delivery target: /GitDocs or  Pages for a playable demo

## Architecture Overview

The intended MVP architecture is a browser application backed by a small Go API service.

```text
React + TypeScript + MUI frontend
        |
        | HTTP JSON API
        v
Go backend service
        |
        v
SQLite database
```

The frontend owns the interactive crossword experience: profile selection, word set import flow, crossword grid UI, answer entry, submission, and history screens.

The backend owns persistent data and game-related operations: user profiles, stored word sets, crossword generation, attempt recording, and history retrieval.

SQLite is used because it is simple, local, easy to back up, and enough for the first version of this project.

## Main Components

### Frontend

The frontend will be a React application written in TypeScript. MUI will provide the UI component library for forms, buttons, layout, dialogs, tables, and common application controls.

Planned screens:

- profile selection and creation;
- word set list;
- JSON word set import;
- crossword gameplay;
- attempt result;
- player history.

### Backend

The backend will be a Go service exposing a JSON API.

Planned responsibilities:

- validate and create user profiles;
- store and list word sets;
- validate imported JSON word sets;
- generate crossword puzzle layouts;
- validate submitted attempts;
- store attempt history;
- serve history data.

### Database

SQLite will store the application state. The initial model is expected to include:

- users;
- word sets;
- words;
- crossword attempts;
- attempt answers or summary results.

The schema may evolve during implementation, but the first version should remain intentionally small.

## Major Design Decisions

### Simple Profiles Instead of Full Authentication

The MVP does not need secure authentication. A user profile is identified by a unique username. This keeps the project focused on game mechanics and learning flow.

### JSON Word Sets

JSON is a good fit for word sets because it is strict, easy to validate, easy for AI tools to generate, and flexible enough to support future metadata such as tags, language, difficulty, examples, and parts of speech.

### Go and SQLite Backend

The backend uses Go for a small, typed, easy-to-run service. SQLite avoids additional infrastructure during the MVP and keeps local development simple.

### TypeScript, React, and MUI Frontend

TypeScript and React provide a practical browser application stack. MUI gives the project a ready-made component system, reducing time spent on low-level UI primitives and helping the app feel complete sooner.

### /GitDocs Deployment Consideration

If the organization's GitDocs setup supports only static hosting, it can host only the frontend or a static demo. The full version with Go and SQLite requires a running backend service and persistent storage.

For the MVP, the most straightforward deployable shape is one Go service that serves both the API and built frontend assets, with SQLite stored in a persistent data directory.

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
