# RFC-0022: Validation report and navigation

- Status: Accepted
- Date: 2026-07-28

## Context

Inline validation explains individual fields, but large and collapsed object
graphs need one complete view of invalid and missing data. This report must be
usable outside Svelte and must preserve the same safety guarantees as search
and inspection.

## Decision

The core exposes:

```ts
validateObject(root, schema): readonly ValidationIssue[]
```

Each immutable issue contains a canonical path, formatted path, message, and
the code `invalid` or `required`. Traversal:

- validates nested object fields and array items;
- reports missing required properties at their intended paths;
- contains validator failures through existing validation semantics;
- reads property descriptors without invoking getters;
- stops at circular references.

`ObjectEditor` renders an accessible summary with direct issue controls.
Selecting an existing issue focuses its node. A missing property focuses the
nearest rendered ancestor. Branches containing issues expand automatically,
and existing nodes with issues receive a visual marker.

The existing inline messages remain the local explanation and source of
accessible field error state.

## Out of scope

Warnings, severity levels, asynchronous validation, cross-field issue arrays,
server validation, custom summary rendering, and automatic correction are
excluded.

## Consequences

- Consumers can validate an entire object without rendering the editor.
- Collapsed and deeply nested errors become discoverable.
- Missing values gain navigable locations through their nearest container.
- Validation remains descriptive and never blocks editing.
