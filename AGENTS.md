# Project Instructions

- TASK_REQUIREMENTS.md must never be changed
- Commit messages must use a short subject that summarizes the main change, and the commit body must describe in detail what was done.
- Never push directly to the `main` branch. Push changes to another branch, such as `release` or a feature branch, and merge into `main` only through an explicit user-requested merge/release step.
- UI tooltips should default to the project standard readable tooltip pattern: white background with an arrow and normal-size text in the light theme, dark background with an arrow in the dark theme. Reuse existing tooltip helpers or matching slot styles instead of raw dark MUI tooltip defaults.
