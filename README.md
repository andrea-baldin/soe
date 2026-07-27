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

SOE currently provides recursive and structural editing for plain objects and
arrays, including property insertion and renaming, item movement, and deletion.
Strings, finite numbers, booleans, and explicitly initialized null values are
editable, with undo and redo for both value and structural changes. Unsupported
JavaScript values and circular references remain safely inspectable. The
optional schema can override runtime type inference and provide synchronous
field validation, including missing required properties. The repository also
contains its framework-independent operations, a demo, interaction tests, and
the project documents that guide future work.

```svelte
<script lang="ts">
  import type { ObjectSchema } from '@soe/core';

  const schema: ObjectSchema = {
    fields: {
      age: {
        required: true,
        type: 'number',
        validate: (value) =>
          Number(value) >= 0 ? undefined : 'Age cannot be negative'
      }
    }
  };
</script>

<ObjectEditor bind:value {schema} />
```

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
Primitive editing and the precedence of future validation criteria are defined
in [RFC-0003](docs/architecture/RFC-0003-primitive-editing.md).
Recursive traversal and immutable paths are defined in
[RFC-0004](docs/architecture/RFC-0004-recursive-editing.md).
Structural operations and their UI boundaries are defined in
[RFC-0005](docs/architecture/RFC-0005-structural-editing.md).
Bounded value history, revision grouping, and keyboard shortcuts are defined in
[RFC-0006](docs/architecture/RFC-0006-history.md).
Schema precedence and validation boundaries are defined in
[RFC-0007](docs/architecture/RFC-0007-schema-validation.md).
Required-property validation is defined in
[RFC-0008](docs/architecture/RFC-0008-required-fields.md).
All operational decisions are centralized by the framework-independent
[Capability Resolver](docs/architecture/RFC-0009-capability-resolver.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
