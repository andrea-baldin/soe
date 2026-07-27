<script lang="ts">
  /**
   * The harness exposes the bound value so interactions test the public API.
   */
  import ObjectEditor from '../src/ObjectEditor.svelte';

  let { initial }: { initial: Record<string, unknown> } = $props();
  let value = $derived({ ...initial });
</script>

<ObjectEditor bind:value />
<output data-testid="bound-value">{JSON.stringify(value)}</output>
