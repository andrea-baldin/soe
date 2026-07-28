# RFC-0026 — Tuple schemas

Status: Accepted

## Context

`FieldSchema.items` describes homogeneous arrays well, but positional data such
as coordinates, records, and protocol tuples assign different meaning and type
to each index. Modelling those arrays by field name is impossible, while
teaching the renderer about tuples would mix schema knowledge with presentation.

## Decision

An array field schema may define `prefixItems`, an ordered immutable collection
of field schemas:

```ts
const schema: ObjectSchema = {
  fields: {
    record: {
      items: { readonly: true },
      prefixItems: [{ type: 'number' }, { type: 'string', readonly: false }]
    }
  }
};
```

`items` remains the general schema for every array element. When an index exists
in `prefixItems`, its schema is composed over `items`, so positional knowledge
can specialize the general policy. Indices beyond the tuple prefix continue to
use `items`.

Schema composition merges `prefixItems` by index. Later schemas override earlier
properties without discarding unrelated positional knowledge. Resolved tuple
schemas feed the existing validation, capability, plugin, and rendering paths.

The public component remains unchanged:

```svelte
<ObjectEditor bind:value {schema} />
```

## Consequences

SOE can describe heterogeneous arrays without a tuple-specific renderer or
component option. Positional rules remain ordinary `FieldSchema` values and
therefore compose with existing type, path, predicate, and explicit-field
knowledge.

Tuple length enforcement and rest-item cardinality are deliberately excluded.
They require a demonstrated validation use case and a separate decision.
