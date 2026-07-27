# SOE

**Editing objects should feel as natural as editing text.**

SOE is a Svelte object editor that keeps the object as the source of truth while
providing clarity, structure, and guidance without getting in the way.

```svelte
<script lang="ts">
  import { ObjectEditor } from '@soe/svelte';

  let value = $state({
    name: 'Ada',
    age: 36,
    active: true
  });
</script>

<ObjectEditor bind:value />
```

## Project status

SOE is in its foundation phase. The repository already contains the first
usable primitive object editor, its framework-independent value model, a demo,
tests, and the project documents that guide future work.

## Development

Requirements:

- Node.js 22.12 or newer
- pnpm 11

```sh
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

## Repository

- `packages/core` contains framework-independent object value behavior.
- `packages/svelte` contains the Svelte component.
- `demo` is the local development application and Tailwind CSS integration
  example.
- `docs` contains the manifesto, architecture decisions, roadmap, and backlog.

## Principles

The public API stays small. Data, knowledge, and behavior remain separate.
Complexity is absorbed inside the library instead of being transferred to its
users. Read the [SOE Manifesto](docs/manifesto.md) and
[RFC-0001](docs/architecture/RFC-0001-foundation.md) for the full rationale.
Styling boundaries are defined in
[RFC-0002](docs/architecture/RFC-0002-styling.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
