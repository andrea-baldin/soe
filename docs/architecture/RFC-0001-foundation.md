# RFC-0001: Foundation

- Status: Accepted
- Date: 2026-07-27

## Context

SOE needs a stable development foundation without committing its public API to
unproven abstractions. The first useful behavior is editing the primitive
properties of an object through Svelte two-way binding.

## Decision

SOE is a pnpm monorepo with three workspaces:

- `@soe/core` owns framework-independent value classification and formatting.
- `@soe/svelte` owns the Svelte UI and exposes `ObjectEditor`.
- `@soe/demo` demonstrates the public API and binding behavior.

The package workspaces remain private until the public npm naming and release
policy are accepted in a dedicated RFC.

The editor modifies values by replacing the bound top-level object. This keeps
changes observable and avoids depending on a particular state-management
implementation.

Strings, finite numeric input, and booleans are editable. Unsupported values
are classified and formatted for inspection instead of throwing. No schema,
plugin, provider, capability resolver, history, or nested model is introduced
until a concrete milestone requires it.

## Consequences

- The first public API contains one component and one required binding.
- Core behavior can be tested without a browser or Svelte runtime.
- Future recursive editing can reuse value classification without coupling the
  core to rendering.
- Null and complex JavaScript values remain inspection-only in this milestone.

## Supersession

Accepted RFCs are historical records. A later decision supersedes this RFC
instead of rewriting its rationale.
