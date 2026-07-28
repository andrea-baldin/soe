# RFC-0027 — Validation severity

Status: Accepted

## Context

Not every schema criterion makes a value invalid. Applications also need to
communicate recommendations, deprecations, and unusual values while preserving
editing and assistive-technology semantics.

Treating every message as an error makes `aria-invalid` misleading. Adding
component options or a second warning system would duplicate the existing
schema, recursive validation, report, and navigation paths.

## Decision

`FieldSchema` may declare a `severity` of `error` or `warning`. Omitted severity
means `error`, preserving existing behavior:

```ts
const schema: ObjectSchema = {
  fields: {
    score: {
      type: 'number',
      severity: 'warning',
      validate: (value) =>
        Number(value) >= 5 ? undefined : 'A score of 5 is recommended'
    }
  }
};
```

Every `ValidationIssue` carries its resolved severity. The setting applies to
type checks, custom validation, and missing required properties described by
that field.

The validation summary reports error and warning counts and retains navigation
for both. Errors use alert semantics and mark standard controls invalid.
Warnings use status semantics and remain associated with their control without
setting `aria-invalid`.

Schema composition uses its existing precedence rules: later and more specific
schemas may override severity independently from validation criteria.

## Consequences

Applications gain non-blocking diagnostics without another component property,
validator protocol, or report API. Existing schemas remain errors by default.
Plugins and renderers continue to receive the same resolved field schema.

Multiple diagnostics per field, custom issue codes, and asynchronous validation
remain outside this milestone. Each changes the validator contract and requires
a separate demonstrated use case.
