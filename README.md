# Language Crossword Lab

Language Crossword Lab is a small educational browser game for practicing foreign vocabulary through generated crosswords. The first target use case is learning English and Spanish words from Russian clues.

The project is being built for the AI-Native Development Challenge. The goal is not only to produce a playable game, but also to document the full AI-assisted development lifecycle: requirements, planning, architecture, implementation, validation, and retrospective.



## Game Description

Players solve crossword puzzles where each clue is written in Russian and each answer is a foreign-language word. For example:

- clue: `кот`
- answer: `cat` or `gato`

The game is intended to support predefined word sets and custom word sets uploaded as JSON files. These JSON files may be authored manually or generated in advance with AI tools.

The first product direction is a static browser crossword generator:

- users create simple local profiles with a unique display name;
- users can type their own name or choose from five generated names;
- generated names combine a funny adjective and the surname of a known contributor to languages or language learning;
- word sets can be stored and reused in the browser;
- generated crossword attempts are recorded locally;
- players can view their solving history on the same device and browser.

## Planned Technology Stack

- Application: TypeScript, React, MUI
- Persistence: browser `localStorage`
- Content format: JSON
- Delivery target: local development first, with /GitDocs-friendly static delivery considered as a bonus

## Current Status

This repository is at the initial specification stage. No playable implementation exists yet.

## Setup

Setup instructions will be added once the initial application structure is implemented.

Expected local development flow:

1. Install application dependencies.
2. Start the React development environment.
3. Open the local app in a browser.

## Run

Run instructions will be added once the implementation is available.

## Screenshots

Screenshots will be added after the first playable UI is implemented.

## AI-Native Workflow

This project is intentionally developed with AI assistance. Design decisions, implementation steps, validation results, and lessons learned will be captured in the repository documentation, especially in `RETROSPECTIVE.md`.
