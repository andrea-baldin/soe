# @andreabaldin/soe-svelte

The Svelte 5 object editor from SOE.

```sh
npm install @andreabaldin/soe-svelte
```

```svelte
<script lang="ts">
  import { ObjectEditor } from '@andreabaldin/soe-svelte';

  let value = $state({
    name: 'Ada',
    age: 36,
    active: true
  });
</script>

<ObjectEditor bind:value />
```

`value` is the only required property. Optional schema knowledge, plugins, and
external diagnostics add guidance without changing the default editor.

```svelte
<ObjectEditor bind:value {schema} {plugins} {diagnostics} />
```

SOE supports recursive and structural editing, history, safe inspection,
validation reports, async validation, custom editors, advanced search and
capability-safe bulk replacement, and schema-guided insertion.

The component ships standard CSS and requires no styling framework. Customize
it with CSS variables such as `--soe-surface`, `--soe-text`, `--soe-border`,
`--soe-focus`, `--soe-error`, and `--soe-warning`. Tailwind CSS is used only by
the repository demo.

See the [SOE repository](https://github.com/andrea-baldin/soe) for the complete
schema guide, plugin examples, and architecture records.
