# RFC-0033 — Schema-guided authoring

Status: Accepted

## Context

Schemas can identify missing required fields and constrain structures, but users
still have to reconstruct known keys and suitable initial values manually.
Homogeneous array insertion also defaults to `null`, even when item knowledge is
available.

## Decision

`FieldSchema` may define:

- `defaultValue` for a fresh editable value;
- `enum` for a finite primitive choice;
- existing `fields`, `items`, and `prefixItems` as structural templates.

`schemaInitialValue` derives a fresh value in this order: explicit default,
first enum choice, primitive type default, required nested fields, array
template, then `null`. Plain object and array defaults are cloned for each
insertion.

`schemaFieldSuggestions` returns absent known fields with their required state
and initial value. `ObjectEditor` presents those suggestions separately from
free-form insertion. With `additionalProperties: false`, arbitrary keys remain
hidden while known fields stay insertable.

Enum fields use the standard select editor. Array append derives its value from
the positional or general item schema. Every insertion uses existing structural
operations, capabilities, history, validation, and undo.

## Consequences

Schema knowledge assists construction without owning data or changing the
zero-configuration editor. Objects outside a schema remain freely editable.
Readonly or plugin-denied containers expose no insertion controls.

Dynamic default factories, remote option lists, dependent choices, and
multi-select values remain plugin or future adapter concerns.
