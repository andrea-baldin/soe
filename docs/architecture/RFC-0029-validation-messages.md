# RFC-0029 — Validation messages

Status: Accepted

## Context

Declarative constraints need useful defaults, but applications also need domain
language and localization. A global locale option would move schema knowledge
into `ObjectEditor`, while replacing validators only to change text would
duplicate validation logic.

## Decision

`FieldSchema.messages` is an immutable partial dictionary for `type`,
`minimum`, `maximum`, `minimumLength`, `maximumLength`, `pattern`, `required`,
and `validatorFailure`.

```ts
const schema = composeObjectSchemas(
  schemaForType('number', {
    minimum: 0,
    messages: {
      minimum: 'Il valore deve essere positivo'
    }
  }),
  {
    fields: {
      discount: {
        maximum: 30,
        messages: {
          maximum: 'Lo sconto non può superare il 30%'
        }
      }
    }
  }
);
```

Messages compose by key with the same general-to-specific precedence as the
rest of the field schema. A specific field can replace one message without
discarding general messages. Missing keys retain SOE's existing English
defaults. Custom validators continue to return their own message.

Localization is expressed by composing reusable schemas. No locale, message
provider, or translation lifecycle is added to the renderer.

## Consequences

Applications can adopt domain-specific and localized validation incrementally.
Existing schemas and validator signatures remain compatible, and
`ObjectEditor` remains unchanged.

Parameterized message functions and formatter services are deliberately
excluded until static schema messages prove insufficient.
