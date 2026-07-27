# RFC-0015: Renderer node properties

- Status: Accepted
- Date: 2026-07-28

## Context

Property providers and public plugin registration are available, but the
Svelte renderer has no concrete property catalog. The first catalog must prove
the extension point without turning presentation concerns into schema fields.

## Decision

`ObjectEditorNodeProperties` contains two optional values:

```ts
interface ObjectEditorNodeProperties {
  readonly label?: string;
  readonly description?: string;
}
```

`label` changes only the visible presentation. Canonical paths, accessible
control names, operations, validation, and plugin matching continue to use the
real object path.

`description` renders supporting text and is connected to the relevant control
or container toggle through `aria-describedby`.

Properties use the existing ordered, immutable property resolver. No separate
renderer plugin mechanism is introduced.

## Out of scope

Visibility, CSS classes, themes, formatters, custom editors, icons, grouping,
sorting, and arbitrary markup are deliberately excluded.

## Consequences

- Plugins can add presentation knowledge without changing data or schema.
- Labels cannot accidentally change object addressing.
- Descriptions are accessible rather than visual-only decoration.
- The catalog can grow only when another concrete use case justifies it.
