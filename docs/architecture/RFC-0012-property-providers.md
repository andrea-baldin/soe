# RFC-0012: Property providers

- Status: Accepted
- Date: 2026-07-27

## Context

Schemas currently contain only demonstrated knowledge. Future formatters,
presentation metadata, runtime annotations, and plugin contributions must not
turn `FieldSchema` into a growing bag of unrelated options.

Capability providers solve the same composition problem for a fixed boolean
vocabulary. Node properties require a generic but type-safe mechanism because
each future property catalog belongs to its consumer.

## Decision

### Generic contracts

```ts
interface PropertyProvider<TProperties extends object> {
  provide(
    context: ResolvedNodeContext,
    current: Readonly<TProperties>
  ): Partial<TProperties> | undefined;
}

interface PropertyResolver<TProperties extends object> {
  resolve(context: ResolvedNodeContext): Readonly<TProperties>;
}
```

`createPropertyResolver` combines typed defaults with an ordered provider list.
Providers see the resolved node context and properties accumulated so far.
Later explicit contributions replace earlier values.

The core deliberately defines no universal `NodeProperties` interface. A
renderer, formatter registry, or plugin host introduces the smallest property
catalog required by its own demonstrated use cases.

### Isolation and stability

- defaults and the provider list are copied at resolver creation;
- each resolution starts from fresh defaults;
- current properties passed to a provider are frozen;
- exceptions and absent contributions are isolated;
- the final result is a fresh frozen object.

The resolver performs shallow composition. Nested property structures, when
needed, must define their own merge semantics instead of receiving surprising
implicit behavior from the core.

### Public API

Property providers are a framework-independent extension primitive. No
component properties or built-in property catalogs are added in this
milestone.

## Out of scope

This RFC does not define labels, formatters, themes, validation metadata,
asynchronous providers, provider discovery, or plugin registration.

## Consequences

- Schemas remain focused on object knowledge.
- Future metadata sources compose without modifying the model.
- Property catalogs remain typed and owned by their consumers.
- The core gains an extension seam without speculative properties.
