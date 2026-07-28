<script lang="ts">
  /**
   * The harness exposes the bound value so interactions test the public API.
   */
  import ObjectEditor from '../src/ObjectEditor.svelte';
  import type { ObjectSchema } from '@andrea-baldin/soe-core';
  import type { ObjectEditorPlugin } from '../src/object-editor-plugin.js';

  let {
    initial,
    schema,
    plugins
  }: {
    initial: Record<string, unknown>;
    schema?: ObjectSchema;
    plugins?: readonly ObjectEditorPlugin[];
  } = $props();
  let value = $derived({ ...initial });
</script>

<ObjectEditor bind:value {schema} {plugins} />
<output data-testid="bound-value">{JSON.stringify(value)}</output>
