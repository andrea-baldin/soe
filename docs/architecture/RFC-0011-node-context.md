# RFC-0011: Node context

- Status: Accepted
- Date: 2026-07-27

## Context

Capability resolvers and providers already receive root, value, parent, path,
and schema. Future property providers and plugins need the same information
plus the resolved operational policy. Repeating slightly different argument
lists would create incompatible extension contracts.

## Decision

### Base context

The core defines one renderer-independent node view:

```ts
interface NodeContext<T = unknown> {
  root: unknown;
  value: T;
  parent: unknown;
  path: ObjectPath;
  schema?: FieldSchema;
}
```

`CapabilityContext` becomes an alias of this contract, preserving its existing
meaning without maintaining a duplicate interface.

### Resolved context

`resolveNodeContext` adds the final capabilities:

```ts
interface ResolvedNodeContext<T = unknown> extends NodeContext<T> {
  capabilities: Capabilities;
}
```

The returned context, its copied path, and its capability object are frozen.
Root, parent, and value references are not cloned or frozen; SOE continues to
respect the user's data identities.

The Svelte renderer resolves this context and consumes its capabilities instead
of invoking the capability engine as a separate concern.

### Deliberate omissions

The earlier architectural exploration anticipated a model reference inside
`NodeContext`. No persistent `ObjectModel` exists yet, so this RFC does not
invent one merely to satisfy a future shape. The context may grow only when a
real consumer demonstrates the need.

## Public API

`NodeContext` is a framework-independent extension contract. No component
property is added:

```svelte
<ObjectEditor bind:value />
```

## Out of scope

This RFC does not introduce plugins, property providers, a persistent node
model, stable node identities, sibling helpers, or asynchronous resolution.

## Consequences

- Capability and future extension code share one vocabulary.
- Extensions receive resolved policy together with node data.
- Context cannot be mutated accidentally by a consumer.
- Data identity and the zero-configuration API remain unchanged.
