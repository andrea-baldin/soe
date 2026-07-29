# Schema guide

SOE treats the edited object as data, the schema as optional knowledge, and
plugins as behavior. The simplest editor needs no schema:

```svelte
<ObjectEditor bind:value />
```

## General and specific knowledge

Compose reusable rules by runtime type, wildcard path, predicate, and explicit
field:

```ts
const schema = composeObjectSchemas(
  schemaForType('number', { minimum: 0 }),
  schemaForPath(['orders', '*', 'discount'], { maximum: 30 }),
  {
    fields: {
      status: {
        enum: ['draft', 'submitted'],
        defaultValue: 'draft'
      }
    }
  }
);
```

Rules apply in declaration order. Explicit field knowledge is applied last.

## Validation

Schemas support type, numeric, string-length, RegExp, required, and custom
criteria. Severity and messages compose independently:

```ts
{
  type: 'string',
  minimumLength: 3,
  pattern: /^[a-z]+$/,
  severity: 'warning',
  messages: {
    minimumLength: 'Use at least three characters',
    pattern: 'Use lowercase letters only'
  }
}
```

A validator may return a string, one diagnostic, or several diagnostics:

```ts
validate: (value) => [
  {
    code: 'unusual',
    message: 'This value is unusual',
    severity: 'warning'
  }
];
```

Use `validateAsync` for cancellable remote checks. It receives an
`AbortSignal`; obsolete editor runs are aborted and discarded.

## Authoring

`defaultValue`, `enum`, nested required fields, `items`, and `prefixItems`
provide safe initial values. Missing known fields appear as suggestions.
`additionalProperties: false` hides arbitrary insertion but keeps known fields
available.

## Policies and plugins

Schemas can mark values readonly, restrict key operations, close objects, and
bound array sizes. Plugins may contribute later capability and renderer
properties using the resolved `NodeContext`.

The component API remains:

```svelte
<ObjectEditor bind:value {schema} {plugins} />
```
