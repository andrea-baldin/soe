# RFC-0032 — Advanced search and bulk editing

Status: Accepted

## Context

Large objects need more than substring navigation. Users must narrow results by
meaning, preview repetitive edits, and reverse a bulk operation safely.
Implementing replacement directly in the renderer would duplicate traversal,
path, capability, and immutable-update rules.

## Decision

`searchObject` accepts either its existing string query or a structured query
with:

- contains or deterministic fuzzy matching;
- path, value, or combined scope;
- value-kind filters;
- validation issue, error, or warning filters;
- a bounded result limit.

Results expose their value kind, match source, and score while preserving
canonical paths and safe traversal.

`planObjectReplacements` creates an immutable preview for string values. It
accepts a capability predicate and therefore excludes nodes the caller cannot
edit. Replacement is literal, global, and case-insensitive by default.
`applyObjectReplacements` applies the accepted plan immutably.

`ObjectEditor` resolves `editValue` through its existing plugin host, displays a
bounded preview, and commits replace-current or replace-all through the normal
history. A replace-all is one atomic undo revision.

The advanced controls are collapsed by default. The existing search box and
zero-configuration component API remain unchanged.

## Consequences

Search, preview, replacement, capability policy, and history compose instead of
forming a second editing system. Core consumers can build alternate interfaces
over the same deterministic plan.

Replacement deliberately targets string values only. Type conversion, regular
expression replacement, key renaming, and schema-aware transformations require
separate use cases and decisions.
