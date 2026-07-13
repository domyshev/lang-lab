# Football World Cup Theme Design

## Goal

Move Language Lab from a mostly Spain-only football skin to a broader World Cup 2026 football theme while keeping Spain as the main app identity. The app should feel like "learn Spanish and English while cheering for football": warm, playful, energetic, and readable.

## Visual Direction

The header keeps the Spain supporter identity: red, yellow, warm cream, and dark readable text. The current purple accent is removed because it clashes with the Spain theme. It is replaced by a stadium-blue accent that suggests sky, stadium lights, scoreboards, and modern sport UI.

Core accent tokens:

- stadium blue: `#1877c9`
- stadium blue light: `#e8f5ff`
- stadium blue border: `#8fc8f2`
- stadium blue dark: `#123c69`
- Spain red: `#c60b1e`
- Spain yellow: `#ffc400`
- warm surface: `#fffaf0`

Purple should not remain as a visible primary/secondary accent in normal light-theme UI. If any purple-like decoration remains in a very local illustration, it must not read as the app accent.

## Game Tiles

The four game tiles each use the flag colors of a major football country. The tile art remains custom SVG/DOM art, not external images, so the app stays offline-friendly and testable.

Mapping:

- Crossword: Spain. Red and yellow background with a football goal silhouette.
- Multiple choice: Portugal. Green, red, and gold background with a prominent football.
- Missing letters: England. White, red, and blue background with `FIFA WC 2026` in a sporty tournament style.
- Missing word: Germany. Black, red, and gold background with a jumping goalkeeper silhouette.

Disabled game tiles keep the existing grayscale behavior and disabled tooltip mechanism. The country art must remain visible enough when disabled, but visually inactive.

## Characters

The visible character roster becomes four football-country characters, one per major country:

- Spain: fast winger / young spark.
- Portugal: star striker / finishing flair.
- England: captain / set-piece and grit.
- Germany: goalkeeper or tactical machine / order and saves.

Persisted assistant ids must not break. Keep the current `AssistantId` union stable for stored Redux state, but expose only four selectable characters in the selector. The fifth legacy id should resolve safely to the default or stay as a hidden legacy profile if needed for old persisted sessions.

Character assets should be stylized football-player stickers rather than realistic photos or official logos. They can evoke country kits through colors, numbers, posture, and football props. Avoid official crests, club logos, federation marks, or copyrighted likenesses.

The character phrases should move away from forest/fantasy tone and into match tone: passes, saves, pressure, tempo, finishing, stadium, and comeback energy. They do not need to be about language learning directly.

## Card Set Library Palettes

The card-set library should feel like a collection of world football teams. Add a shared palette list with at least 30 football-country palettes. Each palette contains:

- `countryKey`
- localized country label if useful for tests/tooltips later
- primary, secondary, optional third color
- readable foreground color
- gradient string or enough tokens to build one

Initial country palette set:

1. Spain
2. Portugal
3. England
4. Germany
5. Brazil
6. Argentina
7. France
8. Italy
9. Netherlands
10. Uruguay
11. Croatia
12. Japan
13. Morocco
14. Mexico
15. USA
16. Belgium
17. Denmark
18. Sweden
19. Switzerland
20. Poland
21. Senegal
22. Ghana
23. Nigeria
24. South Korea
25. Australia
26. Colombia
27. Chile
28. Serbia
29. Scotland
30. Wales
31. Cameroon
32. Turkey

`All cards` should keep a special Spain/World Cup palette and stay first. Custom sets receive a stable palette by hashing or indexing their id, so colors do not jump when the user scrolls, filters, reloads, or changes target language.

The carousel behavior stays the same: three visible cards, selected set centered when possible, wheel and arrow navigation preserved.

## AI And Utility Accent Replacement

Replace visible purple accents with stadium-blue accents in:

- AI assistant magic-wand buttons.
- Chat tab icon accents.
- Card set selected outlines.
- Card editing outlines and hover states where they currently use purple.
- Tooltip decorative bubbles that currently read as purple-dominant.
- Any chip, border, or icon that looks like the old purple theme.

The Chat tab icon should stop using the robot visual. Replace it with a colorful football icon that has an AI hint, such as small neural dots, spark lines, or a circuit glint around the ball. It should feel playful and football-specific, not like an admin robot.

Active tabs must be readable on the Spain header. The current orange active text blends into the header, so use stadium-blue dark, deep green/graphite, or another high-contrast color that works on the yellow/red header.

## Data And Persistence

No persisted schema migration is required for visual palettes. Store no palette assignment in Redux; derive it deterministically from card-set id.

Assistant ids stay compatible with existing persisted values. If a hidden legacy id is found in state, `resolveAssistantId` should keep the app stable and preferably resolve to one of the four visible football characters.

## Testing Strategy

Add or update tests before implementation:

- Game tile tests assert each of the four tiles exposes the expected country theme metadata and still renders its specific art.
- Character selector tests assert four visible options and the expected localized football character names/tooltips.
- Assistant resolver tests assert legacy/unknown ids remain safe.
- Card-set library tests assert at least 30 football palettes exist and palette assignment is stable for the same id.
- Card-set library tests assert selected outlines and AI assistant button no longer use the old purple accent.
- App shell/navigation tests assert the active tab style uses the new readable color and the Chat tab uses the new football-AI icon.

## Out Of Scope

- Backend synchronization.
- Official World Cup, FIFA, federation, or club branding.
- Photorealistic player portraits.
- Changing game mechanics.
- Changing card data or statistics behavior.
