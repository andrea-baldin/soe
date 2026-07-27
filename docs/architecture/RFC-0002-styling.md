# RFC-0002: Styling boundaries

- Status: Accepted
- Date: 2026-07-27

## Context

Tailwind CSS is widely adopted in SvelteKit applications and is useful in the
SOE demo. Requiring it in the component package would couple every consumer to
an application-level styling decision and require Tailwind-specific source
detection or precompiled styles.

## Decision

SOE remains independent of CSS frameworks:

- `@soe/core` contains no styling concepts.
- `@soe/svelte` ships a small usable default style written in standard CSS.
- The demo uses Tailwind CSS through its official Vite integration.
- Consumers customize the component through documented `--soe-*` CSS custom
  properties and stable `data-soe-*` attributes.

The initial public styling tokens are:

- `--soe-surface`
- `--soe-text`
- `--soe-muted`
- `--soe-border`
- `--soe-focus`
- `--soe-focus-ring`
- `--soe-radius`
- `--soe-row-height`

The initial semantic attributes are `data-soe-editor`, `data-soe-field`,
`data-soe-kind`, and `data-soe-editable`.

## Consequences

- SOE works without Tailwind CSS or any other styling dependency.
- The demo provides a current integration example for Svelte and SvelteKit
  adopters.
- Applications can use their own design tokens without replacing the
  component renderer.
- A dedicated Tailwind package is deferred until real usage demonstrates that
  CSS custom properties and semantic attributes are insufficient.
