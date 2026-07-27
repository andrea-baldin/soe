# RFC-0006: Value history

- Status: Accepted
- Date: 2026-07-27

## Context

Primitive and structural editing already replace values immutably. Users now
need to reverse accidental changes without requiring schemas, plugins, or a
larger component API.

History must support every value SOE can carry, including values that cannot be
serialized or cloned safely. It must also avoid treating every character typed
in one field as a separate user action.

## Decision

### Revisions

The framework-independent core provides `ValueHistory<T>`. It stores references
to immutable root revisions rather than deep copies or operation-specific
inverses.

```ts
const history = new ValueHistory(initialValue);

history.record(nextValue);
history.undo();
history.redo();
```

This representation handles primitive replacements and structural operations
uniformly. Unsupported JavaScript values retain their identity, prototypes, and
descriptors because history never serializes them.

### Boundaries

The latest 100 reversible revisions are retained. Recording a new value after
undo clears the redo revisions. Repeated primitive updates for the same path
are coalesced into one revision, so typing a value is reversed as one action.

Replacing the bound root from outside the editor resets its local history.
Mutating the same root reference externally is not observable and remains
outside SOE's immutable update contract.

### User interface

`ObjectEditor` displays Undo and Redo controls. It also supports:

- `Ctrl+Z` and `Command+Z` for undo;
- `Ctrl+Shift+Z` and `Command+Shift+Z` for redo;
- `Ctrl+Y` and `Command+Y` for redo.

Shortcuts apply only while focus is inside that editor. Disabled buttons expose
the current navigation state without adding component properties.

Deletion confirmation introduced by RFC-0005 remains in place. History and
confirmation serve different purposes: one provides recovery, while the other
requires explicit intent for a destructive structural action.

## Out of scope

This RFC does not introduce persistence across sessions, collaborative history,
transaction labels, a visual revision timeline, schemas, or capability-based
access to operations.

## Consequences

- Undo and redo use immutable roots already produced by SOE.
- History is independent of Svelte and can be tested in isolation.
- Memory use is bounded without exposing configuration prematurely.
- The public component API remains `<ObjectEditor bind:value />`.
