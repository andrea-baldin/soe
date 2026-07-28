# @andrea-baldin/soe-core

Framework-independent object inspection, editing, schema, validation, capability,
property, and plugin foundations for SOE.

Most Svelte applications should install `@andrea-baldin/soe-svelte`, which
depends on this package. Install the core directly when building integrations
that do not render Svelte components.

```sh
npm install @andrea-baldin/soe-core
```

```ts
import { formatObjectPath, validateObject } from '@andrea-baldin/soe-core';
```

See the [SOE repository](https://github.com/andrea-baldin/soe) for documentation
and examples.
