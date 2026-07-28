# RFC-0028 — Declarative value constraints

Status: Accepted

## Context

Common numeric, length, and pattern rules should not require repeated custom
validator functions. They are schema knowledge, not component behavior.

## Decision

`FieldSchema` supports `minimum`, `maximum`, `minimumLength`,
`maximumLength`, and `pattern`. Type compatibility is checked first,
declarative constraints second, and a custom validator last.

```ts
const schema = composeObjectSchemas(
  schemaForType('number', { minimum: 0 }),
  schemaForType('string', { maximumLength: 200 }),
  {
    fields: {
      discount: { maximum: 30 },
      postalCode: { pattern: /^\d{5}$/ }
    }
  }
);
```

General type rules compose beneath path, predicate, tuple, and explicit-field
knowledge. Standard Svelte inputs receive the equivalent native attributes,
while core validation remains authoritative and renderer-independent.

Regular expressions are reset before and after evaluation so global and sticky
patterns behave deterministically.

## Consequences

Frequently used constraints become concise and reusable without changing
`ObjectEditor`. Custom validators remain available for domain rules and receive
the same root and path context.

Formats, transformations, custom messages, and asynchronous validation remain
separate concerns.
