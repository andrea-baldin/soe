# RFC-0025 — Schema composition

Status: Accepted

## Context

Field-name schemas express precise domain knowledge but repeat general rules.
Applications often want every number, date, URL, or semantic value to share
validation and policy, then specialize one path without teaching the renderer
about those categories.

Adding type options to `ObjectEditor` would mix knowledge with presentation.
Resolving different schemas independently in validation and rendering would
create inconsistent behavior.

## Decision

`ObjectSchema` may contain ordered rules. Rules can match:

- the conservative runtime `ObjectValueKind`;
- an immutable path pattern where `*` matches one segment;
- a safe predicate receiving root, value, and canonical path.

`schemaForType`, `schemaForPath`, and `schemaWhen` create focused schemas.
`composeObjectSchemas` combines them and deeply composes field and item
knowledge.

Rules are applied in declaration order, with later contributions overriding
earlier properties. Explicit field knowledge is applied after matching rules,
so the most specific existing schema remains authoritative. A parent readonly
policy is inherited last.

Predicate exceptions are isolated and treated as non-matches.

`resolveFieldSchema` is the single framework-independent resolution entry
point. Its result feeds validation, required-field reporting, capabilities,
plugins, and rendering.

## Example

```ts
const schema = composeObjectSchemas(
  schemaForType('number', {
    readonly: true
  }),
  schemaForPath(['metrics', '*'], {
    readonly: false
  }),
  {
    fields: {
      metrics: {
        additionalProperties: false
      }
    }
  }
);
```

The public component remains unchanged:

```svelte
<ObjectEditor bind:value {schema} />
```

## Consequences

Knowledge becomes reusable across unrelated field names while exact fields
remain predictable. Runtime type rules describe values that already exist;
they do not replace explicit field schemas when a missing or differently typed
value needs an intended editor type.

Path wildcards deliberately match one segment only. Recursive glob syntax,
asynchronous predicates, and external schema standards require separate RFCs.
