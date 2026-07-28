# RFC-0019: Custom value editors

- Status: Accepted
- Date: 2026-07-28

## Context

Runtime inference and schema types cover primitive controls, but applications
need domain-specific inputs without adding a component property for every
possible editor.

## Decision

The Svelte plugin property catalog gains one optional `editor`:

```ts
interface ObjectEditorValueEditorProps {
  context: ResolvedNodeContext;
  commit(value: unknown): void;
}
```

A property provider selects a Svelte component implementing this contract.
The editor receives the complete resolved context and an explicit commit
callback. Commits use the existing immutable update and history pipeline.

The renderer uses a custom editor only when `editValue` is true. Without a
selected editor it retains the standard inferred or schema-driven control.
Capabilities therefore remain the sole authority for edit permission.

## Out of scope

Global registries, editor names, dependency injection, asynchronous component
loading, custom history behavior, and editor-specific configuration protocols
are excluded. Configuration can be captured by the component supplied by a
plugin.

## Consequences

- Domain controls compose through the existing plugin mechanism.
- Custom editors do not need renderer or model access.
- Undo and redo work without editor-specific integration.
- The fundamental zero-configuration API remains unchanged.
