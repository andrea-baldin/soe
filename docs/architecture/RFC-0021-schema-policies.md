# RFC-0021: Schema-driven policies

- Status: Accepted
- Date: 2026-07-28

## Context

Schemas already describe type and validation knowledge, while capabilities
remain the sole authority for available operations. Applications need a
declarative bridge between these concepts without duplicating path checks in
every plugin.

## Decision

`FieldSchema` gains explicit policy knowledge:

```ts
interface FieldSchema {
  readonly?: boolean;
  removable?: boolean;
  renameable?: boolean;
  additionalProperties?: boolean;
  minimumItems?: number;
  maximumItems?: number;
}
```

The framework-independent `schemaCapabilityProvider` translates these facts
into capability contributions:

- `readonly` disables every mutating capability and is inherited recursively;
- `removable: false` disables deletion;
- `renameable: false` disables key renaming;
- `additionalProperties: false` disables object insertion;
- array limits disable append or deletion at their boundaries.

`ObjectEditor` registers this provider before application plugins. Later
plugins may refine or override schema policy, preserving the established
composition order: schema knowledge first, application behavior afterward.

Required validation remains descriptive. `required: true` does not implicitly
disable deletion; applications must state `removable: false` when that is the
desired policy.

## Out of scope

Role-based permissions, asynchronous authorization, tuple schemas, conditional
policies, object cardinality, automatic defaults, and schema mutation are
excluded.

## Consequences

- Schema policy uses the same capability engine as every other authority.
- Recursive read-only behavior requires no renderer-specific checks.
- Structural controls disappear consistently at their declared boundaries.
- The zero-configuration API remains unchanged.
