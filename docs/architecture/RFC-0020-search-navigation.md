# RFC-0020: Search and navigation

- Status: Accepted
- Date: 2026-07-28

## Context

Recursive editing and inspection make large object graphs understandable, but
manual expansion does not scale. Search must work across editable and
inspection-only values without invoking accessors or introducing a persistent
object model.

## Decision

The core exposes `searchObject(root, query, limit)` and immutable results
containing canonical formatted paths. Search:

- matches case-insensitive paths and safe formatted values;
- traverses editable objects, arrays, maps, sets, instances, and symbol keys;
- reads property descriptors without invoking getters;
- stops circular traversal;
- returns at most 100 results by default.

`ObjectEditor` provides an integrated search field, result count, and
previous/next navigation. Matching branches expand automatically. All matches
are marked, while the active match receives focus and a distinct visual state.

Search does not filter or reorder nodes. Clearing the query removes match state
but does not collapse branches the user has already seen.

## Out of scope

Regular expressions, fuzzy ranking, replacement, hidden-result filtering,
custom search providers, persisted queries, and virtualization are excluded.

## Consequences

- Large editable and inspected graphs become navigable.
- Search remains framework-independent at its core.
- Getter safety and circular protection match the Object Inspector.
- No new component property is required for the default experience.
