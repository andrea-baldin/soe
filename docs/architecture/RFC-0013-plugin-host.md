# RFC-0013: Plugin host

- Status: Accepted
- Date: 2026-07-27

## Context

Capability and property providers are deliberately independent extension
points. A plugin needs one small registration unit that can contribute to
either contract without making the renderer discover or coordinate providers.

## Decision

### Plugin contract

```ts
interface ObjectPlugin<TProperties extends object> {
  readonly capabilities?: CapabilityProvider;
  readonly properties?: PropertyProvider<TProperties>;
}
```

A plugin is declarative registration. It has no lifecycle, mutable state,
dependency injection container, name, priority, or renderer access.

### Plugin host

`createPluginHost` copies the registered plugins and creates the existing
capability and property resolvers. For every node it:

1. resolves capabilities;
2. creates the immutable `ResolvedNodeContext`;
3. resolves typed properties using that context;
4. returns a frozen resolution.

Plugin registration order remains provider order. Existing provider failure
isolation remains authoritative; the host does not duplicate those rules.

### Public API

The host is framework-independent. This milestone does not add `plugins` to
`ObjectEditor`; UI registration requires a concrete consumer and its own RFC.

## Out of scope

Lifecycle hooks, asynchronous plugins, discovery, priorities, dependencies,
configuration, renderer replacement, and global registration are not part of
this contract.

## Consequences

- Plugins compose existing concepts instead of creating a second extension
  system.
- Capability-dependent properties receive the final resolved capabilities.
- The renderer can consume one resolution without knowing individual plugins.
- The basic Svelte API remains unchanged.
