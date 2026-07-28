# @andreabaldin/soe-core

Framework-independent object inspection, editing, schema, validation, capability,
property, and plugin foundations for SOE.

Most Svelte applications should install `@andreabaldin/soe-svelte`, which
depends on this package. Install the core directly when building integrations
that do not render Svelte components.

```sh
npm install @andreabaldin/soe-core
```

```ts
import { formatObjectPath, validateObject } from '@andreabaldin/soe-core';
```

See the [SOE repository](https://github.com/andrea-baldin/soe) for documentation
and examples.
