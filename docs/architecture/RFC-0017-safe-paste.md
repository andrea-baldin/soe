# RFC-0017: Safe container paste

- Status: Accepted
- Date: 2026-07-28

## Context

Paste changes data and therefore needs stricter semantics than copy. Treating
arbitrary clipboard text as a value would introduce surprising coercion and
could silently change a container from an object to an array.

## Decision

Every rendered container with `paste: true` exposes an accessible Paste
action. Clipboard text is accepted only when:

- it is valid JSON;
- the parsed value is an editable object or array;
- its container kind matches the destination.

A successful paste replaces the selected container immutably and enters the
normal history, so it can be undone and redone. Invalid content, unavailable
clipboard APIs, denied permissions, and rejected reads leave the value
unchanged and produce accessible status text.

## Out of scope

Primitive paste, object merging, array insertion, root replacement, custom
parsers, special JavaScript types, and MIME negotiation are excluded.

## Consequences

- Paste behavior is explicit and predictable.
- Object and array shape cannot change accidentally.
- Plugins retain sole control through the existing `paste` capability.
- Clipboard mutation participates in existing history without a new model.
