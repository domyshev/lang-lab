# Mortal Kombat And Star Trek Worlds Design

## Goal

Add two selectable application worlds, Mortal Kombat and Star Trek, alongside Forest Elves and Football.

## Decisions Made Without Blocking

- Character ids will reuse the existing visible assistant ids per world, but each new world gets distinct localized character profiles.
- Character visuals will be original genre-inspired stickers, not exact copyrighted characters.
- The existing game tile art system will be reused with new gradients and palette names so the feature stays focused and testable.
- Existing local storage compatibility is preserved through `resolveWorldId`; unknown values still fall back to Football.

## Mortal Kombat World

Palette: obsidian, crimson, ember gold, jade success, fatal red failure.

Characters:

- Flame Ninja
- Ice Guardian
- Thunder Monk
- Shadow Queen

Tone: dramatic arena, precision, combo discipline, finishing courage.

## Star Trek World

Palette: deep space navy, command gold, science blue, engineering red, nebula violet.

Characters:

- Star Captain
- Science Officer
- Chief Engineer
- Helm Pilot

Tone: exploration, calm command decisions, analysis, systems thinking.

## UI Integration

- World selector menu lists all four worlds.
- First-run setup renders worlds dynamically from `worldIds`.
- Header/app bar, game tab, game setup Play button, game tiles, card-set palettes, result colors, and info icon palettes derive from the selected world.
- Assistant selector and onboarding assistant figures show four visible characters for each new world.

## Test Strategy

- Domain tests verify world resolution, labels, visual tokens, card-set palettes, and defaults.
- Assistant tests verify four visible characters per new world and localized copy.
- AppShell tests verify onboarding renders new world buttons.

