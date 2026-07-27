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

## Milestone 3.1 — Schema and validation

- Optional recursive object schema
- Explicit primitive types override runtime inference
- Synchronous validators with root and path context
- Accessible inline validation without blocking editing

## Milestone 3.2 — Required fields

- Required property knowledge in field schemas
- Root and nested missing-property validation
- Reactive updates across structural editing and history
- Separation between validation and operation permissions

## Milestone 4.1 — Capability resolver

- Framework-independent capability vocabulary and node context
- Conservative default and failure fallback
- Value, structural, and movement controls driven by resolved capability
- No additional public component properties

## Milestone 4.2 — Capability providers

- Ordered partial capability contributions
- Explicit later-provider precedence
- Per-provider error and malformed-result isolation
- Framework-independent composition without public UI registration

## Milestone 4.3 — Node context

- Shared root, value, parent, path, and schema contract
- Resolved context containing final capabilities
- Frozen context, copied path, and frozen capability state
- Renderer integration without a premature object model

## Milestone 4.4 — Property providers

- Generic typed property providers and resolver
- Ordered shallow composition over resolved node context
- Per-resolution isolation and frozen results
- No speculative universal property catalog

## Milestone 4.5 — Plugin host

- Minimal typed plugin registration over existing providers
- Capability resolution before property resolution
- Immutable combined node resolution
- No plugin lifecycle or public component registration

## Milestone 4.6 — ObjectEditor plugins

- Optional plugin registration without changing the default API
- Capability plugins applied to root and recursive nodes
- One shared plugin host per editor
- No speculative renderer-property catalog

## Milestone 4.7 — Renderer properties

- Minimal typed `label` and `description` catalog
- Ordered property contributions through ObjectEditor plugins
- Canonical object paths remain unchanged
- Accessible descriptions for primitive and container nodes

## Later milestones

Concrete policy and property catalogs, persistent object models, custom
editors, and alternate renderers remain candidates. Each requires its own RFC
and a demonstrated use case before entering the core.
