# @andreabaldin/soe-core

Framework-independent object traversal, immutable editing, schema, validation,
capability, search, and plugin foundations for SOE.

Most Svelte applications should install `@andreabaldin/soe-svelte`, which
includes this package. Install the core directly for alternate renderers,
validation services, or object-processing integrations.

```sh
npm install @andreabaldin/soe-core
```

## Schema composition

```ts
import {
  composeObjectSchemas,
  schemaForPath,
  schemaForType,
  validateObject
} from '@andreabaldin/soe-core';

const schema = composeObjectSchemas(
  schemaForType('number', {
    minimum: 0,
    messages: { minimum: 'Use a positive number' }
  }),
  schemaForPath(['orders', '*', 'status'], {
    enum: ['draft', 'submitted']
  }),
  {
    fields: {
      username: {
        required: true,
        type: 'string',
        minimumLength: 3
      }
    }
  }
);

const issues = validateObject(value, schema);
```

Specific path and field knowledge composes over general type rules.

## Async validation

```ts
const schema = {
  fields: {
    username: {
      async validateAsync(value, { signal }) {
        const available = await checkUsername(String(value), { signal });
        return available
          ? undefined
          : {
              code: 'username-taken',
              message: 'Username already in use',
              severity: 'error'
            };
      }
    }
  }
};
```

`validateObjectAsync` is cancellable and uses the same structured diagnostic
contract as synchronous validators.

The complete guide and API examples are in the
[SOE repository](https://github.com/andrea-baldin/soe).
