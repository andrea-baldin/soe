# RFC-0005: Structural editing

- Status: Accepted
- Date: 2026-07-27

## Context

Recursive editing can replace existing values but cannot yet change the shape
of an object or array. SOE needs a small structural vocabulary that works
without configuration and can later become the input of a history layer.

The operation model must remain independent of Svelte, preserve immutable
updates, and avoid turning future concerns such as schemas or permissions into
component properties.

## Decision

### Operations

The core exposes one discriminated union and one pure function:

```ts
type StructuralOperation =
  | { type: 'object.insert'; path: ObjectPath; key: string; value?: unknown }
  | { type: 'object.rename'; path: ObjectPath; key: string }
  | { type: 'array.append'; path: ObjectPath; value?: unknown }
  | { type: 'array.move'; path: ObjectPath; toIndex: number }
  | { type: 'value.remove'; path: ObjectPath };

applyStructuralOperation(root, operation);
```

Valid operations return a new root while retaining references to unaffected
branches. Invalid operations return the original root.

### Objects

New properties are appended and initially contain `null` unless an explicit
value is supplied. Empty and duplicate keys are rejected.

Renaming retains the property's position, descriptor, and container prototype.
Structural operations do not read property values while cloning an object, so
accessors are not invoked as a side effect.

### Arrays

New items are appended and initially contain `null` unless an explicit value is
supplied. Existing items can move within the same array or be removed.

### User interface

The editor provides local controls for inserting, renaming, moving, and
deleting values without adding component properties. Deletion requires an
explicit second action because undo and redo are not available yet. This
confirmation is a UI concern and is not part of the core operation.

### Validation precedence

Runtime type inference remains the lowest-priority fallback established by
RFC-0003. Structural operations do not define schemas or validation. A future
knowledge layer may constrain or replace their availability without changing
the zero-configuration API.

## Out of scope

This RFC does not introduce undo and redo, persistent node identities, schemas,
permissions, capabilities, or provider resolution.

## Consequences

- Structural changes have a framework-independent representation.
- The future history milestone can record operations without being implemented
  prematurely.
- Object prototypes and descriptors survive structural changes.
- The public component API remains `<ObjectEditor bind:value />`.
