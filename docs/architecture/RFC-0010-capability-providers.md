# RFC-0010: Capability providers

- Status: Accepted
- Date: 2026-07-27

## Context

RFC-0009 centralizes operational decisions in a resolver. A single resolver,
however, would eventually need to know about schemas, plugins, runtime policy,
and user permissions. Adding each source directly would make it a new
monolith.

## Decision

### Contributions

A provider contributes only the capability values it owns:

```ts
interface CapabilityProvider {
  provide(
    context: CapabilityContext,
    current: Readonly<Capabilities>
  ): Partial<Capabilities> | undefined;
}
```

`createCapabilityResolver` combines a base resolver with an ordered provider
list. Each provider sees the same node context and the capabilities resolved so
far. Boolean contributions replace matching values; omitted capabilities remain
unchanged.

Registration order is precedence order. Later providers may refine earlier
decisions. This permits an eventual pipeline such as:

```text
Runtime → Schema → Plugin → Permissions
```

without hard-coding those sources in the core.

### Isolation

Each provider runs independently:

- exceptions are contained and composition continues;
- unknown properties and non-boolean contributions are ignored;
- the current capabilities passed to a provider are frozen;
- the provider registration list is copied when the resolver is created.

The final resolver still passes through RFC-0009's conservative contract
validation.

### Public API

Provider composition is a framework-independent core facility. This milestone
does not add providers, plugins, or resolver properties to `ObjectEditor`.

## Out of scope

This RFC does not define schema, permission, or plugin providers; asynchronous
providers; dependency ordering; provider discovery; or public UI registration.

## Consequences

- New policy sources compose instead of expanding the default resolver.
- Precedence is explicit and deterministic.
- One failing extension cannot disable unrelated providers.
- The basic editor API remains unchanged.
