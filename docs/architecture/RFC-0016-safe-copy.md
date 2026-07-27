# RFC-0016: Safe value copy

- Status: Accepted
- Date: 2026-07-28

## Context

The capability vocabulary includes `copy`, but the renderer does not expose
the operation. Copy must also preserve the object-inspector guarantee: unusual
or circular values cannot make the editor fail.

## Decision

Every node with `copy: true` exposes an accessible Copy action.

`serializeObjectValue` produces clipboard text:

- primitive and special values use their safe inspection representation;
- editable objects and arrays use formatted JSON when serialization succeeds;
- serialization failures fall back to the safe inspection representation.

Clipboard access occurs only after explicit user action. Missing permissions,
unavailable APIs, and rejected writes are caught and reported as status text;
they never alter the value.

## Out of scope

Paste, custom serializers, MIME negotiation, binary values, and legacy
clipboard fallbacks are excluded.

## Consequences

- The existing `copy` capability now controls real UI.
- Inspectable values can be copied without becoming editable.
- Copy remains independent from data mutation and history.
- Paste can define parsing semantics separately.
