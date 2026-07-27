# RFC-0008: Required fields

- Status: Accepted
- Date: 2026-07-27

## Context

RFC-0007 validates fields that exist, but an absent property has no node on
which to display an error. Schemas need to express that selected object
properties are required while preserving SOE's non-blocking editing model.

## Decision

`FieldSchema` gains one optional fact:

```ts
interface FieldSchema {
  required?: boolean;
}
```

For each object container, SOE compares its own properties with the associated
schema fields. Missing required names are reported on that container. Root
requirements are reported at editor level.

Required checks:

- never read property values or invoke accessors;
- do not accept inherited properties;
- update after structural changes and history navigation;
- report invalid state without blocking editing.

Adding a missing property resolves the required error. Its value is then
validated normally, so a newly inserted `null` may reveal the explicit type
error until the user supplies a valid value.

## Operation boundaries

Required does not imply read-only or undeletable. Rename and delete operations
remain available and may produce invalid state. Deciding whether an operation
is allowed belongs to the future capability resolver, not to schema validation.

## Public API

No new component property is introduced:

```svelte
<ObjectEditor bind:value {schema} />
```

## Out of scope

This RFC does not introduce defaults, automatic property creation, capability
resolution, read-only fields, minimum array lengths, or object-wide validators.

## Consequences

- Missing values become visible validation state even without rendered nodes.
- Validation remains descriptive rather than coercive.
- Schema knowledge and operational permissions stay separate.
