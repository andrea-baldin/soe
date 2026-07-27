# RFC-0004: Recursive editing

- Status: Accepted
- Date: 2026-07-27

## Context

SOE can edit primitive properties at the root of an object. Real application
data also contains nested objects and arrays, but introducing a persistent node
graph before structural operations are needed would add more model than the
current problem requires.

Recursive traversal must preserve the zero-configuration API, avoid mutating
the user's object, and never recurse forever when data contains cycles.

## Decision

### Containers

SOE recursively edits only:

- arrays;
- plain objects whose prototype is `Object.prototype` or `null`.

Class instances and built-in collections remain inspection-only. This prevents
SOE from guessing how domain objects should be cloned or mutated.

### Paths

A path is an immutable sequence of property names and array indices:

```ts
type ObjectPath = readonly (string | number)[];
```

Paths identify values and route changes. They are not stateful nodes and do not
know about rendering, schemas, or validation.

### Updates

Editing a leaf replaces the containers along its path while retaining
references to unaffected branches. Invalid or unreadable paths leave the root
unchanged.

### Recursion

Containers are expanded initially and can be collapsed with native buttons.
Recursion stops when a value appears in its own ancestor chain. Shared
references that are not ancestors may be rendered in multiple locations.
Nested controls use their formatted path as the accessible name, avoiding
ambiguous labels when several branches contain properties with the same key.

### Public API

Recursive editing does not add component properties:

```svelte
<ObjectEditor bind:value />
```

The component exposes semantic `data-soe-node`, `data-soe-path`, and
`data-soe-children` attributes in addition to the styling contract established
by RFC-0002.

## Out of scope

This RFC does not introduce insertion, deletion, property renaming, array
movement, persistent node identities, or history. Those operations require
their own demonstrated contracts.

## Consequences

- Nested editing uses a small framework-independent core operation.
- Unaffected object branches preserve referential identity.
- Circular data remains safe to inspect.
- A future schema or validation layer can override runtime inference without
  changing path semantics.
