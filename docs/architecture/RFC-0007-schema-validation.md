# RFC-0007: Schema knowledge and field validation

- Status: Accepted
- Date: 2026-07-27

## Context

Runtime values let SOE infer primitive editors with no configuration, but they
cannot express intent. A null value has no future type, an incorrect runtime
value may need a different editor, and domain constraints often depend on
neighboring or root values.

SOE needs an optional knowledge source that can override inference without
mixing data, rendering, and behavior or turning the schema into a large
configuration language.

## Decision

### Minimal schema

The core introduces two recursive contracts:

```ts
interface ObjectSchema {
  fields: Readonly<Record<string, FieldSchema>>;
}

interface FieldSchema {
  type?: 'boolean' | 'number' | 'string';
  fields?: Readonly<Record<string, FieldSchema>>;
  items?: FieldSchema;
  validate?: FieldValidator;
}
```

`fields` describes object children and `items` describes every item in an
array. The schema contains knowledge about values; it does not render controls,
mutate the object, or own history.

### Precedence

An explicit schema type selects the primitive editor before runtime inference.
When no type is supplied, the behavior established by RFC-0003 remains the
fallback. This permits a schema to correct an invalid runtime type or provide
the intended type for null without changing zero-configuration behavior.

### Validation

A validator returns an error message or `undefined`:

```ts
type FieldValidator = (
  value: unknown,
  context: {
    path: ObjectPath;
    root: unknown;
  }
) => string | undefined;
```

Explicit type validation runs before the custom validator. Validator exceptions
are contained and become a stable validation error so the editor never fails.
Validation does not block editing; the bound object remains the source of truth
and invalid state remains visible.

Errors are associated with their controls through native accessibility
attributes and exposed through `data-soe-valid`.

### Public API

The default API is unchanged:

```svelte
<ObjectEditor bind:value />
```

Knowledge is opt-in through the single schema boundary anticipated by earlier
RFCs:

```svelte
<ObjectEditor bind:value {schema} />
```

## Out of scope

This RFC does not introduce required or optional property semantics, built-in
constraint catalogs, asynchronous validation, object-wide error summaries,
formatters, permissions, capabilities, plugins, or custom editors.

## Consequences

- Explicit knowledge supersedes inference without replacing it.
- Nested objects and arrays share one recursive schema vocabulary.
- Cross-field validation can use root and path context.
- Invalid values remain editable and inspectable.
- Future providers can contribute knowledge without moving it into the model.
