# Card Set Archive Design

## Goal

Add a first-class archived state for card sets across the Cards page and the AI helper while keeping historical game results intact. Archived card sets remain readable, continue to appear in statistics through existing attempts, and can be used as a source for a new active card set, but they cannot be restored in place.

## Existing Context

`CardSet` already has an optional `archivedAt` field. The manual archive reducer exists, and editing reducers already ignore archived sets. The missing pieces are discoverability, filtered archive browsing, active-name uniqueness, archived-set copy creation, and AI helper support.

## Data Model

No new persisted archive field is required. A card set is archived when `archivedAt` is set.

Rules:

- `all-cards` cannot be archived.
- Archived card sets stay in `state.cardSets.cardSets`.
- Archived card sets keep their original `id`, `name`, `names`, and `cardIds`.
- Existing attempts and statistics are not migrated or deleted.
- An archived set cannot be restored in place.
- A new active set may be created from an archived set by cloning names and `cardIds` into a new `id` with fresh `createdAt` and `updatedAt`, without `archivedAt`.

## Cards Page UX

The left card-set rail gets two controls above the tile list:

- a quick search field that filters by the visible set name and localized `names`;
- an `Archived` checkbox.

Filtering behavior:

- unchecked `Archived`: show active custom card sets and the built-in `All cards` tile;
- checked `Archived`: show only archived custom card sets, and hide `All cards`;
- search is applied inside the selected active/archive mode;
- the visible card-set count follows the active/archive mode and search result.

Tile behavior:

- active custom sets keep the existing archive action;
- archived sets do not show the archive action;
- archived sets show a copy action named `Create active copy`;
- selecting an archived set opens its detail view in read-only mode.

Detail behavior for archived sets:

- card list, search, translations, and per-card statistics remain visible;
- card membership editing is disabled;
- the detail header clearly marks the set as archived;
- copy creation is available from the archived detail view as well as the tile.

## Name Uniqueness

Name uniqueness is enforced only among non-archived custom card sets. Archived names do not block new active sets.

The uniqueness check should compare normalized values across `name` and all localized `names`, not only the currently visible language. This prevents creating active sets that become duplicates after switching the interface or target language.

## AI Helper Support

The AI helper can archive normal card sets through the same staged-operation pipeline used for all AI writes. It never applies changes directly.

Schema change:

- extend `update` card-set changes with `archive?: true`;
- keep `archive` mutually compatible with name and membership updates only when the resulting operation is clear and still references an existing non-`all-cards` set;
- reject attempts to archive `all-cards`;
- reject no-op archive requests for already archived sets.

Planning behavior:

- `planAiOperation` turns `archive: true` into an `updatedCardSets` entry where `after.archivedAt = now` and `after.updatedAt = now`;
- rollback remains possible through the existing AI operation history because the operation stores `before` and `after`;
- preview counts add `archivedCardSets`, counting card-set updates that newly set `archivedAt`.

AI read tools:

- `list_card_sets` should accept an archive filter: `active`, `archived`, or `all`;
- default should remain active sets plus `All cards` to avoid surprising the model during normal requests;
- archived summaries should include `archivedAt`.

System prompt update:

- allow the assistant to propose archiving card sets;
- keep prohibitions on deleting card sets, deleting global cards, restoring archived sets, and archiving `All cards`;
- instruct the assistant to create a new active set when the user asks to reuse an archived one.

## Statistics

No statistics data changes are required. Historical attempts keep their original `cardSetId`. Statistics views should continue to render attempts for archived card sets using the archived set name when available; if the set is later copied, the copy is a different set with separate future history.

## Testing Strategy

Add tests before implementation:

- Cards rail filters active and archived sets correctly.
- Search filters by canonical and localized set names.
- Archived mode hides `All cards`.
- Archived set detail is read-only and still shows card statistics.
- Copying an archived set creates an active set with a new `id`.
- Active-name uniqueness ignores archived sets but rejects duplicates among active sets.
- AI proposal with `archive: true` produces an `updatedCardSets` archive operation.
- AI proposal cannot archive `all-cards`.
- AI read tools can list active, archived, and all card sets.

## Out of Scope

- Restoring archived sets in place.
- Deleting archived sets.
- Moving or rewriting historical attempts.
- Backend synchronization for archived sets.
