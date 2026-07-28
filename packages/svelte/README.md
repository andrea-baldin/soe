# @andreabaldin/soe-svelte

The Svelte 5 object editor from SOE.

```sh
npm install @andreabaldin/soe-svelte
```

```svelte
<script>
  import { ObjectEditor } from '@andreabaldin/soe-svelte';

  let value = $state({
    name: 'Ada',
    age: 36,
    active: true
  });
</script>

<ObjectEditor bind:value />
```

The component has a usable standard-CSS presentation and does not require
Tailwind CSS. Schema knowledge and plugins remain optional.

See the [SOE repository](https://github.com/andrea-baldin/soe) for the complete
documentation and demo.
