# RFC-0018: Recursive object inspector

- Status: Accepted
- Date: 2026-07-28

## Context

SOE must remain useful when an object contains values that cannot safely be
edited. Showing only `Map(5)` or `Example(…)` is safe but does not allow users
to understand their contents.

## Decision

The core exposes safe inspection entries for:

- `Map` values, labelled with their formatted keys;
- `Set` values, addressed by inspection index;
- class instances and other objects through own property descriptors;
- string and symbol keys;
- accessor properties as summaries without invoking getters.

The Svelte renderer expands these values recursively. Once traversal enters a
non-editable container, the entire descendant subtree remains inspection-only.
Copy and inspect remain available; editing, insertion, paste, movement,
renaming, and deletion are disabled.

Inspection paths are presentation addresses. They never become mutation paths.
Circular-reference protection applies exactly as it does to editable objects.

## Out of scope

Editing maps and sets, invoking getters, inherited properties, proxy
introspection, weak collections, iterator expansion, and mutation of class
instances are excluded.

## Consequences

- Unsupported containers become understandable without becoming mutable.
- Accessors cannot execute as a side effect of rendering.
- Symbol-keyed data is visible.
- Existing copy behavior remains available throughout inspected subtrees.
- The default editable-object experience remains unchanged.
