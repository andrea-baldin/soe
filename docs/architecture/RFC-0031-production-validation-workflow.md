# RFC-0031 — Production validation workflow

Status: Accepted

## Context

Some domain rules depend on remote services, while server submissions may
return diagnostics that do not originate in the local schema. Async work must
not allow stale responses to overwrite newer edits or move request state into
the renderer.

## Decision

`FieldSchema.validateAsync` receives the value plus root, canonical path, and an
`AbortSignal`. It returns the same string or structured diagnostic contract as
synchronous validation.

```ts
const schema: ObjectSchema = {
  fields: {
    username: {
      async validateAsync(value, { signal }) {
        const available = await checkUsername(String(value), { signal });
        return available
          ? undefined
          : {
              code: 'username-taken',
              message: 'Username already in use',
              severity: 'error'
            };
      }
    }
  }
};
```

Async validation is explicit rather than overloading `validate`. This keeps
`validateObject` and `validateField` predictably synchronous.
`validateObjectAsync` performs cancellable framework-independent traversal.

`ObjectEditor` starts validation reactively, aborts obsolete runs, discards
stale results, exposes an accessible pending state, and merges async issues with
the synchronous report.

External server issues may be supplied through the optional `diagnostics`
property. They use the same code, message, path, and severity vocabulary and
are normalized by `mergeValidationIssues`.

## Consequences

The zero-configuration editor remains unchanged. Applications opt into remote
work only through schema knowledge and can reuse the same report, navigation,
styling, and accessibility behavior for local, async, and server diagnostics.

Debounce policy remains the responsibility of the async validator or its
service adapter. SOE guarantees cancellation and stale-result isolation rather
than imposing an application-specific delay.
