# RFC-0009: Capability resolver

- Status: Accepted
- Date: 2026-07-27

## Context

SOE can edit values and perform structural operations, but the renderer still
contains local decisions about which controls to show. Future schemas, plugins,
permissions, and providers must be able to influence those decisions without
adding scattered conditions to Svelte components.

## Decision

### Capabilities

The core defines the complete operational vocabulary:

```ts
interface Capabilities {
  editValue: boolean;
  renameKey: boolean;
  delete: boolean;
  insert: boolean;
  move: boolean;
  copy: boolean;
  paste: boolean;
  inspect: boolean;
}
```

The UI never infers these permissions. It asks a resolver and renders only the
controls allowed by the resolved result.

### Context and resolver

```ts
interface CapabilityResolver {
  resolve(context: CapabilityContext): Capabilities;
}
```

Context contains the root, current value, parent, path, and optional field
schema. It contains no Svelte state or renderer objects.

The default resolver preserves current behavior:

- supported primitive values and schema-typed fields can be edited;
- object keys can be renamed and values can be deleted;
- editable containers accept insertion;
- array children can move;
- every value can be copied and inspected;
- editable containers can accept paste when that operation is implemented.

Copy, paste, and inspect are part of the stable vocabulary even though this
milestone adds no controls for them.

### Failure containment

A resolver exception or malformed result produces conservative capabilities:
all mutations are disabled, inspection and copying remain available. Capability
resolution must never make the editor fail.

### Public API

No resolver property is added to `ObjectEditor`. The default resolver is an
internal architectural boundary. Future providers and plugins may compose it
through their own approved extension point without expanding the basic API:

```svelte
<ObjectEditor bind:value />
```

## Required fields

Required validation remains descriptive. The default resolver does not prevent
deletion or renaming of required fields. A future policy provider may choose to
contribute stricter capabilities.

## Out of scope

This RFC does not introduce user permissions, provider composition, plugin
registration, copy and paste controls, read-only schema properties, or a public
resolver component property.

## Consequences

- Renderers consume decisions instead of making them.
- Operational vocabulary is framework-independent and testable.
- Future policy sources have one place to contribute.
- The public component API remains unchanged.
