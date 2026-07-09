# Project Instructions

- TASK_REQUIREMENTS.md must never be changed
- Commit messages must use a short subject that summarizes the main change, and the commit body must describe in detail what was done.
- AGENT_HISTORY.md must record every new user and assistant chat message for this project as separate entries, in chronological order. If older exact chat messages are visible in the current chat context, copy them into AGENT_HISTORY.md as exact entries. If older exact messages are unavailable in the current context and no workspace transcript file exists, add an explicit backfill entry that summarizes the available context instead of inventing a transcript.
- Separate AGENT_HISTORY.md entries with a three-line timestamp divider. The middle line contains the actual chat message timestamp when it is visible or otherwise known, in `DMMYY:HMM` format for the project timezone, with no leading zero in the hour and two digits for minutes, for example `90726:928` for July 9, 2026 at 09:28. When Codex thread metadata is available, use the turn `startedAt` value as the source timestamp. Never reuse the current time as a fake timestamp for older messages. If the exact message time is not visible or otherwise known, do not invent it: add a short note in the entry or a nearby migration note explaining whether the timestamp is inferred or is the recording time. The plus-only lines above and below must be padded to the same width as the middle line:
  `+++++++++++++++++++++++`
  `++++++ 90726:928 ++++++`
  `+++++++++++++++++++++++`
