# Roadmap

## Milestone 0 — Foundation

- Monorepo, build, type checking, linting, formatting, and tests
- Core value classification and safe formatting
- First Svelte package and Tailwind CSS demo
- Manifesto and architecture records

## Milestone 1 — Primitive editing

- Stable string, finite number, and boolean editing
- Explicit null initialization
- Component-level binding and interaction tests
- Keyboard and accessible-name verification

## Milestone 2.1 — Recursive editing

- Recursive object and array rendering
- Stable paths
- Immutable updates along paths
- Expand, collapse, and circular-reference protection

## Milestone 2.2 — Structural editing

- Immutable object property insertion, renaming, and deletion
- Immutable array append, movement, and deletion
- Inline key validation and explicit delete confirmation
- Framework-independent structural operation tests

## Milestone 2.3 — History

- Framework-independent bounded value history
- Undo and redo for primitive and structural changes
- Coalesced field input revisions
- Accessible controls and keyboard shortcuts

## Later milestones

Schema knowledge, plugins, capabilities, property providers, custom editors,
and alternate renderers remain candidates. Each requires its own RFC and a
demonstrated use case before entering the core.
