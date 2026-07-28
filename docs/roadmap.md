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

## Milestone 5.1 — Safe copy

- Capability-driven copy action on every node
- JSON serialization for editable containers
- Safe readable fallback for special and circular values
- Clipboard failure isolation with accessible status

## Milestone 5.2 — Safe paste

- Capability-driven paste for rendered containers
- Valid JSON with matching object or array kind
- Immutable replacement integrated with undo and redo
- Invalid input and clipboard failure isolation

## Milestone 6 — Object inspector

- Recursive read-only inspection of maps, sets, and class instances
- Own string and symbol property descriptors
- Accessor summaries without getter invocation
- Capability-safe inspected subtrees with circular-reference protection

## Milestone 7 — Custom value editors

- Typed Svelte editor contract receiving resolved NodeContext
- Plugin property selection with capability authority
- Explicit commits through immutable updates and history
- Standard editor fallback and Date editor demonstration

## Milestone 8 — Search and navigation

- Safe recursive search across editable and inspected values
- Path and formatted-value matching without getter invocation
- Automatic branch expansion and visible match state
- Accessible result count and previous/next focus navigation

## Milestone 9 — Schema-driven policies

- Read-only, rename, delete, and additional-property knowledge
- Minimum and maximum array size constraints
- Framework-independent schema capability provider
- Recursive policy inheritance with application-plugin precedence

## Milestone 10 — Validation report

- Framework-independent recursive validation issues
- Missing and invalid values with canonical paths
- Accessible summary and direct issue navigation
- Automatic expansion and visual state for invalid branches

## Milestone 11 — Release candidate

- Public `@andreabaldin/soe-core` and `@andreabaldin/soe-svelte` package identity
- Complete npm metadata, export maps, license, and package documentation
- Isolated tarball installation and Svelte consumer build
- Release notes, maintainer procedure, and CI package verification

## Milestone 12 — Release automation

- GitHub Actions publication from an explicit GitHub Release
- npm Trusted Publishing with short-lived OpenID Connect credentials
- Matching tag, package version, dependency, and changelog enforcement
- Verified tarball publication in Core → Svelte order

## Milestone 13 — Schema composition

- Reusable schemas composed without changing `ObjectEditor`
- Runtime value-type, wildcard path, and safe predicate rules
- Ordered rule composition with explicit field knowledge applied last
- One resolved schema for validation, capabilities, plugins, and rendering

## Milestone 14 — Tuple schemas

- Positional `prefixItems` knowledge for heterogeneous arrays
- General `items` policy composed beneath position-specific overrides
- Index-wise schema composition with immutable resolved definitions
- Existing validation, capabilities, plugins, and rendering reused unchanged

## Milestone 15 — Validation severity

- Schema-level error and warning severity with error-compatible defaults
- Severity preserved in recursive validation issues and required fields
- Accessible error and non-blocking warning semantics
- Summary counts, navigation, styling hooks, demo, and regression coverage

## Milestone 16 — Declarative value constraints

- Numeric minimum and maximum constraints
- String length and regular-expression constraints
- General type rules composed beneath specific field knowledge
- Native input attributes, deterministic validation, demo, tests, and RFC

## Later milestones

Concrete policy and property catalogs, persistent object models, custom
editors, and alternate renderers remain candidates. Each requires its own RFC
and a demonstrated use case before entering the core.
