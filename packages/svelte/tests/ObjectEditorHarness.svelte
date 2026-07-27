<script lang="ts">
  /**
   * The harness exposes the bound value so interactions test the public API.
   */
  import ObjectEditor from '../src/ObjectEditor.svelte';
  import type { ObjectSchema } from '@soe/core';

  let {
    initial,
    schema
  }: {
    initial: Record<string, unknown>;
    schema?: ObjectSchema;
  } = $props();
  let value = $derived({ ...initial });
</script>

<ObjectEditor bind:value {schema} />
<output data-testid="bound-value">{JSON.stringify(value)}</output>
