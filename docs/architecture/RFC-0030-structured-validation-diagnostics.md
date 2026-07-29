# RFC-0030 — Structured validation diagnostics

Status: Accepted

## Context

A field may violate more than one independent domain rule. Returning one string
loses issue identity and forces validators to choose between errors and
warnings. Replacing the simple validator contract would unnecessarily break
existing schemas.

## Decision

A field validator may return its existing string, one structured diagnostic, or
an array of diagnostics:

```ts
validate: (value) => [
  {
    code: 'unusual',
    message: 'The value is unusually high',
    severity: 'warning'
  },
  {
    code: 'limit',
    message: 'The hard limit was exceeded',
    severity: 'error'
  }
];
```

Structured diagnostics have a stable application-defined `code`, a message,
and an optional severity. Missing severity inherits the field severity and then
defaults to `error`.

`validateFieldDiagnostics` normalizes, freezes, and deterministically
deduplicates results. `validateField` remains available and returns the first
message for compatibility. Recursive object validation and the Svelte report
preserve every diagnostic.

Malformed results and validator exceptions remain isolated.

## Consequences

Existing string validators require no changes. Advanced schemas gain multiple
independently navigable issues without a second validation system or new
`ObjectEditor` property.

Asynchronous validation, cancellation, and server diagnostics remain separate
concerns.
